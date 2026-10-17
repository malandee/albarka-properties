import Link from 'next/link';
import { COMPANY } from '@/config/company';
import { Logo } from '@/components/brand/Logo';
import { MobileNav } from './MobileNav';
import { NavLinks } from './NavLinks';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex h-[72px] max-w-content items-center justify-between gap-4 px-5 md:px-8">
        <Link href="/" className="flex shrink-0 items-center rounded-md" aria-label={`${COMPANY.displayName}, home`}>
          <Logo variant="header" decorative />
          <span className="sr-only">{COMPANY.displayName}</span>
        </Link>
        <nav aria-label="Primary" className="hidden xl:block">
          <NavLinks />
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/contact" className="btn-primary hidden md:inline-flex">
            Contact Us
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
