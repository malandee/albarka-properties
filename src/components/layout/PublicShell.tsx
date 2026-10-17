import { defaultPublicContact, type PublicContact } from '@/lib/contact/rules';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import { WhatsAppFab } from './WhatsAppFab';

/**
 * Public page frame. `contact` comes from the server (Settings overrides, then defaults).
 * Error and not-found pages pass nothing and get the defaults, so they still render if the database is unavailable.
 */
export function PublicShell({
  children,
  showWhatsApp = true,
  contact = defaultPublicContact(),
}: {
  children: React.ReactNode;
  showWhatsApp?: boolean;
  contact?: PublicContact;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:shadow-raised">
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter contact={contact} />
      {showWhatsApp && <WhatsAppFab contact={contact} />}
    </div>
  );
}
