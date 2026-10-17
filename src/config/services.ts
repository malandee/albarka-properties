/**
 * Eight service families (addendum A–H), mirroring sections 5.1–5.8 of the corporate profile.
 *
 * Wording rules (from the addendum):
 *  - The profile describes the company's "business scope and stated service interests".
 *    Do not present every item as delivered in-house. Use `delivery` where the route matters.
 *  - Regulated or specialist work carries a `note`. Do not remove these notes.
 *  - No accreditation, registration, licence, certification, or regulated-authority claim
 *    is made here. Add one only after it is verified (see CONTENT_VERIFICATION.md).
 */

import type { ContactSubjectKey } from './subjects';

export type ContactSubject = ContactSubjectKey;

export interface ServiceItem {
  /** Exact service name. The five named services in the proposal appear verbatim. */
  name: string;
  summary: string;
  subject: ContactSubject;
}

export interface ServiceFamily {
  /** Stable URL slug. */
  slug: string;
  /** Addendum letter, A–H. */
  letter: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
  title: string;
  /** Short card summary. */
  summary: string;
  /** Opening paragraph on the family page. */
  intro: string;
  subject: ContactSubject;
  items: ServiceItem[];
  /** Optional caution shown on the family page. */
  note?: string;
  /** Optional illustrative image (see `illustration` in public/images/services). */
  illustration?: { src: string; alt: string };
  /** Icon key understood by ServiceIcon. */
  icon: 'building' | 'wrench' | 'droplet' | 'zap' | 'clipboard' | 'truck' | 'shield' | 'message';
}

export const SERVICE_FAMILIES: ServiceFamily[] = [
  {
    slug: 'real-estate-property-services',
    letter: 'A',
    title: 'Real Estate and Property Services',
    summary: 'Land and landed-property agency, estate development, valuation, property and facility management, and advisory.',
    intro:
      'Support across the property lifecycle, from land and landed-property transactions to the ongoing care of property assets. Each assignment is scoped to the brief and to applicable professional requirements.',
    subject: 'PROPERTY_ENQUIRY',
    icon: 'building',
    illustration: { src: '/images/services/house-exterior.jpg', alt: 'Illustrative image of a residential house exterior. Not a photograph of an Albarka project.' },
    items: [
      { name: 'Land and Landed Property Agency', summary: 'Agency and related transaction support for land and landed property.', subject: 'PROPERTY_ENQUIRY' },
      { name: 'Estate and Housing Development', summary: 'Estate and housing development activities.', subject: 'CONSTRUCTION' },
      { name: 'Property Acquisition and Disposal Support', summary: 'Acquisition, holding, improvement, alteration, development, letting, and disposal of property, as applicable.', subject: 'PROPERTY_ENQUIRY' },
      { name: 'Property Management', summary: 'Management and support for the care and effective use of property assets.', subject: 'PROPERTY_MANAGEMENT' },
      { name: 'Valuation Services', summary: 'Property valuation, subject to applicable professional requirements and the qualifications needed for the assignment.', subject: 'VALUATION' },
      { name: 'Facility Management', summary: 'Combines business administration, engineering, and maintenance disciplines to keep buildings and infrastructure safe, comfortable, and efficient.', subject: 'PROPERTY_MANAGEMENT' },
      { name: 'Property Consultancy', summary: 'Advisory services where external experts analyse organisational challenges and help execute operational or strategic changes.', subject: 'CONSULTATION' },
    ],
    note: 'Valuation work is subject to the professional requirements and qualifications applicable to each assignment.',
  },
  {
    slug: 'building-construction-civil-works',
    letter: 'B',
    title: 'Building, Construction and Civil Works',
    summary: 'General building contracting, renovation and refurbishment, building maintenance, civil engineering, and building-material supply.',
    intro:
      'Construction-related services for new builds, renovations, and maintenance, delivered through our own arrangements or through coordinated contractors and suppliers, depending on the scope.',
    subject: 'CONSTRUCTION',
    icon: 'wrench',
    illustration: { src: '/images/services/warehouse-exterior.jpg', alt: 'Illustrative image of a commercial building. Not a photograph of an Albarka project.' },
    items: [
      { name: 'General Building Contracting', summary: 'General building contracting and construction-related services.', subject: 'CONSTRUCTION' },
      { name: 'Renovation and Refurbishment', summary: 'Renovation, refurbishment, and the equipping of buildings and structures.', subject: 'CONSTRUCTION' },
      { name: 'Building Maintenance', summary: 'Planned and responsive maintenance of buildings.', subject: 'CONSTRUCTION' },
      { name: 'Building and Civil Engineering Works', summary: 'Building and civil engineering work, including estate development activities.', subject: 'CONSTRUCTION' },
      { name: 'Building-Material Sourcing and Supply', summary: 'Sourcing, procurement, and supply of building materials.', subject: 'PROCUREMENT' },
    ],
  },
  {
    slug: 'water-engineering',
    letter: 'C',
    title: 'Water Engineering',
    summary: 'Borehole drilling, water-treatment plant installation, and water-related equipment and supply.',
    intro:
      'Water-engineering work for boreholes, treatment systems, and related equipment and materials.',
    subject: 'WATER_ENGINEERING',
    icon: 'droplet',
    items: [
      { name: 'Borehole Drilling', summary: 'Borehole drilling and related water-engineering work.', subject: 'WATER_ENGINEERING' },
      { name: 'Water-Treatment Plant Installation', summary: 'Installation of water-treatment plants and associated systems.', subject: 'WATER_ENGINEERING' },
      { name: 'Water Equipment and Materials Supply', summary: 'Water-related equipment, materials, and supply activities.', subject: 'PROCUREMENT' },
      { name: 'Water Packaging', summary: 'Included in the company’s registered objects, subject to relevant approvals and standards.', subject: 'WATER_ENGINEERING' },
    ],
    note: 'Water packaging and certain water works are subject to relevant approvals and standards before work begins.',
  },
  {
    slug: 'renewable-energy-power-systems',
    letter: 'D',
    title: 'Renewable Energy and Power Systems',
    summary: 'Solar electric and thermal systems, refrigeration, wind and hydro power, and related electrical materials.',
    intro:
      'Procurement, supply, installation, and maintenance of renewable-energy and power systems where the work is suitably resourced and authorised.',
    subject: 'RENEWABLE_ENERGY',
    icon: 'zap',
    items: [
      { name: 'Renewable-Energy Systems', summary: 'Procurement, supply, installation, and maintenance of renewable-energy systems, where suitably resourced and authorised.', subject: 'RENEWABLE_ENERGY' },
      { name: 'Solar Electric and Thermal Systems', summary: 'Solar electric and thermal systems and related safety equipment and accessories.', subject: 'RENEWABLE_ENERGY' },
      { name: 'Refrigeration Systems', summary: 'Refrigeration systems and related equipment.', subject: 'RENEWABLE_ENERGY' },
      { name: 'Wind and Hydro Power Plants', summary: 'Wind and hydro power plants and related equipment.', subject: 'RENEWABLE_ENERGY' },
      { name: 'Electrical Materials for Power Systems', summary: 'Cables, fittings, inverters, converters, transformers, and associated equipment.', subject: 'PROCUREMENT' },
    ],
    note: 'Installation and maintenance of power systems depend on the resources and authorisations held for each assignment.',
  },
  {
    slug: 'general-contracts-procurement-supplies',
    letter: 'E',
    title: 'General Contracts, Procurement and Supplies',
    summary: 'General contracting, procurement, trading and distribution of goods, import and export within registered scope, and logistics support.',
    intro:
      'Commercial contracting and supply for organisations that need goods, materials, and equipment sourced and delivered under a clear arrangement.',
    subject: 'CONTRACTS',
    icon: 'truck',
    items: [
      { name: 'General Contracts', summary: 'General contracting and commercial supply activities.', subject: 'CONTRACTS' },
      { name: 'Procurement and Supply of General Goods', summary: 'Procurement, trading, marketing, sales, distribution, and supply of general goods.', subject: 'PROCUREMENT' },
      { name: 'Import and Export', summary: 'Within the company’s registered scope and applicable laws.', subject: 'CONTRACTS' },
      { name: 'Sourcing of Specified Materials', summary: 'Sourcing and supply of building, industrial, electrical, electronic, and other specified materials and equipment.', subject: 'PROCUREMENT' },
    ],
    note: 'Import and export activities are carried out within the company’s registered scope and applicable laws.',
  },
  {
    slug: 'project-management-services',
    letter: 'F',
    title: 'Project and Management Services',
    summary: 'Project management from inception through delivery, development-sector management, business analysis, and logistics support.',
    intro:
      'Project coordination from planning through implementation, with management support for development-sector work.',
    subject: 'PROJECT_MANAGEMENT',
    icon: 'clipboard',
    illustration: { src: '/images/services/office-interior.jpg', alt: 'Illustrative image of an office interior. Not a photograph of an Albarka project.' },
    items: [
      { name: 'Project Management', summary: 'Project management from planning and inception through coordination, implementation, and delivery.', subject: 'PROJECT_MANAGEMENT' },
      { name: 'Development-Sector Management Services', summary: 'Management services relating to development-sector activities.', subject: 'PROJECT_MANAGEMENT' },
      { name: 'Business Analysis and Project Coordination', summary: 'Business analysis and project-related coordination.', subject: 'CONSULTATION' },
      { name: 'Logistics Support', summary: 'Logistics and related support, in accordance with the agreed assignment.', subject: 'PROJECT_MANAGEMENT' },
    ],
  },
  {
    slug: 'electrical-electronic-security-supplies',
    letter: 'G',
    title: 'Electrical, Electronic and Security-Related Supplies',
    summary: 'Electrical materials and machinery, electronic equipment, and specified security equipment such as CCTV cameras, monitors, scanners, and sensors.',
    intro:
      'Supply of electrical, electronic, and specified security-related goods and accessories for projects and facilities.',
    subject: 'PROCUREMENT',
    icon: 'shield',
    items: [
      { name: 'Electrical Materials and Equipment', summary: 'Electrical materials, parts, components, accessories, machinery, plant, and fittings.', subject: 'PROCUREMENT' },
      { name: 'Electronic Equipment', summary: 'Electronic equipment and related goods.', subject: 'PROCUREMENT' },
      { name: 'Security-Related Equipment', summary: 'Specified security equipment, including CCTV cameras, monitors, scanners, sensors, and associated accessories.', subject: 'PROCUREMENT' },
    ],
  },
  {
    slug: 'consultancy-integrated-property-solutions',
    letter: 'H',
    title: 'Consultancy and Integrated Property Solutions',
    summary: 'Consultation and coordination support, collaboration with specialist providers, and integrated solutions that combine property, project, and supply services.',
    intro:
      'Consultation and coordination for property, construction, project, procurement, and supply matters. Where a requirement goes beyond our own scope, we coordinate with complementary specialist providers.',
    subject: 'CONSULTATION',
    icon: 'message',
    items: [
      { name: 'Consultations', summary: 'Consultancy and coordination support related to property, construction, project, procurement, and supply activities.', subject: 'CONSULTATION' },
      { name: 'Integrated Property Solutions', summary: 'Solutions that may combine property services, project coordination, maintenance, supplies, and specialist partner services.', subject: 'CONSULTATION' },
      { name: 'Coordinated Partner Services', summary: 'Collaboration with complementary service providers for broader property and infrastructure requirements.', subject: 'PARTNERSHIP' },
    ],
  },
];

export function findFamily(slug: string): ServiceFamily | undefined {
  return SERVICE_FAMILIES.find((f) => f.slug === slug);
}
