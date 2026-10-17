'use client';

import Link from 'next/link';
import { Button } from './Button';

export function EmptyState({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: { href: string; label: string; variant?: 'primary' | 'secondary' }[];
}) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-border bg-white px-6 py-12 text-center">
      <h2 className="text-card text-brand-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-prose text-support text-neutral-text">{description}</p>
      {actions && actions.length > 0 && (
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {actions.map((a) => (
            <Link key={a.href} href={a.href} className={a.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'}>
              {a.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Error state with a working retry. Used by route error boundaries and data panels. */
export function ErrorState({ title = 'Something went wrong', description = 'We could not load this information. Please try again.', onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-danger/30 bg-white px-6 py-10 text-center">
      <h2 className="text-card text-danger">{title}</h2>
      <p className="mx-auto mt-2 max-w-prose text-support text-neutral-text">{description}</p>
      {onRetry && (
        <div className="mt-5">
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

export function SkeletonLines({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-4 rounded" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}
