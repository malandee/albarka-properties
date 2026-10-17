import { z } from 'zod';
import { COMPANY } from '@/config/company';

/**
 * Pure contact rules (no database access, safe to import in tests and in client code).
 *
 * Publication gate: a telephone number is shown publicly only when `published` is true.
 * WhatsApp: the button is shown only when a verified number is configured.
 */

export interface PublicPhone {
  label: string;
  /** E.164 value, e.g. +2348060473796. */
  tel: string;
  published: boolean;
}

export interface PublicContact {
  email: string;
  address: string;
  phones: PublicPhone[];
  /** E.164 WhatsApp number, or null when no verified number is configured. */
  whatsapp: string | null;
}

/** Defaults from the company config. Phones are unpublished and WhatsApp is unset until confirmed. */
export function defaultPublicContact(): PublicContact {
  return {
    email: COMPANY.email,
    address: COMPANY.address.full,
    phones: COMPANY.phones.map((p) => ({ label: p.label, tel: p.tel, published: p.published })),
    whatsapp: COMPANY.whatsapp,
  };
}

/** Normalises a Nigerian number to E.164 (+234XXXXXXXXXX). Returns null when it cannot be read. */
export function normalizeNigerianPhone(input: string): string | null {
  const compact = input.replace(/[\s\-().]/g, '');
  let digits: string | null = null;
  if (/^\+234\d{10}$/.test(compact)) digits = compact.slice(1);
  else if (/^234\d{10}$/.test(compact)) digits = compact;
  else if (/^0\d{10}$/.test(compact)) digits = `234${compact.slice(1)}`;
  return digits ? `+${digits}` : null;
}

/** Display form used on the site, e.g. +234 806 047 3796. */
export function formatPhone(tel: string): string {
  const d = tel.replace(/^\+234/, '');
  return `+234 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

/** Phones that may be shown on the public site. The publication gate. */
export function publicPhones(contact: Pick<PublicContact, 'phones'>): PublicPhone[] {
  return contact.phones.filter((p) => p.published === true);
}

/** WhatsApp click-to-chat link, or null when no verified number is configured. */
export function whatsappHref(contact: Pick<PublicContact, 'whatsapp'>, message?: string): string | null {
  if (!contact.whatsapp) return null;
  const digits = contact.whatsapp.replace(/\D/g, '');
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function telHref(tel: string): string {
  return `tel:${tel.replace(/[^+0-9]/g, '')}`;
}

const phoneField = z
  .string()
  .trim()
  .max(30)
  .transform((v, ctx) => {
    const n = normalizeNigerianPhone(v);
    if (!n) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a Nigerian number, such as 0806 047 3796 or +234 806 047 3796.' });
      return z.NEVER;
    }
    return n;
  });

export const publicContactSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(160),
    address: z.string().trim().min(5, 'Enter the office address.').max(300),
    phones: z
      .array(
        z
          .object({
            label: z.string().trim().min(1, 'Enter a label.').max(40),
            number: phoneField,
            published: z.boolean(),
          })
          .strict(),
      )
      .max(3, 'Add no more than three telephone numbers.'),
    whatsapp: z.union([phoneField, z.literal('').transform(() => null), z.null()]),
    /** Required: the approver confirms these details were verified with the company. */
    confirmed: z.literal(true, {
      errorMap: () => ({ message: 'Confirm that these details have been verified before saving.' }),
    }),
  })
  .strict();

export type PublicContactInput = z.infer<typeof publicContactSchema>;

/** Shape stored in SiteSetting under PUBLIC_CONTACT_KEY. */
export const storedContactSchema = z.object({
  email: z.string().email(),
  address: z.string().min(5).max(300),
  phones: z
    .array(z.object({ label: z.string().min(1).max(40), tel: z.string().regex(/^\+234\d{10}$/), published: z.boolean() }))
    .max(3),
  whatsapp: z.string().regex(/^\+234\d{10}$/).nullable(),
});

export type StoredContact = z.infer<typeof storedContactSchema>;
