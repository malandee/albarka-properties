'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { PublicShell } from '@/components/layout/PublicShell';
import { Button } from '@/components/ui/Button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Logged in the browser only. Server-side details stay on the server.
    console.error('[app-error]', error.digest ?? 'unknown');
  }, [error]);
  return (
    <PublicShell showWhatsApp={false}>
      <div className="mx-auto flex max-w-content flex-col items-start gap-6 px-5 py-24 md:px-8">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="text-page">This page could not be displayed</h1>
        <p className="max-w-prose text-body text-neutral-text">Please try again. If the problem continues, contact us and we will look into it.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={reset}>Try again</Button>
          <Link href="/" className="btn-secondary">
            Back to the home page
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
