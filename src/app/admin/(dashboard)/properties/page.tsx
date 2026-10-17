import Link from 'next/link';
import { requirePageSession } from '@/lib/auth/guards';
import { PERMISSIONS } from '@/lib/auth/policy';
import { listManageableProperties, parseAdminFilters } from '@/lib/property/catalogue';
import { mediaUrl } from '@/lib/media/urls';
import { formatPrice, formatDate, purposeLabel } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge, VisibilityBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';
import { VisibilityToggle, DeletePropertyButton } from '@/components/admin/PropertyActions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Properties' };

type SP = Record<string, string | string[] | undefined>;

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const session = await requirePageSession('/admin/properties');
  const f = parseAdminFilters(sp);
  const data = await listManageableProperties(session.actor, f);
  const isSuper = PERMISSIONS.manageAllProperties(session.actor);
  const params: Record<string, string> = {};
  for (const k of ['q', 'visibility', 'status', 'purpose', 'sort'] as const) {
    const v = sp[k];
    if (typeof v === 'string' && v) params[k] = v;
  }
  const filtersActive = Object.keys(params).length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={isSuper ? 'All listings' : 'My listings'}
        title="Properties"
        intro={`${data.total} listing${data.total === 1 ? '' : 's'} match${data.total === 1 ? 'es' : ''} your filters.`}
        actions={
          <Link href="/admin/properties/new" className="btn-primary">
            Add a property
          </Link>
        }
      />

      <form method="get" role="search" aria-label="Filter properties" className="card grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
        <div>
          <label htmlFor="q" className="block text-support font-semibold text-brand-ink">Search</label>
          <input id="q" name="q" type="search" defaultValue={f.q} maxLength={100} placeholder="Title, city, address" className="mt-1.5 input" />
        </div>
        <div>
          <label htmlFor="visibility" className="block text-support font-semibold text-brand-ink">Visibility</label>
          <select id="visibility" name="visibility" defaultValue={f.visibility ?? ''} className="mt-1.5 input">
            <option value="">Any</option>
            <option value="PUBLIC">Shown</option>
            <option value="HIDDEN">Hidden</option>
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-support font-semibold text-brand-ink">Status</label>
          <select id="status" name="status" defaultValue={f.status ?? ''} className="mt-1.5 input">
            <option value="">Any</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
            <option value="RENTED">Rented</option>
          </select>
        </div>
        <div>
          <label htmlFor="purpose" className="block text-support font-semibold text-brand-ink">Purpose</label>
          <select id="purpose" name="purpose" defaultValue={f.purpose ?? ''} className="mt-1.5 input">
            <option value="">Any</option>
            <option value="FOR_SALE">For Sale</option>
            <option value="FOR_RENT">For Rent</option>
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="block text-support font-semibold text-brand-ink">Sort by</label>
          <select id="sort" name="sort" defaultValue={f.sort} className="mt-1.5 input">
            <option value="updated">Recently updated</option>
            <option value="newest">Newest first</option>
            <option value="price_asc">Price, low to high</option>
            <option value="price_desc">Price, high to low</option>
            <option value="title">Title, A to Z</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-secondary w-full">Apply</button>
          {filtersActive && (
            <Link href="/admin/properties" className="btn-ghost whitespace-nowrap">Clear</Link>
          )}
        </div>
      </form>

      {data.items.length === 0 ? (
        <EmptyState
          title={filtersActive ? 'No listings match these filters' : 'No listings yet'}
          description={filtersActive ? 'Try a different search or clear the filters.' : 'Add your first property. It stays hidden until you choose to show it.'}
          actions={filtersActive ? [{ href: '/admin/properties', label: 'Clear filters', variant: 'secondary' }] : [{ href: '/admin/properties/new', label: 'Add a property' }]}
        />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-support">
              <caption className="sr-only">Listings matching your filters</caption>
              <thead className="border-b border-neutral-border bg-neutral-alt text-neutral-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Property</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Price</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Visibility</th>
                  {isSuper && <th scope="col" className="px-4 py-3 font-semibold">Owner</th>}
                  <th scope="col" className="px-4 py-3 font-semibold">Updated</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => {
                  const img = p.images[0];
                  return (
                    <tr key={p.id} className="border-b border-neutral-border last:border-0 align-top">
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          {img ? (
                            <img src={mediaUrl(img.storageKey, 'sm')} alt="" width={72} height={54} loading="lazy" className="h-[54px] w-[72px] flex-none rounded object-cover" />
                          ) : (
                            <span className="flex h-[54px] w-[72px] flex-none items-center justify-center rounded bg-neutral-alt text-[0.75rem] text-neutral-muted">No photo</span>
                          )}
                          <div className="min-w-0">
                            <Link href={`/admin/properties/${p.id}`} className="font-semibold text-brand-ink hover:text-brand-deep hover:underline">{p.title}</Link>
                            <p className="mt-1 text-[0.8125rem] text-neutral-muted">{p.category.name} · {purposeLabel(p.purpose)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 tabular-nums">{formatPrice(p.priceAmount?.toString() ?? null, p.currency, p.priceOnRequest)}</td>
                      <td className="px-4 py-4"><StatusBadge status={p.availabilityStatus} /></td>
                      <td className="px-4 py-4"><VisibilityBadge visibility={p.visibility} /></td>
                      {isSuper && <td className="px-4 py-4">{p.owner.name}</td>}
                      <td className="px-4 py-4 text-neutral-muted">{formatDate(p.updatedAt)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link href={`/admin/properties/${p.id}/edit`} className="btn-secondary min-h-10 px-3 text-support">
                            Edit<span className="sr-only"> {p.title}</span>
                          </Link>
                          <VisibilityToggle id={p.id} visibility={p.visibility} title={p.title} />
                          {p.visibility === 'HIDDEN' && <DeletePropertyButton id={p.id} title={p.title} />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination basePath="/admin/properties" params={params} page={data.page} pageCount={data.pageCount} />
        </>
      )}
    </div>
  );
}
