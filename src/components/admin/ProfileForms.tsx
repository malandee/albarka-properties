'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { apiRequest, ApiClientError, fieldErrorMap } from '@/lib/client/api';

export function ProfileDetailsForm({ initialName, initialPhone }: { initialName: string; initialPhone: string }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (name.trim().length < 2) local.name = 'Enter your full name.';
    setErrors(local);
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      await apiRequest('/api/admin/profile', { method: 'PATCH', body: { name: name.trim(), phone: phone.trim() || null } });
      toast.success('Profile saved.');
      router.refresh();
    } catch (err) {
      setErrors(fieldErrorMap(err));
      toast.error(err instanceof ApiClientError ? err.message : 'The profile could not be saved.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} noValidate className="card space-y-5 p-5 md:p-6" aria-labelledby="details-heading">
      <h2 id="details-heading" className="text-card text-brand-ink">Your details</h2>
      <div>
        <label htmlFor="profile-name" className="block text-support font-semibold text-brand-ink">Full name</label>
        <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={`mt-1.5 input ${errors.name ? 'input-invalid' : ''}`} aria-invalid={!!errors.name || undefined} aria-describedby={errors.name ? 'profile-name-error' : undefined} />
        {errors.name && <p id="profile-name-error" className="mt-1.5 text-[0.8125rem] text-danger">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="profile-phone" className="block text-support font-semibold text-brand-ink">Phone (optional)</label>
        <input id="profile-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={32} className={`mt-1.5 input ${errors.phone ? 'input-invalid' : ''}`} />
        {errors.phone && <p className="mt-1.5 text-[0.8125rem] text-danger">{errors.phone}</p>}
      </div>
      <Button type="submit" loading={busy} loadingLabel="Saving…">Save details</Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const router = useRouter();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const local: Record<string, string> = {};
    if (!current) local.currentPassword = 'Enter your current password.';
    if (next.length < 12) local.newPassword = 'Use at least 12 characters, with a letter and a digit.';
    if (next !== confirm) local.confirmPassword = 'The new passwords do not match.';
    setErrors(local);
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      await apiRequest('/api/admin/profile/password', { method: 'POST', body: { currentPassword: current, newPassword: next, confirmPassword: confirm } });
      setCurrent('');
      setNext('');
      setConfirm('');
      toast.success('Password changed. Your other sessions have been signed out.');
      router.refresh();
    } catch (err) {
      setErrors(fieldErrorMap(err));
      toast.error(err instanceof ApiClientError ? err.message : 'The password could not be changed.');
    } finally {
      setBusy(false);
    }
  }
  const field = (id: string, key: string, label: string, value: string, set: (v: string) => void, auto: string) => (
    <div>
      <label htmlFor={id} className="block text-support font-semibold text-brand-ink">{label}</label>
      <input id={id} type="password" value={value} onChange={(e) => set(e.target.value)} autoComplete={auto} maxLength={256} className={`mt-1.5 input ${errors[key] ? 'input-invalid' : ''}`} aria-invalid={!!errors[key] || undefined} />
    </div>
  );
  return (
    <form onSubmit={submit} noValidate className="card space-y-5 p-5 md:p-6" aria-labelledby="password-heading">
      <h2 id="password-heading" className="text-card text-brand-ink">Change password</h2>
      <p id="password-help" className="text-support text-neutral-muted">At least 12 characters, including a letter and a digit. It must not contain your email name.</p>
      {field('password-current', 'currentPassword', 'Current password', current, setCurrent, 'current-password')}
      {errors.currentPassword && <p className="text-[0.8125rem] text-danger">{errors.currentPassword}</p>}
      {field('password-new', 'newPassword', 'New password', next, setNext, 'new-password')}
      {errors.newPassword && <p className="text-[0.8125rem] text-danger">{errors.newPassword}</p>}
      {field('password-confirm', 'confirmPassword', 'Confirm new password', confirm, setConfirm, 'new-password')}
      {errors.confirmPassword && <p className="text-[0.8125rem] text-danger">{errors.confirmPassword}</p>}
      <Button type="submit" loading={busy} loadingLabel="Changing…">Change password</Button>
    </form>
  );
}
