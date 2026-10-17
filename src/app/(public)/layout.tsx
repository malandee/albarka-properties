import { PublicShell } from '@/components/layout/PublicShell';
import { COMPANY } from '@/config/company';
import { getEnv } from '@/lib/env';
import { getPublicContact } from '@/lib/contact/public-contact';
import { publicPhones } from '@/lib/contact/rules';

/**
 * Public pages are rendered per request. They read the database (contact details, featured listings),
 * which is not available while a host such as Amplify builds the site. Rendering at request time
 * also means Settings changes show immediately.
 */
export const dynamic = 'force-dynamic';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const contact = await getPublicContact();
  const base = getEnv().APP_URL.replace(/\/$/, '');
  // Organization data. Only published data is included: no hours, ratings, social profiles, or unconfirmed telephone numbers.
  const phone = publicPhones(contact)[0]?.tel;
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: COMPANY.displayName,
    legalName: COMPANY.legalName,
    url: base,
    logo: `${base}${COMPANY.logo.src}`,
    email: contact.email,
    ...(phone ? { telephone: phone } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${COMPANY.address.line1}, ${COMPANY.address.line2}`,
      addressLocality: COMPANY.address.city,
      addressRegion: COMPANY.address.state,
      addressCountry: 'NG',
    },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org).replace(/</g, '\\u003c') }} />
      <PublicShell contact={contact}>{children}</PublicShell>
    </>
  );
}
