'use client';

import { CONTACT_SUBJECT_KEYS } from '@/config/subjects';
import { SUBJECT_LABELS } from '@/lib/validation/account';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { apiRequest, ApiClientError, fieldErrorMap } from '@/lib/client/api';
import { useToast } from '@/components/ui/Toast';

const SUBJECTS = CONTACT_SUBJECT_KEYS.map((value) => ({ value, label: SUBJECT_LABELS[value] ?? value }));

interface Props {
  initialSubject?: string;
  propertySlug?: string;
  propertyTitle?: string;
}

/**
 * Enquiry form. The success message appears only after the server confirms the enquiry was stored.
 * A hidden honeypot field catches automated submissions.
 */
export function ContactForm({ initialSubject, propertySlug, propertyTitle }: Props) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ reference: string | null } | null>(null);
  const [values, setValues] = useState({
    name: '',
    email: '',
    phone: '',
    subject: SUBJECTS.some((s) => s.value === initialSubject) ? (initialSubject as string) : 'GENERAL',
    message: propertyTitle ? `I would like more information about "${propertyTitle}".` : '',
    website: '',
  });

  function update(name: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setFormError(null);
    const local: Record<string, string> = {};
    if (values.name.trim().length < 2) local.name = 'Enter your name.';
    if (!values.email.trim() && !values.phone.trim()) local.email = 'Provide an email address or a phone number so we can reply.';
    if (values.message.trim().length < 10) local.message = 'Tell us a little more (at least 10 characters).';
    if (Object.keys(local).length) {
      setErrors(local);
      document.getElementById(`field-${Object.keys(local)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      const res = await apiRequest<{ received: boolean; reference: string | null }>('/api/enquiries', {
        method: 'POST',
        body: { ...values, propertySlug: propertySlug ?? null },
      });
      setSuccess({ reference: res.reference });
      toast.success('Your enquiry has been received.');
    } catch (err) {
      const fields = fieldErrorMap(err);
      if (Object.keys(fields).length) setErrors(fields);
      const message = err instanceof ApiClientError ? err.message : 'Your enquiry could not be sent. Please try again or call us.';
      setFormError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div role="status" className="card space-y-4 p-8">
        <h2 className="text-section text-success">Thank you. Your enquiry has been received.</h2>
        <p className="text-body text-neutral-text">
          Our team will reply using the contact details you provided. If your matter is urgent, call or WhatsApp us using the details on this page.
        </p>
        {success.reference && <p className="text-support text-neutral-muted">Reference: <span className="font-semibold text-brand-ink">{success.reference}</span></p>}
        <Button variant="secondary" onClick={() => setSuccess(null)}>
          Send another enquiry
        </Button>
      </div>
    );
  }

  const invalid = (k: string) => (errors[k] ? 'input input-invalid' : 'input');
  const describe = (k: string) => (errors[k] ? `field-${k}-error` : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-5 p-6 md:p-8" aria-labelledby="contact-form-heading">
      <h2 id="contact-form-heading" className="text-section">
        Send us an enquiry
      </h2>
      <p className="text-support text-neutral-muted">
        Fields marked <span aria-hidden="true">*</span><span className="sr-only">required</span> are required. Provide an email address or phone number so we can reply.
      </p>

      {formError && (
        <div role="alert" className="rounded-md border border-danger/30 p-3 text-support text-danger">
          {formError}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="field-name" className="block text-support font-semibold text-brand-ink">
            Full name <span aria-hidden="true" className="text-danger">*</span>
          </label>
          <input id="field-name" name="name" autoComplete="name" required aria-required="true" value={values.name} onChange={(e) => update('name', e.target.value)} className={`mt-1.5 ${invalid('name')}`} aria-invalid={!!errors.name || undefined} aria-describedby={describe('name')} maxLength={120} />
          {errors.name && <p id="field-name-error" className="mt-1.5 text-[0.8125rem] text-danger">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="field-subject" className="block text-support font-semibold text-brand-ink">
            Subject <span aria-hidden="true" className="text-danger">*</span>
          </label>
          <select id="field-subject" name="subject" required aria-required="true" value={values.subject} onChange={(e) => update('subject', e.target.value)} className="input mt-1.5">
            {SUBJECTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="field-email" className="block text-support font-semibold text-brand-ink">
            Email address
          </label>
          <input id="field-email" name="email" type="email" autoComplete="email" inputMode="email" value={values.email} onChange={(e) => update('email', e.target.value)} className={`mt-1.5 ${invalid('email')}`} aria-invalid={!!errors.email || undefined} aria-describedby={describe('email')} maxLength={254} />
          {errors.email && <p id="field-email-error" className="mt-1.5 text-[0.8125rem] text-danger">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="field-phone" className="block text-support font-semibold text-brand-ink">
            Phone number
          </label>
          <input id="field-phone" name="phone" type="tel" autoComplete="tel" value={values.phone} onChange={(e) => update('phone', e.target.value)} className={`mt-1.5 ${invalid('phone')}`} aria-invalid={!!errors.phone || undefined} aria-describedby={describe('phone')} maxLength={32} />
          {errors.phone && <p id="field-phone-error" className="mt-1.5 text-[0.8125rem] text-danger">{errors.phone}</p>}
        </div>
      </div>

      {propertySlug && (
        <p className="rounded-md bg-neutral-alt p-3 text-support text-neutral-text">
          This enquiry will reference the listing <span className="font-semibold">{propertyTitle ?? propertySlug}</span>.
        </p>
      )}

      <div>
        <label htmlFor="field-message" className="block text-support font-semibold text-brand-ink">
          Message <span aria-hidden="true" className="text-danger">*</span>
        </label>
        <textarea id="field-message" name="message" rows={6} required aria-required="true" value={values.message} onChange={(e) => update('message', e.target.value)} className={`mt-1.5 ${invalid('message')} min-h-40 resize-y`} aria-invalid={!!errors.message || undefined} aria-describedby={describe('message')} maxLength={2000} />
        {errors.message && <p id="field-message-error" className="mt-1.5 text-[0.8125rem] text-danger">{errors.message}</p>}
      </div>

      {/* Honeypot: hidden from people and assistive technology. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="field-website">Leave this field empty</label>
        <input id="field-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => update('website', e.target.value)} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.8125rem] text-neutral-muted">We store your enquiry only to respond to you. See our Privacy Policy.</p>
        <Button type="submit" loading={busy} loadingLabel="Sending enquiry…" className="sm:min-w-44">
          Send enquiry
        </Button>
      </div>
    </form>
  );
}
