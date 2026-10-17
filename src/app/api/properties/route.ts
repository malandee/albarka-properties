import { listPublicProperties, parsePublicFilters, type PublicFilters } from '@/lib/property/catalogue';
import { mediaUrl } from '@/lib/media/urls';
import { ApiError, fail, ok, toResponse } from '@/lib/http';

/**
 * GET /api/properties
 * Query: q, purpose (sale|rent), type (category slug), state, city, minPrice, maxPrice,
 *        bedrooms, bathrooms, status, sort (newest|price_asc|price_desc), page.
 * Returns only public, visible listings.
 */
export async function GET(req: Request) {
  try {
    const params = Object.fromEntries(new URL(req.url).searchParams.entries());
    const { filters, errors } = parsePublicFilters(params);
    if (Object.keys(errors).length) {
      return fail(new ApiError(400, 'INVALID_FILTER', 'Some filters are not valid.', Object.entries(errors).map(([field, message]) => ({ field, message }))));
    }
    const result = await listPublicProperties(filters as PublicFilters);
    return ok({
      total: result.total,
      page: result.page,
      pageCount: result.pageCount,
      pageSize: result.pageSize,
      items: result.items.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        shortDescription: p.shortDescription,
        purpose: p.purpose,
        type: p.category.name,
        priceAmount: p.priceAmount?.toString() ?? null,
        priceOnRequest: p.priceOnRequest,
        currency: p.currency,
        city: p.city,
        state: p.state,
        availabilityStatus: p.availabilityStatus,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        image: p.images[0] ? { url: mediaUrl(p.images[0].storageKey, 'sm'), alt: p.images[0].altText } : null,
      })),
    });
  } catch (err) {
    return toResponse(err, 'public.properties');
  }
}
