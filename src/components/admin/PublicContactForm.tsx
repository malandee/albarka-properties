'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { apiRequest, ApiClientError } from '@/lib/client/api';
import type { PublicContact } from '@/lib/contact/rules';

interface Row {
  label: string;
  number: string;
  published: boolean;
}

/**
 * Super Admin control for public contact details.
 * Telephone numbers are published only when their box is ticked, and WhatsApp appears only when a number is set.
 * Saving requires the verification checkbox, so nothing is published from an unchecked entry.
 */
export function PublicContactForm({ initial }: { initial: PublicContact }) {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState(initial.email);
  const [address, setAddress] = useState(initial.address);
  const [rows, setRows] = useState<Row[]>(
    initial.phones.map((p) => ({ label: p.label, number: p.tel, published: p.published })),
  );
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp ?? '');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!confirmed) {
      setError('Tick the verification box to save these details.');
      return;
    }
    setBusy(true);
    try {
      await apiRequest('/api/admin/site-contact', {
        method: 'PATCH',
        body: {
          email,
          address,
          phones: rows.filter((r) => r.number.trim()).map((r) => ({ label: r.label, number: r.number, published: r.published })),
          whatsapp: whatsapp.trim() === '' ? null : whatsapp,
          confirmed: true,
        },
      });
      toast.success('Public contact details saved.');
      setConfirmed(false);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError && err.fields.length > 0) setError(err.fields[0]!.message);
      else setError(err instanceof ApiClientError ? err.message : 'The details could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="card space-y-6 p-5 md:p-6" aria-labelledby="contact-heading">
      <div>
        <h2 id="contact-heading" className="text-card text-brand-ink">Public contact details</h2>
        <p className="mt-1 text-support text-neutral-muted">
          Telephone numbers appear on the site only when they are ticked as published. The WhatsApp button appears only when a WhatsApp number is entered. Only enter details the company has confirmed.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="pc-email" className="block text-support font-semibold text-brand-ink">Email</label>
          <input id="pc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 input" required />
        </div>
        <div>
          <label htmlFor="pc-address" className="block text-support font-semibold text-brand-ink">Head office address</label>
          <input id="pc-address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1.5 input" required />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-support font-semibold text-brand-ink">Telephone numbers (up to three)</legend>
        {rows.map((r, i) => (
          <div key={i} className="grid gap-3 md:grid-cols-[1fr_1.4fr_auto] md:items-end">
            <div>
              <label htmlFor={`pc-label-${i}`} className="block text-[0.8125rem] text-neutral-muted">Label</label>
              <input id={`pc-label-${i}`} type="text" value={r.label} onChange={(e) => updateRow(i, { label: e.target.value })} className="mt-1 input" />
            </div>
            <div>
              <label htmlFor={`pc-number-${i}`} className="block text-[0.8125rem] text-neutral-muted">Number (Nigerian)</label>
              <input id={`pc-number-${i}`} type="tel" value={r.number} onChange={(e) => updateRow(i, { number: e.target.value })} className="mt-1 input" />
            </div>
            <label className="inline-flex min-h-11 items-center gap-2 text-support text-neutral-text">
              <input type="checkbox" checked={r.published} onChange={(e) => updateRow(i, { published: e.target.checked })} className="h-4 w-4" />
              Show on the site
            </label>
          </div>
        ))}
        {rows.length < 3 && (
          <Button type="button" variant="ghost" onClick={() => setRows((rs) => [...rs, { label: `Telephone ${rs.length + 1}`, number: '', published: false }])}>
            Add a telephone number
          </Button>
        )}
      </fieldset>

      <div>
        <label htmlFor="pc-whatsapp" className="block text-support font-semibold text-brand-ink">WhatsApp number (optional)</label>
        <p className="mt-1 text-[0.8125rem] text-neutral-muted">Leave blank to hide the WhatsApp button.</p>
        <input id="pc-whatsapp" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="mt-1.5 input max-w-sm" />
      </div>

      <div className="rounded-md bg-neutral-alt p-4">
        <label className="flex min-h-11 items-start gap-3 text-support text-neutral-text">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 h-4 w-4" aria-describedby="pc-confirm-help" />
          <span>I confirm that these details have been verified with the company and may be published.</span>
        </label>
        <p id="pc-confirm-help" className="ml-7 text-[0.8125rem] text-neutral-muted">Every change is recorded in the audit log.</p>
      </div>

      {error && <p role="alert" className="text-[0.8125rem] text-danger">{error}</p>}

      <Button type="submit" variant="secondary" loading={busy} loadingLabel="Saving…">Save contact details</Button>
    </form>
  );
}
