import Link from 'next/link';
import { PublicShell } from '@/components/layout/PublicShell';

export default function NotFound() {
  return (
    <PublicShell showWhatsApp={false}>
      <div className="mx-auto flex max-w-content flex-col items-start gap-6 px-5 py-24 md:px-8">
        <p className="eyebrow">Error 404</p>
        <h1 className="text-page">We could not find that page</h1>
        <p className="max-w-prose text-body text-neutral-text">
          The page may have moved, or the listing may no longer be available. Try one of the links below.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="btn-primary">
            Go to the home page
          </Link>
          <Link href="/properties" className="btn-secondary">
            Browse properties
          </Link>
          <Link href="/contact" className="btn-ghost">
            Contact us
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
