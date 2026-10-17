import type { Metadata } from 'next';
import { COMPANY } from '@/config/company';
import { listPublicProperties, parsePublicFilters } from '@/lib/property/catalogue';
import { db } from '@/lib/db';
import { PropertyCard } from '@/components/property/PropertyCard';
import { CatalogueFilters } from '@/components/property/CatalogueFilters';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/States';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = {
  title: 'Properties for Sale and Rent',
  description: 'Browse visible property listings for sale and rent across Nigeria. Search and filter by type, location, price, bedrooms, and availability.',
  alternates: { canonical: '/properties' },
};

export const dynamic = 'force-dynamic';

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function PropertiesPage({ searchParams }: { searchParams: SP }) {
  const raw = await searchParams;
  const { filters, errors } = parsePublicFilters(raw);
  const rawQuery: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const val = Array.isArray(v) ? v[0] : v;
    if (typeof val === 'string') rawQuery[k] = val;
  }

  const [types, result] = await Promise.all([
    db.propertyCategory.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], select: { slug: true, name: true } }),
    listPublicProperties(filters),
  ]);

  const hasFilters = Boolean(filters.q || filters.purpose || filters.type || filters.state || filters.city || filters.minPrice !== null || filters.maxPrice !== null || filters.bedrooms !== null || filters.bathrooms !== null || filters.status);
  const from = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const to = Math.min(result.total, result.page * result.pageSize);
  const paramsForPaging: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawQuery)) if (v !== '' && k !== 'page') paramsForPaging[k] = v;

  return (
    <>
      <PageHeader
        eyebrow="Property catalogue"
        title="Properties for sale and rent"
        intro={`Browse listings that ${COMPANY.shortName} has published. Hidden listings are not shown. Contact the team for the latest details on any property.`}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Properties' }]}
      />
      <div className="mx-auto grid max-w-content gap-8 px-5 py-10 md:px-8 lg:grid-cols-[320px_1fr] lg:gap-10">
        <aside aria-label="Search and filters">
          <CatalogueFilters filters={filters} types={types} errors={errors} rawQuery={rawQuery} />
        </aside>

        <section aria-labelledby="results-heading" className="min-w-0">
          <div className="flex flex-col gap-2 border-b border-neutral-border pb-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 id="results-heading" className="text-card text-brand-ink" aria-live="polite">
              {result.total === 0
                ? 'No matching properties'
                : `Showing ${from}–${to} of ${result.total} ${result.total === 1 ? 'property' : 'properties'}`}
            </h2>
            {hasFilters && <p className="text-support text-neutral-muted">Filters applied</p>}
          </div>

          {result.items.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                title={hasFilters ? 'No properties match these filters' : 'No properties are listed yet'}
                description={
                  hasFilters
                    ? 'Try removing a filter, widening the price range, or searching a different area. You can also contact us about properties that are not listed online.'
                    : 'New listings are added regularly. Contact our team to tell us what you are looking for.'
                }
                actions={[
                  ...(hasFilters ? [{ href: '/properties', label: 'Clear filters' }] : []),
                  { href: '/contact?subject=PROPERTY_ENQUIRY', label: 'Contact our team', variant: 'secondary' as const },
                ]}
              />
            </div>
          ) : (
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map((p) => (
                <li key={p.id}>
                  <PropertyCard p={p} headingLevel={2} />
                </li>
              ))}
            </ul>
          )}

          <Pagination basePath="/properties" params={paramsForPaging} page={result.page} pageCount={result.pageCount} />
        </section>
      </div>
    </>
  );
}
