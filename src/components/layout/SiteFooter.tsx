import Link from 'next/link';
import { COMPANY } from '@/config/company';
import { SERVICE_FAMILIES } from '@/config/services';
import { Logo } from '@/components/brand/Logo';
import { SocialLinks } from '@/components/brand/SocialLinks';
import { formatPhone, publicPhones, telHref, type PublicContact } from '@/lib/contact/rules';
import { PRIMARY_NAV } from './navigation';

const linkClass = 'inline-flex min-h-9 items-center text-support text-neutral-text hover:text-brand-deep';

export function SiteFooter({ contact }: { contact: PublicContact }) {
  const year = new Date().getFullYear();
  const phones = publicPhones(contact);
  return (
    <footer className="mt-20 border-t border-neutral-border bg-white">
      <div className="mx-auto grid max-w-content gap-10 px-5 py-12 md:grid-cols-2 md:px-8 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo variant="footer" />
          <p className="max-w-prose text-support text-neutral-text">{COMPANY.introduction}</p>
          <p className="text-support font-semibold text-brand-charcoal">{COMPANY.motto}</p>
        </div>

        <nav aria-label="Footer">
          <h2 className="text-card text-brand-ink">Explore</h2>
          <ul className="mt-3 space-y-1">
            {PRIMARY_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/privacy" className={linkClass}>
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className={linkClass}>
                Terms of Use
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-card text-brand-ink">Services</h2>
          <ul className="mt-3 space-y-1">
            {SERVICE_FAMILIES.map((f) => (
              <li key={f.slug}>
                <Link href={`/services/${f.slug}`} className={linkClass}>
                  {f.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-card text-brand-ink">Contact</h2>
          <address className="space-y-2 text-support not-italic text-neutral-text">
            <p>{contact.address}</p>
            {phones.length > 0 && (
              <p>
                {phones.map((p, i) => (
                  <span key={p.tel}>
                    {i > 0 && <span aria-hidden="true"> · </span>}
                    <a href={telHref(p.tel)} className="font-semibold text-brand-deep hover:underline">
                      {formatPhone(p.tel)}
                    </a>
                  </span>
                ))}
              </p>
            )}
            <p>
              <a href={`mailto:${contact.email}`} className="break-all font-semibold text-brand-deep hover:underline">
                {contact.email}
              </a>
            </p>
          </address>
          <SocialLinks />
        </div>
      </div>
      <div className="border-t border-neutral-border">
        <div className="mx-auto flex max-w-content flex-col gap-2 px-5 py-5 text-support text-neutral-muted md:flex-row md:items-center md:justify-between md:px-8">
          <p>
            © {year} {COMPANY.legalName} CAC {COMPANY.cacRegistration}. All rights reserved.
          </p>
          <p>{COMPANY.coverage}</p>
        </div>
      </div>
    </footer>
  );
}
