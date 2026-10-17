import type { Metadata } from 'next';
import Link from 'next/link';
import { COMPANY } from '@/config/company';
import { db } from '@/lib/db';
import { getPublicContact } from '@/lib/contact/public-contact';
import { formatPhone, publicPhones, telHref, whatsappHref } from '@/lib/contact/rules';
import { PageHeader } from '@/components/ui/PageHeader';
import { ContactForm } from '@/components/property/ContactForm';
import { SocialLinks } from '@/components/brand/SocialLinks';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: `Contact ${COMPANY.displayName}: office address in Bauchi, email, and enquiry form.`,
  alternates: { canonical: '/contact' },
};

export const dynamic = 'force-dynamic';

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function ContactPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const contact = await getPublicContact();
  const subject = typeof sp.subject === 'string' ? sp.subject : undefined;
  const propertySlug = typeof sp.property === 'string' && /^[a-z0-9-]{3,160}$/.test(sp.property) ? sp.property : undefined;
  let propertyTitle: string | undefined;
  if (propertySlug) {
    const p = await db.property.findFirst({ where: { slug: propertySlug, visibility: 'PUBLIC' }, select: { title: true } });
    propertyTitle = p?.title;
  }
  const phones = publicPhones(contact);
  const waHref = whatsappHref(contact, 'Hello Albarka Properties, I would like to make an enquiry.');
  const mapsSearch = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`;
  const label = 'text-support font-semibold uppercase tracking-[0.06em] text-neutral-muted';

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Talk to the Albarka team"
        intro="Send an enquiry below, or use the details here. We reply using the contact details you give us."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
      />
      <div className="mx-auto grid max-w-content gap-10 px-5 py-12 md:px-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-5">
          <section aria-labelledby="direct" className="card space-y-6 p-6 md:p-8">
            <h2 id="direct" className="text-section">Direct contact</h2>

            {phones.length > 0 && (
              <div>
                <h3 className={label}>Telephone</h3>
                <ul className="mt-2 space-y-2">
                  {phones.map((p) => (
                    <li key={p.tel}>
                      <a href={telHref(p.tel)} className="inline-flex min-h-11 items-center text-body font-semibold text-brand-deep hover:underline">
                        {formatPhone(p.tel)}
                        <span className="ml-3 text-support font-normal text-neutral-muted">{p.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {waHref && (
              <div>
                <h3 className={label}>WhatsApp</h3>
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center justify-center rounded-md bg-[#1E7A4C] px-5 font-semibold text-white transition-colors duration-200 ease-std hover:bg-[#17633D]">
                  Start a WhatsApp chat<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            )}

            <div>
              <h3 className={label}>Email</h3>
              <a href={`mailto:${contact.email}`} className="mt-2 block break-all text-body font-semibold text-brand-deep hover:underline">
                {contact.email}
              </a>
            </div>

            <div>
              <h3 className={label}>Head office</h3>
              <address className="mt-2 text-body not-italic text-neutral-text">
                {COMPANY.legalName}
                <br />
                {contact.address}
              </address>
              <p className="mt-2 text-support text-neutral-muted">CAC registration number: {COMPANY.cacRegistration}</p>
              <a href={mapsSearch} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center font-semibold text-brand-deep hover:underline">
                Search for the address in Google Maps<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>

            {COMPANY.socials.length > 0 && (
              <div>
                <h3 className={label}>Follow us</h3>
                <div className="mt-3">
                  <SocialLinks />
                </div>
              </div>
            )}
          </section>

          <section aria-labelledby="coverage" className="rounded-lg bg-neutral-alt p-6">
            <h2 id="coverage" className="text-card text-brand-ink">Nationwide coverage</h2>
            <p className="mt-2 text-support text-neutral-text">{COMPANY.coverage}</p>
            <p className="mt-3 text-support">
              Looking at a specific listing? <Link href="/properties" className="font-semibold text-brand-deep hover:underline">Browse properties</Link>.
            </p>
          </section>
        </div>

        <div className="lg:col-span-7">
          <ContactForm initialSubject={subject} propertySlug={propertySlug} propertyTitle={propertyTitle} />
        </div>
      </div>
    </>
  );
}
