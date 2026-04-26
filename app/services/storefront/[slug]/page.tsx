'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

type Listing = {
  id: string;
  serviceType: string;
  businessName: string;
  vendorSlug: string;
  heroImageUrl?: string;
  tagline?: string;
  aboutMd?: string;
  status: string;
  homeCity?: string;
  cities?: string[];
  pricingPattern?: string;
  trustTier?: string;
  avgRating?: number;
  ratingCount?: number;
  completedBookingsCount?: number;
  cancellationPolicy?: string;
  outstationCapable?: boolean;
};

type Item = {
  id: string;
  title: string;
  heroPhotoUrl?: string;
  photos?: string[];
  descriptionMd?: string;
  basePricePaise: number;
  options?: Record<string, any>;
  occasionTags?: string[];
  leadTimeHours?: number;
  status: string;
};

const TYPE_EMOJI: Record<string, string> = {
  CAKE_DESIGNER: '🎂', SINGER: '🎤', PANDIT: '🪔', DECORATOR: '🌸',
  STAFF_HIRE: '🧑‍🍳', COOK: '👨‍🍳', APPLIANCE_RENTAL: '🍳',
};

const TRUST_BADGE: Record<string, { label: string; class: string }> = {
  LISTED:         { label: 'Listed',          class: 'bg-gray-100 text-gray-700' },
  SAFAR_VERIFIED: { label: '✓ Safar Verified', class: 'bg-blue-100 text-blue-800' },
  TOP_RATED:      { label: '★ Top Rated',      class: 'bg-amber-100 text-amber-800' },
};

export default function StorefrontPage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params?.slug ?? '');
  const [listing, setListing] = useState<Listing | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const l = await api.getServiceListingBySlug(slug);
        if (cancelled) return;
        setListing(l);
        const items = await api.getServiceListingItems(l.id).catch(() => []);
        if (!cancelled) setItems(items || []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Vendor not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500 text-sm">Loading…</div>;
  }

  if (error || !listing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Vendor not found</h1>
        <p className="text-gray-500 mb-6">{error || 'This storefront isn\'t available.'}</p>
        <Link href="/services" className="text-orange-500 hover:underline">← Back to services</Link>
      </div>
    );
  }

  const trust = TRUST_BADGE[listing.trustTier ?? 'LISTED'] ?? TRUST_BADGE.LISTED;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero */}
      {listing.heroImageUrl && (
        <div className="rounded-3xl overflow-hidden bg-gray-100 mb-6 aspect-[16/7]">
          <img src={listing.heroImageUrl} alt={listing.businessName}
            className="w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      <div className="flex items-start gap-4 mb-8 flex-wrap">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shrink-0">
          <span className="text-3xl">{TYPE_EMOJI[listing.serviceType] ?? '•'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{listing.businessName}</h1>
          {listing.tagline && <p className="text-base text-gray-600 mt-1">{listing.tagline}</p>}

          {/* Trust stack — Practo pattern */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${trust.class}`}>{trust.label}</span>
            {listing.ratingCount !== undefined && listing.ratingCount > 0 && (
              <span className="text-xs text-gray-700">★ {listing.avgRating?.toFixed(1)} ({listing.ratingCount} reviews)</span>
            )}
            {listing.completedBookingsCount !== undefined && listing.completedBookingsCount > 0 && (
              <span className="text-xs text-gray-700">· {listing.completedBookingsCount} completed bookings</span>
            )}
            {listing.homeCity && <span className="text-xs text-gray-700">· {listing.homeCity}</span>}
            {listing.outstationCapable && <span className="text-xs text-green-700">· travels outstation</span>}
          </div>
        </div>
      </div>

      {/* About */}
      {listing.aboutMd && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-2">About</h2>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{listing.aboutMd}</p>
        </section>
      )}

      {/* Items grid (Etsy shop pattern) */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {items.length > 0 ? `What ${listing.businessName} offers` : 'Direct booking'}
        </h2>

        {items.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
            <p className="text-sm text-gray-600 mb-3">
              {listing.businessName} works on a quote basis. Get in touch to discuss your requirements.
            </p>
            <button className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm">
              Request a quote
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.map(item => (
              <div key={item.id} id={`item-${item.id}`} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition">
                {item.heroPhotoUrl && (
                  <div className="aspect-square bg-gray-100">
                    <img src={item.heroPhotoUrl} alt={item.title}
                      className="w-full h-full object-cover"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{item.title}</h3>
                  {item.descriptionMd && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.descriptionMd}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-bold text-gray-900">₹{(item.basePricePaise / 100).toLocaleString('en-IN')}</span>
                    {item.leadTimeHours && (
                      <span className="text-[11px] text-gray-500">{item.leadTimeHours}h lead time</span>
                    )}
                  </div>
                  {item.occasionTags && item.occasionTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.occasionTags.slice(0, 3).map(t => (
                        <span key={t} className="text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Coverage + policy */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Service area</h3>
          {listing.cities && listing.cities.length > 0 ? (
            <p className="text-sm text-gray-700">{listing.cities.join(', ')}</p>
          ) : (
            <p className="text-sm text-gray-700">{listing.homeCity || 'Local only'}</p>
          )}
          {listing.outstationCapable && (
            <p className="text-xs text-green-700 mt-1">✓ Available for outstation events</p>
          )}
        </div>
        {listing.cancellationPolicy && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Cancellation</h3>
            <p className="text-sm text-gray-700">{listing.cancellationPolicy}</p>
          </div>
        )}
      </section>
    </div>
  );
}
