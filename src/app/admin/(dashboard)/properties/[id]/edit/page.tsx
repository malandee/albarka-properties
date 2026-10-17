import { notFound } from 'next/navigation';
import { requirePageSession } from '@/lib/auth/guards';
import { loadManageableProperty } from '@/lib/property/access';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { PropertyForm, type PropertyFormValues } from '@/components/admin/PropertyForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit property' };

export default async function EditPropertyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await requirePageSession(`/admin/properties/${id}/edit`);
  try {
    await loadManageableProperty(session.actor, id);
  } catch {
    notFound();
  }
  const [p, categories, features] = await Promise.all([
    db.property.findUniqueOrThrow({
      where: { id },
      select: {
        title: true, shortDescription: true, description: true, purpose: true, categoryId: true, priceAmount: true, priceOnRequest: true, currency: true, priceNote: true,
        addressLine: true, area: true, city: true, state: true, formattedAddress: true, latitude: true, longitude: true, mapIsPrivate: true,
        bedrooms: true, bathrooms: true, toilets: true, parkingSpaces: true, floors: true, landSizeSqm: true, buildingSizeSqm: true,
        features: { select: { featureId: true } },
      },
    }),
    db.propertyCategory.findMany({ where: { OR: [{ active: true }, { properties: { some: { id } } }] }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], select: { id: true, name: true } }),
    db.feature.findMany({ where: { OR: [{ active: true }, { properties: { some: { propertyId: id } } }] }, orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }], select: { id: true, label: true } }),
  ]);
  const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
  const initial: PropertyFormValues = {
    title: p.title,
    shortDescription: p.shortDescription,
    description: p.description,
    purpose: p.purpose,
    categoryId: p.categoryId,
    priceAmount: s(p.priceAmount?.toString()),
    priceOnRequest: p.priceOnRequest,
    currency: p.currency === 'USD' ? 'USD' : 'NGN',
    priceNote: s(p.priceNote),
    addressLine: p.addressLine,
    area: s(p.area),
    city: p.city,
    state: p.state,
    formattedAddress: s(p.formattedAddress),
    latitude: s(p.latitude?.toString()),
    longitude: s(p.longitude?.toString()),
    mapIsPrivate: p.mapIsPrivate,
    bedrooms: s(p.bedrooms),
    bathrooms: s(p.bathrooms),
    toilets: s(p.toilets),
    parkingSpaces: s(p.parkingSpaces),
    floors: s(p.floors),
    landSizeSqm: s(p.landSizeSqm?.toString()),
    buildingSizeSqm: s(p.buildingSizeSqm?.toString()),
    featureIds: p.features.map((f) => f.featureId),
  };
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[{ label: 'Properties', href: '/admin/properties' }, { label: p.title, href: `/admin/properties/${id}` }, { label: 'Edit' }]}
        eyebrow="Edit listing"
        title={p.title}
        intro={sp.created === '1' ? 'Listing saved. Next, add photographs in the gallery.' : 'Changes are saved when you choose Save changes. Visitors see updates once the listing is saved.'}
      />
      <PropertyForm mode="edit" propertyId={id} initial={initial} categories={categories} features={features} />
    </div>
  );
}
