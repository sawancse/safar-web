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

type Booking = {
  id: string;
  bookingRef: string;
  eventType?: string;
  eventDate?: string;
  eventTime?: string;
  guestCount?: number;
  city?: string;
  venueAddress?: string;
  status: string;
  totalAmountPaise?: number;
  customerName?: string;
  menuDescription?: string;
};

type TabKey = 'listings' | 'bookings' | 'inquiries';

const SERVICE_LABELS: Record<string, { label: string; emoji: string }> = {
  PANDIT_PUJA:      { label: 'Pandit / Puja',  emoji: '🪔' },
  EVENT_DECOR:      { label: 'Decor',          emoji: '🌸' },
  DESIGNER_CAKE:    { label: 'Designer Cake',  emoji: '🎂' },
  LIVE_MUSIC:       { label: 'Live Music',     emoji: '🎤' },
  STAFF_HIRE:       { label: 'Staff Hire',     emoji: '🧑‍🍳' },
  APPLIANCE_RENTAL: { label: 'Appliance',      emoji: '📦' },
};

function bookingServiceMeta(b: Booking): { label: string; emoji: string } {
  if (b.menuDescription) {
    try {
      const md = JSON.parse(b.menuDescription);
      if (md?.type && SERVICE_LABELS[md.type]) return SERVICE_LABELS[md.type];
    } catch { /* fall through */ }
  }
  return { label: 'Event', emoji: '🎉' };
}

function formatPaise(p?: number): string {
  if (!p || p <= 0) return '—';
  return `₹${(p / 100).toLocaleString('en-IN')}`;
}

export default function VendorDashboardPage() {
  const router = useRouter();
  const search = useSearchParams();
  const justSubmitted = search?.get('submitted') === '1';
  const [tab, setTab] = useState<TabKey>('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inquiries, setInquiries] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/auth?next=/vendor/dashboard'); return; }

    setLoading(true);
    Promise.all([
      api.getMyServiceListings(token).catch(() => []),
      api.getMyVendorBookings(token).catch(() => []),
      api.getVendorOpenInquiries(token).catch(() => []),
    ]).then(([l, b, i]: any) => {
      setListings(l || []);
      setBookings(b || []);
      setInquiries(i || []);
    }).catch((e: any) => setError(e?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [router]);

  async function claim(eventId: string) {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setClaimingId(eventId);
    setClaimMsg(null);
    try {
      await api.claimEventBooking(eventId, token);
      // Move from inquiries → bookings on success
      const claimed = inquiries.find(i => i.id === eventId);
      setInquiries(prev => prev.filter(i => i.id !== eventId));
      if (claimed) setBookings(prev => [claimed, ...prev]);
      setClaimMsg('✓ Claimed — moved to your Bookings tab');
      setTimeout(() => setClaimMsg(null), 4000);
    } catch (e: any) {
      setClaimMsg(`✗ ${e?.message || 'Could not claim — it may have been taken'}`);
    } finally {
      setClaimingId(null);
    }
  }

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

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {([
          { key: 'listings',  label: 'My listings',     count: listings.length },
          { key: 'bookings',  label: 'My bookings',     count: bookings.length },
          { key: 'inquiries', label: 'Open inquiries',  count: inquiries.length },
        ] as { key: TabKey; label: string; count: number }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
              tab === t.key
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label} <span className="text-xs text-gray-400">({t.count})</span>
          </button>
        ))}
      </div>

      {claimMsg && (
        <div className={`mb-4 rounded-lg px-3 py-2 text-sm ${
          claimMsg.startsWith('✓') ? 'bg-green-50 border border-green-200 text-green-700'
                                   : 'bg-red-50 border border-red-200 text-red-700'
        }`}>{claimMsg}</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Loading…</p>}

      {/* ── Listings tab ─────────────────────────────────────── */}
      {!loading && tab === 'listings' && (
        <>
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

          {listings.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-500">
              No listings yet. Pick a service type above to start.
            </div>
          )}
        </>
      )}

      {/* ── Bookings tab ─────────────────────────────────────── */}
      {!loading && tab === 'bookings' && (
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-500">
              No bookings yet. Open inquiries near you appear in the next tab — claim one to get started.
            </div>
          ) : bookings.map(b => {
            const meta = bookingServiceMeta(b);
            return (
              <Link
                key={b.id}
                href={`/cooks/my-bookings/${b.id}`}
                className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3 hover:border-orange-300 hover:shadow-sm transition">
                <span className="text-2xl shrink-0">{meta.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 truncate">{meta.label}</p>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Ref: {b.bookingRef} · {b.eventDate} {b.eventTime ?? ''}
                    {b.eventType ? ` · ${b.eventType}` : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    {b.guestCount ? `${b.guestCount} guests · ` : ''}{b.city ?? ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">{formatPaise(b.totalAmountPaise)}</p>
                  <p className="text-[11px] text-orange-500 mt-1">View →</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Open inquiries tab ───────────────────────────────── */}
      {!loading && tab === 'inquiries' && (
        <div className="space-y-3">
          {inquiries.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-500">
              No open inquiries right now. Approved listings + matching customer requests will show up here.
              <p className="text-xs text-gray-400 mt-2">
                Tip: a listing must be <strong>VERIFIED</strong> before its type/city show up here.
              </p>
            </div>
          ) : inquiries.map(b => {
            const meta = bookingServiceMeta(b);
            return (
              <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
                <span className="text-2xl shrink-0">{meta.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 truncate">{meta.label}</p>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                      OPEN
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Ref: {b.bookingRef} · {b.eventDate} {b.eventTime ?? ''}
                    {b.eventType ? ` · ${b.eventType}` : ''}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {b.guestCount ? `${b.guestCount} guests · ` : ''}{b.venueAddress ?? b.city ?? ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900 mb-2">{formatPaise(b.totalAmountPaise)}</p>
                  <button
                    onClick={() => claim(b.id)}
                    disabled={claimingId === b.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50">
                    {claimingId === b.id ? 'Claiming…' : 'Claim'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && tab === 'listings' && (
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
      )}
    </div>
  );
}
