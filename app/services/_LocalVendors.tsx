'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

const TYPE_EMOJI: Record<string, string> = {
  CAKE_DESIGNER: '🎂', SINGER: '🎤', PANDIT: '🪔', DECORATOR: '🌸',
  STAFF_HIRE: '🧑‍🍳', COOK: '👨‍🍳', APPLIANCE_RENTAL: '🍳',
};

type Props = {
  serviceType?: string;          // omit to list ALL verified vendors (directory mode)
  heading?: string;
  sub?: string;
  accentText?: string;           // tailwind text-color class to match the page theme
};

// Live VERIFIED service-listing vendors for a vertical, linking to their storefront.
// Renders nothing when there are no vendors, so curated/static content stays the default.
export default function LocalVendors({
  serviceType,
  heading = 'Vendors near you',
  sub = 'Browse verified local partners on BhramanKaro.',
  accentText = 'text-rose-600',
}: Props) {
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    api.browseServiceListings(serviceType ? { serviceType } : {})
      .then((v: any) => setVendors(Array.isArray(v) ? v : []))
      .catch(() => setVendors([]));
  }, [serviceType]);

  if (vendors.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
      <div className="mb-6">
        <p className={`text-xs font-semibold tracking-[0.25em] ${accentText} uppercase mb-2`}>Verified local partners</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{heading}</h2>
        <p className="text-sm text-gray-500 mt-1">{sub}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {vendors.map(v => (
          <Link
            key={v.id}
            href={`/services/storefront/${v.vendorSlug}`}
            className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-rose-200 transition-all"
          >
            <div className="aspect-[16/10] overflow-hidden bg-gray-100">
              {v.heroImageUrl
                ? <img src={v.heroImageUrl} alt={v.businessName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                : <div className="w-full h-full flex items-center justify-center text-5xl">{TYPE_EMOJI[v.serviceType] ?? '🏷️'}</div>}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-gray-900 truncate">{v.businessName}</p>
                {v.trustTier && v.trustTier !== 'LISTED' && (
                  <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    {v.trustTier === 'TOP_RATED' ? '★ Top Rated' : '✓ Verified'}
                  </span>
                )}
              </div>
              {v.tagline && <p className="text-xs text-gray-500 mt-0.5 truncate">{v.tagline}</p>}
              <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-500">
                {!serviceType && v.serviceType && <span>{TYPE_EMOJI[v.serviceType] ?? '🏷️'}</span>}
                {v.homeCity && <span>📍 {v.homeCity}</span>}
                {v.ratingCount > 0 && <span className="text-amber-600 font-semibold">★ {Number(v.avgRating).toFixed(1)} ({v.ratingCount})</span>}
              </div>
              <span className={`inline-block mt-3 text-xs font-bold ${accentText} opacity-0 group-hover:opacity-100 transition`}>View storefront →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
