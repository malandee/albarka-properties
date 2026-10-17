'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { PRIMARY_NAV } from './navigation';

/**
 * Accessible mobile navigation drawer.
 * - Toggle button reports aria-expanded and names the action it performs.
 * - Escape closes the drawer and returns focus to the toggle.
 * - Focus moves into the drawer on open and stays within it (Tab wraps).
 * - Body scrolling is locked while open.
 * - Navigating to a link closes the drawer.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close after navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const first = drawerRef.current?.querySelector<HTMLElement>('a, button');
    first?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = Array.from(drawerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
        if (focusables.length === 0) return;
        const firstEl = focusables[0]!;
        const lastEl = focusables[focusables.length - 1]!;
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="xl:hidden">
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        className="inline-flex h-11 min-w-11 items-center justify-center rounded-md border border-neutral-border bg-white text-brand-ink"
      >
        <span className="sr-only">{open ? 'Close main menu' : 'Open main menu'}</span>
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? (
            <>
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </>
          ) : (
            <>
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 top-[72px] z-50 bg-brand-ink/40" onClick={() => setOpen(false)} aria-hidden="true" />
      )}
      <div
        id="mobile-navigation"
        ref={drawerRef}
        hidden={!open}
        className="fixed inset-x-0 top-[72px] z-50 max-h-[calc(100dvh-72px)] overflow-y-auto border-b border-neutral-border bg-white shadow-raised"
      >
        <nav aria-label="Mobile" className="mx-auto max-w-content px-5 py-4">
          <ul className="flex flex-col">
            {PRIMARY_NAV.map((item) => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <li key={item.href} className="border-b border-neutral-border last:border-b-0">
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-12 items-center justify-between py-3 text-[1.0625rem] font-semibold ${active ? 'text-brand-deep' : 'text-neutral-text'}`}
                  >
                    {item.label}
                    <span aria-hidden="true" className="text-neutral-muted">→</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link href="/contact" className="btn-primary mt-4 w-full">
            Contact Us
          </Link>
        </nav>
      </div>
    </div>
  );
}
