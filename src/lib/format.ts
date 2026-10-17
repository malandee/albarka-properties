export function formatPrice(amount: string | number | null, currency = 'NGN', priceOnRequest = false): string {
  if (priceOnRequest || amount === null) return 'Contact for price';
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(n)) return 'Contact for price';
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}

export function formatSqm(value: string | number | null): string | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n) || n <= 0) return null;
  return `${new Intl.NumberFormat('en-NG', { maximumFractionDigits: 2 }).format(n)} sqm`;
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

export function purposeLabel(p: 'FOR_SALE' | 'FOR_RENT'): string {
  return p === 'FOR_SALE' ? 'For Sale' : 'For Rent';
}

export function locationLine(p: { area?: string | null; city: string; state: string }): string {
  return [p.area, p.city, p.state].filter(Boolean).join(', ');
}
