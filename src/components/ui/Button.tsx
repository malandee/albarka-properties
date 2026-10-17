'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
}

/** Button with a real loading state: disabled while busy, aria-busy set, and a visible spinner. */
export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', loading = false, loadingLabel, fullWidth, className = '', children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading && <Spinner />}
      <span>{loading && loadingLabel ? loadingLabel : children}</span>
    </button>
  );
});
