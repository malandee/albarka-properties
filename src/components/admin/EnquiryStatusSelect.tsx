'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { apiRequest, ApiClientError } from '@/lib/client/api';

const OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'CLOSED', label: 'Closed' },
] as const;

export function EnquiryStatusSelect({ id, status, label }: { id: string; status: 'NEW' | 'REVIEWED' | 'CLOSED'; label: string }) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState(status);
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <label htmlFor={`enq-${id}`} className="sr-only">Status for enquiry from {label}</label>
      <select
        id={`enq-${id}`}
        value={value}
        disabled={busy}
        aria-busy={busy || undefined}
        onChange={async (e) => {
          const next = e.target.value as typeof value;
          const prev = value;
          setValue(next);
          setBusy(true);
          try {
            await apiRequest(`/api/admin/enquiries/${id}`, { method: 'PATCH', body: { status: next } });
            toast.success('Enquiry status updated.');
            router.refresh();
          } catch (err) {
            setValue(prev);
            toast.error(err instanceof ApiClientError ? err.message : 'The status could not be updated.');
          } finally {
            setBusy(false);
          }
        }}
        className="input min-h-10 py-1.5"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
