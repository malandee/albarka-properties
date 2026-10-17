'use client';

import { useEffect, useId, useRef } from 'react';
import { Button } from './Button';

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Accessible confirmation dialog. Focus starts on Cancel (the safe choice), Escape cancels,
 * Tab stays inside the dialog, and focus returns to the element that opened it.
 * The action runs only when the user presses the confirm button.
 */
export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel = 'Cancel', destructive = false, busy = false, onConfirm, onCancel }: Props) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const cancelHandler = useRef(onCancel);
  cancelHandler.current = onCancel;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) {
        e.preventDefault();
        cancelHandler.current();
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])'));
        if (!items.length) return;
        const first = items[0]!;
        const last = items[items.length - 1]!;
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
      opener?.focus?.();
    };
  }, [open, busy]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-ink/50 p-4 sm:items-center">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-raised"
      >
        <h2 id={titleId} className="text-card text-brand-ink">
          {title}
        </h2>
        <p id={descId} className="mt-2 text-support text-neutral-text">
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy} className="btn-secondary">
            {cancelLabel}
          </button>
          <Button variant={destructive ? 'danger' : 'primary'} loading={busy} loadingLabel="Working…" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
