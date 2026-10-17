import { CONTACT_SUBJECT_KEYS } from '@/config/subjects';
import { z } from 'zod';

/** Password policy: at least 12 characters, a letter and a digit, and not the account email. */
export function passwordIssues(password: string, email?: string): string[] {
  const issues: string[] = [];
  if (password.length < 12) issues.push('Use at least 12 characters.');
  if (password.length > 128) issues.push('Use no more than 128 characters.');
  if (!/[A-Za-z]/.test(password)) issues.push('Include at least one letter.');
  if (!/[0-9]/.test(password)) issues.push('Include at least one number.');
  if (email && password.toLowerCase().includes(email.toLowerCase().split('@')[0]!) && email.split('@')[0]!.length >= 4) {
    issues.push('Do not include your email name in the password.');
  }
  return issues;
}

export const passwordSchema = z
  .string()
  .min(12, 'Use at least 12 characters.')
  .max(128, 'Use no more than 128 characters.');

const phone = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (typeof v === 'string' ? v.trim() : null))
  .transform((v) => (v === '' ? null : v))
  .refine((v) => v === null || /^\+?[0-9 ()-]{7,20}$/.test(v), { message: 'Enter a valid phone number.' });

export const adminCreateSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter the administrator name.').max(120),
    email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254),
    phone,
  })
  .strict();

export const adminUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email().max(254),
    phone,
  })
  .strict();

export const adminStatusSchema = z.object({ status: z.enum(['ACTIVE', 'INACTIVE']) }).strict();

export const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    phone,
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.').max(256),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1),
  })
  .strict()
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'The new passwords do not match.',
  });

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254),
    password: z.string().min(1, 'Enter your password.').max(256),
  })
  .strict();

export const setPasswordSchema = z
  .object({
    token: z.string().min(20).max(200),
    password: passwordSchema,
    confirmPassword: z.string().min(1),
  })
  .strict()
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'The passwords do not match.',
  });

export const contactEnquirySchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your name.').max(120),
    email: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((v) => (typeof v === 'string' && v.trim() ? v.trim().toLowerCase() : null))
      .refine((v) => v === null || z.string().email().safeParse(v).success, { message: 'Enter a valid email address.' }),
    phone: phone,
    subject: z.enum(CONTACT_SUBJECT_KEYS, {
      errorMap: () => ({ message: 'Choose a subject.' }),
    }),
    message: z.string().trim().min(10, 'Tell us a little more (at least 10 characters).').max(2000),
    propertySlug: z.union([z.string(), z.null(), z.undefined()]).transform((v) => (v ? v.trim().slice(0, 160) : null)),
    /** Honeypot: real visitors leave this empty. */
    website: z.union([z.string(), z.null(), z.undefined()]),
  })
  .strict()
  .refine((v) => v.email !== null || v.phone !== null, {
    path: ['email'],
    message: 'Provide an email address or a phone number so we can reply.',
  });

/** Keys written before the addendum (e.g. CONTRACTS) stay valid for old enquiries. */
export const SUBJECT_LABELS: Record<string, string> = {
  GENERAL: 'General enquiry',
  PROPERTY_ENQUIRY: 'Property enquiry',
  PROPERTY_MANAGEMENT: 'Property management',
  VALUATION: 'Valuation services',
  CONTRACTS: 'General contracts',
  CONSULTATION: 'Consultation',
  PARTNERSHIP: 'Partnership or collaboration',
  CONSTRUCTION: 'Building, construction and civil works',
  WATER_ENGINEERING: 'Water engineering',
  RENEWABLE_ENERGY: 'Renewable energy and power systems',
  PROCUREMENT: 'Procurement and supplies',
  PROJECT_MANAGEMENT: 'Project and management services',
};

export const catalogueItemSchema = z
  .object({
    label: z.string().trim().min(2).max(80),
    active: z.boolean().optional(),
  })
  .strict();

export const settingsSchema = z
  .object({
    featuredCount: z.number().int().min(1).max(12),
  })
  .strict();
