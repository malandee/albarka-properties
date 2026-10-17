import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { COMPANY } from '@/config/company';
import { getPublicPropertyBySlug, getPublicPropertyById, relatedProperties } from '@/lib/property/catalogue';
import { toDetailData } from '@/lib/property/view-model';
import { PropertyDetailView } from '@/components/property/PropertyDetailView';
import { getPublicContact } from '@/lib/contact/public-contact';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { looksLikeId } from '@/lib/property/slug';
import { formatPrice } from '@/lib/format';
import { getEnv } from '@/lib/env';
import { mediaUrl } from '@/lib/media/urls';

export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;

async function loadPublic(slug: string) {
  const p = await getPublicPropertyBySlug(slug);
  return p;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await loadPublic(slug);
  if (!p) return { title: 'Property not found', robots: { index: false, follow: false } };
  const detail = toDetailData(p);
  const title = `${p.title} for ${p.purpose === 'FOR_SALE' ? 'sale' : 'rent'} in ${p.city}`;
  const image = p.images[0] ? new URL(mediaUrl(p.images[0].storageKey, 'lg'), getEnv().APP_URL).toString() : undefined;
  return {
    title,
    description: p.shortDescription,
    alternates: { canonical: `/properties/${p.slug}` },
    openGraph: {
      title: `${p.title} | ${COMPANY.shortName}`,
      description: p.shortDescription,
      url: `/properties/${p.slug}`,
      type: 'website',
      images: image ? [{ url: image, alt: p.images[0]!.altText }] : undefined,
    },
    other: { 'listing-price': formatPrice(detail.priceAmount, detail.currency, detail.priceOnRequest) },
  };
}

export default async function PropertyDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const p = await loadPublic(slug);
  if (!p) {
    // A link that uses an internal id is redirected to the canonical slug if the listing is public.
    if (looksLikeId(slug)) {
      const byId = await getPublicPropertyById(slug);
      if (byId) permanentRedirect(`/properties/${byId.slug}`);
    }
    notFound();
  }
  const detail = toDetailData(p);
  const related = await relatedProperties(p.id, p.categoryId, p.state, 3);

  // Structured data: only public, visible listings are described here.
  const base = getEnv().APP_URL.replace(/\/$/, '');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: p.title,
    description: p.shortDescription,
    url: `${base}/properties/${p.slug}`,
    datePosted: p.publishedAt?.toISOString(),
    image: p.images.slice(0, 5).map((i) => `${base}${mediaUrl(i.storageKey, 'lg')}`),
    ...(detail.priceAmount && !detail.priceOnRequest
      ? {
          offers: {
            '@type': 'Offer',
            price: detail.priceAmount,
            priceCurrency: detail.currency,
            availability: detail.availabilityStatus === 'AVAILABLE' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
          },
        }
      : {}),
    address: { '@type': 'PostalAddress', streetAddress: p.addressLine, addressLocality: p.city, addressRegion: p.state, addressCountry: 'NG' },
  };

  return (
    <>
      <div className="mx-auto max-w-content px-5 pt-6 md:px-8">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Properties', href: '/properties' }, { label: p.title }]} />
      </div>
      <PropertyDetailView p={detail} related={related} contact={await getPublicContact()} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </>
  );
}

