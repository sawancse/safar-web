import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import CookCartButton from '@/components/CookCartButton';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { I18nProvider } from '@/lib/i18n';

export const metadata: Metadata = {
  metadataBase: new URL('https://ysafar.com'),
  title: {
    default: 'Safar — Find Your Perfect Stay in India',
    template: '%s | Safar',
  },
  description:
    'Book homes, PGs, hotels, villas, and unique stays across India. Zero commission for hosts. Instant UPI payments. AI-powered pricing.',
  keywords: [
    'property rental india', 'homestay india', 'PG accommodation', 'airbnb alternative india',
    'hotel booking india', 'villa rental', 'co-living india', 'safar', 'ysafar',
    'budget stays india', 'furnished rooms', 'short term rental',
  ],
  authors: [{ name: 'Safar India Pvt. Ltd.' }],
  creator: 'Safar',
  publisher: 'Safar India Pvt. Ltd.',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://ysafar.com',
    siteName: 'Safar',
    title: 'Safar — Find Your Perfect Stay in India',
    description: 'Book homes, PGs, hotels, villas across India. Zero commission for hosts.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Safar — Property Rental Marketplace India',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Safar — Find Your Perfect Stay in India',
    description: 'Book homes, PGs, hotels, villas across India. Zero commission for hosts.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://ysafar.com',
  },
  verification: {
    google: 'ihAn2Blazat810vtBxw4DjN5n1qjSJxh6epX5jryCv8',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <GoogleAnalytics />
        <I18nProvider>
          <Navbar />
          <main>{children}</main>
          <CookCartButton />
          <footer className="bg-gray-50 border-t mt-16">
            <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-gray-500 text-center">
              © {new Date().getFullYear()} Safar India Pvt. Ltd. · Zero commission, 100% yours.
            </div>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
