import { db } from '@/lib/db';
import { getCurrentSession } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/auth/policy';
import { isValidStorageKey, readVariant, type Variant } from '@/lib/media/storage';

/**
 * Serves property images. Files are not in /public, so every request is checked:
 * - Public listings: visible to anyone.
 * - Hidden listings: only the owning Admin or a Super Admin, with private caching.
 * Missing or unauthorised media returns 404 without revealing whether the file exists.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  if (!Array.isArray(path) || path.length !== 3) return notFound();
  const [propertyId, hex, variantRaw] = path;
  const variant = variantRaw as Variant;
  if (variant !== 'lg' && variant !== 'sm') return notFound();
  const key = `${propertyId}/${hex}`;
  if (!isValidStorageKey(key)) return notFound();

  const image = await db.propertyImage.findUnique({
    where: { storageKey: key },
    select: { property: { select: { id: true, ownerId: true, visibility: true } } },
  });
  if (!image) return notFound();

  let cacheControl: string;
  if (image.property.visibility === 'PUBLIC') {
    cacheControl = 'public, max-age=300, stale-while-revalidate=600';
  } else {
    const session = await getCurrentSession();
    if (!session || !PERMISSIONS.viewProperty(session.actor, image.property)) return notFound();
    cacheControl = 'private, no-store';
  }

  try {
    const buf = await readVariant(key, variant);
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': cacheControl,
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline',
      },
    });
  } catch {
    return notFound();
  }
}

function notFound() {
  return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' } });
}
