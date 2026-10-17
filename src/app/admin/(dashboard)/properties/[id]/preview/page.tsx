import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePageSession } from '@/lib/auth/guards';
import { loadManageableProperty } from '@/lib/property/access';
import { db } from '@/lib/db';
import { toDetailData } from '@/lib/property/view-model';
import { PropertyDetailView } from '@/components/property/PropertyDetailView';
import { getPublicContact } from '@/lib/contact/public-contact';
import { PageHeader } from '@/components/ui/PageHeader';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Preview listing' };

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePageSession(`/admin/properties/${id}/preview`);
  try {
    await loadManageableProperty(session.actor, id);
  } catch {
    notFound();
  }
  const p = await db.property.findUniqueOrThrow({
    where: { id },
    include: {
      category: { select: { name: true, slug: true } },
      features: { include: { feature: { select: { label: true } } }, orderBy: { feature: { sortOrder: 'asc' } } },
      images: { orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }], select: { id: true, storageKey: true, altText: true, isFeatured: true, width: true, height: true } },
    },
  });
  const detail = toDetailData(p);
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Properties', href: '/admin/properties' }, { label: p.title, href: `/admin/properties/${id}` }, { label: 'Preview' }]}
        title="Preview"
        intro="This is how the listing appears to visitors. Hidden listings are not visible to the public."
        actions={<Link href={`/admin/properties/${id}/edit`} className="btn-secondary">Back to edit</Link>}
      />
      {p.images.length === 0 && (
        <p role="status" className="rounded-md border border-warning/40 bg-white p-4 text-support text-neutral-text">This listing has no photographs yet. A featured photograph is required before it can be shown.</p>
      )}
      <PropertyDetailView p={detail} preview contact={await getPublicContact()} />
    </div>
  );
}
