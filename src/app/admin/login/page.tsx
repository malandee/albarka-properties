import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/session';
import { safeNextPath } from '@/lib/auth/guards';
import { Logo } from '@/components/brand/Logo';
import { LoginForm } from '@/components/admin/LoginForm';
import { COMPANY } from '@/config/company';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; notice?: string }> }) {
  const sp = await searchParams;
  const existing = await getCurrentSession();
  if (existing) redirect(safeNextPath(sp.next));
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center bg-neutral-bg px-5 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <Logo variant="auth" priority />
          <h1 className="text-page">Sign in</h1>
          <p className="text-support text-neutral-muted">Albarka Properties administration. Authorised administrators only.</p>
        </div>
        <div className="card p-6 md:p-8">
          <LoginForm next={safeNextPath(sp.next)} notice={sp.notice} />
        </div>
        <p className="text-center text-[0.8125rem] text-neutral-muted">
          {COMPANY.displayName}. Need access? Ask a Super Admin to create your account.
        </p>
      </div>
    </main>
  );
}
