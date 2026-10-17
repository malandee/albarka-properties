import { COMPANY } from '@/config/company';

/** Icons are inline SVG glyphs. Each entry links only to a profile the company supplied. */
const ICONS: Record<string, React.ReactNode> = {
  facebook: (
    <path d="M13.5 21v-7h2.4l.4-2.9h-2.8V9.3c0-.8.3-1.4 1.4-1.4h1.5V5.3c-.3 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6v2.3H8.1V14h2.3v7h3.1z" />
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.8" cy="7.2" r="1.1" />
    </>
  ),
  tiktok: (
    <path d="M14.5 3h2.6c.2 2.2 1.6 3.9 3.9 4.1v2.7c-1.5 0-2.8-.5-3.9-1.3v5.8c0 3-2.4 5.2-5.3 5.2S6.5 17.3 6.5 14.4s2.3-5.2 5.2-5.2c.2 0 .4 0 .6.1v2.8c-.2-.1-.4-.1-.6-.1-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.7-1.1 2.7-2.6z" />
  ),
  x: (
    <path d="M4 4h4.6l3.5 4.9L16.2 4H19l-5.9 6.8L20 20h-4.6l-3.9-5.4L7.1 20H4.3l6.3-7.2zM7.2 5.6 16.8 18.4h1.5L8.7 5.6z" />
  ),
};

export function SocialLinks({ className = '', tone = 'light' }: { className?: string; tone?: 'light' | 'dark' }) {
  const color = tone === 'dark' ? 'text-white hover:text-white' : 'text-brand-deep hover:text-brand-charcoal';
  return (
    <ul className={`flex flex-wrap items-center gap-3 ${className}`} aria-label="Official social media profiles">
      {COMPANY.socials.map((s) => (
        <li key={s.id}>
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${COMPANY.shortName} on ${s.label} (opens in a new tab)`}
            className={`inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-md border px-3 text-support font-semibold transition-colors duration-200 ease-std ${tone === 'dark' ? 'border-white/25 hover:border-white' : 'border-neutral-border bg-white hover:border-brand-deep'} ${color}`}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill={s.id === 'instagram' || s.id === 'tiktok' || s.id === 'x' ? 'none' : 'currentColor'} stroke={s.id === 'instagram' ? 'currentColor' : 'none'}>
              {ICONS[s.id === 'x' ? 'x' : s.id]}
            </svg>
            <span>{s.label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
