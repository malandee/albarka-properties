import { describe, expect, it } from 'vitest';
import { passwordIssues, contactEnquirySchema, setPasswordSchema } from '@/lib/validation/account';
import { propertyContentSchema } from '@/lib/validation/property';
import { parsePublicFilters } from '@/lib/property/catalogue';

describe('password policy', () => {
  it('requires at least 12 characters with a letter and a digit', () => {
    expect(passwordIssues('short1')).toEqual(expect.arrayContaining(['Use at least 12 characters.']));
    expect(passwordIssues('onlyletterslong')).toContain('Include at least one number.');
    expect(passwordIssues('123456789012')).toContain('Include at least one letter.');
    expect(passwordIssues('Strong-Passphrase-9')).toEqual([]);
  });

  it('rejects a password that contains the email name', () => {
    expect(passwordIssues('Halima-2026-secure', 'halima@example.com')).toContain('Do not include your email name in the password.');
  });

  it('requires the confirmation to match', () => {
    const r = setPasswordSchema.safeParse({ token: 'x'.repeat(30), password: 'Strong-Passphrase-9', confirmPassword: 'different' });
    expect(r.success).toBe(false);
  });
});

describe('contact enquiry', () => {
  const base = { name: 'Amina Yusuf', email: 'amina@example.com', phone: '', subject: 'GENERAL', message: 'I would like to know more.', propertySlug: '', website: '' };

  it('accepts a valid enquiry with an email address', () => {
    expect(contactEnquirySchema.safeParse(base).success).toBe(true);
  });

  it('requires an email or a phone number', () => {
    expect(contactEnquirySchema.safeParse({ ...base, email: '' }).success).toBe(false);
  });

  it('rejects an unknown subject', () => {
    expect(contactEnquirySchema.safeParse({ ...base, subject: 'SPAM' }).success).toBe(false);
  });
});

describe('property content', () => {
  const valid = {
    title: 'Two-bedroom flat with a fitted kitchen',
    shortDescription: 'A bright flat with tiled floors and a fitted kitchen.',
    description: 'A well-lit two-bedroom flat on the second floor, close to transport routes and shops.',
    purpose: 'FOR_RENT',
    categoryId: 'cat1',
    priceAmount: '3500000',
    priceOnRequest: false,
    currency: 'NGN',
    priceNote: 'per year',
    addressLine: 'Admiralty Way',
    area: 'Lekki Phase 1',
    city: 'Lagos',
    state: 'Lagos',
    formattedAddress: '',
    latitude: '6.4474',
    longitude: '3.4723',
    mapIsPrivate: false,
    bedrooms: '2',
    bathrooms: '',
    toilets: '',
    parkingSpaces: '',
    floors: '',
    landSizeSqm: '',
    buildingSizeSqm: '',
    featureIds: [],
  };

  it('accepts a valid listing and converts blank optional numbers to null', () => {
    const r = propertyContentSchema.parse(valid);
    expect(r.priceAmount).toBe(3500000);
    expect(r.bathrooms).toBeNull();
    expect(r.latitude).toBeCloseTo(6.4474);
  });

  it('rejects a latitude outside the valid range', () => {
    expect(propertyContentSchema.safeParse({ ...valid, latitude: '95' }).success).toBe(false);
  });

  it('rejects an unknown listing purpose', () => {
    expect(propertyContentSchema.safeParse({ ...valid, purpose: 'LEASE' }).success).toBe(false);
  });

  it('rejects a state that is not in the Nigerian list', () => {
    expect(propertyContentSchema.safeParse({ ...valid, state: 'Atlantis' }).success).toBe(false);
  });
});

describe('public catalogue filters', () => {
  it('maps sale and rent URL values to stored purposes', () => {
    expect(parsePublicFilters({ purpose: 'sale' }).filters.purpose).toBe('FOR_SALE');
    expect(parsePublicFilters({ purpose: 'rent' }).filters.purpose).toBe('FOR_RENT');
    expect(parsePublicFilters({ purpose: 'FOR_RENT' }).filters.purpose).toBe('FOR_RENT');
  });

  it('falls back to newest sorting for unknown sort values', () => {
    expect(parsePublicFilters({ sort: 'drop table' }).filters.sort).toBe('newest');
  });

  it('defaults to page 1', () => {
    expect(parsePublicFilters({}).filters.page).toBe(1);
  });
});
