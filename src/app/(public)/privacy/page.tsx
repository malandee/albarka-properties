import type { Metadata } from 'next';
import { COMPANY } from '@/config/company';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = { title: 'Privacy Policy', description: 'How Albarka Properties Consultant Ltd handles personal information.', alternates: { canonical: '/privacy' } };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="Privacy Policy" breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]} intro="This notice explains what information this website collects and how it is used." />
      <article className="prose-width mx-auto space-y-5 px-5 py-14 text-body text-neutral-text md:px-8">
        <h2 className="text-card text-brand-ink">Information we collect</h2>
        <p>When you send an enquiry through our Contact page we collect your name, your email address or phone number, the subject you choose, your message, and, where relevant, the property you are asking about. Administrators sign in with an email address and password.</p>
        <h2 className="text-card text-brand-ink">How we use it</h2>
        <p>We use enquiry information only to respond to you about the matter you raised. We do not sell personal information. Administrator accounts are used to manage property listings and are recorded in an activity log.</p>
        <h2 className="text-card text-brand-ink">Technical information</h2>
        <p>Our servers keep a pseudonymous fingerprint of the requesting network address for security and rate-limiting. Raw addresses are not stored in audit records. Session cookies are used only to keep administrators signed in; this website does not use advertising cookies.</p>
        <h2 className="text-card text-brand-ink">Your choices</h2>
        <p>You may ask us to correct or delete an enquiry you have sent by contacting us at {COMPANY.email}.</p>
        <h2 className="text-card text-brand-ink">Contact</h2>
        <p>{COMPANY.legalName}, {COMPANY.address.full} Email: {COMPANY.email}</p>
        <p className="text-support text-neutral-muted">This template reflects the current site behaviour. Have the final text reviewed by the company’s legal adviser before publication.</p>
      </article>
    </>
  );
}
