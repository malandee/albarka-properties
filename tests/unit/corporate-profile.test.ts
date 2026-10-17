import { describe, expect, it } from 'vitest';
import { COMPANY } from '@/config/company';
import { ABOUT, ADORN_PARTNERSHIP, PARTNERSHIPS, WHO_WE_SERVE } from '@/config/profile';
import { SERVICE_FAMILIES, findFamily } from '@/config/services';
import { CONTACT_SUBJECT_KEYS } from '@/config/subjects';
import { LEADERSHIP, TESTIMONIALS } from '@/config/people';
import { SUBJECT_LABELS } from '@/lib/validation/account';
import { PRIMARY_NAV } from '@/components/layout/navigation';

const allPublicText = JSON.stringify({ COMPANY, ABOUT, PARTNERSHIPS, WHO_WE_SERVE, ADORN_PARTNERSHIP, SERVICE_FAMILIES });

describe('identity taken from the corporate profile', () => {
  it('uses the CAC registration number and motto verbatim', () => {
    expect(COMPANY.cacRegistration).toBe('RC 7062863');
    expect(COMPANY.motto).toBe("Our Client's Success is Our Success.");
  });

  it('gives the head office address from the profile', () => {
    expect(COMPANY.address.full).toBe(
      'Block A, No. 7, Nasara Shopping Complex, Opposite Old Dass Park Junction, Bauchi, Bauchi State, Nigeria',
    );
  });

  it('keeps the coverage wording with its qualifier', () => {
    expect(COMPANY.coverage).toContain('subject to the requirements and capacity of individual assignments');
  });

  it('keeps the profile’s two telephone numbers, both unpublished until confirmed', () => {
    expect(COMPANY.phones.map((p) => p.tel)).toEqual(['+2348060473796', '+2348031175727']);
    expect(COMPANY.phones.every((p) => p.published === false)).toBe(true);
  });

  it('uses the primary number for WhatsApp, and has no office coordinates or business hours', () => {
    expect(COMPANY.whatsapp).toBe('+2348060473796');
    expect(COMPANY.office).toBeNull();
    expect(COMPANY.businessHours).toBeNull();
  });
});

describe('About content', () => {
  it('has the seven core values in profile order', () => {
    expect(ABOUT.values.map((v) => v.name)).toEqual([
      'Integrity',
      'Professionalism',
      'Client focus',
      'Accountability',
      'Quality and diligence',
      'Collaboration',
      'Practical value',
    ]);
  });

  it('has the six delivery stages in order', () => {
    expect(ABOUT.approach.map((a) => a.stage)).toEqual([
      'Understand the Requirement',
      'Define the Scope',
      'Plan and Coordinate',
      'Deliver Responsibly',
      'Communicate and Review',
      'Build Lasting Relationships',
    ]);
  });
});

describe('service families', () => {
  it('has eight families lettered A to H', () => {
    expect(SERVICE_FAMILIES.map((f) => f.letter)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  });

  it('includes the five proposal services by exact name', () => {
    const names = SERVICE_FAMILIES.flatMap((f) => f.items.map((i) => i.name));
    for (const required of [
      'General Contracts',
      'Property Management',
      'Consultations',
      'Land and Landed Property Agency',
      'Valuation Services',
    ]) {
      expect(names).toContain(required);
    }
  });

  it('gives every item and family a subject that the enquiry form accepts', () => {
    for (const f of SERVICE_FAMILIES) {
      expect(CONTACT_SUBJECT_KEYS).toContain(f.subject);
      for (const i of f.items) expect(CONTACT_SUBJECT_KEYS).toContain(i.subject);
    }
  });

  it('labels every enquiry subject', () => {
    for (const key of CONTACT_SUBJECT_KEYS) expect(SUBJECT_LABELS[key]).toBeTruthy();
  });

  it('looks up a family by slug', () => {
    expect(findFamily('water-engineering')?.letter).toBe('C');
    expect(findFamily('nope')).toBeUndefined();
  });
});

describe('navigation', () => {
  it('follows the addendum order', () => {
    expect(PRIMARY_NAV.map((n) => n.label)).toEqual([
      'Home',
      'About Us',
      'Services',
      'Properties',
      'Who We Serve',
      'Partnerships',
      'Contact',
    ]);
  });
});

describe('Adorn Cleaners wording', () => {
  it('describes a potential collaboration only', () => {
    expect(ADORN_PARTNERSHIP.status).toBe('potential-collaboration');
    expect(ADORN_PARTNERSHIP.text).toContain('potential areas for collaboration');
  });

  it('never describes the relationship as exclusive, confirmed, or completed', () => {
    expect(ADORN_PARTNERSHIP.text).not.toMatch(/exclusive|official partner|strategic alliance|joint project|successfully|signed|confirmed partner/i);
  });

  it('states the limits explicitly in the disclaimer', () => {
    expect(ADORN_PARTNERSHIP.disclaimer).toMatch(/not an exclusive arrangement/i);
    expect(ADORN_PARTNERSHIP.disclaimer).toMatch(/not an exclusive arrangement, a completed joint project, or a binding contract/);
  });

  it('shows no logo', () => {
    expect(ADORN_PARTNERSHIP.logo).toBeNull();
  });
});

describe('nothing is invented', () => {
  it('leaves leadership and testimonials unpublished', () => {
    expect(LEADERSHIP.every((l) => !l.approved && l.name === null)).toBe(true);
    expect(TESTIMONIALS).toEqual([]);
  });

  it('contains no accreditation, certification, or experience claims', () => {
    expect(allPublicText).not.toMatch(/accredit|certified|\bCOREN\b|\bNIESV\b|\bISO\s?\d|years of experience|\d+\+?\s+(projects|clients)|testimonial/i);
  });
});
