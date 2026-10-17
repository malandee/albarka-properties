import type { Metadata } from 'next';
import { COMPANY } from '@/config/company';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = { title: 'Terms of Use', description: 'Terms for using the Albarka Properties website.', alternates: { canonical: '/terms' } };

export default function TermsPage() {
  return (
    <>
      <PageHeader title="Terms of Use" breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Terms of Use' }]} intro="Please read these terms before using this website." />
      <article className="prose-width mx-auto space-y-5 px-5 py-14 text-body text-neutral-text md:px-8">
        <h2 className="text-card text-brand-ink">Information on this website</h2>
        <p>Property information is provided for general guidance. Availability, price, and specifications can change. Please confirm details with {COMPANY.legalName} before making any decision or payment.</p>
        <h2 className="text-card text-brand-ink">Demonstration listings</h2>
        <p>Listings marked “Demonstration listing” are sample content used for testing and presentation. They are not offers for sale or rent and do not represent real company inventory.</p>
        <h2 className="text-card text-brand-ink">Images</h2>
        <p>Photographs shown on the site are either company-supplied or illustrative. Illustrative images are not photographs of a specific property.</p>
        <h2 className="text-card text-brand-ink">Enquiries</h2>
        <p>Submitting an enquiry does not create a contract. We will confirm receipt on the website and respond using the contact details you provide.</p>
        <h2 className="text-card text-brand-ink">Limitation</h2>
        <p>To the extent permitted by law, we are not liable for decisions made from information on this site without confirming it with us.</p>
      </article>
    </>
  );
}
