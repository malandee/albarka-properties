import { z } from 'zod';
import { NIGERIAN_STATES } from '@/config/nigeria';

const trimmed = (max: number, min = 0) => z.string().trim().min(min).max(max);
const optionalText = (max: number) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (typeof v === 'string' ? v.trim() : null))
    .transform((v) => (v === '' ? null : v))
    .refine((v) => v === null || v.length <= max, { message: `Must be ${max} characters or fewer.` });

/** Integer count fields: nonnegative, bounded, optional. */
const count = (label: string, max = 100) =>
  z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((v) => (v === '' || v === undefined ? null : v))
    .refine((v) => v === null || (typeof v === 'number' ? Number.isFinite(v) : /^\d+$/.test(v.trim())), {
      message: `${label} must be a whole number.`,
    })
    .transform((v) => (v === null ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v <= max), {
      message: `${label} must be between 0 and ${max}.`,
    });

/** Decimal area fields in square metres. */
const areaSqm = (label: string) =>
  z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((v) => (v === '' || v === undefined ? null : v))
    .refine((v) => v === null || !Number.isNaN(Number(v)), { message: `${label} must be a number.` })
    .transform((v) => (v === null ? null : Number(v)))
    .refine((v) => v === null || (v >= 0 && v <= 10_000_000), {
      message: `${label} must be between 0 and 10,000,000 sqm.`,
    });

/** Price in naira (or the selected currency). Stored as a decimal with two places. */
export const MAX_PRICE = 100_000_000_000;
export const priceAmount = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((v) => (v === '' || v === undefined ? null : v))
  .refine((v) => v === null || !Number.isNaN(Number(v)), { message: 'Price must be a number.' })
  .transform((v) => (v === null ? null : Number(v)));

export const coordinate = {
  latitude: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((v) => (v === '' || v === undefined ? null : v))
    .refine((v) => v === null || !Number.isNaN(Number(v)), { message: 'Latitude must be a number.' })
    .transform((v) => (v === null ? null : Number(v)))
    .refine((v) => v === null || (v >= -90 && v <= 90), { message: 'Latitude must be between -90 and 90.' }),
  longitude: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((v) => (v === '' || v === undefined ? null : v))
    .refine((v) => v === null || !Number.isNaN(Number(v)), { message: 'Longitude must be a number.' })
    .transform((v) => (v === null ? null : Number(v)))
    .refine((v) => v === null || (v >= -180 && v <= 180), { message: 'Longitude must be between -180 and 180.' }),
};

export const propertyContentSchema = z
  .object({
    title: trimmed(160, 5),
    shortDescription: trimmed(280, 20),
    description: trimmed(8000, 40),
    purpose: z.enum(['FOR_SALE', 'FOR_RENT'], { errorMap: () => ({ message: 'Choose For Sale or For Rent.' }) }),
    categoryId: z.string().trim().min(1, 'Choose a property type.').max(40),
    priceAmount,
    priceOnRequest: z.boolean().default(false),
    currency: z.enum(['NGN', 'USD']).default('NGN'),
    priceNote: optionalText(160),
    addressLine: trimmed(255, 5),
    area: optionalText(120),
    city: trimmed(120, 2),
    state: z.enum(NIGERIAN_STATES, { errorMap: () => ({ message: 'Choose a state from the list.' }) }),
    formattedAddress: optionalText(400),
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    mapIsPrivate: z.boolean().default(false),
    bedrooms: count('Bedrooms', 50),
    bathrooms: count('Bathrooms', 50),
    toilets: count('Toilets', 80),
    parkingSpaces: count('Parking spaces', 200),
    floors: count('Floors', 200),
    landSizeSqm: areaSqm('Land size'),
    buildingSizeSqm: areaSqm('Building size'),
    featureIds: z.array(z.string().min(1).max(40)).max(40).default([]),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.priceOnRequest) {
      if (v.priceAmount !== null) {
        ctx.addIssue({ code: 'custom', path: ['priceAmount'], message: 'Remove the amount, or turn off "Price on request".' });
      }
    } else {
      if (v.priceAmount === null) {
        ctx.addIssue({ code: 'custom', path: ['priceAmount'], message: 'Enter a price, or choose "Price on request".' });
      } else if (v.priceAmount <= 0 || v.priceAmount > MAX_PRICE) {
        ctx.addIssue({
          code: 'custom',
          path: ['priceAmount'],
          message: `Price must be greater than 0 and no more than ${MAX_PRICE.toLocaleString('en-US')}.`,
        });
      } else if (Math.round(v.priceAmount * 100) !== v.priceAmount * 100) {
        ctx.addIssue({ code: 'custom', path: ['priceAmount'], message: 'Price can have at most two decimal places.' });
      }
    }
    const hasLat = v.latitude !== null;
    const hasLng = v.longitude !== null;
    if (hasLat !== hasLng) {
      ctx.addIssue({ code: 'custom', path: ['longitude'], message: 'Latitude and longitude must be provided together.' });
    }
    if (v.mapIsPrivate && !hasLat) {
      // A private flag without coordinates has no effect; keep the record consistent.
    }
  });

export type PropertyContentInput = z.input<typeof propertyContentSchema>;
export type PropertyContent = z.output<typeof propertyContentSchema>;

/** Status and visibility are separate endpoints so each can be authorized and audited on its own. */
export const statusSchema = z
  .object({ availabilityStatus: z.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'RENTED']) })
  .strict();

export const visibilitySchema = z.object({ visibility: z.enum(['PUBLIC', 'HIDDEN']) }).strict();

export const imageMetaSchema = z.object({
  altText: trimmed(200, 3),
});

export const imageUpdateSchema = z
  .object({
    altText: trimmed(200, 3).optional(),
    isFeatured: z.literal(true).optional(),
  })
  .strict()
  .refine((v) => v.altText !== undefined || v.isFeatured !== undefined, { message: 'Nothing to update.' });

export const imageOrderSchema = z
  .object({ imageIds: z.array(z.string().min(1).max(40)).min(1).max(40) })
  .strict();

/** Public catalogue query. Every value is validated; unknown keys are ignored by the parser. */
export const SORT_OPTIONS = ['newest', 'price_asc', 'price_desc'] as const;
export const PAGE_SIZE = 12;
