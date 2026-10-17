/**
 * Enquiry subjects. The keys are stored with each enquiry, so existing keys must never be renamed.
 */
export const CONTACT_SUBJECT_KEYS = [
  'GENERAL',
  'PROPERTY_ENQUIRY',
  'PROPERTY_MANAGEMENT',
  'VALUATION',
  'CONTRACTS',
  'CONSULTATION',
  'PARTNERSHIP',
  'CONSTRUCTION',
  'WATER_ENGINEERING',
  'RENEWABLE_ENERGY',
  'PROCUREMENT',
  'PROJECT_MANAGEMENT',
] as const;

export type ContactSubjectKey = (typeof CONTACT_SUBJECT_KEYS)[number];
