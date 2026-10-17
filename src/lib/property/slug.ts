/**
 * Lowercase, ASCII-only, hyphen-separated slug. Non-ASCII letters are removed rather than
 * transliterated so the output is predictable. Length is capped for stable URLs.
 */
export function slugify(input: string, maxLength = 90): string {
  const base = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');
  return base || 'property';
}

/** Slug with a short random suffix; uniqueness is still enforced by the database. */
export function buildPropertySlug(title: string, suffix: string): string {
  return `${slugify(title)}-${suffix.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6).padEnd(6, '0')}`;
}

/** True for values that look like an internal id (cuid) rather than a public slug. */
export function looksLikeId(value: string): boolean {
  return /^c[a-z0-9]{20,30}$/.test(value);
}
