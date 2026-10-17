'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

type Tone = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  tone: Tone;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/**
 * Notifications. Success uses a polite live region; errors use an assertive one so screen
 * readers announce failures immediately. Messages never include sensitive values.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (tone: Tone, message: string) => {
      const id = nextId.current++;
      setItems((list) => [...list.slice(-3), { id, tone, message }]);
      window.setTimeout(() => dismiss(id), tone === 'error' ? 8000 : 5000);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  );

  const errors = items.filter((t) => t.tone === 'error');
  const others = items.filter((t) => t.tone !== 'error');

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 md:left-auto md:right-6 md:items-end">
        <div role="status" aria-live="polite" className="flex w-full max-w-sm flex-col gap-2">
          {others.map((t) => (
            <ToastCard key={t.id} item={t} onDismiss={dismiss} />
          ))}
        </div>
        <div role="alert" aria-live="assertive" className="flex w-full max-w-sm flex-col gap-2">
          {errors.map((t) => (
            <ToastCard key={t.id} item={t} onDismiss={dismiss} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const accent = item.tone === 'success' ? 'border-l-success' : item.tone === 'error' ? 'border-l-danger' : 'border-l-brand-deep';
  return (
    <div className={`pointer-events-auto flex items-start gap-3 rounded-md border border-neutral-border border-l-4 bg-white px-4 py-3 text-support text-neutral-text shadow-raised ${accent}`}>
      <p className="flex-1">{item.message}</p>
      <button type="button" onClick={() => onDismiss(item.id)} className="-m-1 rounded p-1 text-neutral-muted hover:text-brand-ink">
        <span className="sr-only">Dismiss notification</span>
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
