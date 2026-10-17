'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PRIMARY_NAV } from './navigation';

/** Desktop navigation. Marks the current page with aria-current. */
export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-1">
      {PRIMARY_NAV.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              onClick={onNavigate}
              className={`inline-flex min-h-11 items-center rounded-md px-3 text-[0.9375rem] font-semibold transition-colors duration-200 ease-std ${
                active ? 'text-brand-deep' : 'text-neutral-text hover:text-brand-deep'
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
