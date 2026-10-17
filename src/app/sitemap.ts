import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { getEnv } from '@/lib/env';
import { SERVICE_FAMILIES } from '@/config/services';

export const dynamic = 'force-dynamic';

/** Public pages and visible listings only. Hidden listings never appear here. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getEnv().APP_URL.replace(/\/$/, '');
  const staticPages = [
    '',
    '/about',
    '/services',
    ...SERVICE_FAMILIES.map((f) => `/services/${f.slug}`),
    '/properties',
    '/who-we-serve',
    '/partnerships',
    '/contact',
    '/privacy',
    '/terms',
  ];
  const properties = await db.property.findMany({
    where: { visibility: 'PUBLIC' },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 5000,
  });
  return [
    ...staticPages.map((p) => ({ url: `${base}${p}`, lastModified: new Date() })),
    ...properties.map((p) => ({ url: `${base}/properties/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
