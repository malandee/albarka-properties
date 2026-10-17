import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { NIGERIAN_STATES } from '@/config/nigeria';
import { MAX_PRICE, PAGE_SIZE } from '@/lib/validation/property';
import { PERMISSIONS, type Actor, type AvailabilityStatus, type ListingPurpose, type Visibility } from '@/lib/auth/policy';

export const SORTS = ['newest', 'price_asc', 'price_desc'] as const;
export type SortKey = (typeof SORTS)[number];

export interface PublicFilters {
  q: string;
  purpose: ListingPurpose | null;
  type: string | null; // category slug
  state: string | null;
  city: string;
  minPrice: number | null;
  maxPrice: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  status: AvailabilityStatus | null;
  sort: SortKey;
  page: number;
}

export interface ParseResult {
  filters: PublicFilters;
  errors: Record<string, string>;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return (v[0] ?? '').trim();
  return (v ?? '').trim();
}

/** Strips control characters and collapses whitespace in free-text search. */
export function cleanSearchText(input: string): string {
  return input.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
}

function parseNonNegInt(raw: string, max: number): number | null | 'invalid' {
  if (raw === '') return null;
  if (!/^\d+$/.test(raw)) return 'invalid';
  const n = Number(raw);
  return n <= max ? n : 'invalid';
}

function parseMoney(raw: string): number | null | 'invalid' {
  if (raw === '') return null;
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return 'invalid';
  const n = Number(raw);
  return n >= 0 && n <= MAX_PRICE ? n : 'invalid';
}

/**
 * Validates public catalogue query parameters. Invalid values are reported and replaced with
 * defaults, so the page never silently applies an unsupported filter.
 */
export function parsePublicFilters(params: RawParams): ParseResult {
  const errors: Record<string, string> = {};
  const purposeRaw = first(params.purpose);
  const purpose: ListingPurpose | null = purposeRaw === 'sale' || purposeRaw === 'FOR_SALE' ? 'FOR_SALE' : purposeRaw === 'rent' || purposeRaw === 'FOR_RENT' ? 'FOR_RENT' : null;
  if (purposeRaw && !purpose) errors.purpose = 'Choose For Sale or For Rent.';

  const typeRaw = first(params.type);
  const type = typeRaw && /^[a-z0-9-]{2,80}$/.test(typeRaw) ? typeRaw : null;
  if (typeRaw && !type) errors.type = 'Choose a property type from the list.';

  const stateRaw = first(params.state);
  const state = stateRaw && (NIGERIAN_STATES as readonly string[]).includes(stateRaw) ? stateRaw : null;
  if (stateRaw && !state) errors.state = 'Choose a state from the list.';

  const city = cleanSearchText(first(params.city));

  const min = parseMoney(first(params.minPrice));
  const max = parseMoney(first(params.maxPrice));
  let minPrice: number | null = null;
  let maxPrice: number | null = null;
  if (min === 'invalid') errors.minPrice = 'Enter a valid minimum price.';
  else minPrice = min;
  if (max === 'invalid') errors.maxPrice = 'Enter a valid maximum price.';
  else maxPrice = max;
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    errors.maxPrice = 'The maximum price must be greater than or equal to the minimum price.';
  }

  const bed = parseNonNegInt(first(params.bedrooms), 50);
  const bath = parseNonNegInt(first(params.bathrooms), 50);
  if (bed === 'invalid') errors.bedrooms = 'Bedrooms must be a whole number from 0 to 50.';
  if (bath === 'invalid') errors.bathrooms = 'Bathrooms must be a whole number from 0 to 50.';

  const statusRaw = first(params.status);
  const statusList = ['AVAILABLE', 'RESERVED', 'SOLD', 'RENTED'] as const;
  const status = (statusList as readonly string[]).includes(statusRaw) ? (statusRaw as AvailabilityStatus) : null;
  if (statusRaw && !status) errors.status = 'Choose a supported status.';

  const sortRaw = first(params.sort);
  const sort: SortKey = (SORTS as readonly string[]).includes(sortRaw) ? (sortRaw as SortKey) : 'newest';
  if (sortRaw && sortRaw !== sort) errors.sort = 'Choose a supported sort order.';

  const pageRaw = first(params.page);
  let page = 1;
  if (pageRaw) {
    if (/^\d+$/.test(pageRaw) && Number(pageRaw) >= 1 && Number(pageRaw) <= 10_000) page = Number(pageRaw);
    else errors.page = 'Invalid page number.';
  }

  return {
    filters: {
      q: cleanSearchText(first(params.q)),
      purpose,
      type,
      state,
      city,
      minPrice,
      maxPrice,
      bedrooms: bed === 'invalid' ? null : bed,
      bathrooms: bath === 'invalid' ? null : bath,
      status,
      sort,
      page,
    },
    errors,
  };
}

/** Builds the Prisma filter. Visibility is always enforced here, never left to the caller. */
export function buildPublicWhere(f: PublicFilters): Prisma.PropertyWhereInput {
  const and: Prisma.PropertyWhereInput[] = [{ visibility: 'PUBLIC' }];
  if (f.q) {
    and.push({
      OR: [
        { title: { contains: f.q, mode: 'insensitive' } },
        { shortDescription: { contains: f.q, mode: 'insensitive' } },
        { description: { contains: f.q, mode: 'insensitive' } },
        { addressLine: { contains: f.q, mode: 'insensitive' } },
        { area: { contains: f.q, mode: 'insensitive' } },
        { city: { contains: f.q, mode: 'insensitive' } },
        { state: { contains: f.q, mode: 'insensitive' } },
        { category: { name: { contains: f.q, mode: 'insensitive' } } },
      ],
    });
  }
  if (f.purpose) and.push({ purpose: f.purpose });
  if (f.type) and.push({ category: { slug: f.type } });
  if (f.state) and.push({ state: f.state });
  if (f.city) and.push({ city: { contains: f.city, mode: 'insensitive' } });
  if (f.minPrice !== null || f.maxPrice !== null) {
    and.push({
      priceOnRequest: false,
      priceAmount: {
        ...(f.minPrice !== null ? { gte: f.minPrice } : {}),
        ...(f.maxPrice !== null ? { lte: f.maxPrice } : {}),
      },
    });
  }
  if (f.bedrooms !== null) and.push({ bedrooms: { gte: f.bedrooms } });
  if (f.bathrooms !== null) and.push({ bathrooms: { gte: f.bathrooms } });
  if (f.status) and.push({ availabilityStatus: f.status });
  return { AND: and };
}

export function buildOrderBy(sort: SortKey): Prisma.PropertyOrderByWithRelationInput[] {
  switch (sort) {
    case 'price_asc':
      return [{ priceAmount: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }];
    case 'price_desc':
      return [{ priceAmount: { sort: 'desc', nulls: 'last' } }, { id: 'desc' }];
    default:
      return [{ createdAt: 'desc' }, { id: 'desc' }];
  }
}

export const cardSelect = {
  id: true,
  slug: true,
  title: true,
  shortDescription: true,
  purpose: true,
  priceAmount: true,
  priceOnRequest: true,
  currency: true,
  priceNote: true,
  city: true,
  state: true,
  area: true,
  bedrooms: true,
  bathrooms: true,
  landSizeSqm: true,
  buildingSizeSqm: true,
  availabilityStatus: true,
  isDemo: true,
  category: { select: { name: true, slug: true } },
  images: {
    where: { isFeatured: true },
    take: 1,
    select: { id: true, storageKey: true, altText: true, width: true, height: true },
  },
} satisfies Prisma.PropertySelect;

export async function listPublicProperties(f: PublicFilters) {
  const where = buildPublicWhere(f);
  const [total, items] = await Promise.all([
    db.property.count({ where }),
    db.property.findMany({
      where,
      orderBy: buildOrderBy(f.sort),
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: cardSelect,
    }),
  ]);
  return { total, items, pageSize: PAGE_SIZE, page: f.page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getPublicPropertyBySlug(slug: string) {
  return db.property.findFirst({
    where: { slug, visibility: 'PUBLIC' },
    include: {
      category: { select: { name: true, slug: true } },
      features: { include: { feature: { select: { label: true } } }, orderBy: { feature: { sortOrder: 'asc' } } },
      images: {
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        select: { id: true, storageKey: true, altText: true, isFeatured: true, width: true, height: true },
      },
    },
  });
}

/** Lookup by id for legacy links. Only returns public listings. */
export async function getPublicPropertyById(id: string) {
  return db.property.findFirst({ where: { id, visibility: 'PUBLIC' }, select: { slug: true } });
}

export async function featuredProperties(limit: number) {
  return db.property.findMany({
    where: { visibility: 'PUBLIC' },
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    take: limit,
    select: cardSelect,
  });
}

export async function relatedProperties(propertyId: string, categoryId: string, state: string, limit = 3) {
  return db.property.findMany({
    where: { visibility: 'PUBLIC', id: { not: propertyId }, OR: [{ categoryId }, { state }] },
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    take: limit,
    select: cardSelect,
  });
}

/* ----------------------- Management listing ----------------------- */

export interface AdminFilters {
  q: string;
  visibility: Visibility | null;
  status: AvailabilityStatus | null;
  purpose: ListingPurpose | null;
  sort: 'updated' | 'newest' | 'price_asc' | 'price_desc' | 'title';
  page: number;
  ownerId?: string | null;
}

export function parseAdminFilters(params: RawParams): AdminFilters {
  const vis = first(params.visibility);
  const st = first(params.status);
  const pu = first(params.purpose);
  const sort = first(params.sort);
  const page = /^\d+$/.test(first(params.page)) ? Math.min(Math.max(1, Number(first(params.page))), 10_000) : 1;
  return {
    q: cleanSearchText(first(params.q)),
    visibility: vis === 'PUBLIC' || vis === 'HIDDEN' ? vis : null,
    status: (['AVAILABLE', 'RESERVED', 'SOLD', 'RENTED'] as const).includes(st as AvailabilityStatus) ? (st as AvailabilityStatus) : null,
    purpose: pu === 'FOR_SALE' || pu === 'FOR_RENT' ? pu : null,
    sort: (['updated', 'newest', 'price_asc', 'price_desc', 'title'] as const).includes(sort as never) ? (sort as AdminFilters['sort']) : 'updated',
    page,
  };
}

export async function listManageableProperties(actor: Actor, f: AdminFilters) {
  if (!PERMISSIONS.viewProperty(actor, { ownerId: actor.id }) && actor.role !== 'SUPER_ADMIN') {
    return { total: 0, items: [], page: 1, pageCount: 1 };
  }
  const and: Prisma.PropertyWhereInput[] = [];
  if (actor.role !== 'SUPER_ADMIN') and.push({ ownerId: actor.id });
  if (f.q) {
    and.push({
      OR: [
        { title: { contains: f.q, mode: 'insensitive' } },
        { city: { contains: f.q, mode: 'insensitive' } },
        { state: { contains: f.q, mode: 'insensitive' } },
        { addressLine: { contains: f.q, mode: 'insensitive' } },
      ],
    });
  }
  if (f.visibility) and.push({ visibility: f.visibility });
  if (f.status) and.push({ availabilityStatus: f.status });
  if (f.purpose) and.push({ purpose: f.purpose });
  const where: Prisma.PropertyWhereInput = and.length ? { AND: and } : {};
  const orderBy: Prisma.PropertyOrderByWithRelationInput[] =
    f.sort === 'newest'
      ? [{ createdAt: 'desc' }, { id: 'desc' }]
      : f.sort === 'price_asc'
        ? [{ priceAmount: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }]
        : f.sort === 'price_desc'
          ? [{ priceAmount: { sort: 'desc', nulls: 'last' } }, { id: 'desc' }]
          : f.sort === 'title'
            ? [{ title: 'asc' }, { id: 'asc' }]
            : [{ updatedAt: 'desc' }, { id: 'desc' }];
  const [total, items] = await Promise.all([
    db.property.count({ where }),
    db.property.findMany({
      where,
      orderBy,
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        title: true,
        purpose: true,
        priceAmount: true,
        priceOnRequest: true,
        currency: true,
        visibility: true,
        availabilityStatus: true,
        updatedAt: true,
        createdAt: true,
        ownerId: true,
        owner: { select: { name: true } },
        category: { select: { name: true } },
        images: { where: { isFeatured: true }, take: 1, select: { id: true, storageKey: true, altText: true } },
      },
    }),
  ]);
  return { total, items, page: f.page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** Dashboard figures from live database counts. Admins see only their own listings. */
export async function dashboardStats(actor: Actor) {
  const scope: Prisma.PropertyWhereInput = actor.role === 'SUPER_ADMIN' ? {} : { ownerId: actor.id };
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [total, visible, hidden, available, recentlyUpdated] = await Promise.all([
    db.property.count({ where: scope }),
    db.property.count({ where: { ...scope, visibility: 'PUBLIC' } }),
    db.property.count({ where: { ...scope, visibility: 'HIDDEN' } }),
    db.property.count({ where: { ...scope, availabilityStatus: 'AVAILABLE' } }),
    db.property.count({ where: { ...scope, updatedAt: { gte: weekAgo } } }),
  ]);
  const base = { total, visible, hidden, available, recentlyUpdated };
  if (actor.role !== 'SUPER_ADMIN') return { ...base, scope: 'own' as const };
  const [activeAdmins, totalAdmins, perAdmin] = await Promise.all([
    db.user.count({ where: { status: 'ACTIVE', deletedAt: null } }),
    db.user.count({ where: { deletedAt: null } }),
    db.user.findMany({
      where: { deletedAt: null },
      orderBy: [{ name: 'asc' }],
      select: { id: true, name: true, status: true, role: true, _count: { select: { properties: true } } },
    }),
  ]);
  return {
    ...base,
    scope: 'all' as const,
    activeAdmins,
    totalAdmins,
    perAdmin: perAdmin.map((u) => ({ id: u.id, name: u.name, status: u.status, role: u.role, properties: u._count.properties })),
  };
}
