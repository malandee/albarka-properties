/**
 * Demonstration data for development, review, and training.
 *
 * Everything created here is SAMPLE content: listings are titled "[Sample]", flagged `isDemo`,
 * and their photographs are AI-generated illustrations. Do not run this against a production
 * database that holds real listings.
 *
 * Run: npm run db:seed   (safe to re-run: it does nothing when sample listings already exist)
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { db } from '../src/lib/db';
import { createProperty, uploadImage, changeVisibility, changeAvailability } from '../src/lib/property/service';
import { propertyContentSchema } from '../src/lib/validation/property';
import type { Actor } from '../src/lib/auth/policy';

const SAMPLE_OWNER_EMAIL = 'sample-listings@albarka.invalid';
const ASSET_DIR = path.join(process.cwd(), 'prisma', 'seed-assets', 'demo');

const CATEGORIES = [
  { slug: 'detached-house', name: 'Detached house' },
  { slug: 'duplex', name: 'Duplex' },
  { slug: 'flat-apartment', name: 'Flat / apartment' },
  { slug: 'land-plot', name: 'Land / plot' },
  { slug: 'office-space', name: 'Office space' },
  { slug: 'shop-retail', name: 'Shop / retail' },
  { slug: 'warehouse', name: 'Warehouse' },
];

const FEATURES = [
  'Fenced compound',
  'Borehole water',
  'Standby generator',
  'Gated estate',
  'Boys’ quarters',
  'Fitted kitchen',
  'Tiled floors',
  'Air conditioning',
  'Ample parking',
  'Good road access',
];

interface SampleListing {
  image: string;
  alt: string;
  title: string;
  category: string;
  purpose: 'FOR_SALE' | 'FOR_RENT';
  priceAmount: number | null;
  priceOnRequest?: boolean;
  priceNote?: string;
  addressLine: string;
  area: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  mapIsPrivate?: boolean;
  shortDescription: string;
  description: string;
  specs: { bedrooms?: number; bathrooms?: number; toilets?: number; parkingSpaces?: number; floors?: number; landSizeSqm?: number; buildingSizeSqm?: number };
  features: string[];
  after?: { status: 'RESERVED' | 'SOLD' | 'RENTED' };
}

const LISTINGS: SampleListing[] = [
  {
    image: 'house-exterior.jpg',
    alt: 'Sample illustration of a two-storey detached house with a front lawn',
    title: '[Sample] Four-bedroom detached house with boys’ quarters',
    category: 'detached-house',
    purpose: 'FOR_SALE',
    priceAmount: 185_000_000,
    addressLine: 'Off Bompai Road, near the main gate',
    area: 'Nasarawa GRA',
    city: 'Kano',
    state: 'Kano',
    latitude: 12.0022,
    longitude: 8.592,
    shortDescription: 'Sample listing: a spacious four-bedroom detached home in a quiet, established neighbourhood.',
    description:
      'Sample listing for demonstration only. A detached two-storey house with four en-suite bedrooms, a large living and dining area, a fitted kitchen, a separate boys’ quarters, and a secure compound with ample parking. Coordinates are approximate.',
    specs: { bedrooms: 4, bathrooms: 5, toilets: 6, parkingSpaces: 4, floors: 2, landSizeSqm: 900, buildingSizeSqm: 520 },
    features: ['Fenced compound', 'Borehole water', 'Standby generator', 'Boys’ quarters', 'Fitted kitchen', 'Ample parking'],
  },
  {
    image: 'duplex-exterior.jpg',
    alt: 'Sample illustration of a modern duplex with a covered balcony',
    title: '[Sample] Modern three-bedroom duplex in a gated estate',
    category: 'duplex',
    purpose: 'FOR_RENT',
    priceAmount: 12_000_000,
    priceNote: 'per year, two years in advance',
    addressLine: 'Estate Road, Phase 2',
    area: 'Ajah',
    city: 'Lagos',
    state: 'Lagos',
    latitude: 6.4698,
    longitude: 3.6052,
    shortDescription: 'Sample listing: a modern three-bedroom duplex with a balcony, inside a gated estate.',
    description:
      'Sample listing for demonstration only. A three-bedroom duplex with a balcony, air-conditioned bedrooms, a generator, and 24-hour estate security. Suitable for a family or a small office. Figures are illustrative.',
    specs: { bedrooms: 3, bathrooms: 3, toilets: 4, parkingSpaces: 2, floors: 2, buildingSizeSqm: 260 },
    features: ['Gated estate', 'Standby generator', 'Air conditioning', 'Fitted kitchen', 'Tiled floors'],
  },
  {
    image: 'flat-interior.jpg',
    alt: 'Sample illustration of a bright living room in a flat',
    title: '[Sample] Two-bedroom flat with a fitted kitchen',
    category: 'flat-apartment',
    purpose: 'FOR_RENT',
    priceAmount: 3_500_000,
    priceNote: 'per year',
    addressLine: 'Admiralty Way',
    area: 'Lekki Phase 1',
    city: 'Lekki',
    state: 'Lagos',
    latitude: 6.4474,
    longitude: 3.4723,
    shortDescription: 'Sample listing: a bright two-bedroom flat with tiled floors and a fitted kitchen.',
    description:
      'Sample listing for demonstration only. A well-lit two-bedroom flat on the second floor with tiled floors, a fitted kitchen, and access to parking. Close to shops and transport routes.',
    specs: { bedrooms: 2, bathrooms: 2, toilets: 2, parkingSpaces: 1, floors: 1, buildingSizeSqm: 95 },
    features: ['Fitted kitchen', 'Tiled floors', 'Ample parking', 'Good road access'],
  },
  {
    image: 'land-plot.jpg',
    alt: 'Sample illustration of a level residential land plot',
    title: '[Sample] Residential plot in a planned layout',
    category: 'land-plot',
    purpose: 'FOR_SALE',
    priceAmount: null,
    priceOnRequest: true,
    addressLine: 'Layout Road, Phase 3',
    area: 'Independence Layout',
    city: 'Kaduna',
    state: 'Kaduna',
    latitude: 10.5105,
    longitude: 7.4165,
    mapIsPrivate: true,
    shortDescription: 'Sample listing: a level residential plot in a planned layout with good road access.',
    description:
      'Sample listing for demonstration only. A level residential plot with a regular shape, documented title in the sample, and road access on two sides. The exact map position is kept private for this sample.',
    specs: { landSizeSqm: 600 },
    features: ['Good road access'],
  },
  {
    image: 'office-interior.jpg',
    alt: 'Sample illustration of an open-plan office with desks and windows',
    title: '[Sample] Open-plan office floor with meeting room',
    category: 'office-space',
    purpose: 'FOR_RENT',
    priceAmount: 4_800_000,
    priceNote: 'per year',
    addressLine: 'Ikwerre Road',
    area: 'Rumuola',
    city: 'Port Harcourt',
    state: 'Rivers',
    latitude: 4.8156,
    longitude: 7.0498,
    shortDescription: 'Sample listing: an open-plan office floor with a meeting room and good natural light.',
    description:
      'Sample listing for demonstration only. An open-plan office floor with a meeting room, a kitchenette, and generator backup. Suitable for a consultancy or a small business team. Figures are illustrative.',
    specs: { toilets: 2, parkingSpaces: 3, floors: 1, buildingSizeSqm: 180 },
    features: ['Standby generator', 'Air conditioning', 'Ample parking', 'Good road access'],
    after: { status: 'RESERVED' },
  },
  {
    image: 'shop-frontage.jpg',
    alt: 'Sample illustration of a ground-floor shop frontage on a busy street',
    title: '[Sample] Ground-floor shop on a busy road',
    category: 'shop-retail',
    purpose: 'FOR_SALE',
    priceAmount: 65_000_000,
    addressLine: 'Market Road',
    area: 'Ogui',
    city: 'Enugu',
    state: 'Enugu',
    latitude: 6.4584,
    longitude: 7.5464,
    shortDescription: 'Sample listing: a ground-floor shop with a wide frontage on a busy road.',
    description:
      'Sample listing for demonstration only. A ground-floor retail unit with a wide frontage, a storage room at the back, and high foot traffic. Suitable for a shop or a showroom. Figures are illustrative.',
    specs: { toilets: 1, floors: 1, buildingSizeSqm: 70 },
    features: ['Good road access'],
    after: { status: 'SOLD' },
  },
  {
    image: 'warehouse-exterior.jpg',
    alt: 'Sample illustration of a warehouse with a loading bay',
    title: '[Sample] Warehouse with loading bay and yard',
    category: 'warehouse',
    purpose: 'FOR_RENT',
    priceAmount: 22_000_000,
    priceNote: 'per year',
    addressLine: 'Industrial Estate, Plot 14',
    area: 'Ibadan Industrial Estate',
    city: 'Ibadan',
    state: 'Oyo',
    latitude: 7.3775,
    longitude: 3.947,
    shortDescription: 'Sample listing: a warehouse with a loading bay, a secure yard, and high ceilings.',
    description:
      'Sample listing for demonstration only. A warehouse with a loading bay, a secure walled yard, and high ceilings suitable for storage and light distribution. Figures are illustrative.',
    specs: { parkingSpaces: 6, floors: 1, landSizeSqm: 1200, buildingSizeSqm: 800 },
    features: ['Fenced compound', 'Standby generator', 'Good road access', 'Ample parking'],
    after: { status: 'RENTED' },
  },
];

async function ensureCatalogue() {
  for (const [i, c] of CATEGORIES.entries()) {
    await db.propertyCategory.upsert({
      where: { slug: c.slug },
      create: { ...c, sortOrder: i + 1, active: true },
      update: {},
    });
  }
  for (const [i, label] of FEATURES.entries()) {
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await db.feature.upsert({ where: { slug }, create: { slug, label, sortOrder: i + 1, active: true }, update: {} });
  }
}

async function main() {
  const existing = await db.property.count({ where: { isDemo: true } });
  if (existing > 0) {
    console.log(`Sample listings already exist (${existing}). Nothing to do.`);
    return;
  }

  await ensureCatalogue();

  // A non-signing owner for the sample listings. It has no password, so nobody can sign in as it.
  const owner = await db.user.upsert({
    where: { email: SAMPLE_OWNER_EMAIL },
    create: { name: 'Sample listings (demonstration)', email: SAMPLE_OWNER_EMAIL, role: 'ADMIN', status: 'ACTIVE' },
    update: {},
    select: { id: true, role: true, status: true },
  });
  const actor: Actor = { id: owner.id, role: 'ADMIN', status: 'ACTIVE' };

  const categories = await db.propertyCategory.findMany({ select: { id: true, slug: true } });
  const features = await db.feature.findMany({ select: { id: true, label: true } });

  const createdIds: string[] = [];
  try {
    await seedListings(actor, categories, features, createdIds);
  } catch (err) {
    // Remove partial sample data so the seed can be re-run cleanly.
    if (createdIds.length) await db.property.deleteMany({ where: { id: { in: createdIds }, isDemo: true } });
    throw err;
  }
  console.log('Done. All seeded listings are marked as sample content.');
}

async function seedListings(
  actor: Actor,
  categories: { id: string; slug: string }[],
  features: { id: string; label: string }[],
  createdIds: string[],
) {
  const categoryId = (slug: string) => categories.find((c) => c.slug === slug)!.id;
  const featureIds = (labels: string[]) => labels.map((l) => features.find((f) => f.label === l)!.id);
  for (const item of LISTINGS) {
    const input = {
      title: item.title,
      shortDescription: item.shortDescription,
      description: item.description,
      purpose: item.purpose,
      categoryId: categoryId(item.category),
      priceAmount: item.priceOnRequest ? null : item.priceAmount,
      priceOnRequest: item.priceOnRequest ?? false,
      currency: 'NGN' as const,
      priceNote: item.priceNote ?? null,
      addressLine: item.addressLine,
      area: item.area,
      city: item.city,
      state: item.state,
      formattedAddress: `${item.addressLine}, ${item.area}, ${item.city}, ${item.state}, Nigeria`,
      latitude: item.latitude,
      longitude: item.longitude,
      mapIsPrivate: item.mapIsPrivate ?? false,
      bedrooms: item.specs.bedrooms ?? null,
      bathrooms: item.specs.bathrooms ?? null,
      toilets: item.specs.toilets ?? null,
      parkingSpaces: item.specs.parkingSpaces ?? null,
      floors: item.specs.floors ?? null,
      landSizeSqm: item.specs.landSizeSqm ?? null,
      buildingSizeSqm: item.specs.buildingSizeSqm ?? null,
      featureIds: featureIds(item.features),
    };
    const content = propertyContentSchema.parse(input);
    const created = await createProperty(actor, content, null);
    createdIds.push(created.id);
    const bytes = await readFile(path.join(ASSET_DIR, item.image));
    await uploadImage(actor, created.id, bytes, item.alt, null);
    await db.property.update({ where: { id: created.id }, data: { isDemo: true } });
    await changeVisibility(actor, created.id, 'PUBLIC', null);
    if (item.after) await changeAvailability(actor, created.id, item.after.status, null);
    console.log(`Created sample listing: ${created.slug}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
