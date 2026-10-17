import { whatsappHref, type PublicContact } from '@/lib/contact/rules';

/**
 * Persistent WhatsApp action. Renders nothing unless a verified WhatsApp number is configured.
 * Sits above the page content and never covers form submit buttons on small screens.
 */
export function WhatsAppFab({
  contact,
  message = 'Hello Albarka Properties, I would like to make an enquiry.',
}: {
  contact: PublicContact;
  message?: string;
}) {
  const href = whatsappHref(contact, message);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Albarka Properties on WhatsApp (opens in a new tab)"
      className="fixed bottom-4 right-4 z-30 inline-flex h-12 items-center gap-2 rounded-full bg-[#1E7A4C] px-4 text-support font-semibold text-white shadow-raised transition-colors duration-200 ease-std hover:bg-[#17633D] focus-visible:ring-offset-2 md:bottom-6 md:right-6"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4.3-.4c.1-.1.1-.3 0-.5l-.7-1.8c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2s.9 2.6 1 2.8c.1.2 1.8 2.8 4.4 3.9 2.6 1 2.6.7 3.1.7.5 0 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z" />
      </svg>
      <span className="hidden sm:inline">WhatsApp us</span>
      <span className="sr-only sm:hidden">WhatsApp</span>
    </a>
  );
}
