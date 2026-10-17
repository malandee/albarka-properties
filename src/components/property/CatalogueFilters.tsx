import Link from 'next/link';
import { NIGERIAN_STATES } from '@/config/nigeria';
import type { PublicFilters } from '@/lib/property/catalogue';

interface Props {
  filters: PublicFilters;
  types: { slug: string; name: string }[];
  errors: Record<string, string>;
  rawQuery: Record<string, string>;
}

const field = 'mt-1.5';
const label = 'block text-support font-semibold text-brand-ink';

/**
 * Search and filter form. It is a plain GET form: every control is a real query parameter, so it
 * works without JavaScript and the results page is linkable and shareable.
 */
export function CatalogueFilters({ filters, types, errors, rawQuery }: Props) {
  const err = (k: string) => errors[k];
  return (
    <form method="get" action="/properties" aria-describedby={Object.keys(errors).length ? 'filter-errors' : undefined} className="card space-y-6 p-5 md:p-6" role="search" aria-label="Search and filter properties">
      <div>
        <label htmlFor="q" className={label}>
          Keyword search
        </label>
        <input id="q" name="q" type="search" defaultValue={filters.q} maxLength={100} placeholder="Title, area, city, description, or type" className={`input ${field}`} autoComplete="off" />
        <p className="mt-1.5 text-[0.8125rem] text-neutral-muted">Searches titles, descriptions, areas, cities, states, and property types.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <div>
          <label htmlFor="purpose" className={label}>
            Listing purpose
          </label>
          <select id="purpose" name="purpose" defaultValue={filters.purpose === 'FOR_SALE' ? 'sale' : filters.purpose === 'FOR_RENT' ? 'rent' : ''} className={`input ${field}`} aria-invalid={!!err('purpose') || undefined} aria-describedby={err('purpose') ? 'purpose-error' : undefined}>
            <option value="">Any purpose</option>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
        </div>
        <div>
          <label htmlFor="type" className={label}>
            Property type
          </label>
          <select id="type" name="type" defaultValue={filters.type ?? ''} className={`input ${field}`} aria-invalid={!!err('type') || undefined}>
            <option value="">Any type</option>
            {types.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="state" className={label}>
            State
          </label>
          <select id="state" name="state" defaultValue={filters.state ?? ''} className={`input ${field}`} aria-invalid={!!err('state') || undefined}>
            <option value="">Any state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="city" className={label}>
            City or area
          </label>
          <input id="city" name="city" type="text" maxLength={100} defaultValue={filters.city} className={`input ${field}`} placeholder="e.g. Bauchi" />
        </div>
        <div>
          <label htmlFor="minPrice" className={label}>
            Minimum price (NGN)
          </label>
          <input id="minPrice" name="minPrice" type="number" inputMode="decimal" min={0} step="any" defaultValue={rawQuery.minPrice ?? ''} className={`input ${field} ${err('minPrice') ? 'input-invalid' : ''}`} aria-invalid={!!err('minPrice') || undefined} aria-describedby={err('minPrice') ? 'minPrice-error' : undefined} />
        </div>
        <div>
          <label htmlFor="maxPrice" className={label}>
            Maximum price (NGN)
          </label>
          <input id="maxPrice" name="maxPrice" type="number" inputMode="decimal" min={0} step="any" defaultValue={rawQuery.maxPrice ?? ''} className={`input ${field} ${err('maxPrice') ? 'input-invalid' : ''}`} aria-invalid={!!err('maxPrice') || undefined} aria-describedby={err('maxPrice') ? 'maxPrice-error' : undefined} />
        </div>
        <div>
          <label htmlFor="bedrooms" className={label}>
            Bedrooms (minimum)
          </label>
          <select id="bedrooms" name="bedrooms" defaultValue={filters.bedrooms?.toString() ?? ''} className={`input ${field}`}>
            <option value="">Any</option>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="bathrooms" className={label}>
            Bathrooms (minimum)
          </label>
          <select id="bathrooms" name="bathrooms" defaultValue={filters.bathrooms?.toString() ?? ''} className={`input ${field}`}>
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className={label}>
            Availability
          </label>
          <select id="status" name="status" defaultValue={filters.status ?? ''} className={`input ${field}`}>
            <option value="">Any status</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
            <option value="RENTED">Rented</option>
          </select>
        </div>
        <div>
          <label htmlFor="sort" className={label}>
            Sort by
          </label>
          <select id="sort" name="sort" defaultValue={filters.sort} className={`input ${field}`}>
            <option value="newest">Newest first</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <div id="filter-errors" role="alert" className="rounded-md border border-danger/30 bg-white p-4 text-support text-danger">
          <p className="font-semibold">Please check these filters:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {Object.entries(errors).map(([k, v]) => (
              <li key={k} id={`${k}-error`}>
                {v}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" className="btn-primary">
          Apply filters
        </button>
        <Link href="/properties" className="btn-secondary">
          Clear all
        </Link>
      </div>
    </form>
  );
}
