import { describe, expect, it } from 'vitest';
import { slugify, buildPropertySlug, looksLikeId } from '@/lib/property/slug';
import { formatPrice, locationLine } from '@/lib/format';
import { sha256, hashIp, generateToken } from '@/lib/security/crypto';
import { safeNextPath } from '@/lib/auth/guards';

describe('slugs', () => {
  it('produces ASCII, hyphenated, lowercase slugs', () => {
    expect(slugify('  Four-bedroom  House, Kano!  ')).toBe('four-bedroom-house-kano');
    expect(slugify('Ṣẹ́ẹ́ Ìlú')).toMatch(/^[a-z0-9-]+$/);
    expect(slugify('!!!')).toBe('property');
  });

  it('adds a six-character suffix to property slugs', () => {
    expect(buildPropertySlug('Warehouse', 'AB-12CD9')).toBe('warehouse-ab12cd');
  });

  it('recognises internal ids but not public slugs', () => {
    expect(looksLikeId('cjld2cjxh0000qzrmn831i7rn')).toBe(true);
    expect(looksLikeId('warehouse-ab12cd')).toBe(false);
  });
});

describe('formatting', () => {
  it('shows “Contact for price” when the price is on request or missing', () => {
    expect(formatPrice(null)).toBe('Contact for price');
    expect(formatPrice('185000000', 'NGN', true)).toBe('Contact for price');
  });

  it('formats naira without decimals', () => {
    expect(formatPrice('185000000.00')).toMatch(/185,000,000/);
  });

  it('builds a location line from area, city and state', () => {
    expect(locationLine({ area: 'Ajah', city: 'Lagos', state: 'Lagos' })).toContain('Ajah');
  });
});

describe('crypto helpers', () => {
  it('hashes tokens deterministically and never stores the raw value', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('pseudonymises IP addresses and returns null when absent', () => {
    expect(hashIp(null)).toBeNull();
    expect(hashIp('203.0.113.9')).toHaveLength(64);
    expect(hashIp('203.0.113.9')).not.toContain('203.0.113.9');
  });

  it('creates long random tokens', () => {
    expect(generateToken().length).toBeGreaterThanOrEqual(40);
    expect(generateToken()).not.toBe(generateToken());
  });
});

describe('post-login redirects', () => {
  it('accepts admin paths only', () => {
    expect(safeNextPath('/admin/properties')).toBe('/admin/properties');
    expect(safeNextPath('https://evil.example/admin')).toBe('/admin');
    expect(safeNextPath('//evil.example')).toBe('/admin');
    expect(safeNextPath('/admin/\\evil')).toBe('/admin');
    expect(safeNextPath(undefined)).toBe('/admin');
  });
});
