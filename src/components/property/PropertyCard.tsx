import Link from 'next/link';
import { PurposeBadge, StatusBadge } from '@/components/ui/Badge';
import { formatPrice, formatSqm, locationLine } from '@/lib/format';
import { mediaUrl } from '@/lib/media/urls';
import type { AvailabilityStatus, ListingPurpose } from '@/lib/auth/policy';

export interface PropertyCardData {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  purpose: ListingPurpose;
  priceAmount: { toString(): string } | null;
  priceOnRequest: boolean;
  currency: string;
  priceNote: string | null;
  city: string;
  state: string;
  area: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  landSizeSqm: { toString(): string } | null;
  buildingSizeSqm: { toString(): string } | null;
  availabilityStatus: AvailabilityStatus;
  isDemo?: boolean;
  category: { name: string };
  images: { id: string; storageKey: string; altText: string; width: number; height: number }[];
}

/** Card with a fixed 4:3 image frame so every card has the same proportions. */
export function PropertyCard({ p, headingLevel = 3 }: { p: PropertyCardData; headingLevel?: 2 | 3 }) {
  const img = p.images[0];
  const Heading = (headingLevel === 2 ? 'h2' : 'h3') as 'h2' | 'h3';
  const size = formatSqm(p.landSizeSqm?.toString() ?? null) ?? formatSqm(p.buildingSizeSqm?.toString() ?? null);
  return (
    <article className="card flex h-full flex-col overflow-hidden transition-[border-color,box-shadow] duration-200 ease-std hover:border-brand-deep/50">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-alt">
        {img ? (
          <img
            src={mediaUrl(img.storageKey, 'sm')}
            alt={img.altText}
            width={640}
            height={480}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-support text-neutral-muted">Photograph coming soon</div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <PurposeBadge purpose={p.purpose} />
        </div>
        {p.isDemo && (
          <span className="absolute bottom-3 left-3 rounded-md bg-white/95 px-2 py-1 text-[0.75rem] font-semibold text-brand-ink">Demonstration listing</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-support font-semibold text-brand-deep">{p.category.name}</p>
        <Heading className="text-card text-brand-ink">
          <Link href={`/properties/${p.slug}`} className="rounded-sm hover:underline focus-visible:underline">
            {p.title}
          </Link>
        </Heading>
        <p className="text-support text-neutral-muted">{locationLine(p)}</p>
        <p className="text-[1.0625rem] font-bold text-brand-ink">
          {formatPrice(p.priceAmount?.toString() ?? null, p.currency, p.priceOnRequest)}
          {p.priceNote && <span className="ml-1 text-support font-normal text-neutral-muted">{p.priceNote}</span>}
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-support text-neutral-text" aria-label="Key specifications">
          {p.bedrooms !== null && <li>{p.bedrooms} bed</li>}
          {p.bathrooms !== null && <li>{p.bathrooms} bath</li>}
          {size && <li>{size}</li>}
        </ul>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-neutral-border pt-4">
          <StatusBadge status={p.availabilityStatus} />
          <Link href={`/properties/${p.slug}`} className="text-support font-semibold text-brand-deep hover:underline">
            View details<span className="sr-only"> for {p.title}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
