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
          <footer className="bg-[#F5F5F5] border-t mt-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-6">
              {/* Footer columns */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 text-sm">
                {/* Support */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Support</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li><a href="/dashboard/bookings" className="hover:text-[#003B95] transition">Manage your trips</a></li>
                    <li><a href="mailto:support@ysafar.com" className="hover:text-[#003B95] transition">Contact Customer Service</a></li>
                    <li><a href="/safety" className="hover:text-[#003B95] transition">Safety Resource Center</a></li>
                    <li><a href="/help" className="hover:text-[#003B95] transition">Help Center</a></li>
                  </ul>
                </div>
                {/* Discover */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Discover</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li><a href="/nomad" className="hover:text-[#003B95] transition">Nomad Prime Loyalty</a></li>
                    <li><a href="/search" className="hover:text-[#003B95] transition">Seasonal & holiday deals</a></li>
                    <li><a href="/experiences" className="hover:text-[#003B95] transition">Experiences</a></li>
                    <li><a href="/cooks" className="hover:text-[#003B95] transition">Cooks & Chefs</a></li>
                    <li><a href="/buy" className="hover:text-[#003B95] transition">Buy Property</a></li>
                    <li><a href="/projects" className="hover:text-[#003B95] transition">New Projects</a></li>
                  </ul>
                </div>
                {/* Terms and settings */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Terms & Settings</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li><a href="/privacy" className="hover:text-[#003B95] transition">Privacy Notice</a></li>
                    <li><a href="/terms" className="hover:text-[#003B95] transition">Terms of Service</a></li>
                    <li><a href="/accessibility" className="hover:text-[#003B95] transition">Accessibility</a></li>
                    <li><a href="/grievance" className="hover:text-[#003B95] transition">Grievance Officer</a></li>
                  </ul>
                </div>
                {/* Partners */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Partners</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li><a href="/host" className="hover:text-[#003B95] transition">List your property</a></li>
                    <li><a href="/host" className="hover:text-[#003B95] transition">Host dashboard</a></li>
                    <li><a href="/broker" className="hover:text-[#003B95] transition">Become a broker</a></li>
                    <li><a href="/services" className="hover:text-[#003B95] transition">Value-added Services</a></li>
                    <li><a href="/aashray" className="hover:text-[#003B95] transition">Aashray (NGO stays)</a></li>
                  </ul>
                </div>
                {/* About */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">About</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li><a href="/about" className="hover:text-[#003B95] transition">About Safar</a></li>
                    <li><a href="/how-we-work" className="hover:text-[#003B95] transition">How We Work</a></li>
                    <li><a href="/sustainability" className="hover:text-[#003B95] transition">Sustainability</a></li>
                    <li><a href="/careers" className="hover:text-[#003B95] transition">Careers</a></li>
                    <li><a href="/press" className="hover:text-[#003B95] transition">Press Center</a></li>
                  </ul>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="mt-10 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-[#003B95]">Safar</span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-500">Zero commission platform</span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-400">
                    <span className="text-xs px-2 py-1 border border-gray-300 rounded font-medium text-gray-600">INR &#8377;</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center mt-4">
                  Safar is India's zero-commission property rental marketplace. Hosts keep 100% of earnings.
                </p>
                <p className="text-xs text-gray-400 text-center mt-1">
                  &copy; {new Date().getFullYear()} Safar India Pvt. Ltd. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
