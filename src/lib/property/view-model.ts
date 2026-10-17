import type { PropertyDetailData } from '@/components/property/PropertyDetailView';
import type { AvailabilityStatus, ListingPurpose, Visibility } from '@/lib/auth/policy';

/** Converts a Prisma record (Decimal fields, relations) into the serialisable detail shape. */
export function toDetailData(p: {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  purpose: string;
  priceAmount: { toString(): string } | null;
  priceOnRequest: boolean;
  currency: string;
  priceNote: string | null;
  addressLine: string;
  area: string | null;
  city: string;
  state: string;
  formattedAddress: string | null;
  latitude: { toString(): string } | null;
  longitude: { toString(): string } | null;
  mapIsPrivate: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  toilets: number | null;
  parkingSpaces: number | null;
  floors: number | null;
  landSizeSqm: { toString(): string } | null;
  buildingSizeSqm: { toString(): string } | null;
  availabilityStatus: string;
  visibility: string;
  isDemo: boolean;
  updatedAt: Date;
  category: { name: string };
  features?: { feature: { label: string } }[];
  images: { id: string; storageKey: string; altText: string; width: number; height: number; isFeatured: boolean }[];
}): PropertyDetailData {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    shortDescription: p.shortDescription,
    description: p.description,
    purpose: p.purpose as ListingPurpose,
    typeName: p.category.name,
    priceAmount: p.priceAmount?.toString() ?? null,
    priceOnRequest: p.priceOnRequest,
    currency: p.currency,
    priceNote: p.priceNote,
    addressLine: p.addressLine,
    area: p.area,
    city: p.city,
    state: p.state,
    formattedAddress: p.formattedAddress,
    latitude: p.latitude === null ? null : Number(p.latitude.toString()),
    longitude: p.longitude === null ? null : Number(p.longitude.toString()),
    mapIsPrivate: p.mapIsPrivate,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    toilets: p.toilets,
    parkingSpaces: p.parkingSpaces,
    floors: p.floors,
    landSizeSqm: p.landSizeSqm?.toString() ?? null,
    buildingSizeSqm: p.buildingSizeSqm?.toString() ?? null,
    availabilityStatus: p.availabilityStatus as AvailabilityStatus,
    visibility: p.visibility as Visibility,
    isDemo: p.isDemo,
    features: (p.features ?? []).map((f) => f.feature.label),
    images: p.images.map((i) => ({ id: i.id, storageKey: i.storageKey, alt: i.altText, width: i.width, height: i.height, isFeatured: i.isFeatured })),
    updatedAt: p.updatedAt.toISOString(),
  };
}
