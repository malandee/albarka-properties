import { requireAdmin } from '@/lib/auth/guards';
import { consumeRateLimit } from '@/lib/security/rate-limit';
import { searchPlaces } from '@/lib/geo';
import { errors, ok, toResponse } from '@/lib/http';

/** Admin-only proxy to the geocoder. Keeps the usage policy (identity, rate) on the server. */
export async function GET(req: Request) {
  try {
    const { actor } = await requireAdmin();
    const q = (new URL(req.url).searchParams.get('q') ?? '').trim();
    if (q.length < 3 || q.length > 200) {
      throw errors.unprocessable('Enter at least 3 characters to search for a place.', [{ field: 'q', message: 'Enter at least 3 characters.' }]);
    }
    const limit = await consumeRateLimit(`geocode:${actor.id}`, 30, 60);
    if (!limit.allowed) throw errors.rateLimited(limit.retryAfterSeconds);
    return ok({ results: await searchPlaces(q) });
  } catch (err) {
    return toResponse(err, 'admin.geocode');
  }
}
