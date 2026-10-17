'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { apiRequest, ApiClientError } from '@/lib/client/api';

type Status = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'RENTED';
const STATUS_LABEL: Record<Status, string> = { AVAILABLE: 'Available', RESERVED: 'Reserved', SOLD: 'Sold', RENTED: 'Rented' };

/** Show/hide and delete actions used in the listing table. Each action shows busy state and the result. */
export function VisibilityToggle({ id, visibility, title }: { id: string; visibility: 'PUBLIC' | 'HIDDEN'; title: string }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const show = visibility === 'HIDDEN';
  return (
    <Button
      variant="secondary"
      className="min-h-10 px-3 text-support"
      loading={busy}
      loadingLabel={show ? 'Showing…' : 'Hiding…'}
      aria-label={`${show ? 'Show' : 'Hide'} ${title}`}
      onClick={async () => {
        setBusy(true);
        try {
          await apiRequest(`/api/admin/properties/${id}/visibility`, { method: 'PATCH', body: { visibility: show ? 'PUBLIC' : 'HIDDEN' } });
          toast.success(show ? 'Listing is now shown publicly.' : 'Listing is hidden from the public site.');
          router.refresh();
        } catch (err) {
          if (err instanceof ApiClientError && err.fields.length) {
            toast.error(`${err.message} ${err.fields.map((f) => f.message).join(' ')}`);
          } else {
            toast.error(err instanceof ApiClientError ? err.message : 'The visibility could not be changed.');
          }
        } finally {
          setBusy(false);
        }
      }}
    >
      {show ? 'Show' : 'Hide'}
    </Button>
  );
}

export function DeletePropertyButton({ id, title, redirectTo }: { id: string; title: string; redirectTo?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button variant="danger" className="min-h-10 px-3 text-support" onClick={() => setOpen(true)} aria-label={`Delete ${title}`}>
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        title="Delete this listing?"
        description={`“${title}” and its photographs will be permanently removed. Its audit history is kept. Only hidden listings can be deleted.`}
        confirmLabel="Delete listing"
        destructive
        busy={busy}
        onCancel={() => setOpen(false)}
        onConfirm={async () => {
          setBusy(true);
          try {
            await apiRequest(`/api/admin/properties/${id}`, { method: 'DELETE' });
            toast.success('Listing deleted.');
            setOpen(false);
            if (redirectTo) router.push(redirectTo);
            else router.refresh();
          } catch (err) {
            toast.error(err instanceof ApiClientError ? err.message : 'The listing could not be deleted.');
            setOpen(false);
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}

export function StatusForm({ id, current, purpose }: { id: string; current: Status; purpose: 'FOR_SALE' | 'FOR_RENT' }) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState<Status>(current);
  const [busy, setBusy] = useState(false);
  const options: Status[] = purpose === 'FOR_SALE' ? ['AVAILABLE', 'RESERVED', 'SOLD'] : ['AVAILABLE', 'RESERVED', 'RENTED'];
  if (!options.includes(value)) options.push(value);
  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy || value === current) return;
        setBusy(true);
        try {
          await apiRequest(`/api/admin/properties/${id}/status`, { method: 'PATCH', body: { availabilityStatus: value } });
          toast.success(`Status changed to ${STATUS_LABEL[value]}.`);
          router.refresh();
        } catch (err) {
          toast.error(err instanceof ApiClientError ? err.message : 'The status could not be changed.');
          setValue(current);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="flex-1">
        <label htmlFor="status-select" className="block text-support font-semibold text-brand-ink">
          Availability status
        </label>
        <select id="status-select" value={value} onChange={(e) => setValue(e.target.value as Status)} className="input mt-1.5">
          {options.map((o) => (
            <option key={o} value={o}>
              {STATUS_LABEL[o]}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" variant="secondary" loading={busy} loadingLabel="Saving…" disabled={value === current}>
        Update status
      </Button>
    </form>
  );
}

export function ListingLinks({ id, slug, visibility }: { id: string; slug: string; visibility: 'PUBLIC' | 'HIDDEN' }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/admin/properties/${id}/edit`} className="btn-secondary min-h-10 px-3 text-support">
        Edit
      </Link>
      <Link href={`/admin/properties/${id}/gallery`} className="btn-secondary min-h-10 px-3 text-support">
        Gallery
      </Link>
      <Link href={`/admin/properties/${id}/preview`} className="btn-secondary min-h-10 px-3 text-support">
        Preview
      </Link>
      {visibility === 'PUBLIC' && (
        <Link href={`/properties/${slug}`} className="btn-ghost min-h-10 px-3 text-support" target="_blank" rel="noopener noreferrer">
          Public page<span className="sr-only"> (opens in a new tab)</span>
        </Link>
      )}
    </div>
  );
}
