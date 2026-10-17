/**
 * Corporate narrative, taken from the corporate profile (sections 01–13).
 * Keep wording close to the profile. Do not add claims the profile does not make.
 */

export const ABOUT = {
  overview: [
    'Albarka Properties Consultant Ltd. is a private company limited by shares, registered in Nigeria under CAC registration number RC 7062863. Our head office is in Bauchi, Bauchi State.',
    'We bring together a broad business scope designed to respond to the property, project, supply, and development needs of individuals, businesses, and institutions.',
    'Our solutions span the property lifecycle, from land and landed-property agency and valuation to property management, building and civil works, water engineering, renewable-energy systems, general contracts, procurement, and project management.',
    'Successful property and infrastructure outcomes depend on more than the initial transaction or construction activity. They require careful coordination, responsible management, dependable supplies, attention to quality, and collaboration with capable service providers.',
  ],
  vision:
    'To become a trusted and respected Nigerian service partner in real estate development, construction, infrastructure, and project support, recognised for integrity, dependable delivery, and solutions that create lasting value.',
  mission:
    'To provide responsive, practical, and value-driven property, project, contracting, and supply solutions; build enduring relationships with clients and partners; and pursue every engagement with professionalism, accountability, and respect for applicable standards.',
  motto: "Our Client's Success is Our Success.",
  values: [
    { name: 'Integrity', text: 'We value honesty, transparency, and ethical conduct in our dealings with clients, suppliers, partners, and institutions.' },
    { name: 'Professionalism', text: 'We aim to approach assignments with preparation, care, respect, and attention to the requirements of the work.' },
    { name: 'Client focus', text: 'We seek to understand each client’s needs and align our proposed services with clearly defined objectives.' },
    { name: 'Accountability', text: 'We value clear responsibilities, open communication, and ownership of commitments made.' },
    { name: 'Quality and diligence', text: 'We recognise the importance of appropriate planning, quality checks, and responsible execution.' },
    { name: 'Collaboration', text: 'We welcome constructive partnerships that combine complementary capabilities and improve the value delivered to clients.' },
    { name: 'Practical value', text: 'We aim to offer solutions that are relevant to the assignment, mindful of resources, and oriented towards sustainable usefulness.' },
  ],
  /** Service-delivery approach, six stages, in profile order. */
  approach: [
    { stage: 'Understand the Requirement', text: 'Clarify the client’s objectives, constraints, timelines, specifications, and expected outcomes before proposing a response.' },
    { stage: 'Define the Scope', text: 'Set out the work to be undertaken, deliverables, responsibilities, assumptions, and any specialist inputs required.' },
    { stage: 'Plan and Coordinate', text: 'Organise the sequence of activities, resources, procurement needs, partner contributions, and communication arrangements.' },
    { stage: 'Deliver Responsibly', text: 'Carry out or coordinate the agreed work with attention to quality, safety, relevant standards, and contractual obligations.' },
    { stage: 'Communicate and Review', text: 'Keep communication proportionate to the assignment and review progress against the agreed scope and milestones.' },
    { stage: 'Build Lasting Relationships', text: 'Use feedback and professional engagement to strengthen trust and identify opportunities for future collaboration.' },
  ],
  delivery:
    'Each opportunity begins by understanding the requirement. We then identify a suitable delivery pathway: our own operational arrangements, procurement and project coordination, or collaboration with qualified specialist partners where required. Each assignment is defined by the agreed brief, available capacity, and applicable legal, technical, and professional requirements.',
  commitment:
    'We aim to build our reputation through the quality of our relationships, the clarity of our commitments, and the care with which we approach each assignment. As we grow, we intend to place continued emphasis on professional conduct, clear project definition, responsible coordination, compliance readiness, and collaboration with competent service providers.',
} as const;

export const WHO_WE_SERVE = {
  intro:
    'Our service scope is relevant to a range of potential clients and sectors. The groups below are target markets and possible areas of application. They are not a list of confirmed clients or completed contracts.',
  groups: [
    'Individuals and property owners requiring property-related support.',
    'Property developers, estate managers, landlords, and real estate investors.',
    'Private businesses and commercial property operators.',
    'Public institutions and government-related organisations, subject to procurement requirements.',
    'Construction and infrastructure project stakeholders.',
    'Organisations requiring procurement, supplies, project coordination, or general contracting.',
    'Institutions and facilities that may require coordinated property, maintenance, water, energy, or environmental solutions.',
  ],
} as const;

export const PARTNERSHIPS = {
  intro:
    'Complex property and infrastructure needs may require expertise beyond the scope of a single provider. We are open to professional collaboration where partners bring complementary skills, resources, technical knowledge, or delivery capacity. The purpose is to coordinate suitable capabilities around clearly defined client requirements and agreed responsibilities.',
  openTo: [
    'Joint delivery arrangements',
    'Procurement and supply opportunities',
    'Property and facility-related services',
    'Project management',
    'Other collaborations that align with our business scope and the capabilities of the parties involved',
  ],
  whyPartner: [
    { title: 'A long-term outlook', text: 'We seek relationships that support dependable service, practical value, and sustainable business growth.' },
    { title: 'Integrity and accountability', text: 'We aim to build confidence through honest communication, clarity of commitments, and responsible business conduct.' },
    { title: 'Planning and coordination', text: 'We recognise the importance of clear scopes, realistic timelines, responsible procurement, communication, and oversight.' },
    { title: 'A collaborative mindset', text: 'We value partnerships with competent providers whose expertise can complement project requirements.' },
    { title: 'A broad service scope', text: 'Our business scope spans property, construction, project management, supplies, and related services.' },
    { title: 'A client-centred philosophy', text: 'Our motto places client success at the centre of how we define a successful engagement.' },
  ],
  /** Responsibilities, deliverables, commercial terms and compliance are agreed in advance. */
  terms:
    'Responsibilities, deliverables, commercial terms, and compliance requirements should be agreed in advance.',
} as const;

/**
 * Documented partner. The profile describes a POTENTIAL collaborative relationship only.
 * Do not describe it as exclusive, confirmed, or completed. Do not show a logo unless permitted.
 */
export const ADORN_PARTNERSHIP = {
  name: 'Adorn Cleaners & Environmental Services Ltd',
  status: 'potential-collaboration' as const,
  text:
    'We have documented engagement with Adorn Cleaners & Environmental Services Ltd and have identified potential areas for collaboration. These include property and facility management, estate maintenance, environmental services, commercial property management, project development, and institutional facilities.',
  disclaimer:
    'This is presented as a collaborative opportunity. It is not an exclusive arrangement, a completed joint project, or a binding contract.',
  logo: null as null | { src: string; alt: string },
} as const;
