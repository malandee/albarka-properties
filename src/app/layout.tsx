import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { ToastProvider } from '@/components/ui/Toast';
import { COMPANY } from '@/config/company';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? 'http://localhost:3000'),
  title: {
    default: `${COMPANY.displayName} | Property, Construction and Project Services in Nigeria`,
    template: `%s | ${COMPANY.shortName}`,
  },
  description: COMPANY.introduction,
  applicationName: COMPANY.shortName,
  icons: { icon: '/brand/albarka-logo-320.png', apple: '/brand/albarka-logo-320.png' },
  openGraph: {
    siteName: COMPANY.displayName,
    type: 'website',
    locale: 'en_NG',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#116B93',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
