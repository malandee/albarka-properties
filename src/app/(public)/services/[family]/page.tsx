import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { COMPANY } from '@/config/company';
import { SERVICE_FAMILIES, findFamily } from '@/config/services';
import { SUBJECT_LABELS } from '@/lib/validation/account';
import { PageHeader } from '@/components/ui/PageHeader';
import { ServiceIcon } from '@/components/ui/ServiceIcon';

type Params = Promise<{ family: string }>;

export function generateStaticParams() {
  return SERVICE_FAMILIES.map((f) => ({ family: f.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { family } = await params;
  const f = findFamily(family);
  if (!f) return { title: 'Service not found' };
  return {
    title: f.title,
    description: f.summary,
    alternates: { canonical: `/services/${f.slug}` },
  };
}

export default async function ServiceFamilyPage({ params }: { params: Params }) {
  const { family } = await params;
  const f = findFamily(family);
  if (!f) notFound();
  const index = SERVICE_FAMILIES.findIndex((x) => x.slug === f.slug);
  const others = SERVICE_FAMILIES.filter((x) => x.slug !== f.slug);

  return (
    <>
      <PageHeader
        eyebrow={`Family ${f.letter}`}
        title={f.title}
        intro={f.intro}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Services', href: '/services' }, { label: f.title }]}
        actions={
          <Link href={`/contact?subject=${f.subject}`} className="btn-primary">
            Enquire about this service
          </Link>
        }
      />

      <div className="mx-auto grid max-w-content gap-10 px-5 py-12 md:px-8 md:py-14 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-7">
          <section aria-labelledby="scope">
            <h2 id="scope" className="text-section">Services in this family</h2>
            <ul className="mt-6 space-y-4">
              {f.items.map((item) => (
                <li key={item.name} className="card flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div>
                    <h3 className="text-card text-brand-ink">{item.name}</h3>
                    <p className="mt-1 text-support text-neutral-text">{item.summary}</p>
                  </div>
                  <Link
                    href={`/contact?subject=${item.subject}`}
                    className="inline-flex min-h-11 shrink-0 items-center font-semibold text-brand-deep hover:underline"
                  >
                    Enquire<span className="sr-only"> about {item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {f.note && (
            <aside aria-label="Important information" className="rounded-lg border border-warning/40 bg-white p-5 text-support text-neutral-text">
              <p className="font-semibold text-brand-ink">Please note</p>
              <p className="mt-1">{f.note}</p>
            </aside>
          )}

          <p className="text-support text-neutral-muted">
            The scope of each assignment is agreed with you before work begins, taking account of the brief, available capacity, and applicable legal, technical, and professional requirements.
          </p>
        </div>

        <aside className="space-y-6 lg:col-span-5">
          <div className="card overflow-hidden">
            {f.illustration ? (
              <figure>
                <Image
                  src={f.illustration.src}
                  alt={f.illustration.alt}
                  width={1200}
                  height={800}
                  className="aspect-[3/2] w-full object-cover"
                  sizes="(min-width: 1024px) 40vw, 100vw"
                />
                <figcaption className="px-5 py-3 text-[0.8125rem] text-neutral-muted">Illustrative image. Not a photograph of an Albarka project.</figcaption>
              </figure>
            ) : (
              <div className="flex aspect-[3/2] items-center justify-center bg-neutral-alt text-brand-deep" aria-hidden="true">
                <ServiceIcon name={f.icon} />
              </div>
            )}
          </div>
          <div className="card space-y-3 p-6">
            <h2 className="text-card text-brand-ink">Start an enquiry</h2>
            <p className="text-support text-neutral-text">Subject: {SUBJECT_LABELS[f.subject] ?? f.title}</p>
            <Link href={`/contact?subject=${f.subject}`} className="btn-primary w-full">
              Enquire about this service
            </Link>
            <p className="text-support text-neutral-muted">We serve clients nationwide, subject to the requirements and capacity of individual assignments.</p>
          </div>
          <div className="card p-6">
            <h2 className="text-card text-brand-ink">Other service families</h2>
            <ul className="mt-3 space-y-2">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link href={`/services/${o.slug}`} className="inline-flex min-h-9 items-center text-support font-semibold text-brand-deep hover:underline">
                    {o.letter}. {o.title}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[0.8125rem] text-neutral-muted">{COMPANY.shortName} · {index + 1} of {SERVICE_FAMILIES.length}</p>
          </div>
        </aside>
      </div>
    </>
  );
}
