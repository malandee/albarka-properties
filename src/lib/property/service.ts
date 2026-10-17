import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { ApiError, errors } from '@/lib/http';
import { recordAudit } from '@/lib/audit';
import { canDeleteProperty, isStatusTransitionAllowed, STATUS_LABELS, type Actor, type AvailabilityStatus, type Visibility } from '@/lib/auth/policy';
import { buildPropertySlug, slugify } from './slug';
import { loadManageableProperty, assertCanModify } from './access';
import { publishBlockers } from './publish-rules';
import type { PropertyContent } from '@/lib/validation/property';
import { MAX_IMAGES_PER_PROPERTY, processImageUpload } from '@/lib/media/process';
import { newStorageKey, removeVariants, writeVariants } from '@/lib/media/storage';
import { randomId } from '@/lib/security/crypto';
import { PERMISSIONS } from '@/lib/auth/policy';

const SLUG_ATTEMPTS = 5;

async function resolveCatalogue(categoryId: string, featureIds: string[], tx: Prisma.TransactionClient) {
  const category = await tx.propertyCategory.findFirst({ where: { id: categoryId, active: true }, select: { id: true } });
  if (!category) throw errors.unprocessable('Choose an active property type.', [{ field: 'categoryId', message: 'Choose an active property type.' }]);
  const uniqueFeatureIds = [...new Set(featureIds)];
  if (uniqueFeatureIds.length > 0) {
    const found = await tx.feature.findMany({
      where: { id: { in: uniqueFeatureIds }, active: true },
      select: { id: true },
    });
    if (found.length !== uniqueFeatureIds.length) {
      throw errors.unprocessable('One or more selected features are not available.', [
        { field: 'featureIds', message: 'One or more selected features are not available.' },
      ]);
    }
  }
  return uniqueFeatureIds;
}

function contentData(c: PropertyContent) {
  return {
    title: c.title,
    shortDescription: c.shortDescription,
    description: c.description,
    purpose: c.purpose,
    priceAmount: c.priceOnRequest || c.priceAmount === null ? null : new Prisma.Decimal(c.priceAmount),
    priceOnRequest: c.priceOnRequest,
    currency: c.currency,
    priceNote: c.priceNote,
    addressLine: c.addressLine,
    area: c.area,
    city: c.city,
    state: c.state,
    formattedAddress: c.formattedAddress,
    latitude: c.latitude === null ? null : new Prisma.Decimal(c.latitude),
    longitude: c.longitude === null ? null : new Prisma.Decimal(c.longitude),
    mapIsPrivate: c.mapIsPrivate,
    bedrooms: c.bedrooms,
    bathrooms: c.bathrooms,
    toilets: c.toilets,
    parkingSpaces: c.parkingSpaces,
    floors: c.floors,
    landSizeSqm: c.landSizeSqm === null ? null : new Prisma.Decimal(c.landSizeSqm),
    buildingSizeSqm: c.buildingSizeSqm === null ? null : new Prisma.Decimal(c.buildingSizeSqm),
  };
}

/**
 * Creates a listing owned by the actor. New listings start hidden, so nothing is public
 * until the owner has reviewed the preview and chosen to show it.
 */
export async function createProperty(actor: Actor, content: PropertyContent, ip: string | null) {
  for (let attempt = 0; attempt < SLUG_ATTEMPTS; attempt++) {
    const slug = buildPropertySlug(content.title, randomId(4));
    try {
      return await db.$transaction(async (tx) => {
        const featureIds = await resolveCatalogue(content.categoryId, content.featureIds, tx);
        const property = await tx.property.create({
          data: {
            ...contentData(content),
            slug,
            categoryId: content.categoryId,
            ownerId: actor.id,
            visibility: 'HIDDEN',
            availabilityStatus: 'AVAILABLE',
            features: { create: featureIds.map((featureId) => ({ featureId })) },
          },
          select: { id: true, title: true, slug: true },
        });
        await recordAudit(
          { actorId: actor.id, action: 'property.create', entityType: 'property', entityId: property.id, summary: `Created listing "${property.title}" (hidden)`, ip },
          tx,
        );
        return property;
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') continue; // slug collision
      throw err;
    }
  }
  throw new ApiError(500, 'SLUG_FAILED', 'Could not create a unique address for this listing. Please try again.');
}

export async function updateProperty(actor: Actor, id: string, content: PropertyContent, ip: string | null) {
  const existing = await loadManageableProperty(actor, id);
  return db.$transaction(async (tx) => {
    const featureIds = await resolveCatalogue(content.categoryId, content.featureIds, tx);
    await tx.property.update({
      where: { id: existing.id },
      data: {
        ...contentData(content),
        categoryId: content.categoryId,
        features: {
          deleteMany: {},
          create: featureIds.map((featureId) => ({ featureId })),
        },
      },
    });
    await recordAudit(
      { actorId: actor.id, action: 'property.update', entityType: 'property', entityId: existing.id, summary: `Updated listing "${content.title}"`, ip },
      tx,
    );
    return { id: existing.id };
  });
}

export async function changeAvailability(actor: Actor, id: string, to: AvailabilityStatus, ip: string | null) {
  const existing = await loadManageableProperty(actor, id);
  if (!isStatusTransitionAllowed(existing.purpose, existing.availabilityStatus, to)) {
    throw errors.unprocessable(
      `This listing cannot change from ${STATUS_LABELS[existing.availabilityStatus]} to ${STATUS_LABELS[to]}.`,
      [{ field: 'availabilityStatus', message: 'Not an allowed status change for this listing purpose.' }],
    );
  }
  await db.$transaction(async (tx) => {
    await tx.property.update({ where: { id: existing.id }, data: { availabilityStatus: to } });
    await tx.propertyStatusHistory.create({
      data: {
        propertyId: existing.id,
        changedById: actor.id,
        fromStatus: existing.availabilityStatus,
        toStatus: to,
        fromVisibility: existing.visibility,
        toVisibility: existing.visibility,
      },
    });
    await recordAudit(
      { actorId: actor.id, action: 'property.status', entityType: 'property', entityId: existing.id, summary: `Status set to ${STATUS_LABELS[to]} for "${existing.title}"`, ip },
      tx,
    );
  });
  return { availabilityStatus: to };
}

export async function changeVisibility(actor: Actor, id: string, to: Visibility, ip: string | null) {
  const existing = await loadManageableProperty(actor, id);
  if (existing.visibility === to) return { visibility: to, changed: false };

  if (to === 'PUBLIC') {
    const featuredCount = await db.propertyImage.count({ where: { propertyId: existing.id, isFeatured: true } });
    const full = await db.property.findUnique({
      where: { id: existing.id },
      select: { title: true, shortDescription: true, description: true, addressLine: true, city: true, state: true, priceOnRequest: true, priceAmount: true },
    });
    if (!full) throw errors.notFound('Property');
    const blockers = publishBlockers({ ...full, featuredImageCount: featuredCount });
    if (blockers.length) {
      throw errors.unprocessable('This listing is not ready to show publicly.', blockers.map((message) => ({ field: 'visibility', message })));
    }
  }

  await db.$transaction(async (tx) => {
    await tx.property.update({
      where: { id: existing.id },
      data: { visibility: to, ...(to === 'PUBLIC' ? { publishedAt: new Date() } : {}) },
    });
    await tx.propertyStatusHistory.create({
      data: {
        propertyId: existing.id,
        changedById: actor.id,
        fromVisibility: existing.visibility,
        toVisibility: to,
        fromStatus: existing.availabilityStatus,
        toStatus: existing.availabilityStatus,
      },
    });
    await recordAudit(
      {
        actorId: actor.id,
        action: to === 'PUBLIC' ? 'property.publish' : 'property.hide',
        entityType: 'property',
        entityId: existing.id,
        summary: `${to === 'PUBLIC' ? 'Showed' : 'Hid'} listing "${existing.title}"`,
        ip,
      },
      tx,
    );
  });
  return { visibility: to, changed: true };
}

export async function deleteProperty(actor: Actor, id: string, ip: string | null) {
  const existing = await loadManageableProperty(actor, id);
  const check = canDeleteProperty(actor, existing);
  if (!check.allowed) {
    if (check.reason === 'forbidden') throw new ApiError(404, 'NOT_FOUND', 'Property was not found.');
    throw errors.conflict(check.reason ?? 'This listing cannot be deleted.');
  }
  const images = await db.propertyImage.findMany({ where: { propertyId: existing.id }, select: { storageKey: true } });
  await db.$transaction(async (tx) => {
    await recordAudit(
      { actorId: actor.id, action: 'property.delete', entityType: 'property', entityId: existing.id, summary: `Deleted listing "${existing.title}" (${images.length} image(s))`, ip },
      tx,
    );
    await tx.property.delete({ where: { id: existing.id } });
  });
  // Files are removed only after the database commit. A failure here leaves orphan files, not broken records.
  for (const img of images) await removeVariants(img.storageKey).catch((e) => console.error('[media-cleanup]', e));
  return { deleted: true };
}

/* ----------------------------- Images ----------------------------- */

export async function uploadImage(actor: Actor, propertyId: string, file: Buffer, altText: string, ip: string | null) {
  const property = await loadManageableProperty(actor, propertyId);
  assertCanModify(actor, property);
  const processed = await processImageUpload(file);
  const storageKey = newStorageKey(property.id, randomId(16));

  // Write files first, then the row. If the row write fails, the files are removed.
  await writeVariants(storageKey, processed.large, processed.thumb);
  try {
    return await db.$transaction(async (tx) => {
      const count = await tx.propertyImage.count({ where: { propertyId: property.id } });
      if (count >= MAX_IMAGES_PER_PROPERTY) {
        throw errors.conflict(`A listing can have at most ${MAX_IMAGES_PER_PROPERTY} images.`);
      }
      const featured = await tx.propertyImage.count({ where: { propertyId: property.id, isFeatured: true } });
      const image = await tx.propertyImage.create({
        data: {
          propertyId: property.id,
          storageKey,
          altText,
          sortOrder: count,
          isFeatured: featured === 0,
          width: processed.width,
          height: processed.height,
          bytes: processed.large.length,
        },
        select: { id: true, altText: true, isFeatured: true, sortOrder: true, storageKey: true, width: true, height: true },
      });
      await recordAudit(
        { actorId: actor.id, action: 'property.image_upload', entityType: 'property', entityId: property.id, summary: `Added image to "${property.title}"`, ip },
        tx,
      );
      return image;
    });
  } catch (err) {
    await removeVariants(storageKey).catch(() => undefined);
    throw err;
  }
}

/** Replaces an image's file, keeping its id, order, and featured flag. Old files are removed after commit. */
export async function replaceImage(actor: Actor, propertyId: string, imageId: string, file: Buffer, ip: string | null) {
  const property = await loadManageableProperty(actor, propertyId);
  assertCanModify(actor, property);
  const old = await db.propertyImage.findFirst({ where: { id: imageId, propertyId: property.id } });
  if (!old) throw errors.notFound('Image');
  const processed = await processImageUpload(file);
  const newKey = newStorageKey(property.id, randomId(16));
  await writeVariants(newKey, processed.large, processed.thumb);
  try {
    await db.$transaction(async (tx) => {
      await tx.propertyImage.update({
        where: { id: old.id },
        data: { storageKey: newKey, width: processed.width, height: processed.height, bytes: processed.large.length },
      });
      await recordAudit(
        { actorId: actor.id, action: 'property.image_replace', entityType: 'property', entityId: property.id, summary: `Replaced an image on "${property.title}"`, ip },
        tx,
      );
    });
  } catch (err) {
    await removeVariants(newKey).catch(() => undefined);
    throw err;
  }
  // The old key is unique to this row, but verify it is no longer referenced before deleting.
  const stillUsed = await db.propertyImage.count({ where: { storageKey: old.storageKey } });
  if (stillUsed === 0) await removeVariants(old.storageKey).catch((e) => console.error('[media-cleanup]', e));
  return { id: old.id };
}

export async function removeImage(actor: Actor, propertyId: string, imageId: string, ip: string | null) {
  const property = await loadManageableProperty(actor, propertyId);
  assertCanModify(actor, property);
  const image = await db.propertyImage.findFirst({ where: { id: imageId, propertyId: property.id } });
  if (!image) throw errors.notFound('Image');
  await db.$transaction(async (tx) => {
    await tx.propertyImage.delete({ where: { id: image.id } });
    if (image.isFeatured) {
      const next = await tx.propertyImage.findFirst({
        where: { propertyId: property.id },
        orderBy: { sortOrder: 'asc' },
      });
      if (next) await tx.propertyImage.update({ where: { id: next.id }, data: { isFeatured: true } });
    }
    await recordAudit(
      { actorId: actor.id, action: 'property.image_remove', entityType: 'property', entityId: property.id, summary: `Removed an image from "${property.title}"`, ip },
      tx,
    );
  });
  const stillUsed = await db.propertyImage.count({ where: { storageKey: image.storageKey } });
  if (stillUsed === 0) await removeVariants(image.storageKey).catch((e) => console.error('[media-cleanup]', e));
  return { removed: true };
}

export async function setFeaturedImage(actor: Actor, propertyId: string, imageId: string, ip: string | null) {
  const property = await loadManageableProperty(actor, propertyId);
  assertCanModify(actor, property);
  await db.$transaction(async (tx) => {
    const image = await tx.propertyImage.findFirst({ where: { id: imageId, propertyId: property.id }, select: { id: true } });
    if (!image) throw errors.notFound('Image');
    await tx.propertyImage.updateMany({ where: { propertyId: property.id, isFeatured: true }, data: { isFeatured: false } });
    await tx.propertyImage.update({ where: { id: image.id }, data: { isFeatured: true } });
    await recordAudit(
      { actorId: actor.id, action: 'property.image_feature', entityType: 'property', entityId: property.id, summary: `Changed featured image of "${property.title}"`, ip },
      tx,
    );
  });
  return { featuredImageId: imageId };
}

export async function reorderImages(actor: Actor, propertyId: string, orderedIds: string[], ip: string | null) {
  const property = await loadManageableProperty(actor, propertyId);
  assertCanModify(actor, property);
  const current = await db.propertyImage.findMany({ where: { propertyId: property.id }, select: { id: true } });
  const currentIds = new Set(current.map((c) => c.id));
  if (orderedIds.length !== currentIds.size || new Set(orderedIds).size !== orderedIds.length || orderedIds.some((i) => !currentIds.has(i))) {
    throw errors.unprocessable('The gallery order must include every image exactly once.');
  }
  await db.$transaction(async (tx) => {
    for (const [index, id] of orderedIds.entries()) {
      await tx.propertyImage.update({ where: { id }, data: { sortOrder: index } });
    }
    await recordAudit(
      { actorId: actor.id, action: 'property.image_reorder', entityType: 'property', entityId: property.id, summary: `Reordered gallery of "${property.title}"`, ip },
      tx,
    );
  });
  return { ordered: orderedIds.length };
}


export async function updateImageAlt(actor: Actor, propertyId: string, imageId: string, altText: string, ip: string | null) {
  const property = await loadManageableProperty(actor, propertyId);
  assertCanModify(actor, property);
  const image = await db.propertyImage.findFirst({ where: { id: imageId, propertyId: property.id }, select: { id: true } });
  if (!image) throw errors.notFound('Image');
  await db.$transaction(async (tx) => {
    await tx.propertyImage.update({ where: { id: image.id }, data: { altText } });
    await recordAudit({ actorId: actor.id, action: 'property.image_replace', entityType: 'property', entityId: property.id, summary: `Updated image description on "${property.title}"`, ip }, tx);
  });
  return { id: image.id };
}
