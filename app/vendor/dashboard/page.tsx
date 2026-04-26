'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { WIZARD_CONFIGS } from '@/lib/vendor-wizard-config';

type Listing = {
  id: string;
  serviceType: string;
  businessName: string;
  vendorSlug: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'VERIFIED' | 'PAUSED' | 'SUSPENDED';
  rejectionReason?: string;
  homeCity?: string;
  trustTier?: string;
  ratingCount?: number;
  avgRating?: number;
  completedBookingsCount?: number;
  commissionTier?: 'STARTER' | 'PRO' | 'COMMERCIAL';
  commissionPctOverride?: number;
  hasPendingChanges?: boolean;
  pendingChangesSubmittedAt?: string;
};

const COMMISSION_TIER_LABEL: Record<string, { label: string; color: string }> = {
  STARTER:    { label: 'Starter',    color: 'text-gray-600 bg-gray-100' },
  PRO:        { label: 'Pro',        color: 'text-blue-700 bg-blue-100' },
  COMMERCIAL: { label: 'Commercial', color: 'text-amber-700 bg-amber-100' },
};

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  DRAFT:           { color: 'bg-gray-100 text-gray-700',     label: 'Draft' },
  PENDING_REVIEW:  { color: 'bg-amber-100 text-amber-800',   label: 'Pending review' },
  VERIFIED:        { color: 'bg-green-100 text-green-800',   label: 'Live' },
  PAUSED:          { color: 'bg-yellow-100 text-yellow-800', label: 'Paused' },
  SUSPENDED:       { color: 'bg-red-100 text-red-800',       label: 'Suspended' },
};

export default function VendorDashboardPage() {
  const router = useRouter();
  const search = useSearchParams();
  const justSubmitted = search?.get('submitted') === '1';
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/auth?next=/vendor/dashboard'); return; }

    api.getMyServiceListings(token)
      .then((data: any) => setListings(data || []))
      .catch((e: any) => setError(e?.message || 'Failed to load listings'))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Vendor Dashboard</h1>
          <p className="text-sm text-gray-500">Manage your service listings and submissions.</p>
        </div>
      </div>

      {justSubmitted && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-green-800">✓ Submitted for review</p>
          <p className="text-xs text-green-700 mt-1">
            Our team reviews most submissions within 24 hours. You'll receive a WhatsApp + email
            update once it's approved.
          </p>
        </div>
      )}

      {/* New listing CTA */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 mb-6">
        <p className="text-sm font-semibold text-orange-800 mb-2">Add a new service listing</p>
        <div className="flex flex-wrap gap-2">
          {Object.values(WIZARD_CONFIGS).map(c => (
            <Link
              key={c.serviceType}
              href={`/vendor/onboard/${c.serviceType.toLowerCase().replace('_designer','').replace('_hire','-hire').replace('decorator','decor')}`}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-orange-300 text-orange-700 hover:bg-orange-100">
              {c.hero.emoji} {c.displayName}
            </Link>
          ))}
        </div>
      </div>

      {/* My listings */}
      <h2 className="text-base font-bold text-gray-900 mb-3">My listings ({listings.length})</h2>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">
          {error}
        </div>
      )}

      {!loading && listings.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-500">
          No listings yet. Pick a service type above to start.
        </div>
      )}

      <div className="space-y-3">
        {listings.map(l => {
          const badge = STATUS_BADGE[l.status] ?? { color: 'bg-gray-100 text-gray-700', label: l.status };
          const cfg = WIZARD_CONFIGS[l.serviceType];
          return (
            <div key={l.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl shrink-0">{cfg?.hero.emoji ?? '•'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{l.businessName}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {cfg?.displayName ?? l.serviceType} · /{l.vendorSlug}
                      {l.homeCity && ` · ${l.homeCity}`}
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                {l.rejectionReason && l.status === 'DRAFT' && (
                  <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5 text-xs text-red-700">
                    Last rejection: {l.rejectionReason}
                  </div>
                )}

                {l.status === 'VERIFIED' && (
                  <p className="text-xs text-green-700 mt-1">
                    🎉 Live at <Link href={`/services/storefront/${l.vendorSlug}`} className="underline">safar.com/services/storefront/{l.vendorSlug}</Link>
                    {l.ratingCount && l.ratingCount > 0 && (
                      <> · ★{l.avgRating?.toFixed(1)} ({l.ratingCount})</>
                    )}
                  </p>
                )}

                {l.hasPendingChanges && (
                  <div className="mt-2 bg-pink-50 border border-pink-200 rounded-lg px-3 py-1.5 text-xs text-pink-800">
                    🔄 Material change submitted — admin reviewing. Listing stays live with current values until approved.
                  </div>
                )}

                {/* Commission tier — vendors see their tier + booking progress */}
                {l.status === 'VERIFIED' && l.commissionTier && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${COMMISSION_TIER_LABEL[l.commissionTier]?.color}`}>
                      {COMMISSION_TIER_LABEL[l.commissionTier]?.label} commission tier
                    </span>
                    {l.commissionPctOverride && (
                      <span className="text-[11px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-semibold">
                        {l.commissionPctOverride}% — special rate
                      </span>
                    )}
                    {l.commissionTier !== 'COMMERCIAL' && (
                      <span className="text-[11px] text-gray-500">
                        {l.completedBookingsCount ?? 0} bookings completed
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-2 flex items-center gap-3">
                  <Link href={`/vendor/listings/${l.id}/items`}
                    className="text-xs text-orange-600 hover:underline font-medium">
                    Manage items →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
