import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePageSession } from '@/lib/auth/guards';
import { loadManageableProperty } from '@/lib/property/access';
import { publishBlockers } from '@/lib/property/publish-rules';
import { db } from '@/lib/db';
import { formatDateTime, formatPrice, locationLine, purposeLabel } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { PurposeBadge, StatusBadge, VisibilityBadge } from '@/components/ui/Badge';
import { StatusForm, VisibilityToggle, DeletePropertyButton, ListingLinks } from '@/components/admin/PropertyActions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Property details' };

export default async function InspectPropertyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await requirePageSession(`/admin/properties/${id}`);
  let access: Awaited<ReturnType<typeof loadManageableProperty>>;
  try {
    access = await loadManageableProperty(session.actor, id);
  } catch {
    notFound();
  }
  const p = await db.property.findUniqueOrThrow({
    where: { id },
    select: {
      id: true, slug: true, title: true, shortDescription: true, description: true, purpose: true, priceAmount: true, priceOnRequest: true, currency: true, priceNote: true,
      addressLine: true, area: true, city: true, state: true, formattedAddress: true, latitude: true, longitude: true, mapIsPrivate: true,
      bedrooms: true, bathrooms: true, toilets: true, parkingSpaces: true, floors: true, landSizeSqm: true, buildingSizeSqm: true,
      availabilityStatus: true, visibility: true, publishedAt: true, updatedAt: true, createdAt: true, isDemo: true,
      category: { select: { name: true } }, owner: { select: { name: true } },
      features: { select: { feature: { select: { label: true } } }, orderBy: { featureId: 'asc' } },
      images: { orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }], select: { id: true } },
      statusHistory: { orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, fromStatus: true, toStatus: true, fromVisibility: true, toVisibility: true, createdAt: true, changedBy: { select: { name: true } } } },
    },
  });
  const featured = p.images.length > 0 ? 1 : 0;
  const blockers = publishBlockers({ ...p, featuredImageCount: featured });
  const canDelete = p.visibility === 'HIDDEN';
  const price = formatPrice(p.priceAmount?.toString() ?? null, p.currency, p.priceOnRequest);

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[{ label: 'Properties', href: '/admin/properties' }, { label: p.title }]}
        eyebrow={`${p.category.name} · ${purposeLabel(p.purpose)}`}
        title={p.title}
        intro={`Owner: ${p.owner.name}. Last updated ${formatDateTime(p.updatedAt)}.`}
      />

      {sp.created === '1' && (
        <p role="status" className="rounded-md border border-brand-deep/30 bg-white p-4 text-support text-neutral-text">
          Listing saved as hidden. Add photographs, then choose Show to publish it.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <PurposeBadge purpose={p.purpose} />
        <StatusBadge status={p.availabilityStatus} />
        <VisibilityBadge visibility={p.visibility} />
        {p.isDemo && <span className="rounded-md bg-neutral-alt px-2.5 py-1 text-[0.8125rem] font-semibold text-brand-ink">Sample listing</span>}
      </div>

      <ListingLinks id={p.id} slug={p.slug} visibility={p.visibility} />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="card space-y-4 p-5 md:p-6" aria-labelledby="summary-heading">
            <h2 id="summary-heading" className="text-card text-brand-ink">Summary</h2>
            <dl className="grid gap-4 text-support sm:grid-cols-2">
              <div><dt className="text-neutral-muted">Price</dt><dd className="font-semibold text-brand-ink">{price}{p.priceNote ? ` (${p.priceNote})` : ''}</dd></div>
              <div><dt className="text-neutral-muted">Location</dt><dd className="font-semibold text-brand-ink">{p.addressLine}, {locationLine(p)}</dd></div>
              <div><dt className="text-neutral-muted">Map</dt><dd className="text-neutral-text">{p.latitude !== null && p.longitude !== null ? `${p.latitude.toString()}, ${p.longitude.toString()}${p.mapIsPrivate ? ' (kept private)' : ''}` : 'No marker set'}</dd></div>
              <div><dt className="text-neutral-muted">Bedrooms / bathrooms</dt><dd className="text-neutral-text">{p.bedrooms ?? '—'} / {p.bathrooms ?? '—'}</dd></div>
              <div><dt className="text-neutral-muted">Features</dt><dd className="text-neutral-text">{p.features.length ? p.features.map((f) => f.feature.label).join(', ') : 'None selected'}</dd></div>
              <div><dt className="text-neutral-muted">Created</dt><dd className="text-neutral-text">{formatDateTime(p.createdAt)}</dd></div>
            </dl>
            <p className="text-neutral-text">{p.shortDescription}</p>
          </section>

          <section className="card space-y-4 p-5 md:p-6" aria-labelledby="history-heading">
            <h2 id="history-heading" className="text-card text-brand-ink">Recent status changes</h2>
            {p.statusHistory.length === 0 ? (
              <p className="text-support text-neutral-muted">No status changes recorded yet.</p>
            ) : (
              <ul className="divide-y divide-neutral-border text-support">
                {p.statusHistory.map((h) => (
                  <li key={h.id} className="py-3">
                    {h.toStatus && h.fromStatus !== h.toStatus && <span>Status: {h.fromStatus ?? '—'} → {h.toStatus}. </span>}
                    {h.toVisibility && h.fromVisibility !== h.toVisibility && <span>Visibility: {h.toVisibility === 'PUBLIC' ? 'Shown' : 'Hidden'}. </span>}
                    <span className="text-neutral-muted">{formatDateTime(h.createdAt)}{h.changedBy ? `, by ${h.changedBy.name}` : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6" aria-label="Listing controls">
          <section className="card space-y-4 p-5" aria-labelledby="publish-heading">
            <h2 id="publish-heading" className="text-card text-brand-ink">Publishing</h2>
            {p.visibility === 'PUBLIC' ? (
              <p className="text-support text-neutral-text">This listing is visible to the public.</p>
            ) : blockers.length === 0 ? (
              <p className="text-support text-neutral-text">This listing meets the requirements and can be shown.</p>
            ) : (
              <div>
                <p className="text-support font-semibold text-warning">To show this listing, complete these items:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-support text-neutral-text">
                  {blockers.map((b) => (<li key={b}>{b}</li>))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <VisibilityToggle id={p.id} visibility={p.visibility} title={p.title} />
            </div>
          </section>

          <section className="card space-y-4 p-5" aria-labelledby="status-heading">
            <h2 id="status-heading" className="text-card text-brand-ink">Availability</h2>
            <StatusForm id={p.id} current={p.availabilityStatus} purpose={p.purpose} />
          </section>

          <section className="card space-y-4 p-5" aria-labelledby="danger-heading">
            <h2 id="danger-heading" className="text-card text-brand-ink">Delete</h2>
            {canDelete ? (
              <>
                <p className="text-support text-neutral-muted">Deleting removes the listing and its photographs permanently.</p>
                <DeletePropertyButton id={p.id} title={p.title} redirectTo="/admin/properties" />
              </>
            ) : (
              <p className="text-support text-neutral-muted">Hide the listing first. Only hidden listings can be deleted.</p>
            )}
          </section>
          <p className="text-[0.8125rem] text-neutral-muted">Reference: {access.id.slice(-8).toUpperCase()}</p>
        </aside>
      </div>
    </div>
  );
}
