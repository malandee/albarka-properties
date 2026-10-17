import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/guards';
import { consumeRateLimit } from '@/lib/security/rate-limit';
import { reverseLookup } from '@/lib/geo';
import { errors, ok, toResponse } from '@/lib/http';

const schema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export async function GET(req: Request) {
  try {
    const { actor } = await requireAdmin();
    const url = new URL(req.url);
    const parsed = schema.safeParse({ lat: url.searchParams.get('lat'), lng: url.searchParams.get('lng') });
    if (!parsed.success) throw errors.validation(parsed.error.issues);
    const limit = await consumeRateLimit(`geocode:${actor.id}`, 30, 60);
    if (!limit.allowed) throw errors.rateLimited(limit.retryAfterSeconds);
    return ok({ result: await reverseLookup(parsed.data.lat, parsed.data.lng) });
  } catch (err) {
    return toResponse(err, 'admin.geocode.reverse');
  }
}
