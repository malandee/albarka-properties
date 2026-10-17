'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { apiRequest, ApiClientError, fieldErrorMap } from '@/lib/client/api';

export function SetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (password !== confirm) {
      setFieldErrors({ confirmPassword: 'The passwords do not match.' });
      return;
    }
    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      await apiRequest('/api/auth/set-password', { method: 'POST', body: { token, password, confirmPassword: confirm } });
      setDone(true);
    } catch (err) {
      setFieldErrors(fieldErrorMap(err));
      setError(err instanceof ApiClientError ? err.message : 'Could not set the password. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="space-y-4 text-support text-neutral-text">
        <p className="font-semibold text-success">Your password has been set.</p>
        <Link href="/admin/login" className="btn-primary w-full">
          Continue to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <p className="text-support text-neutral-text">Choose a password of at least 12 characters with a letter and a number. This link can be used once.</p>
      {error && (
        <div role="alert" className="rounded-md border border-danger/30 p-3 text-support text-danger">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="new-password" className="block text-support font-semibold text-brand-ink">
          New password
        </label>
        <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`mt-1.5 input ${fieldErrors.password ? 'input-invalid' : ''}`} aria-invalid={!!fieldErrors.password || undefined} aria-describedby="password-hint password-error" required minLength={12} />
        <p id="password-hint" className="mt-1.5 text-[0.8125rem] text-neutral-muted">At least 12 characters, including a letter and a number.</p>
        {fieldErrors.password && (
          <p id="password-error" className="mt-1.5 text-[0.8125rem] text-danger">
            {fieldErrors.password}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="confirm-password" className="block text-support font-semibold text-brand-ink">
          Confirm password
        </label>
        <input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`mt-1.5 input ${fieldErrors.confirmPassword ? 'input-invalid' : ''}`} aria-invalid={!!fieldErrors.confirmPassword || undefined} aria-describedby={fieldErrors.confirmPassword ? 'confirm-error' : undefined} required />
        {fieldErrors.confirmPassword && (
          <p id="confirm-error" className="mt-1.5 text-[0.8125rem] text-danger">
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>
      <Button type="submit" fullWidth loading={busy} loadingLabel="Saving password…">
        Save password
      </Button>
    </form>
  );
}
