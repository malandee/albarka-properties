import { notFound } from 'next/navigation';
import { requirePageSession } from '@/lib/auth/guards';
import { loadManageableProperty } from '@/lib/property/access';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { GalleryManager } from '@/components/admin/GalleryManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Gallery' };

const MAX_IMAGES = 20;

export default async function GalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePageSession(`/admin/properties/${id}/gallery`);
  try {
    await loadManageableProperty(session.actor, id);
  } catch {
    notFound();
  }
  const p = await db.property.findUniqueOrThrow({
    where: { id },
    select: { title: true, images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: { id: true, storageKey: true, altText: true, isFeatured: true, sortOrder: true, width: true, height: true } } },
  });
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[{ label: 'Properties', href: '/admin/properties' }, { label: p.title, href: `/admin/properties/${id}` }, { label: 'Gallery' }]}
        eyebrow="Photographs"
        title="Gallery"
        intro="Photographs are re-encoded as WebP, and camera location data is removed. Choose one featured photograph; it appears first on cards and in search."
      />
      <GalleryManager propertyId={id} images={p.images} maxImages={MAX_IMAGES} />
    </div>
  );
}
