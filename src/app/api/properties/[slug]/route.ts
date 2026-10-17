import { getPublicPropertyBySlug } from '@/lib/property/catalogue';
import { mediaUrl } from '@/lib/media/urls';
import { ApiError, fail, ok, toResponse } from '@/lib/http';

/** Public detail. Hidden or unknown listings return the same 404. */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    if (!/^[a-z0-9-]{3,160}$/.test(slug)) return fail(new ApiError(404, 'NOT_FOUND', 'Property was not found.'));
    const p = await getPublicPropertyBySlug(slug);
    if (!p) return fail(new ApiError(404, 'NOT_FOUND', 'Property was not found.'));
    return ok({
      id: p.id,
      slug: p.slug,
      title: p.title,
      shortDescription: p.shortDescription,
      description: p.description,
      purpose: p.purpose,
      type: p.category.name,
      priceAmount: p.priceAmount?.toString() ?? null,
      priceOnRequest: p.priceOnRequest,
      currency: p.currency,
      priceNote: p.priceNote,
      addressLine: p.addressLine,
      area: p.area,
      city: p.city,
      state: p.state,
      country: p.country,
      availabilityStatus: p.availabilityStatus,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      toilets: p.toilets,
      parkingSpaces: p.parkingSpaces,
      floors: p.floors,
      landSizeSqm: p.landSizeSqm?.toString() ?? null,
      buildingSizeSqm: p.buildingSizeSqm?.toString() ?? null,
      features: p.features.map((f) => f.feature.label),
      location: p.mapIsPrivate || p.latitude === null || p.longitude === null
        ? null
        : { latitude: Number(p.latitude), longitude: Number(p.longitude), formattedAddress: p.formattedAddress },
      images: p.images.map((i) => ({
        id: i.id,
        alt: i.altText,
        featured: i.isFeatured,
        width: i.width,
        height: i.height,
        thumbUrl: mediaUrl(i.storageKey, 'sm'),
        largeUrl: mediaUrl(i.storageKey, 'lg'),
      })),
    });
  } catch (err) {
    return toResponse(err, 'public.property');
  }
}
