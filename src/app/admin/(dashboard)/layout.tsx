import { headers } from 'next/headers';
import Link from 'next/link';
import { requirePageSession } from '@/lib/auth/guards';
import { Logo } from '@/components/brand/Logo';
import { AdminNav } from '@/components/admin/AdminNav';
import { SignOutButton } from '@/components/admin/SignOutButton';
import { COMPANY } from '@/config/company';

export const dynamic = 'force-dynamic';

/**
 * Every admin page is rendered only after the session is verified on the server.
 * Visitors without a valid session are redirected to sign in.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const currentPath = h.get('x-pathname') ?? '/admin';
  const session = await requirePageSession(currentPath);
  const roleLabel = session.actor.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin';

  return (
    <div className="min-h-dvh bg-neutral-bg">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <div className="grid lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-neutral-border bg-white lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="flex flex-col gap-6 p-5">
            <Link href="/admin" className="flex items-center gap-3" aria-label={`${COMPANY.shortName} administration, dashboard`}>
              <Logo variant="sidebar" decorative />
              <span className="text-support font-semibold text-brand-ink">Administration</span>
            </Link>
            <AdminNav role={session.actor.role} currentPath={currentPath} />
          </div>
        </aside>
        <div className="min-w-0">
          <header className="flex items-center justify-between gap-4 border-b border-neutral-border bg-white px-5 py-3 md:px-8">
            <div className="min-w-0">
              <p className="truncate text-support font-semibold text-brand-ink">{session.actor.name}</p>
              <p className="text-[0.8125rem] text-neutral-muted">{roleLabel}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="hidden text-support font-semibold text-brand-deep hover:underline sm:inline">
                View website
              </Link>
              <SignOutButton />
            </div>
          </header>
          <main id="admin-main" className="px-5 py-8 md:px-8 md:py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
