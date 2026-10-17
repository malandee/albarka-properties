import { COMPANY } from '@/config/company';

type Variant = 'header' | 'footer' | 'auth' | 'sidebar';

const SIZES: Record<Variant, string> = {
  // Heights in CSS px. Width follows the artwork's aspect ratio (640 x 571), so nothing is stretched.
  header: 'h-12 w-auto sm:h-14',
  footer: 'h-16 w-auto',
  auth: 'h-24 w-auto',
  sidebar: 'h-10 w-auto',
};

/**
 * The official logo, served as the optimised transparent PNG/WebP derived from the supplied file.
 * The artwork is never recoloured, cropped further, or stretched. Use `decorative` only when the
 * company name is already announced next to the logo.
 */
export function Logo({ variant = 'header', decorative = false, priority = false }: { variant?: Variant; decorative?: boolean; priority?: boolean }) {
  return (
    <picture>
      <source type="image/webp" srcSet={COMPANY.logo.srcWebp} />
      <img
        src={COMPANY.logo.src}
        width={COMPANY.logo.width}
        height={COMPANY.logo.height}
        alt={decorative ? '' : COMPANY.logo.alt}
        className={SIZES[variant]}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    </picture>
  );
}
