'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { apiRequest, ApiClientError } from '@/lib/client/api';

export interface CatalogueRow {
  id: string;
  label: string;
  active: boolean;
  usage: number;
}

/** Add, rename, and enable/disable categories or features. Disabling hides an option from new listings but keeps existing links. */
export function CatalogueManager({ kind, title, intro, items }: { kind: 'categories' | 'features'; title: string; intro: string; items: CatalogueRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [newLabel, setNewLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const single = kind === 'categories' ? 'category' : 'feature';

  async function add(e: FormEvent) {
    e.preventDefault();
    if (newLabel.trim().length < 2) {
      setError('Enter a name of at least 2 characters.');
      return;
    }
    setBusy('add');
    setError(null);
    try {
      await apiRequest(`/api/admin/catalogue/${kind}`, { method: 'POST', body: { label: newLabel.trim() } });
      setNewLabel('');
      toast.success(`${single === 'category' ? 'Property type' : 'Feature'} added.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'It could not be added.');
    } finally {
      setBusy(null);
    }
  }

  async function update(item: CatalogueRow, body: { label?: string; active?: boolean }, success: string) {
    setBusy(item.id);
    try {
      await apiRequest(`/api/admin/catalogue/${kind}/${item.id}`, { method: 'PATCH', body });
      toast.success(success);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'The change could not be saved.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby={`${kind}-heading`} className="card space-y-5 p-5 md:p-6">
      <div>
        <h2 id={`${kind}-heading`} className="text-card text-brand-ink">{title}</h2>
        <p className="mt-1 text-support text-neutral-muted">{intro}</p>
      </div>
      <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
        <div className="flex-1">
          <label htmlFor={`new-${kind}`} className="block text-support font-semibold text-brand-ink">Add a {single === 'category' ? 'property type' : 'feature'}</label>
          <input id={`new-${kind}`} value={newLabel} onChange={(e) => setNewLabel(e.target.value)} maxLength={80} className={`mt-1.5 input ${error ? 'input-invalid' : ''}`} aria-describedby={error ? `new-${kind}-error` : undefined} aria-invalid={!!error || undefined} />
          {error && <p id={`new-${kind}-error`} className="mt-1.5 text-[0.8125rem] text-danger">{error}</p>}
        </div>
        <Button type="submit" variant="secondary" loading={busy === 'add'} loadingLabel="Adding…">Add</Button>
      </form>
      {items.length === 0 ? (
        <p className="text-support text-neutral-muted">None yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-border">
          {items.map((it) => {
            const draft = drafts[it.id] ?? it.label;
            return (
              <li key={it.id} className="flex flex-col gap-3 py-3 md:flex-row md:items-center">
                <div className="flex-1">
                  <label htmlFor={`${kind}-${it.id}`} className="sr-only">Name</label>
                  <input id={`${kind}-${it.id}`} value={draft} onChange={(e) => setDrafts((d) => ({ ...d, [it.id]: e.target.value }))} maxLength={80} className="input min-h-10 py-1.5" />
                  <p className="mt-1 text-[0.8125rem] text-neutral-muted">{it.usage} listing{it.usage === 1 ? '' : 's'} · {it.active ? 'Available for new listings' : 'Hidden from new listings'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" className="min-h-10 px-3" disabled={draft.trim() === it.label || draft.trim().length < 2} loading={busy === it.id} loadingLabel="Saving…" onClick={() => update(it, { label: draft.trim() }, 'Name saved.')}>Save name</Button>
                  <Button variant="secondary" className="min-h-10 px-3" loading={busy === it.id} onClick={() => update(it, { active: !it.active }, it.active ? 'Turned off for new listings.' : 'Turned on.')}>{it.active ? 'Turn off' : 'Turn on'}</Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
