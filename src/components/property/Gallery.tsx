'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { mediaUrl } from '@/lib/media/urls';

export interface GalleryImage {
  id: string;
  storageKey: string;
  alt: string;
  width: number;
  height: number;
}

/**
 * Featured image, thumbnail strip, and accessible lightbox.
 * Keyboard: ←/→ move, Escape closes. Focus moves into the dialog and returns to the trigger on close.
 * Touch: horizontal swipe moves to the next or previous image.
 * Images use the medium variant for the page and the large variant only inside the lightbox.
 */
export function Gallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<number | null>(null);
  const titleId = useId();

  const count = images.length;
  const current = images[index];

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'Tab' && dialogRef.current) {
        const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])'));
        const first = items[0];
        const last = items[items.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
      triggerRef.current?.focus();
    };
  }, [open, go]);

  if (count === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-neutral-alt text-support text-neutral-muted">
        No photographs have been added to this listing yet.
      </div>
    );
  }

  const isBroken = (img: GalleryImage) => failed[img.id];

  return (
    <div className="space-y-3">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block aspect-[4/3] w-full overflow-hidden rounded-lg bg-neutral-alt focus-visible:ring-offset-0"
        aria-label={`Open photo ${index + 1} of ${count} in the full-screen viewer`}
      >
        {current && !isBroken(current) ? (
          <>
            {!loaded[current.id] && <div className="skeleton absolute inset-0" aria-hidden="true" />}
            <img
              src={mediaUrl(current.storageKey, 'sm')}
              alt={current.alt}
              width={640}
              height={480}
              decoding="async"
              fetchPriority="high"
              onLoad={() => setLoaded((l) => ({ ...l, [current.id]: true }))}
              onError={() => setFailed((f) => ({ ...f, [current.id]: true }))}
              className="h-full w-full object-cover"
            />
          </>
        ) : (
          <span className="flex h-full w-full items-center justify-center p-6 text-center text-support text-neutral-muted">
            This photograph could not be loaded. Try another image below.
          </span>
        )}
        <span className="absolute bottom-3 right-3 rounded-md bg-white/95 px-2.5 py-1 text-support font-semibold text-brand-ink">
          {index + 1} / {count} · View full screen
        </span>
      </button>

      {count > 1 && (
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6" aria-label="Gallery thumbnails">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}: ${img.alt}`}
                aria-current={i === index ? 'true' : undefined}
                className={`relative aspect-[4/3] w-full overflow-hidden rounded-md border-2 bg-neutral-alt transition-colors duration-200 ease-std ${i === index ? 'border-brand-deep' : 'border-transparent hover:border-neutral-border'}`}
              >
                {!isBroken(img) ? (
                  <img
                    src={mediaUrl(img.storageKey, 'sm')}
                    alt=""
                    width={160}
                    height={120}
                    loading="lazy"
                    decoding="async"
                    onError={() => setFailed((f) => ({ ...f, [img.id]: true }))}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[0.7rem] text-neutral-muted">Unavailable</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && current && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-[70] flex flex-col bg-brand-ink/95 text-white"
          onTouchStart={(e) => (touchStart.current = e.touches[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            const start = touchStart.current;
            const end = e.changedTouches[0]?.clientX ?? null;
            touchStart.current = null;
            if (start === null || end === null) return;
            if (Math.abs(end - start) > 50) go(end < start ? 1 : -1);
          }}
        >
          <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
            <h2 id={titleId} className="text-support font-semibold">
              {title} · {index + 1} of {count}
            </h2>
            <button ref={closeRef} type="button" onClick={() => setOpen(false)} className="inline-flex h-11 items-center gap-2 rounded-md border border-white/30 px-4 text-support font-semibold hover:border-white">
              Close<span className="sr-only"> viewer</span>
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-14 pb-4 md:px-20">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-brand-ink/60 hover:border-white md:left-6"
            >
              <span aria-hidden="true" className="text-xl">‹</span>
            </button>
            {!isBroken(current) ? (
              <img
                key={current.id}
                src={mediaUrl(current.storageKey, 'lg')}
                alt={current.alt}
                className="max-h-full max-w-full rounded-md object-contain"
                onError={() => setFailed((f) => ({ ...f, [current.id]: true }))}
              />
            ) : (
              <p className="text-support">This photograph could not be loaded.</p>
            )}
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-brand-ink/60 hover:border-white md:right-6"
            >
              <span aria-hidden="true" className="text-xl">›</span>
            </button>
          </div>
          <p className="px-4 pb-4 text-center text-support text-white/80">{current.alt}</p>
        </div>
      )}
    </div>
  );
}
