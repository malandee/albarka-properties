/**
 * Company identity and the DEFAULT public contact details.
 *
 * Source of truth: the Albarka Properties corporate profile (Final, 2026).
 * Anything not in that profile is NOT published here. In particular:
 *  - Telephone numbers are listed but `published: false` until a Super Admin confirms them
 *    in Settings → Public contact details. Only confirmed numbers are shown on the site.
 *  - WhatsApp uses the primary number, +234 806 047 3796, as instructed by the company.
 *  - Business hours, years of experience, project and client counts, testimonials, leadership bios,
 *    accreditations and certifications are deliberately absent. See CONTENT_VERIFICATION.md.
 *
 * Runtime edits made in Settings are stored in the database and override these defaults
 * (see src/lib/contact/public-contact.ts).
 */

export interface DefaultPhone {
  /** Neutral label; the profile does not name the lines. */
  label: string;
  /** Human display form. */
  display: string;
  /** E.164-style value used in tel: links. */
  tel: string;
  /** Whether the number may be shown publicly. Defaults to false until confirmed. */
  published: boolean;
}

export const COMPANY = {
  legalName: 'Albarka Properties Consultant Ltd.',
  displayName: 'Albarka Properties Consultant Ltd.',
  shortName: 'Albarka Properties',
  cacRegistration: 'RC 7062863',
  motto: "Our Client's Success is Our Success.",
  introduction:
    'Albarka Properties Consultant Ltd. is a Nigerian property and consultancy company offering real estate, construction, water engineering, renewable energy, procurement, project management, and consultancy services.',
  servesText:
    'We work with individuals, families, businesses, institutions, developers, and government and development-sector bodies.',
  /** Verbatim from the corporate profile. */
  coverage: 'We serve clients nationwide across Nigeria, subject to the requirements and capacity of individual assignments.',
  address: {
    line1: 'Block A, No. 7, Nasara Shopping Complex',
    line2: 'Opposite Old Dass Park Junction',
    city: 'Bauchi',
    state: 'Bauchi State',
    country: 'Nigeria',
    /** Full single-line address for display and mailing. */
    full: 'Block A, No. 7, Nasara Shopping Complex, Opposite Old Dass Park Junction, Bauchi, Bauchi State, Nigeria',
  },
  /** Office coordinates are NOT set. A verified location is required before a map is shown. */
  office: null as null | { latitude: number; longitude: number },
  email: 'albarkapropertiesconsultantltd@gmail.com',
  /** Default contact details. Phones are unpublished until confirmed. */
  phones: [
    { label: 'Telephone 1', display: '+234 806 047 3796', tel: '+2348060473796', published: false },
    { label: 'Telephone 2', display: '+234 803 117 5727', tel: '+2348031175727', published: false },
  ] as DefaultPhone[],
  /** WhatsApp uses the primary telephone number (confirmed by the company). Set to null to hide the button. */
  whatsapp: '+2348060473796' as string | null,
  /** Social accounts supplied by the company. Shown in the footer. */
  socials: [
    { id: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/profile.php?id=100083218636740' },
    { id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/albarka_properties_conslt._ltd' },
    { id: 'tiktok', label: 'TikTok', url: 'https://vm.tiktok.com/ZS9U2whWFStrN-xlNhI/' },
    { id: 'x', label: 'X', url: 'https://x.com/Albarka_Ppties' },
  ],
  /** Not supplied. Omitted from the site entirely. */
  businessHours: null,
  logo: {
    src: '/brand/albarka-logo-640.png',
    srcWebp: '/brand/albarka-logo-640.webp',
    width: 640,
    height: 571,
    alt: 'Albarka Properties Consultant Ltd. logo',
  },
} as const;

export type CompanyConfig = typeof COMPANY;
