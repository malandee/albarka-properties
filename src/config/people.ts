/**
 * Leadership, testimonials, and corporate documents.
 *
 * Nothing in this file is published until it has been verified and approved.
 * - Leadership: a role appears on the About page only when `approved` is true and `name` is set.
 * - Testimonials: a testimonial appears only when `approved` is true and it has written consent.
 * - Corporate documents: a document appears only when `published` is true.
 *
 * Until then the About page hides these sections entirely (see the About page). No names,
 * bios, testimonials, or credentials are invented here.
 */

export interface LeadershipRole {
  role: string;
  name: string | null;
  title: string | null;
  bio: string | null;
  photo: string | null;
  approved: boolean;
}

export const LEADERSHIP: LeadershipRole[] = [
  { role: 'Managing Director / Chief Executive', name: null, title: null, bio: null, photo: null, approved: false },
  { role: 'Head of Operations / Project Management', name: null, title: null, bio: null, photo: null, approved: false },
  { role: 'Head of Real Estate / Property Services', name: null, title: null, bio: null, photo: null, approved: false },
  { role: 'Procurement / Business Development Lead', name: null, title: null, bio: null, photo: null, approved: false },
  { role: 'Finance and Administration Lead', name: null, title: null, bio: null, photo: null, approved: false },
];

export interface Testimonial {
  quote: string;
  author: string;
  organisation: string;
  /** Written consent to publish the quote and the attribution has been received. */
  consentOnFile: boolean;
  approved: boolean;
}

/** Empty until genuine, consented testimonials are available. */
export const TESTIMONIALS: Testimonial[] = [];

export interface CorporateDocument {
  title: string;
  published: boolean;
}

/** Credentials to verify before any is published. Copies are not part of the public site. */
export const CORPORATE_DOCUMENTS: CorporateDocument[] = [
  { title: 'Corporate Affairs Commission incorporation documents and current status report', published: false },
  { title: 'Current Tax Clearance Certificate', published: false },
  { title: 'Employees’ Compensation Scheme certificate or other applicable employee-compliance documentation', published: false },
];
