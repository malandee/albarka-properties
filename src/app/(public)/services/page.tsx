import type { Metadata } from 'next';
import Link from 'next/link';
import { SERVICE_FAMILIES } from '@/config/services';
import { PageHeader } from '@/components/ui/PageHeader';
import { ServiceIcon } from '@/components/ui/ServiceIcon';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Eight service families: real estate and property services, building and civil works, water engineering, renewable energy, general contracts and supplies, project management, electrical and security supplies, and consultancy.',
  alternates: { canonical: '/services' },
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Our solutions and services"
        intro="Our business scope covers eight service families. The services we undertake on any assignment depend on the brief, the agreed scope, available resources, partner arrangements, and applicable professional or regulatory requirements."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Services' }]}
      />
      <div className="mx-auto max-w-content px-5 py-12 md:px-8 md:py-14">
        <ul className="grid gap-6 md:grid-cols-2">
          {SERVICE_FAMILIES.map((f) => (
            <li key={f.slug}>
              <Link href={`/services/${f.slug}`} className="card group flex h-full flex-col gap-4 p-7 transition-[border-color] duration-200 ease-std hover:border-brand-deep">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-neutral-alt text-brand-deep">
                    <ServiceIcon name={f.icon} />
                  </span>
                  <div>
                    <p className="text-support font-semibold text-neutral-muted">Family {f.letter}</p>
                    <h2 className="text-card text-brand-ink group-hover:text-brand-deep">{f.title}</h2>
                  </div>
                </div>
                <p className="text-support text-neutral-text">{f.summary}</p>
                <ul className="mt-auto flex flex-wrap gap-2 text-[0.8125rem] text-neutral-muted">
                  {f.items.map((i) => (
                    <li key={i.name} className="rounded-full border border-neutral-border px-3 py-1">{i.name}</li>
                  ))}
                </ul>
                <span className="text-support font-semibold text-brand-deep">View this family →</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-support text-neutral-muted">
          Some work is subject to licences, approvals, or professional requirements. We confirm these for each assignment before we commit to delivery.
        </p>
      </div>
    </>
  );
}
