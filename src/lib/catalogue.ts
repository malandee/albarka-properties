import { db } from '@/lib/db';
import { errors } from '@/lib/http';
import { recordAudit } from '@/lib/audit';
import { slugify } from '@/lib/property/slug';
import { PERMISSIONS, type Actor } from '@/lib/auth/policy';
import { catalogueItemSchema, settingsSchema } from '@/lib/validation/account';
import { z } from 'zod';

export type CatalogueKind = 'category' | 'feature';
export const FEATURED_COUNT_KEY = 'featuredCount';

export async function createCatalogueItem(actor: Actor, kind: CatalogueKind, input: z.infer<typeof catalogueItemSchema>, ip: string | null) {
  if (!PERMISSIONS.manageSettings(actor)) throw errors.forbidden();
  const slug = slugify(input.label, 80);
  if (kind === 'category') {
    const max = await db.propertyCategory.aggregate({ _max: { sortOrder: true } });
    const exists = await db.propertyCategory.findFirst({ where: { OR: [{ slug }, { name: input.label }] }, select: { id: true } });
    if (exists) throw errors.unprocessable('A property type with this name already exists.', [{ field: 'label', message: 'This name already exists.' }]);
    const created = await db.$transaction(async (tx) => {
      const row = await tx.propertyCategory.create({ data: { name: input.label, slug, sortOrder: (max._max.sortOrder ?? 0) + 1, active: input.active ?? true }, select: { id: true, name: true } });
      await recordAudit({ actorId: actor.id, action: 'catalogue.create', entityType: 'category', entityId: row.id, summary: `Added property type "${row.name}"`, ip }, tx);
      return row;
    });
    return created;
  }
  const exists = await db.feature.findFirst({ where: { OR: [{ slug }, { label: input.label }] }, select: { id: true } });
  if (exists) throw errors.unprocessable('A feature with this name already exists.', [{ field: 'label', message: 'This name already exists.' }]);
  const max = await db.feature.aggregate({ _max: { sortOrder: true } });
  return db.$transaction(async (tx) => {
    const row = await tx.feature.create({ data: { label: input.label, slug, sortOrder: (max._max.sortOrder ?? 0) + 1, active: input.active ?? true }, select: { id: true, label: true } });
    await recordAudit({ actorId: actor.id, action: 'catalogue.create', entityType: 'feature', entityId: row.id, summary: `Added feature "${row.label}"`, ip }, tx);
    return row;
  });
}

export async function updateCatalogueItem(actor: Actor, kind: CatalogueKind, id: string, input: { label?: string; active?: boolean }, ip: string | null) {
  if (!PERMISSIONS.manageSettings(actor)) throw errors.forbidden();
  if (kind === 'category') {
    const row = await db.propertyCategory.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!row) throw errors.notFound('Property type');
    return db.$transaction(async (tx) => {
      await tx.propertyCategory.update({ where: { id }, data: { ...(input.label ? { name: input.label } : {}), ...(input.active !== undefined ? { active: input.active } : {}) } });
      await recordAudit({ actorId: actor.id, action: 'catalogue.update', entityType: 'category', entityId: id, summary: `Updated property type "${input.label ?? row.name}"`, ip }, tx);
      return { id };
    });
  }
  const row = await db.feature.findUnique({ where: { id }, select: { id: true, label: true } });
  if (!row) throw errors.notFound('Feature');
  return db.$transaction(async (tx) => {
    await tx.feature.update({ where: { id }, data: { ...(input.label ? { label: input.label } : {}), ...(input.active !== undefined ? { active: input.active } : {}) } });
    await recordAudit({ actorId: actor.id, action: 'catalogue.update', entityType: 'feature', entityId: id, summary: `Updated feature "${input.label ?? row.label}"`, ip }, tx);
    return { id };
  });
}

export async function getFeaturedCount(): Promise<number> {
  const row = await db.siteSetting.findUnique({ where: { key: FEATURED_COUNT_KEY } });
  const n = Number(row?.value ?? 6);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : 6;
}

export async function updateSettings(actor: Actor, input: z.infer<typeof settingsSchema>, ip: string | null) {
  if (!PERMISSIONS.manageSettings(actor)) throw errors.forbidden();
  const body = settingsSchema.parse(input);
  await db.$transaction(async (tx) => {
    await tx.siteSetting.upsert({
      where: { key: FEATURED_COUNT_KEY },
      create: { key: FEATURED_COUNT_KEY, value: String(body.featuredCount), updatedById: actor.id },
      update: { value: String(body.featuredCount), updatedById: actor.id },
    });
    await recordAudit({ actorId: actor.id, action: 'settings.update', entityType: 'setting', entityId: FEATURED_COUNT_KEY, summary: `Featured listings count set to ${body.featuredCount}`, ip }, tx);
  });
  return { featuredCount: body.featuredCount };
}
