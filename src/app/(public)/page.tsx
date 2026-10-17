import Link from 'next/link';
import type { Metadata } from 'next';
import { COMPANY } from '@/config/company';
import { SERVICE_FAMILIES } from '@/config/services';
import { ABOUT } from '@/config/profile';
import { featuredProperties } from '@/lib/property/catalogue';
import { getFeaturedCount } from '@/lib/catalogue';
import { PropertyCard } from '@/components/property/PropertyCard';
import { EmptyState } from '@/components/ui/States';
import { ServiceIcon } from '@/components/ui/ServiceIcon';

export const metadata: Metadata = {
  title: 'Real Estate Solutions Built on Trust',
  description: `${COMPANY.introduction} ${COMPANY.coverage}`,
  alternates: { canonical: '/' },
};

export const revalidate = 300;

export default async function HomePage() {
  const featuredCount = await getFeaturedCount();
  let featured: Awaited<ReturnType<typeof featuredProperties>> = [];
  let featuredError = false;
  try {
    featured = await featuredProperties(featuredCount);
  } catch (err) {
    console.error('[home.featured]', err);
    featuredError = true;
  }

  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-heading" className="border-b border-neutral-border bg-white">
        <div className="mx-auto grid max-w-content items-center gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-6">
            <p className="eyebrow mb-4">Nationwide property services in Nigeria</p>
            <h1 id="hero-heading" className="text-display">
              Real Estate Solutions Built on Trust.
            </h1>
            <p className="mt-5 max-w-prose text-body text-neutral-text">
              Land and property agency, valuation, property management, construction, water engineering, renewable energy, procurement, and project management for individuals, businesses, and institutions.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/properties" className="btn-primary">
                Explore Properties
              </Link>
              <Link href="/contact" className="btn-secondary">
                Contact Our Team
              </Link>
            </div>
            <p className="mt-6 text-support text-neutral-muted">{COMPANY.coverage}</p>
          </div>
          <div className="lg:col-span-6">
            <img
              src="/images/hero-estate.webp"
              alt="Contemporary two-storey house with glass windows and a neat front lawn. Illustrative image, not a specific Albarka property."
              width={1536}
              height={1024}
              fetchPriority="high"
              className="aspect-[4/3] w-full rounded-lg object-cover"
            />
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section aria-labelledby="intro-heading" className="mx-auto max-w-content px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow mb-3">About the company</p>
            <h2 id="intro-heading" className="text-section">
              {COMPANY.displayName}
            </h2>
          </div>
          <div className="space-y-5 lg:col-span-7">
            <p className="text-body text-neutral-text">{ABOUT.overview[0]}</p>
            <p className="text-body text-neutral-text">{COMPANY.servesText}</p>
            <Link href="/about" className="inline-flex min-h-11 items-center font-semibold text-brand-deep hover:underline">
              Read about Albarka Properties<span className="sr-only"> Consultant Ltd</span> →
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section aria-labelledby="services-heading" className="bg-neutral-alt py-16 md:py-20">
        <div className="mx-auto max-w-content px-5 md:px-8">
          <div className="max-w-prose">
            <p className="eyebrow mb-3">Our services</p>
            <h2 id="services-heading" className="text-section">
              Eight service families for property, construction, and supply needs
            </h2>
          </div>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_FAMILIES.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/services/${s.slug}`}
                  className="card group flex h-full flex-col gap-4 p-6 transition-[border-color] duration-200 ease-std hover:border-brand-deep"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-md bg-neutral-alt text-brand-deep">
                    <ServiceIcon name={s.icon} />
                  </span>
                  <h3 className="text-card text-brand-ink group-hover:text-brand-deep">{s.title}</h3>
                  <p className="text-support text-neutral-text">{s.summary}</p>
                  <span className="mt-auto text-support font-semibold text-brand-deep">Learn more →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Featured properties */}
      <section aria-labelledby="featured-heading" className="mx-auto max-w-content px-5 py-16 md:px-8 md:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-prose">
            <p className="eyebrow mb-3">Featured properties</p>
            <h2 id="featured-heading" className="text-section">
              Current listings
            </h2>
          </div>
          <Link href="/properties" className="btn-secondary self-start sm:self-auto">
            Browse all properties
          </Link>
        </div>
        <div className="mt-10">
          {featuredError ? (
            <p role="alert" className="rounded-lg border border-danger/30 bg-white p-6 text-support text-neutral-text">
              Featured listings are temporarily unavailable. You can still{' '}
              <Link href="/properties" className="font-semibold text-brand-deep underline">
                browse the catalogue
              </Link>{' '}
              or{' '}
              <Link href="/contact" className="font-semibold text-brand-deep underline">
                contact us
              </Link>
              .
            </p>
          ) : featured.length === 0 ? (
            <EmptyState
              title="No featured listings yet"
              description="There are no published listings to feature at the moment. You can browse the full catalogue or contact the team about a property you need."
              actions={[
                { href: '/properties', label: 'Browse properties' },
                { href: '/contact', label: 'Contact our team', variant: 'secondary' },
              ]}
            />
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <li key={p.id}>
                  <PropertyCard p={p} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Why choose us */}
      <section aria-labelledby="why-heading" className="border-y border-neutral-border bg-white py-16 md:py-20">
        <div className="mx-auto max-w-content px-5 md:px-8">
          <div className="max-w-prose">
            <p className="eyebrow mb-3">Our core values</p>
            <h2 id="why-heading" className="text-section">
              Principles we work by
            </h2>
          </div>
          <ul className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {ABOUT.values.map((v) => (
              <li key={v.name} className="border-t-2 border-brand-deep pt-5">
                <h3 className="text-card text-brand-ink">{v.name}</h3>
                <p className="mt-2 text-support text-neutral-text">{v.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Motto */}
      <section aria-label="Company motto" className="bg-brand-charcoal py-14 text-white">
        <p className="mx-auto max-w-content px-5 text-center text-[clamp(1.5rem,1.2rem+1.4vw,2.25rem)] font-bold leading-snug md:px-8">
          {COMPANY.motto}
        </p>
      </section>

      {/* Call to action */}
      <section aria-labelledby="cta-heading" className="mx-auto max-w-content px-5 py-16 md:px-8 md:py-20">
        <div className="card flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="max-w-prose">
            <h2 id="cta-heading" className="text-section">
              Looking to buy, rent, manage, or value property?
            </h2>
            <p className="mt-3 text-body text-neutral-text">
              Explore current listings, or tell us what you need in property management, valuation, general contracts, or consultation.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/properties" className="btn-primary">
              Explore Properties
            </Link>
            <Link href="/contact?subject=CONSULTATION" className="btn-secondary">
              Start an enquiry
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
