import type { Metadata } from 'next';
import { Logo } from '@/components/brand/Logo';
import { SetPasswordForm } from '@/components/admin/SetPasswordForm';

export const metadata: Metadata = { title: 'Set your password', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center bg-neutral-bg px-5 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <Logo variant="auth" priority />
          <h1 className="text-page">Set your password</h1>
        </div>
        <div className="card p-6 md:p-8">
          {token && /^[A-Za-z0-9_-]{20,200}$/.test(token) ? (
            <SetPasswordForm token={token} />
          ) : (
            <div role="alert" className="space-y-3 text-support text-neutral-text">
              <p className="font-semibold text-danger">This link is not valid.</p>
              <p>Ask a Super Admin for a new setup or reset link.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
