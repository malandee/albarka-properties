import Link from 'next/link';
import type { Role } from '@/lib/auth/policy';

export interface NavItem {
  href: string;
  label: string;
}

export function navFor(role: Role): NavItem[] {
  const common: NavItem[] = [{ href: '/admin', label: 'Dashboard' }];
  if (role === 'SUPER_ADMIN') {
    return [
      ...common,
      { href: '/admin/properties', label: 'All properties' },
      { href: '/admin/properties/new', label: 'Add property' },
      { href: '/admin/administrators', label: 'Administrators' },
      { href: '/admin/enquiries', label: 'Enquiries' },
      { href: '/admin/activity', label: 'Activity log' },
      { href: '/admin/settings', label: 'Settings' },
      { href: '/admin/profile', label: 'My profile' },
    ];
  }
  return [
    ...common,
    { href: '/admin/properties', label: 'My properties' },
    { href: '/admin/properties/new', label: 'Add property' },
    { href: '/admin/profile', label: 'My profile' },
  ];
}

/** Sidebar on large screens; a disclosure menu on small screens (no horizontal scrolling). */
export function AdminNav({ role, currentPath }: { role: Role; currentPath: string }) {
  const items = navFor(role);
  const isActive = (href: string) => (href === '/admin' ? currentPath === '/admin' : currentPath === href || currentPath.startsWith(`${href}/`));
  return (
    <>
      <nav aria-label="Administration" className="hidden lg:block">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} className={`flex min-h-11 items-center rounded-md px-3 text-[0.9375rem] font-semibold transition-colors duration-200 ease-std ${isActive(item.href) ? 'bg-brand-deep text-white' : 'text-brand-ink hover:bg-neutral-alt'}`}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <details className="group lg:hidden">
        <summary className="btn-secondary w-full cursor-pointer list-none justify-between [&::-webkit-details-marker]:hidden">
          <span>Menu</span>
          <span aria-hidden="true" className="transition-transform duration-200 group-open:rotate-180">▾</span>
        </summary>
        <nav aria-label="Administration" className="mt-2 rounded-lg border border-neutral-border bg-white p-2">
          <ul>
            {items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} className={`flex min-h-11 items-center rounded-md px-3 font-semibold ${isActive(item.href) ? 'bg-brand-deep text-white' : 'text-brand-ink hover:bg-neutral-alt'}`}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </details>
    </>
  );
}
