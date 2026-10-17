'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { apiRequest, ApiClientError, fieldErrorMap } from '@/lib/client/api';

interface Props {
  mode: 'create' | 'edit';
  id?: string;
  initial?: { name: string; email: string; phone: string };
}

/** Create an administrator (returns a one-time setup link) or edit an existing account. */
export function AdministratorForm({ mode, id, initial }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [setup, setSetup] = useState<{ url: string; hours: number } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const local: Record<string, string> = {};
    if (name.trim().length < 2) local.name = 'Enter the administrator’s full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) local.email = 'Enter a valid email address.';
    setErrors(local);
    setFormError(null);
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      const body = { name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim() || null };
      if (mode === 'create') {
        const data = await apiRequest<{ setupUrl: string; setupExpiresInHours: number }>('/api/admin/users', { method: 'POST', body });
        setSetup({ url: data.setupUrl, hours: data.setupExpiresInHours });
        toast.success('Administrator account created. Share the setup link once.');
      } else {
        await apiRequest(`/api/admin/users/${id}`, { method: 'PATCH', body });
        toast.success('Administrator details saved.');
        router.refresh();
      }
    } catch (err) {
      const fields = fieldErrorMap(err);
      setErrors(fields);
      const msg = err instanceof ApiClientError ? err.message : 'The details could not be saved. Please try again.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  if (setup) {
    return (
      <div className="card space-y-4 p-5 md:p-6" role="status">
        <h2 className="text-card text-brand-ink">Setup link</h2>
        <p className="text-support text-neutral-text">
          Send this link to the administrator through a private channel. It lets them choose a password, expires in {setup.hours} hours, and works once. It is shown only now; if it is lost, issue a new one from the administrator’s page.
        </p>
        <div className="rounded-md bg-neutral-alt p-4">
          <p className="break-all font-mono text-[0.8125rem] text-brand-ink" data-testid="setup-url">{setup.url}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(setup.url).then(() => toast.success('Link copied.'), () => toast.error('Copy failed. Select the link and copy it manually.'))}>
            Copy link
          </Button>
          <Button variant="ghost" onClick={() => router.push('/admin/administrators')}>Back to administrators</Button>
        </div>
      </div>
    );
  }

  const input = (k: string) => `mt-1.5 input ${errors[k] ? 'input-invalid' : ''}`;
  const err = (k: string) => (errors[k] ? <p id={`${k}-error`} className="mt-1.5 text-[0.8125rem] text-danger">{errors[k]}</p> : null);

  return (
    <form onSubmit={submit} noValidate className="card space-y-5 p-5 md:p-6" aria-label={mode === 'create' ? 'New administrator' : 'Edit administrator'}>
      {formError && <p role="alert" className="text-support text-danger">{formError}</p>}
      <div>
        <label htmlFor="admin-name" className="block text-support font-semibold text-brand-ink">Full name</label>
        <input id="admin-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoComplete="off" className={input('name')} aria-invalid={!!errors.name || undefined} aria-describedby={errors.name ? 'name-error' : undefined} />
        {err('name')}
      </div>
      <div>
        <label htmlFor="admin-email" className="block text-support font-semibold text-brand-ink">Email (used to sign in)</label>
        <input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} autoComplete="off" className={input('email')} aria-invalid={!!errors.email || undefined} aria-describedby={errors.email ? 'email-error' : undefined} />
        {err('email')}
      </div>
      <div>
        <label htmlFor="admin-phone" className="block text-support font-semibold text-brand-ink">Phone (optional)</label>
        <input id="admin-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={32} className={input('phone')} />
        {err('phone')}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" loading={busy} loadingLabel="Saving…">{mode === 'create' ? 'Create account' : 'Save details'}</Button>
        <Button variant="ghost" onClick={() => router.back()} disabled={busy}>Cancel</Button>
      </div>
    </form>
  );
}
