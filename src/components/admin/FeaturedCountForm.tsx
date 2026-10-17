'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { apiRequest, ApiClientError } from '@/lib/client/api';

export function FeaturedCountForm({ initial }: { initial: number }) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState(String(initial));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 12) {
      setError('Enter a whole number from 1 to 12.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await apiRequest('/api/admin/settings', { method: 'PATCH', body: { featuredCount: n } });
      toast.success('Featured count saved.');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'The setting could not be saved.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} noValidate className="card space-y-4 p-5 md:p-6" aria-labelledby="featured-heading">
      <h2 id="featured-heading" className="text-card text-brand-ink">Featured listings on the home page</h2>
      <p className="text-support text-neutral-muted">How many shown listings appear on the home page. Choose a number from 1 to 12.</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <label htmlFor="featured-count" className="block text-support font-semibold text-brand-ink">Number of listings</label>
          <input id="featured-count" type="number" min={1} max={12} step={1} inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} className={`mt-1.5 input w-32 ${error ? 'input-invalid' : ''}`} aria-invalid={!!error || undefined} aria-describedby={error ? 'featured-error' : undefined} />
          {error && <p id="featured-error" className="mt-1.5 text-[0.8125rem] text-danger">{error}</p>}
        </div>
        <Button type="submit" variant="secondary" loading={busy} loadingLabel="Saving…">Save</Button>
      </div>
    </form>
  );
}
