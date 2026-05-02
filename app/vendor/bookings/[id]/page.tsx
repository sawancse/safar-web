'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  INQUIRY:         { label: 'Inquiry',         color: 'bg-gray-100 text-gray-700' },
  QUOTED:          { label: 'Quoted',          color: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED:       { label: 'Confirmed',       color: 'bg-green-100 text-green-700' },
  ADVANCE_PAID:    { label: 'Advance Paid',    color: 'bg-green-100 text-green-700' },
  IN_PROGRESS:     { label: 'In Progress',     color: 'bg-blue-100 text-blue-700' },
  COMPLETED:       { label: 'Completed',       color: 'bg-gray-100 text-gray-600' },
  CANCELLED:       { label: 'Cancelled',       color: 'bg-red-100 text-red-600' },
};

const SERVICE_LABELS: Record<string, { label: string; emoji: string }> = {
  PANDIT_PUJA:      { label: 'Pandit / Puja',  emoji: '🪔' },
  EVENT_DECOR:      { label: 'Decor',          emoji: '🌸' },
  DESIGNER_CAKE:    { label: 'Designer Cake',  emoji: '🎂' },
  LIVE_MUSIC:       { label: 'Live Music',     emoji: '🎤' },
  STAFF_HIRE:       { label: 'Staff Hire',     emoji: '🧑‍🍳' },
  APPLIANCE_RENTAL: { label: 'Appliance',      emoji: '📦' },
};

function serviceMeta(b: any): { label: string; emoji: string } {
  if (b?.menuDescription) {
    try {
      const md = JSON.parse(b.menuDescription);
      if (md?.type && SERVICE_LABELS[md.type]) return SERVICE_LABELS[md.type];
    } catch { /* fall through */ }
  }
  return { label: 'Event', emoji: '🎉' };
}

const FIELD_LABEL: Record<string, string> = {
  arrivalSlot:   'Arrival',
  pujaLabel:     'Puja',
  pujaTier:      'Tier',
  decorLabel:    'Decor',
  decorTier:     'Tier',
  cakeLabel:     'Cake',
  weight:        'Weight',
  flavour:       'Flavour',
  tier:          'Tier',
  genreLabel:    'Genre',
  preference:    'Setup',
  roleLabel:     'Role',
  count:         'People',
  hours:         'Hours',
  rentalDays:    'Rental days',
  deliveryDate:  'Delivery',
  pickupDate:    'Pickup',
};

function humanizeKey(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function humanizeValue(v: any): string {
  if (typeof v !== 'string') return String(v);
  if (/^[A-Z][A-Z0-9_]+$/.test(v) && v.length > 1) {
    return v.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  return v;
}

const MD_SKIP_KEYS = new Set([
  'type', 'inclusions', 'items', 'breakdown',
  'decorPhotoUrl', 'pujaPhotoUrl', 'cakePhotoUrl',
  'decorKey', 'pujaKey', 'cakeKey', 'weightKey', 'genre', 'role',
  'occasion', 'occasionLabel',  // already shown as "Occasion" above
  'withSoundEquipment',         // implied by `preference`
]);

function MenuDescription({ raw }: { raw: string }) {
  let md: any;
  try { md = JSON.parse(raw); } catch { return null; }
  if (!md || typeof md !== 'object') return null;

  const photo: string | undefined =
    md.decorPhotoUrl || md.pujaPhotoUrl || md.cakePhotoUrl;
  const inclusions: string[] = Array.isArray(md.inclusions) ? md.inclusions : [];
  const items: any[] = Array.isArray(md.items) ? md.items : [];

  const rows = Object.entries(md)
    .filter(([k, v]) =>
      !MD_SKIP_KEYS.has(k) &&
      v !== null && v !== undefined && v !== '' &&
      typeof v !== 'object')
    .map(([k, v]) => ({
      label: FIELD_LABEL[k] || humanizeKey(k),
      value: humanizeValue(v),
    }));

  if (!photo && rows.length === 0 && inclusions.length === 0 && items.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-3">
      {photo && (
        <img src={photo} alt="" className="rounded-lg w-full max-w-xs h-40 object-cover" />
      )}
      {rows.length > 0 && (
        <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1.5 text-sm">
          {rows.map(r => (
            <div key={r.label} className="contents">
              <dt className="text-gray-500">{r.label}</dt>
              <dd className="text-gray-800 font-medium">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {inclusions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">Inclusions</p>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-0.5">
            {inclusions.map((it, i) => <li key={i}>{it}</li>)}
          </ul>
        </div>
      )}
      {items.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">Items</p>
          <ul className="text-sm text-gray-700 space-y-0.5">
            {items.map((it: any, i: number) => (
              <li key={i} className="flex justify-between border-b border-gray-100 last:border-0 py-1">
                <span>{it.label || it.key}</span>
                <span className="text-gray-500">× {it.qty}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function VendorBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Action state
  const [otpModal, setOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const [completing, setCompleting] = useState(false);
  const [actionMsg, setActionMsg]   = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const [sharingLocation, setSharingLocation] = useState(false);

  function token() { return localStorage.getItem('access_token') || ''; }

  async function load() {
    setLoading(true);
    try {
      const bk = await api.getEventBookingById(bookingId);
      setBooking(bk);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Could not load booking');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      router.push(`/auth?next=/vendor/bookings/${bookingId}`);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  function toggleShareLocation() {
    if (sharingLocation) {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setSharingLocation(false);
      setActionMsg('📍 Stopped sharing location');
      setTimeout(() => setActionMsg(null), 3000);
      return;
    }
    if (!navigator.geolocation) {
      setActionMsg('✗ Geolocation not supported on this device');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          await api.updateVendorEventLocation(
            bookingId, pos.coords.latitude, pos.coords.longitude, null, token());
        } catch (e: any) { console.warn('Location push failed:', e?.message); }
      },
      (err) => {
        setActionMsg(`✗ Location error: ${err.message}`);
        watchIdRef.current = null;
        setSharingLocation(false);
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 }
    );
    watchIdRef.current = id;
    setSharingLocation(true);
    setActionMsg('📍 Sharing live location — customer can see you on the map');
    setTimeout(() => setActionMsg(null), 4000);
  }

  async function submitStartJob() {
    if (!/^\d{4,6}$/.test(otpInput.trim())) {
      setOtpError('Enter the 4-6 digit OTP the customer shared');
      return;
    }
    setOtpSubmitting(true);
    setOtpError(null);
    try {
      const updated = await api.startEventJobAsVendor(bookingId, otpInput.trim(), token());
      setBooking((prev: any) => ({ ...prev, ...updated }));
      setOtpModal(false);
      setOtpInput('');
      setActionMsg('▶ Job started — customer notified');
      setTimeout(() => setActionMsg(null), 4000);
    } catch (e: any) {
      setOtpError(e?.message || 'Could not start job — check OTP and try again');
    } finally {
      setOtpSubmitting(false);
    }
  }

  async function markComplete() {
    if (!confirm('Mark this booking as complete? Customer will be asked to rate you.')) return;
    setCompleting(true);
    try {
      const updated = await api.completeEventAsVendor(bookingId, token());
      setBooking((prev: any) => ({ ...prev, ...updated }));
      setActionMsg('✓ Booking marked complete');
      setTimeout(() => setActionMsg(null), 4000);
    } catch (e: any) {
      setActionMsg(`✗ ${e?.message || 'Could not complete booking'}`);
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-32 bg-gray-100 rounded-xl" />
          <div className="h-48 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">{error || 'Booking not found.'}</p>
        <Link href="/vendor/dashboard" className="text-orange-500 hover:underline">← Back to Vendor Dashboard</Link>
      </div>
    );
  }

  const meta = serviceMeta(booking);
  const status = STATUS_BADGE[booking.status] || { label: booking.status, color: 'bg-gray-100 text-gray-700' };
  const canShare = ['CONFIRMED', 'ADVANCE_PAID', 'IN_PROGRESS'].includes(booking.status);
  const canStart = ['CONFIRMED', 'ADVANCE_PAID'].includes(booking.status) && !booking.jobStartedAt;
  const canComplete = booking.status === 'IN_PROGRESS';
  const advancePct = booking.totalAmountPaise > 0
    ? Math.round((booking.advanceAmountPaise / booking.totalAmountPaise) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <Link href="/vendor/dashboard" className="text-sm text-orange-500 hover:underline inline-block mb-2">
          ← Vendor Dashboard
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{meta.emoji}</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{meta.label}</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Ref: {booking.bookingRef} · {booking.eventDate}{booking.eventTime ? ` at ${booking.eventTime}` : ''}
              </p>
            </div>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.color}`}>{status.label}</span>
        </div>

        {actionMsg && (
          <div className={`mb-4 rounded-lg px-3 py-2 text-sm ${
            actionMsg.startsWith('✗') ? 'bg-red-50 border border-red-200 text-red-700'
                                       : 'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>{actionMsg}</div>
        )}

        {/* Action panel — pinned visible during active stages */}
        {(canShare || canStart || canComplete) && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Job Actions</h2>
            <div className="flex flex-wrap gap-2">
              {canShare && (
                <button
                  onClick={toggleShareLocation}
                  className={`text-sm font-semibold px-4 py-2 rounded-lg transition ${
                    sharingLocation ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}>
                  {sharingLocation ? '⏹ Stop sharing' : '📍 Share Live Location'}
                </button>
              )}
              {canStart && (
                <button
                  onClick={() => { setOtpModal(true); setOtpInput(''); setOtpError(null); }}
                  className="text-sm font-semibold px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600">
                  ▶ Start Job (enter OTP)
                </button>
              )}
              {canComplete && (
                <button
                  onClick={markComplete}
                  disabled={completing}
                  className="text-sm font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                  {completing ? 'Completing…' : '✓ Mark Complete'}
                </button>
              )}
            </div>
            {canStart && (
              <p className="text-[11px] text-gray-500 mt-2">
                Ask the customer for their start-job OTP when you arrive on site.
              </p>
            )}
          </div>
        )}

        {/* Customer + Venue */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Customer</h2>
            <p className="text-sm font-semibold text-gray-900">{booking.customerName || '—'}</p>
            {booking.customerPhone && (
              <a href={`tel:${booking.customerPhone}`} className="text-xs text-orange-500 hover:underline">
                📞 {booking.customerPhone}
              </a>
            )}
            {booking.customerEmail && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{booking.customerEmail}</p>
            )}
            {booking.customerPhone && (
              <a href={`https://wa.me/91${booking.customerPhone.replace(/\D/g,'').replace(/^91/,'').replace(/^0+/,'')}`}
                 target="_blank" rel="noopener noreferrer"
                 className="inline-block text-xs text-green-600 mt-2 hover:underline">
                💬 Chat on WhatsApp
              </a>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Venue</h2>
            <p className="text-sm text-gray-700">{booking.venueAddress || '—'}</p>
            {booking.city && <p className="text-xs text-gray-500 mt-0.5">{booking.city}{booking.pincode ? ` · ${booking.pincode}` : ''}</p>}
            {booking.guestCount > 0 && (
              <p className="text-xs text-gray-500 mt-1">👥 {booking.guestCount} guest{booking.guestCount > 1 ? 's' : ''}</p>
            )}
            {booking.venueAddress && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.venueAddress + (booking.city ? `, ${booking.city}` : ''))}`}
                 target="_blank" rel="noopener noreferrer"
                 className="inline-block text-xs text-orange-500 mt-2 hover:underline">
                🗺️ Open in Maps
              </a>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Pricing</h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Total quoted</span><span className="font-semibold">{formatPaise(booking.totalAmountPaise || 0)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Advance ({advancePct}%)</span><span>{formatPaise(booking.advanceAmountPaise || 0)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Balance</span><span>{formatPaise(booking.balanceAmountPaise || 0)}</span></div>
            <div className="flex justify-between border-t border-gray-100 pt-2 mt-2"><span className="text-gray-600">Platform fee (15%)</span><span className="text-red-600">– {formatPaise(booking.platformFeePaise || 0)}</span></div>
            <div className="flex justify-between text-sm font-bold"><span>Your earnings</span><span className="text-emerald-600">{formatPaise(booking.chefEarningsPaise || 0)}</span></div>
          </div>
          {booking.balancePaidAt && (
            <p className="text-[11px] text-emerald-600 mt-2">✓ Balance paid {new Date(booking.balancePaidAt).toLocaleString('en-IN')}</p>
          )}
        </div>

        {/* Special requests + service details */}
        {(booking.specialRequests || booking.menuDescription || booking.eventType) && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Customer's Requirements</h2>
            {booking.eventType && (
              <div className="flex items-baseline gap-2 text-sm">
                <span className="text-gray-500">Occasion</span>
                <span className="text-gray-900 font-medium">{humanizeValue(booking.eventType)}</span>
              </div>
            )}
            {booking.menuDescription && <MenuDescription raw={booking.menuDescription} />}
            {booking.specialRequests && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-1">Notes from customer</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{booking.specialRequests}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* OTP Modal */}
      {otpModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
             onClick={() => !otpSubmitting && setOtpModal(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Start Job</h3>
            <p className="text-xs text-gray-500 mb-4">{booking.bookingRef} · {booking.eventDate}</p>
            <p className="text-sm text-gray-700 mb-3">
              Enter the start-job OTP the customer shared with you.
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpInput}
              onChange={e => { setOtpInput(e.target.value.replace(/\D/g, '')); setOtpError(null); }}
              placeholder="4-6 digit OTP"
              className="w-full text-center text-2xl font-mono font-bold tracking-[0.5em] border-2 border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:border-orange-500"
              autoFocus
            />
            {otpError && <p className="text-xs text-red-600 mt-2">{otpError}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={() => setOtpModal(false)} disabled={otpSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={submitStartJob} disabled={otpSubmitting || otpInput.length < 4}
                className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-50">
                {otpSubmitting ? 'Starting…' : '▶ Start Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
