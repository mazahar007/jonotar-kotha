import type { Metadata, Viewport } from 'next';
import BadgeToast from '@/components/BadgeToast';
import { SwRegister } from '@/components/PwaClient';
import './globals.css';

export const metadata: Metadata = {
  title: 'জনতার কথা — ময়মনসিংহ',
  description: 'নাগরিক নিরাপত্তা ও সমস্যা রিপোর্টিং অ্যাপ — ময়মনসিংহ',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'জনতার কথা',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#161D2E',
};

/**
 * Phase 21 — pre-paint theme bootstrap: reads the saved theme (jk-theme,
 * default dark) and sets .dark on <html> BEFORE first paint, so there is
 * no flash of the wrong theme. suppressHydrationWarning on <html> because
 * the class is applied before React hydrates.
 */
const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem('jk-theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>
        <SwRegister />
        <BadgeToast />
        {/* Phase 21d — desktop sidebar removed; its nav moved into the
            floating header pill. Mobile (<lg): the original phone-width
            column, unchanged. Desktop (lg+): wide content column. */}
        <div className="mx-auto min-h-dvh w-full max-w-md bg-cream shadow-[0_0_40px_rgba(0,0,0,0.06)] lg:max-w-none lg:shadow-none">
          <div className="mx-auto w-full min-w-0 max-w-md flex-1 lg:max-w-7xl">{children}</div>
        </div>
      </body>
    </html>
  );
}
