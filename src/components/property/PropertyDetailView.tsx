import Link from 'next/link';
import { COMPANY } from '@/config/company';
import { PurposeBadge, StatusBadge, VisibilityBadge } from '@/components/ui/Badge';
import { Gallery, type GalleryImage } from './Gallery';
import { PropertyMap } from './PropertyMap';
import { formatPrice, formatSqm, locationLine } from '@/lib/format';
import { publicPhones, telHref, whatsappHref, formatPhone, type PublicContact } from '@/lib/contact/rules';
import type { AvailabilityStatus, ListingPurpose, Visibility } from '@/lib/auth/policy';
import { PropertyCard, type PropertyCardData } from './PropertyCard';

export interface PropertyDetailData {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  purpose: ListingPurpose;
  typeName: string;
  priceAmount: string | null;
  priceOnRequest: boolean;
  currency: string;
  priceNote: string | null;
  addressLine: string;
  area: string | null;
  city: string;
  state: string;
  formattedAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  mapIsPrivate: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  toilets: number | null;
  parkingSpaces: number | null;
  floors: number | null;
  landSizeSqm: string | null;
  buildingSizeSqm: string | null;
  availabilityStatus: AvailabilityStatus;
  visibility: Visibility;
  isDemo: boolean;
  features: string[];
  images: (GalleryImage & { isFeatured: boolean })[];
  updatedAt: string;
}

function Spec({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-neutral-border py-3 last:border-b-0">
      <dt className="text-support text-neutral-muted">{label}</dt>
      <dd className="text-right text-[0.9375rem] font-semibold text-brand-ink">{value}</dd>
    </div>
  );
}

/**
 * Full property presentation shared by the public page and the admin preview.
 * `preview` adds a banner so administrators know the listing is not necessarily public yet.
 */
export function PropertyDetailView({
  p,
  preview = false,
  related = [],
  contact,
}: {
  p: PropertyDetailData;
  preview?: boolean;
  related?: PropertyCardData[];
  /** Public contact details (server-supplied). Unpublished phones and an unset WhatsApp number are never shown. */
  contact: PublicContact;
}) {
  // Image ordering: featured first, then gallery order (already sorted by the caller).
  const galleryImages = [...p.images].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
  const showMap = p.latitude !== null && p.longitude !== null && !p.mapIsPrivate;
  const location = locationLine({ area: p.area, city: p.city, state: p.state });
  const land = formatSqm(p.landSizeSqm);
  const building = formatSqm(p.buildingSizeSqm);
  const enquiryMessage = `Hello ${COMPANY.shortName}, I am interested in "${p.title}" (${p.slug}). Please share more details.`;
  const phones = publicPhones(contact);
  const waHref = whatsappHref(contact, enquiryMessage);
  const directions = showMap ? `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}` : null;

  return (
    <article aria-labelledby="property-title" className="mx-auto max-w-content px-5 py-8 md:px-8 md:py-12">
      {preview && (
        <div role="status" className="mb-6 flex flex-col gap-2 rounded-lg border border-warning/40 bg-white p-4 text-support text-neutral-text sm:flex-row sm:items-center sm:justify-between">
          <p>
            <strong className="text-warning">Preview.</strong> This is how the listing looks to visitors. It is{' '}
            {p.visibility === 'PUBLIC' ? 'currently shown publicly' : 'hidden from the public site'}.
          </p>
          <div className="flex items-center gap-3">
            <VisibilityBadge visibility={p.visibility} />
          </div>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-7">
          <Gallery images={galleryImages} title={p.title} />

          <section aria-labelledby="desc-heading" className="space-y-4">
            <h2 id="desc-heading" className="text-section">
              About this property
            </h2>
            <p className="text-body font-semibold text-brand-ink">{p.shortDescription}</p>
            <div className="space-y-4 whitespace-pre-line text-body text-neutral-text">{p.description}</div>
          </section>

          {p.features.length > 0 && (
            <section aria-labelledby="features-heading">
              <h2 id="features-heading" className="text-section">
                Features and amenities
              </h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-body text-neutral-text">
                    <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-brand-deep" />
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="location-heading" className="space-y-4">
            <h2 id="location-heading" className="text-section">
              Location
            </h2>
            <p className="text-body text-neutral-text">{p.formattedAddress ?? `${p.addressLine}, ${location}`}</p>
            {showMap ? (
              <>
                <PropertyMap latitude={p.latitude!} longitude={p.longitude!} label={p.title} />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <a href={directions!} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                    Get directions<span className="sr-only"> to {p.title} (opens in a new tab)</span>
                  </a>
                </div>
              </>
            ) : (
              <p className="rounded-md bg-neutral-alt p-4 text-support text-neutral-text">
                {p.mapIsPrivate
                  ? 'The exact location of this property is shared on request. Contact us to arrange details.'
                  : 'A map is not available for this listing yet. Contact us for directions.'}
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-5" aria-label="Summary and enquiry">
          <div className="card space-y-5 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <PurposeBadge purpose={p.purpose} />
              <StatusBadge status={p.availabilityStatus} />
              {p.isDemo && <span className="rounded-md bg-neutral-alt px-2.5 py-1 text-[0.8125rem] font-semibold text-brand-ink">Demonstration listing</span>}
            </div>
            <div>
              <p className="eyebrow">{p.typeName}</p>
              <h1 id="property-title" className="mt-2 text-page">
                {p.title}
              </h1>
              <p className="mt-2 text-body text-neutral-muted">{location}</p>
            </div>
            <div className="border-t border-neutral-border pt-5">
              <p className="text-[1.5rem] font-bold text-brand-ink">{formatPrice(p.priceAmount, p.currency, p.priceOnRequest)}</p>
              {p.priceNote && <p className="mt-1 text-support text-neutral-muted">{p.priceNote}</p>}
            </div>
            <div className="flex flex-col gap-3">
              {waHref && (
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#1E7A4C] px-4 font-semibold text-white transition-colors duration-200 ease-std hover:bg-[#17633D]">
                  WhatsApp about this property
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
              {phones[0] && (
                <a href={telHref(phones[0].tel)} className="btn-secondary">
                  Call {formatPhone(phones[0].tel)}
                </a>
              )}
              <Link href={`/contact?subject=PROPERTY_ENQUIRY&property=${encodeURIComponent(p.slug)}`} className="btn-ghost">
                Send an enquiry online
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-card text-brand-ink">Specifications</h2>
            <dl className="mt-3">
              <Spec label="Listing purpose" value={p.purpose === 'FOR_SALE' ? 'For Sale' : 'For Rent'} />
              <Spec label="Property type" value={p.typeName} />
              <Spec label="Bedrooms" value={p.bedrooms} />
              <Spec label="Bathrooms" value={p.bathrooms} />
              <Spec label="Toilets" value={p.toilets} />
              <Spec label="Parking spaces" value={p.parkingSpaces} />
              <Spec label="Floors" value={p.floors} />
              <Spec label="Land size" value={land} />
              <Spec label="Building size" value={building} />
              <Spec label="Availability" value={{ AVAILABLE: 'Available', RESERVED: 'Reserved', SOLD: 'Sold', RENTED: 'Rented' }[p.availabilityStatus]} />
              <Spec label="State" value={p.state} />
              <Spec label="City or area" value={[p.city, p.area].filter(Boolean).join(' · ')} />
              <Spec label="Last updated" value={new Date(p.updatedAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })} />
            </dl>
          </div>

          <div className="card p-6">
            <h2 className="text-card text-brand-ink">Contact {COMPANY.shortName}</h2>
            <ul className="mt-3 space-y-2 text-support">
              {phones.map((ph) => (
                <li key={ph.tel}>
                  <a href={telHref(ph.tel)} className="font-semibold text-brand-deep hover:underline">
                    {formatPhone(ph.tel)}
                  </a>
                  <span className="text-neutral-muted"> · {ph.label}</span>
                </li>
              ))}
              <li>
                <a href={`mailto:${contact.email}`} className="break-all font-semibold text-brand-deep hover:underline">
                  {contact.email}
                </a>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-16 border-t border-neutral-border pt-12">
          <h2 id="related-heading" className="text-section">
            Similar properties
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <li key={r.id}>
                <PropertyCard p={r} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
