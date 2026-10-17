import Link from 'next/link';

/** Page navigation that keeps every current filter by rebuilding the query string. */
export function Pagination({ basePath, params, page, pageCount }: { basePath: string; params: Record<string, string>; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams(params);
    if (p <= 1) sp.delete('page');
    else sp.set('page', String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const pages: (number | 'gap')[] = [];
  const window = 2;
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || (i >= page - window && i <= page + window)) pages.push(i);
    else if (pages[pages.length - 1] !== 'gap') pages.push('gap');
  }
  const linkBase = 'inline-flex h-11 min-w-11 items-center justify-center rounded-md border px-3 text-support font-semibold';
  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={`${linkBase} border-neutral-border bg-white text-brand-ink hover:border-brand-deep`}>
          Previous
        </Link>
      ) : (
        <span aria-disabled="true" className={`${linkBase} border-neutral-border bg-neutral-alt text-neutral-muted`}>Previous</span>
      )}
      <ol className="flex flex-wrap items-center gap-2">
        {pages.map((p, i) =>
          p === 'gap' ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-neutral-muted">…</li>
          ) : (
            <li key={p}>
              <Link
                href={href(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Page ${p}`}
                className={`${linkBase} ${p === page ? 'border-brand-deep bg-brand-deep text-white' : 'border-neutral-border bg-white text-brand-ink hover:border-brand-deep'}`}
              >
                {p}
              </Link>
            </li>
          ),
        )}
      </ol>
      {page < pageCount ? (
        <Link href={href(page + 1)} rel="next" className={`${linkBase} border-neutral-border bg-white text-brand-ink hover:border-brand-deep`}>
          Next
        </Link>
      ) : (
        <span aria-disabled="true" className={`${linkBase} border-neutral-border bg-neutral-alt text-neutral-muted`}>Next</span>
      )}
    </nav>
  );
}
