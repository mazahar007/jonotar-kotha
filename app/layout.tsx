import type { Metadata, Viewport } from 'next';
import Sidebar from '@/components/Sidebar';
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
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#fdf8f1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SwRegister />
        <BadgeToast />
        {/* Mobile (<lg): the original phone-width column, unchanged.
            Desktop (lg+): sidebar + wide content column (max-w-7xl). */}
        <div className="mx-auto flex min-h-dvh w-full max-w-md bg-cream shadow-[0_0_40px_rgba(0,0,0,0.06)] lg:max-w-none lg:shadow-none">
          <Sidebar />
          <div className="mx-auto w-full min-w-0 max-w-md flex-1 lg:max-w-7xl">{children}</div>
        </div>
      </body>
    </html>
  );
}
