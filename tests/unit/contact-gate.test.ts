import { describe, expect, it } from 'vitest';
import {
  defaultPublicContact,
  formatPhone,
  normalizeNigerianPhone,
  publicContactSchema,
  publicPhones,
  telHref,
  whatsappHref,
  type PublicContact,
} from '@/lib/contact/rules';
import { PERMISSIONS, type Actor } from '@/lib/auth/policy';

const base: PublicContact = {
  email: 'albarkapropertiesconsultantltd@gmail.com',
  address: 'Block A, No. 7, Nasara Shopping Complex, Opposite Old Dass Park Junction, Bauchi, Bauchi State, Nigeria',
  phones: [
    { label: 'Telephone 1', tel: '+2348060473796', published: false },
    { label: 'Telephone 2', tel: '+2348031175727', published: true },
  ],
  whatsapp: null,
};

describe('telephone publication gate', () => {
  it('ships with no telephone number published by default', () => {
    expect(publicPhones(defaultPublicContact())).toEqual([]);
  });

  it('shows only numbers explicitly marked as published', () => {
    expect(publicPhones(base).map((p) => p.tel)).toEqual(['+2348031175727']);
  });

  it('never shows an unpublished number, even when it is the only one', () => {
    expect(publicPhones({ ...base, phones: [{ label: 'T1', tel: '+2348060473796', published: false }] })).toEqual([]);
  });

  it('builds tel links from E.164 values only', () => {
    expect(telHref('+2348031175727')).toBe('tel:+2348031175727');
  });
});

describe('WhatsApp', () => {
  it('uses the primary number by default', () => {
    expect(defaultPublicContact().whatsapp).toBe('+2348060473796');
    expect(whatsappHref(defaultPublicContact())).toBe('https://wa.me/2348060473796');
  });

  it('returns no link when WhatsApp is switched off (null)', () => {
    expect(whatsappHref({ ...base, whatsapp: null })).toBeNull();
  });

  it('builds a click-to-chat link once a number is configured, with an encoded message', () => {
    const href = whatsappHref({ ...base, whatsapp: '+2348031175727' }, 'Hello, I need a quote');
    expect(href).toBe('https://wa.me/2348031175727?text=Hello%2C%20I%20need%20a%20quote');
  });
});

describe('Nigerian number normalisation', () => {
  it.each([
    ['08060473796', '+2348060473796'],
    ['0806 047 3796', '+2348060473796'],
    ['+234 803 117 5727', '+2348031175727'],
    ['2348031175727', '+2348031175727'],
  ])('reads %s as %s', (input, expected) => {
    expect(normalizeNigerianPhone(input)).toBe(expected);
  });

  it.each(['0803 874 17', '+44 20 7946 0958', 'call me', ''])('rejects %s', (input) => {
    expect(normalizeNigerianPhone(input)).toBeNull();
  });

  it('formats for display', () => {
    expect(formatPhone('+2348060473796')).toBe('+234 806 047 3796');
  });
});

describe('public contact save rules', () => {
  const valid = {
    email: 'Albarkapropertiesconsultantltd@gmail.com',
    address: 'Block A, No. 7, Nasara Shopping Complex, Bauchi',
    phones: [{ label: 'Telephone 1', number: '08060473796', published: true }],
    whatsapp: '',
    confirmed: true,
  };

  it('requires the verification confirmation', () => {
    expect(publicContactSchema.safeParse({ ...valid, confirmed: false }).success).toBe(false);
  });

  it('normalises the email and turns an empty WhatsApp field into null', () => {
    const parsed = publicContactSchema.parse(valid);
    expect(parsed.email).toBe('albarkapropertiesconsultantltd@gmail.com');
    expect(parsed.whatsapp).toBeNull();
    expect(parsed.phones[0]!.number).toBe('+2348060473796');
  });

  it('allows at most three telephone numbers', () => {
    const four = Array.from({ length: 4 }, (_, i) => ({ label: `T${i}`, number: '08060473796', published: false }));
    expect(publicContactSchema.safeParse({ ...valid, phones: four }).success).toBe(false);
  });

  it('rejects an unreadable WhatsApp number', () => {
    expect(publicContactSchema.safeParse({ ...valid, whatsapp: '12345' }).success).toBe(false);
  });
});

describe('contact settings are Super Admin only', () => {
  const superAdmin: Actor = { id: 's', role: 'SUPER_ADMIN', status: 'ACTIVE' };
  const admin: Actor = { id: 'a', role: 'ADMIN', status: 'ACTIVE' };
  it('lets a Super Admin manage settings', () => {
    expect(PERMISSIONS.manageSettings(superAdmin)).toBe(true);
  });
  it('denies a Property Admin corporate settings', () => {
    expect(PERMISSIONS.manageSettings(admin)).toBe(false);
  });
});
