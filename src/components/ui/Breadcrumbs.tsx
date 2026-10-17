import Link from 'next/link';

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-support text-neutral-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && (
              <span aria-hidden="true" className="text-neutral-border">
                /
              </span>
            )}
            {item.href && i < items.length - 1 ? (
              <Link href={item.href} className="hover:text-brand-deep hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current={i === items.length - 1 ? 'page' : undefined} className="text-neutral-text">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
