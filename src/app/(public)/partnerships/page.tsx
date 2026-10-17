import type { Metadata } from 'next';
import Link from 'next/link';
import { ADORN_PARTNERSHIP, PARTNERSHIPS } from '@/config/profile';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = {
  title: 'Partnerships',
  description: 'Professional collaboration with complementary service providers, and a documented collaborative opportunity with Adorn Cleaners & Environmental Services Ltd.',
  alternates: { canonical: '/partnerships' },
};

export default function PartnershipsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Partnerships"
        title="Working with complementary partners"
        intro={PARTNERSHIPS.intro}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Partnerships' }]}
        actions={
          <Link href="/contact?subject=PARTNERSHIP" className="btn-primary">
            Discuss a Partnership
          </Link>
        }
      />

      <section aria-labelledby="documented" className="mx-auto max-w-content px-5 py-14 md:px-8">
        <div className="card p-7 md:p-9">
          <p className="eyebrow mb-3">Documented collaborative opportunity</p>
          <h2 id="documented" className="text-section">{ADORN_PARTNERSHIP.name}</h2>
          <p className="mt-4 text-body text-neutral-text">{ADORN_PARTNERSHIP.text}</p>
          <p className="mt-4 rounded-md bg-neutral-alt p-4 text-support text-neutral-text">{ADORN_PARTNERSHIP.disclaimer}</p>
          <div className="mt-6">
            <Link href="/contact?subject=PARTNERSHIP" className="btn-secondary">Discuss a Partnership</Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="open" className="bg-neutral-alt py-14 md:py-16">
        <div className="mx-auto grid max-w-content gap-10 px-5 md:px-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow mb-3">Open to</p>
            <h2 id="open" className="text-section">Where we can collaborate</h2>
            <ul className="mt-6 list-disc space-y-2 pl-5 text-body text-neutral-text">
              {PARTNERSHIPS.openTo.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
            <p className="mt-6 text-support text-neutral-text">{PARTNERSHIPS.terms}</p>
          </div>
          <div className="lg:col-span-7">
            <p className="eyebrow mb-3">Why partner with us</p>
            <ul className="grid gap-5 sm:grid-cols-2">
              {PARTNERSHIPS.whyPartner.map((w) => (
                <li key={w.title} className="card p-5">
                  <h3 className="text-card text-brand-ink">{w.title}</h3>
                  <p className="mt-2 text-support text-neutral-text">{w.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
