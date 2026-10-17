import type { Metadata } from 'next';
import Link from 'next/link';
import { WHO_WE_SERVE } from '@/config/profile';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = {
  title: 'Who We Serve',
  description: 'The individuals, businesses, developers, public bodies, and project stakeholders our services are relevant to.',
  alternates: { canonical: '/who-we-serve' },
};

export default function WhoWeServePage() {
  return (
    <>
      <PageHeader
        eyebrow="Who we serve"
        title="Clients and sectors we can support"
        intro={WHO_WE_SERVE.intro}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Who We Serve' }]}
      />
      <div className="mx-auto max-w-content px-5 py-12 md:px-8 md:py-14">
        <ul className="grid gap-5 md:grid-cols-2">
          {WHO_WE_SERVE.groups.map((g) => (
            <li key={g} className="card border-l-4 border-l-brand-deep p-6 text-body text-neutral-text">
              {g}
            </li>
          ))}
        </ul>
        <div className="card mt-12 flex flex-col gap-5 p-8 md:flex-row md:items-center md:justify-between">
          <p className="max-w-prose text-body text-neutral-text">Not sure which service fits your situation? Tell us what you need and we will advise on the next step.</p>
          <Link href="/contact?subject=CONSULTATION" className="btn-primary shrink-0">Discuss your requirement</Link>
        </div>
      </div>
    </>
  );
}
