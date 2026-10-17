'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { apiRequest, ApiClientError, fieldErrorMap } from '@/lib/client/api';

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const local: Record<string, string> = {};
    if (!email.trim()) local.email = 'Enter your email address.';
    if (!password) local.password = 'Enter your password.';
    setFieldErrors(local);
    if (Object.keys(local).length) {
      document.getElementById(Object.keys(local)[0] === 'email' ? 'login-email' : 'login-password')?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiRequest('/api/auth/login', { method: 'POST', body: { email, password } });
      window.location.assign(next);
    } catch (err) {
      setFieldErrors(fieldErrorMap(err));
      setError(err instanceof ApiClientError ? err.message : 'Sign-in failed. Please try again.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5" aria-labelledby="login-heading">
      <h2 id="login-heading" className="sr-only">
        Sign-in details
      </h2>
      {notice === 'super-admin-only' && (
        <p role="status" className="rounded-md bg-neutral-alt p-3 text-support text-neutral-text">
          That page is available to Super Admins only.
        </p>
      )}
      {error && (
        <div role="alert" className="rounded-md border border-danger/30 p-3 text-support text-danger">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="login-email" className="block text-support font-semibold text-brand-ink">
          Email address
        </label>
        <input id="login-email" type="email" name="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`mt-1.5 input ${fieldErrors.email ? 'input-invalid' : ''}`} aria-invalid={!!fieldErrors.email || undefined} aria-describedby={fieldErrors.email ? 'login-email-error' : undefined} required />
        {fieldErrors.email && (
          <p id="login-email-error" className="mt-1.5 text-[0.8125rem] text-danger">
            {fieldErrors.email}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="login-password" className="block text-support font-semibold text-brand-ink">
          Password
        </label>
        <input id="login-password" type="password" name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`mt-1.5 input ${fieldErrors.password ? 'input-invalid' : ''}`} aria-invalid={!!fieldErrors.password || undefined} aria-describedby={fieldErrors.password ? 'login-password-error' : undefined} required />
        {fieldErrors.password && (
          <p id="login-password-error" className="mt-1.5 text-[0.8125rem] text-danger">
            {fieldErrors.password}
          </p>
        )}
      </div>
      <Button type="submit" fullWidth loading={busy} loadingLabel="Signing in…">
        Sign in
      </Button>
      <p className="text-[0.8125rem] text-neutral-muted">
        Too many failed attempts temporarily block sign-in for that account. Contact a Super Admin if you are locked out.
      </p>
    </form>
  );
}
