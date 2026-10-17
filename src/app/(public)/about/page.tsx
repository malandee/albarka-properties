import type { Metadata } from 'next';
import Link from 'next/link';
import { COMPANY } from '@/config/company';
import { ABOUT } from '@/config/profile';
import { LEADERSHIP } from '@/config/people';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = {
  title: 'About Us',
  description: `About ${COMPANY.displayName}: our overview, vision, mission, core values, and service-delivery approach. CAC ${COMPANY.cacRegistration}.`,
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  // Leadership is shown only once a role has been verified and approved, with a name.
  const publishedLeaders = LEADERSHIP.filter((l) => l.approved && l.name);

  return (
    <>
      <PageHeader
        eyebrow="About us"
        title={COMPANY.displayName}
        intro={ABOUT.motto}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'About Us' }]}
      />

      <section aria-labelledby="overview" className="mx-auto grid max-w-content gap-10 px-5 py-14 md:px-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="eyebrow mb-3">Overview</p>
          <h2 id="overview" className="text-section">Who we are</h2>
        </div>
        <div className="space-y-5 lg:col-span-8">
          {ABOUT.overview.map((para) => (
            <p key={para} className="text-body text-neutral-text">{para}</p>
          ))}
          <p className="text-body text-neutral-text">{ABOUT.delivery}</p>
        </div>
      </section>

      <section aria-labelledby="vision-mission" className="bg-neutral-alt py-14 md:py-16">
        <div className="mx-auto max-w-content px-5 md:px-8">
          <h2 id="vision-mission" className="sr-only">Vision and mission</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <article className="card p-7">
              <p className="eyebrow mb-3">Our vision</p>
              <p className="text-body text-brand-ink">{ABOUT.vision}</p>
            </article>
            <article className="card p-7">
              <p className="eyebrow mb-3">Our mission</p>
              <p className="text-body text-brand-ink">{ABOUT.mission}</p>
            </article>
          </div>
        </div>
      </section>

      <section aria-labelledby="values" className="mx-auto max-w-content px-5 py-14 md:px-8 md:py-16">
        <div className="max-w-prose">
          <p className="eyebrow mb-3">Core values</p>
          <h2 id="values" className="text-section">What guides our work</h2>
        </div>
        <ul className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {ABOUT.values.map((v) => (
            <li key={v.name} className="border-t-2 border-brand-deep pt-5">
              <h3 className="text-card text-brand-ink">{v.name}</h3>
              <p className="mt-2 text-support text-neutral-text">{v.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Company motto" className="bg-brand-charcoal py-14 text-white">
        <p className="mx-auto max-w-content px-5 text-center text-[clamp(1.5rem,1.2rem+1.4vw,2.25rem)] font-bold leading-snug md:px-8">
          “{ABOUT.motto}”
        </p>
      </section>

      <section aria-labelledby="approach" className="mx-auto max-w-content px-5 py-14 md:px-8 md:py-16">
        <div className="max-w-prose">
          <p className="eyebrow mb-3">How we deliver</p>
          <h2 id="approach" className="text-section">Our approach to service delivery</h2>
          <p className="mt-4 text-body text-neutral-text">
            We approach each assignment in six stages. How much time each stage takes depends on the size and complexity of the work.
          </p>
        </div>
        <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {ABOUT.approach.map((a, i) => (
            <li key={a.stage} className="card p-6">
              <p className="text-support font-semibold text-neutral-muted">Stage {i + 1}</p>
              <h3 className="mt-1 text-card text-brand-ink">{a.stage}</h3>
              <p className="mt-2 text-support text-neutral-text">{a.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {publishedLeaders.length > 0 && (
        <section aria-labelledby="leadership" className="border-t border-neutral-border bg-white py-14 md:py-16">
          <div className="mx-auto max-w-content px-5 md:px-8">
            <h2 id="leadership" className="text-section">Leadership</h2>
            <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {publishedLeaders.map((l) => (
                <li key={l.role} className="card p-6">
                  <h3 className="text-card text-brand-ink">{l.name}</h3>
                  <p className="text-support font-semibold text-brand-deep">{l.title ?? l.role}</p>
                  {l.bio && <p className="mt-3 text-support text-neutral-text">{l.bio}</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section aria-labelledby="corporate" className="mx-auto max-w-content px-5 py-14 md:px-8 md:py-16">
        <div className="card grid gap-6 p-7 md:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">Corporate information</p>
            <h2 id="corporate" className="text-card text-brand-ink">{COMPANY.legalName}</h2>
            <dl className="mt-4 space-y-3 text-support text-neutral-text">
              <div>
                <dt className="font-semibold text-brand-ink">CAC registration number</dt>
                <dd>{COMPANY.cacRegistration}</dd>
              </div>
              <div>
                <dt className="font-semibold text-brand-ink">Head office</dt>
                <dd>{COMPANY.address.full}</dd>
              </div>
              <div>
                <dt className="font-semibold text-brand-ink">Coverage</dt>
                <dd>{COMPANY.coverage}</dd>
              </div>
            </dl>
          </div>
          <div className="flex flex-col justify-between gap-6">
            <p className="text-support text-neutral-text">{ABOUT.commitment}</p>
            <div>
              <Link href="/partnerships" className="btn-secondary">Partnerships</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
