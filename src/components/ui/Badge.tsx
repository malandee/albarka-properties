import type { AvailabilityStatus, ListingPurpose, Visibility } from '@/lib/auth/policy';

const BASE = 'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[0.8125rem] font-semibold leading-none whitespace-nowrap';

export function PurposeBadge({ purpose }: { purpose: ListingPurpose }) {
  return (
    <span className={`${BASE} ${purpose === 'FOR_SALE' ? 'bg-brand-deep text-white' : 'bg-brand-charcoal text-white'}`}>
      {purpose === 'FOR_SALE' ? 'For Sale' : 'For Rent'}
    </span>
  );
}

const STATUS_STYLE: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'bg-[#E7F4EC] text-success',
  RESERVED: 'bg-[#FBF1E1] text-warning',
  SOLD: 'bg-neutral-alt text-brand-ink',
  RENTED: 'bg-neutral-alt text-brand-ink',
};
const STATUS_LABEL: Record<AvailabilityStatus, string> = { AVAILABLE: 'Available', RESERVED: 'Reserved', SOLD: 'Sold', RENTED: 'Rented' };

export function StatusBadge({ status }: { status: AvailabilityStatus }) {
  return <span className={`${BASE} ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  return (
    <span className={`${BASE} ${visibility === 'PUBLIC' ? 'bg-[#E7F4EC] text-success' : 'bg-neutral-alt text-neutral-muted'}`}>
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${visibility === 'PUBLIC' ? 'bg-success' : 'bg-neutral-muted'}`} />
      {visibility === 'PUBLIC' ? 'Shown' : 'Hidden'}
    </span>
  );
}
