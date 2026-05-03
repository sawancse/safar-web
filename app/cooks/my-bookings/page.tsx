'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPaise, formatDate, formatDateTime } from '@/lib/utils';
import CityAutocomplete from '@/components/CityAutocomplete';
import LocalityAutocomplete from '@/components/LocalityAutocomplete';
import DateField from '@/components/DateField';
import PeopleAlsoBooked from '@/components/PeopleAlsoBooked';
import { GENRES as SINGER_GENRES } from '@/app/services/live-music/catalog';

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
  NO_SHOW: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  EXPIRED: 'bg-gray-100 text-gray-600',
  INQUIRY: 'bg-yellow-100 text-yellow-700',
  QUOTED: 'bg-blue-100 text-blue-700',
  ADVANCE_PAID: 'bg-indigo-100 text-indigo-700',
};

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  UNPAID: { label: 'Unpaid', color: 'text-red-600' },
  ADVANCE_PAID: { label: '10% Advance Paid', color: 'text-green-600' },
  ADDITIONAL_PAYMENT_REQUIRED: { label: 'Additional Payment Required', color: 'text-orange-600' },
  FULLY_PAID: { label: 'Fully Paid', color: 'text-green-700' },
};

const MODIFIABLE_BOOKING = ['PENDING_PAYMENT', 'PENDING'];
const MODIFIABLE_EVENT = ['INQUIRY', 'QUOTED'];
const MODIFIABLE_SUB = ['ACTIVE'];

const APPLIANCE_OPTIONS = [
  'Gas stove', 'Oven', 'Microwave', 'Tandoor', 'OTG',
  'Mixer-grinder', 'Hand blender', 'Pressure cooker',
  'Kadhai', 'Tawa', 'Dosa tawa', 'Rice cooker',
  'Chopping board', 'Knife set', 'Ladles & spatulas',
  'Refrigerator', 'Gas cylinder (full)',
];

function crockeryOptionsFor(guests: number) {
  const n = Math.max(guests || 1, 1);
  return [
    `${n} × dinner plates`, `${n} × side plates`, `${n} × tumblers / glasses`,
    `${n} × cutlery sets`, `${n} × bowls`,
    'Serving bowls', 'Serving spoons', 'Water jug', 'Tea/coffee cups', 'Casseroles',
  ];
}

function safeParseArray(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : []; } catch { return []; }
}

function Chips({ label, options, selected, onChange, hint }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void; hint?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
      {hint && <p className="text-[11px] text-gray-400 mb-2">{hint}</p>}
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const on = selected.includes(opt);
          return (
            <button
              type="button"
              key={opt}
              onClick={() => onChange(on ? selected.filter(x => x !== opt) : [...selected, opt])}
              className={`text-xs px-2.5 py-1 rounded-full border transition ${
                on ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-300 hover:border-orange-300'
              }`}
            >
              {on ? '✓ ' : ''}{opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MyChefBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [eventVendors, setEventVendors] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState<{ id: string; type: string } | null>(null);
  const [otpCopied, setOtpCopied] = useState<string | null>(null);

  function copyOtp(bookingId: string, otp: string) {
    navigator.clipboard?.writeText(otp);
    setOtpCopied(bookingId);
    setTimeout(() => setOtpCopied(prev => (prev === bookingId ? null : prev)), 1500);
  }

  function otpShareMessage(b: any) {
    return `Hi ${b.chefName || 'Chef'}, my Safar Cook start-job OTP is *${b.startJobOtp}*. Please enter it when you arrive. Booking ref: ${b.bookingRef ?? ''}.`;
  }

  function eventOtpShareMessage(e: any, recipient: string) {
    return `Hi ${recipient}, my Safar event start-job OTP is *${e.startJobOtp}*. Please enter it when you arrive. Booking ref: ${e.bookingRef ?? ''}.`;
  }

  function formatBookedOn(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // Who is the customer waiting on? For service-only bookings (singer, decor,
  // cake, pandit, staff, appliances) "the chef" is wrong — there is no chef.
  function eventActor(e: any): string {
    if (e?.menuDescription) {
      try {
        const md = JSON.parse(e.menuDescription);
        switch (md.type) {
          case 'LIVE_MUSIC':       return 'our team';
          case 'EVENT_DECOR':      return 'the decorator';
          case 'DESIGNER_CAKE':    return 'the baker';
          case 'PANDIT_PUJA':      return 'the pandit';
          case 'STAFF_HIRE':       return 'our team';
          case 'APPLIANCE_RENTAL': return 'our team';
        }
      } catch { /* fall through */ }
    }
    return 'the cook';
  }
  const sentenceCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Occasion codes are SHOUT_SNAKE_CASE in the DB. Bespoke labels for the few
  // that need lowercase prepositions ("Shadi ka Ghar"); fall back to title case.
  const OCCASION_LABELS: Record<string, string> = {
    SHADI_KA_GHAR: 'Shadi ka Ghar',
    KITTY_PARTY:   'Kitty Party',
    HOUSEWARMING:  'House-warming',
    BABY_SHOWER:   'Baby Shower',
    COCKTAIL:      'Cocktail Night',
    BBQ:           'BBQ Party',
    CORPORATE:     'Corporate Event',
    POOJA:         'Pooja / Puja',
    BIRTHDAY:      'Birthday Party',
    ANNIVERSARY:   'Anniversary',
    WEDDING:       'Wedding',
    FESTIVAL:      'Festival',
    NAVRATRI:      'Navratri',
    RECEPTION:     'Reception',
    ENGAGEMENT:    'Engagement',
    FAREWELL:      'Farewell',
    OTHER:         'Other Event',
  };
  function formatOccasion(code?: string): string {
    if (!code) return '';
    if (OCCASION_LABELS[code]) return OCCASION_LABELS[code];
    return code.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // Service-only bookings (from live-music / decor / cake / pandit / staff-hire / appliances)
  // have no chefName — the actual service name lives inside menuDescription.type.
  // Without this lookup, the row shows "Cook — <occasion-code>" which hides what the
  // customer actually booked.
  function eventHeading(e: any): string {
    const occasion = formatOccasion(e.eventType);
    if (e.menuDescription) {
      try {
        const md = JSON.parse(e.menuDescription);
        switch (md.type) {
          case 'LIVE_MUSIC':       return md.genreLabel ? `Live Singer · ${md.genreLabel}` : 'Live Singer';
          case 'EVENT_DECOR':      return md.decorLabel ? `Event Decor · ${md.decorLabel}` : 'Event Decor';
          case 'DESIGNER_CAKE':    return md.cakeLabel  ? `Designer Cake · ${md.cakeLabel}` : 'Designer Cake';
          case 'PANDIT_PUJA':      return md.pujaLabel  ? `Pandit · ${md.pujaLabel}`        : 'Pandit / Puja';
          case 'STAFF_HIRE': {
            const n = md.count || 1;
            const role = md.roleLabel || 'Staff';
            return `${n} × ${role}${n > 1 ? 's' : ''}`;
          }
          case 'APPLIANCE_RENTAL': return 'Appliance Rental';
        }
      } catch { /* fall through to default */ }
    }
    return `${e.chefName || 'Cook'} — ${occasion || 'Event'}`;
  }
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [editModal, setEditModal] = useState<{ item: any; type: 'booking' | 'event' | 'subscription' } | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editMenus, setEditMenus] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingBooking, setTrackingBooking] = useState<any>(null);
  const [payAdvanceEvent, setPayAdvanceEvent] = useState<any>(null);
  const [payingAdvance, setPayingAdvance] = useState(false);
  // Gate the "Are you a cook?" banner + "Service Dashboard →" header CTA behind an
  // actual chef profile lookup. Non-chef customers shouldn't see either — it
  // only confuses them.
  const [isChef, setIsChef] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/auth'); return; }

    api.getMyChefProfile(token).then(p => setIsChef(!!p?.id)).catch(() => setIsChef(false));

    Promise.all([
      api.getMyChefBookings(token).catch(() => []),
      api.getMyChefSubscriptions(token).catch(() => []),
      api.getMyEventBookings(token).catch(() => []),
    ]).then(([b, s, e]) => {
      // Newest first — sort by createdAt desc so the most recent booking sits at the top.
      const byCreatedDesc = (x: any, y: any) =>
        new Date(y?.createdAt || 0).getTime() - new Date(x?.createdAt || 0).getTime();
      setBookings(((b || []) as any[]).slice().sort(byCreatedDesc));
      setSubscriptions(((s || []) as any[]).slice().sort(byCreatedDesc));
      const sortedEvents = ((e || []) as any[]).slice().sort(byCreatedDesc);
      setEvents(sortedEvents);

      // For active events (INQUIRY/QUOTED/CONFIRMED/ADVANCE_PAID/IN_PROGRESS) fetch the
      // assigned partner vendor in parallel so the row can show "Vendor X is preparing
      // your quote" instead of the generic "waiting on our team" message after the
      // admin assigns a singer / decorator / pandit etc.
      const ACTIVE = new Set(['INQUIRY', 'QUOTED', 'CONFIRMED', 'ADVANCE_PAID', 'IN_PROGRESS']);
      const candidates = sortedEvents.filter(ev => ACTIVE.has(ev.status));
      Promise.all(candidates.map(ev =>
        api.getEventActiveVendor(ev.id, token).then((v: any) => [ev.id, v] as const)
      )).then(pairs => {
        const map: Record<string, any> = {};
        for (const [id, v] of pairs) if (v) map[id] = v;
        setEventVendors(map);
      }).catch(() => { /* vendor fetch failures shouldn't block the list */ });
      // Deep-link from the "Rate Your Experience" email:
      //   /cooks/my-bookings?rateEvent=<eventId>
      //   /cooks/my-bookings?rateBooking=<bookingId>
      // auto-opens the rating modal on the relevant item so users don't have
      // to hunt for a button inside the list.
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const rateEvent = params.get('rateEvent');
        const rateBooking = params.get('rateBooking');
        if (rateEvent && (e || []).some((ev: any) => ev.id === rateEvent)) {
          setActiveTab('events');
          setRatingModal({ id: rateEvent, type: 'event' });
        } else if (rateBooking && (b || []).some((bk: any) => bk.id === rateBooking)) {
          setActiveTab('bookings');
          setRatingModal({ id: rateBooking, type: 'booking' });
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  async function handleCancel(id: string) {
    if (!confirm('Cancel this booking?')) return;
    const token = localStorage.getItem('access_token')!;
    await api.cancelChefBooking(id, 'Customer cancelled', token);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b));
  }

  async function handleRate() {
    if (!ratingModal) return;
    const token = localStorage.getItem('access_token')!;
    try {
      if (ratingModal.type === 'event') {
        await api.rateEventBooking(ratingModal.id, rating, reviewComment, token);
        setEvents(prev => prev.map(e => e.id === ratingModal.id ? { ...e, ratingGiven: rating, reviewComment } : e));
      } else {
        await api.rateChefBooking(ratingModal.id, rating, reviewComment, token);
        setBookings(prev => prev.map(b => b.id === ratingModal.id ? { ...b, ratingGiven: rating, reviewComment } : b));
      }
      setRatingModal(null);
      setRating(5);
      setReviewComment('');
    } catch (err: any) {
      alert(err?.message || 'Failed to submit rating');
    }
  }

  function openEdit(item: any, type: 'booking' | 'event' | 'subscription') {
    setEditMenus([]);
    if (type === 'booking' && item.chefId) {
      api.getChefMenus(item.chefId).then(m => setEditMenus(Array.isArray(m) ? m : [])).catch(() => {});
    }
    setEditForm(
      type === 'booking' ? {
        serviceDate: item.serviceDate || '', serviceTime: item.serviceTime || '',
        guestsCount: item.guestsCount || '', specialRequests: item.specialRequests || '',
        address: item.address || '', city: item.city || '', pincode: item.pincode || '',
        menuId: item.menuId || '',
        appliances: safeParseArray(item.appliancesJson),
        crockery:   safeParseArray(item.crockeryJson),
      } : type === 'event' ? {
        eventDate: item.eventDate || '', eventTime: item.eventTime || '',
        guestCount: item.guestCount || '', durationHours: item.durationHours || '',
        venueAddress: item.venueAddress || '', city: item.city || '', pincode: item.pincode || '',
        menuDescription: item.menuDescription || '', specialRequests: item.specialRequests || '',
      } : {
        mealsPerDay: item.mealsPerDay || '', mealTypes: item.mealTypes || '',
        schedule: item.schedule || '', address: item.address || '', city: item.city || '',
        pincode: item.pincode || '', specialRequests: item.specialRequests || '',
        dietaryPreferences: item.dietaryPreferences || '',
      }
    );
    setEditModal({ item, type });
  }

  async function handleSaveEdit() {
    if (!editModal) return;
    setSaving(true);
    const token = localStorage.getItem('access_token')!;
    const { item, type } = editModal;

    // Build payload with only changed fields
    const payload: any = {};
    Object.entries(editForm).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) return;
      if (k === 'appliances') { payload.appliancesJson = JSON.stringify(v); return; }
      if (k === 'crockery')   { payload.crockeryJson   = JSON.stringify(v); return; }
      payload[k] = ['guestsCount', 'guestCount', 'durationHours', 'mealsPerDay'].includes(k) ? Number(v) : v;
    });

    try {
      let updated: any;
      if (type === 'booking') {
        updated = await api.modifyChefBooking(item.id, payload, token);
        setBookings(prev => prev.map(b => b.id === item.id ? updated : b));
      } else if (type === 'event') {
        updated = await api.modifyEventBooking(item.id, payload, token);
        setEvents(prev => prev.map(e => e.id === item.id ? updated : e));
      } else {
        updated = await api.modifySubscription(item.id, payload, token);
        setSubscriptions(prev => prev.map(s => s.id === item.id ? updated : s));
      }
      setEditModal(null);
    } catch (err: any) {
      alert(err.message || 'Failed to modify booking');
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { key: 'bookings', label: `Bookings (${bookings.length})` },
    { key: 'subscriptions', label: `Subscriptions (${subscriptions.length})` },
    { key: 'events', label: `Events (${events.length})` },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shrink-0">
            <span className="text-xl">🍳</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Service Bookings</h1>
            <p className="text-sm text-gray-500">Bookings you placed as a customer</p>
          </div>
        </div>
        {isChef && (
          <Link href="/cooks/dashboard"
            className="text-sm bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition font-semibold shadow-sm">
            Service Dashboard →
          </Link>
        )}
      </div>

      {/* Banner — chefs only */}
      {isChef && (
        <div className="mb-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-orange-700">
            <strong>Are you a cook?</strong> This page shows bookings you placed as a customer. To view your <strong>incoming orders</strong>, go to the Service Dashboard.
          </p>
          <Link href="/cooks/dashboard" className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-orange-600 transition shrink-0 ml-3">
            My Incoming Orders
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px
              ${activeTab === t.key ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <>
          {/* Bookings */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <p className="text-center text-gray-400 py-12">No bookings yet</p>
              ) : bookings.map(b => {
                const ps = PAYMENT_STATUS_LABELS[b.paymentStatus] || PAYMENT_STATUS_LABELS['UNPAID'];
                return (
                <div key={b.id} className="border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/cooks/my-bookings/${b.id}`} className="font-semibold text-gray-900 hover:text-orange-600 transition inline-flex items-center gap-1">
                        {b.chefName || 'Cook'}
                        <span className="text-xs text-orange-500">→</span>
                      </Link>
                      <p className="text-xs text-gray-500">Ref: {b.bookingRef} · {formatDateTime(b.serviceDate, b.serviceTime)}</p>
                      <p className="text-xs text-gray-500">{b.mealType} | {b.guestsCount} guests | {b.address}</p>
                      {b.createdAt && <p className="text-[11px] text-gray-400 mt-0.5">Booked on {formatBookedOn(b.createdAt)}</p>}
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[b.status] || 'bg-gray-100'}`}>
                        {b.status === 'PENDING_PAYMENT' ? 'Awaiting Payment' : b.status}
                      </span>
                      {b.totalAmountPaise > 0 && <p className="text-sm font-bold mt-1">{formatPaise(b.totalAmountPaise)}</p>}
                    </div>
                  </div>
                  {/* Payment breakdown — hide for cancelled */}
                  {b.status !== 'CANCELLED' && b.totalAmountPaise > 0 && b.advanceAmountPaise > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                        <div className="flex gap-4">
                          <span className={`font-medium ${ps.color}`}>{ps.label}</span>
                          {(b.paymentStatus === 'ADVANCE_PAID' || b.paymentStatus === 'ADDITIONAL_PAYMENT_REQUIRED') && b.advancePaidPaise > 0 && (
                            <span className="text-gray-500">Paid: {formatPaise(b.advancePaidPaise)}</span>
                          )}
                        </div>
                        {b.balanceAmountPaise > 0 && b.paymentStatus !== 'FULLY_PAID' && (
                          <span className="text-orange-600 font-medium">Balance due: {formatPaise(b.balanceAmountPaise)}</span>
                        )}
                      </div>
                      {/* Price adjustment after modification */}
                      {b.paymentAdjustmentPaise > 0 && b.paymentStatus === 'ADDITIONAL_PAYMENT_REQUIRED' && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-orange-700">
                              Order modified — additional <strong>{formatPaise(b.paymentAdjustmentPaise)}</strong> required
                              {b.previousTotalPaise > 0 && (
                                <span className="text-orange-500 ml-1">(was {formatPaise(b.previousTotalPaise)} → now {formatPaise(b.totalAmountPaise)})</span>
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                      {b.paymentAdjustmentPaise < 0 && b.previousTotalPaise > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs">
                          <span className="text-green-700">
                            Order reduced — <strong>{formatPaise(Math.abs(b.paymentAdjustmentPaise))}</strong> credit applied to balance
                            <span className="text-green-500 ml-1">(was {formatPaise(b.previousTotalPaise)} → now {formatPaise(b.totalAmountPaise)})</span>
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Cancelled reason */}
                  {b.status === 'CANCELLED' && (
                    <div className="mt-2 bg-red-50 rounded-lg px-3 py-2 text-xs text-red-600">
                      {b.cancellationReason || 'This booking was cancelled.'}
                    </div>
                  )}
                  {/* Start-job OTP — share with chef when they arrive */}
                  {b.startJobOtp && !b.jobStartedAt && b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                    <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl shrink-0">🔑</span>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase font-bold text-orange-700 tracking-wider">Start-job OTP — share with chef on arrival</p>
                          <p className="text-2xl font-black tracking-[0.3em] text-orange-700 font-mono leading-tight">{b.startJobOtp}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => copyOtp(b.id, b.startJobOtp)}
                          className="text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-lg transition"
                        >
                          {otpCopied === b.id ? 'Copied ✓' : '📋 Copy'}
                        </button>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(otpShareMessage(b))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition"
                        >
                          💬 WhatsApp
                        </a>
                        <a
                          href={`sms:?body=${encodeURIComponent(otpShareMessage(b))}`}
                          className="text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition"
                        >
                          ✉️ SMS
                        </a>
                      </div>
                    </div>
                  )}
                  {/* Job started — confirmation */}
                  {b.jobStartedAt && (
                    <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 flex items-center gap-2">
                      <span>✓</span>
                      <span>Chef started the job at {new Date(b.jobStartedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    {MODIFIABLE_BOOKING.includes(b.status) && (
                      <button onClick={() => openEdit(b, 'booking')}
                        className="text-xs text-blue-600 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50">Modify</button>
                    )}
                    {b.status === 'PENDING_PAYMENT' && (
                      <button onClick={() => router.push(`/cooks/book?chefId=${b.chefId}&type=DAILY&resumeBookingId=${b.id}`)}
                        className="text-xs text-green-600 border border-green-200 px-3 py-1 rounded-lg hover:bg-green-50">Complete Payment</button>
                    )}
                    {b.paymentStatus === 'ADDITIONAL_PAYMENT_REQUIRED' && b.paymentAdjustmentPaise > 0 && (
                      <button onClick={() => router.push(`/cooks/book?chefId=${b.chefId}&type=DAILY&resumeBookingId=${b.id}&additionalPayment=${b.paymentAdjustmentPaise}`)}
                        className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1 rounded-lg hover:bg-orange-100 font-medium">
                        Pay Additional {formatPaise(b.paymentAdjustmentPaise)}
                      </button>
                    )}
                    {(b.status === 'PENDING' || b.status === 'PENDING_PAYMENT') && (
                      <button onClick={() => handleCancel(b.id)} className="text-xs text-red-600 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50">Cancel</button>
                    )}
                    {b.status === 'CANCELLED' && (
                      <button onClick={() => {
                        const d = prompt('Pick a new date to rebook (YYYY-MM-DD):');
                        if (!d) return;
                        const token = localStorage.getItem('access_token')!;
                        api.rebookChef(b.id, d, b.serviceTime || '12:00', token)
                          .then(nb => { setBookings(prev => [nb, ...prev]); alert('Rebooked successfully! Ref: ' + nb.bookingRef + '\nPlease complete payment.'); })
                          .catch((err: any) => alert(err.message || 'Rebook failed'));
                      }} className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1 rounded-lg hover:bg-orange-100 font-medium">
                        Rebook This Cook
                      </button>
                    )}
                    {b.status === 'COMPLETED' && !b.ratingGiven && (
                      <button onClick={() => setRatingModal({ id: b.id, type: 'booking' })}
                        className="text-xs text-orange-600 border border-orange-200 px-3 py-1 rounded-lg hover:bg-orange-50">Rate & Review</button>
                    )}
                    {b.ratingGiven && <span className="text-xs text-gray-500">{'★'.repeat(b.ratingGiven)} Rated</span>}
                    {b.status === 'COMPLETED' && (
                      <button onClick={async () => {
                        try {
                          const inv = await api.getBookingInvoice(b.id);
                          openInvoice(inv);
                        } catch (err: any) {
                          alert(err.message || 'Could not load invoice');
                        }
                      }}
                        className="text-xs text-gray-600 border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-50">Invoice</button>
                    )}
                    {b.status === 'COMPLETED' && (
                      <button onClick={() => { const d = prompt('New date (YYYY-MM-DD):'); if (d) { const token = localStorage.getItem('access_token')!; api.rebookChef(b.id, d, '', token).then(nb => { setBookings(prev => [nb, ...prev]); alert('Rebooked! Ref: ' + nb.bookingRef); }); }}}
                        className="text-xs text-purple-600 border border-purple-200 px-3 py-1 rounded-lg hover:bg-purple-50">Book Again</button>
                    )}
                    {b.status === 'CANCELLED' && (
                      <button onClick={() => router.push(`/cooks/${b.chefId}`)}
                        className="text-xs text-gray-600 border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-50">View Chef</button>
                    )}
                    {(b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') && (
                      <button onClick={async () => {
                        try {
                          const t = await api.getBookingTracking(b.id);
                          setTrackingData(t);
                          setTrackingBooking(b);
                        } catch { alert('Could not fetch tracking info'); }
                      }}
                        className="text-xs text-indigo-600 border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-50">Track Chef</button>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {/* Subscriptions */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-4">
              {subscriptions.length === 0 ? (
                <p className="text-center text-gray-400 py-12">No subscriptions yet</p>
              ) : subscriptions.map(s => (
                <div key={s.id} className="border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{s.chefName || 'Cook'} — {s.plan}</p>
                      <p className="text-xs text-gray-500">Ref: {s.subscriptionRef} | {s.mealsPerDay} meals/day | {s.schedule}</p>
                      <p className="text-xs text-gray-500">{s.mealTypes} | {s.address}</p>
                      {s.createdAt && <p className="text-[11px] text-gray-400 mt-0.5">Booked on {formatBookedOn(s.createdAt)}</p>}
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[s.status] || 'bg-gray-100'}`}>{s.status}</span>
                      <p className="text-sm font-bold mt-1">{formatPaise(s.monthlyRatePaise)}/mo</p>
                    </div>
                  </div>
                  {MODIFIABLE_SUB.includes(s.status) && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => openEdit(s, 'subscription')}
                        className="text-xs text-blue-600 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50">Modify</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Events */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              {events.length === 0 ? (
                <p className="text-center text-gray-400 py-12">No event bookings yet</p>
              ) : events.map(e => (
                <div key={e.id} className="border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/cooks/my-bookings/${e.id}`} className="font-semibold text-gray-900 hover:text-orange-600 transition inline-flex items-center gap-1">
                        {eventHeading(e)}
                        <span className="text-xs text-orange-500">→</span>
                      </Link>
                      <p className="text-xs text-gray-500">Ref: {e.bookingRef} · {formatDateTime(e.eventDate, e.eventTime)}{e.eventType ? ` · ${formatOccasion(e.eventType)}` : ''}</p>
                      <p className="text-xs text-gray-500">{e.guestCount} guests | {e.venueAddress}</p>
                      {e.createdAt && <p className="text-[11px] text-gray-400 mt-0.5">Booked on {formatBookedOn(e.createdAt)}</p>}
                      {e.menuDescription && (() => {
                        try {
                          const md = JSON.parse(e.menuDescription);
                          const tags: string[] = [];
                          if (md.vegNonVeg) tags.push(md.vegNonVeg === 'VEG' ? 'Veg' : md.vegNonVeg === 'NON_VEG' ? 'Non-Veg' : 'Veg + Non-Veg');
                          if (md.decoration) tags.push('Decoration');
                          if (md.cake) tags.push('Cake');
                          if (md.liveCounters?.length) tags.push(`${md.liveCounters.length} counter${md.liveCounters.length > 1 ? 's' : ''}`);
                          if (md.extraStaff) tags.push(`${md.staffCount || 2} staff`);
                          if (md.selectedDishIds?.length) tags.push(`${md.selectedDishIds.length} dishes`);
                          return tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {tags.map(t => <span key={t} className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{t}</span>)}
                            </div>
                          ) : null;
                        } catch { return e.menuDescription ? <p className="text-xs text-gray-400 mt-1 truncate max-w-xs">{e.menuDescription}</p> : null; }
                      })()}
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[e.status] || 'bg-gray-100'}`}>{e.status}</span>
                      {e.totalAmountPaise > 0 && <p className="text-sm font-bold mt-1">{formatPaise(e.totalAmountPaise)}</p>}
                    </div>
                  </div>
                  {/* Quote received banner */}
                  {e.status === 'QUOTED' && e.totalAmountPaise > 0 && (
                    <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-700 font-medium">{sentenceCase(eventActor(e))} has sent a quote!</span>
                        <span className="text-blue-800 font-bold">{formatPaise(e.totalAmountPaise)}</span>
                      </div>
                      <div className="text-xs text-blue-600 mt-1 space-y-0.5">
                        <p>Advance (50%): <strong>{formatPaise(e.advanceAmountPaise)}</strong> | Balance: {formatPaise(e.balanceAmountPaise)}</p>
                        {e.quotedAt && <p className="text-blue-400">Quoted {formatDate(e.quotedAt)}</p>}
                      </div>
                    </div>
                  )}
                  {/* Assigned partner vendor — visible from INQUIRY onward once admin assigns one */}
                  {eventVendors[e.id] && (() => {
                    const v = eventVendors[e.id];
                    const statusStyle: Record<string, string> = {
                      ASSIGNED:  'bg-amber-100 text-amber-700',
                      CONFIRMED: 'bg-blue-100 text-blue-700',
                      DELIVERED: 'bg-green-100 text-green-700',
                    };
                    return (
                      <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 flex items-center gap-3 flex-wrap">
                        <span className="text-lg shrink-0">🤝</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-orange-700 font-bold">Service partner assigned</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">{v.vendorBusinessName}</p>
                          {v.vendorPhone && (
                            <a href={`tel:${v.vendorPhone}`} className="text-xs text-orange-600 hover:underline">📞 {v.vendorPhone}</a>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusStyle[v.status] || 'bg-gray-100 text-gray-700'}`}>
                          {v.status}
                        </span>
                      </div>
                    );
                  })()}
                  {/* Start-job OTP — share with chef/vendor when they arrive on the event day */}
                  {e.startJobOtp && !e.jobStartedAt && (e.status === 'CONFIRMED' || e.status === 'ADVANCE_PAID' || e.status === 'IN_PROGRESS') && (() => {
                    const v = eventVendors[e.id];
                    const recipientName = v?.vendorBusinessName || e.chefName || 'team';
                    const recipientPhone = v?.vendorPhone || e.chefPhone || '';
                    const waPhone = recipientPhone.replace(/\D/g, '').replace(/^0+/, '');
                    const waNumber = waPhone.length === 10 ? `91${waPhone}` : waPhone;
                    const msg = eventOtpShareMessage(e, recipientName);
                    return (
                      <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl shrink-0">🔑</span>
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase font-bold text-orange-700 tracking-wider">
                              Start-job OTP — share with {v ? v.vendorBusinessName : (e.chefName || 'the partner')} on arrival
                            </p>
                            <p className="text-2xl font-black tracking-[0.3em] text-orange-700 font-mono leading-tight">{e.startJobOtp}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => copyOtp(e.id, e.startJobOtp)}
                            className="text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-lg transition"
                          >
                            {otpCopied === e.id ? 'Copied ✓' : '📋 Copy'}
                          </button>
                          <a
                            href={recipientPhone && waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition"
                          >
                            💬 WhatsApp
                          </a>
                          <a
                            href={recipientPhone ? `sms:${recipientPhone}?body=${encodeURIComponent(msg)}` : `sms:?body=${encodeURIComponent(msg)}`}
                            className="text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition"
                          >
                            ✉️ SMS
                          </a>
                          {recipientPhone && (
                            <a
                              href={`tel:${recipientPhone}`}
                              className="text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg transition"
                            >
                              📞 Call
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  {/* Job-started confirmation */}
                  {e.jobStartedAt && (
                    <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 flex items-center gap-2">
                      <span>✓</span>
                      <span>{eventVendors[e.id]?.vendorBusinessName || e.chefName || 'Partner'} started the job at {new Date(e.jobStartedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                  {/* Status info banners */}
                  {e.status === 'INQUIRY' && !eventVendors[e.id] && (
                    <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-700">
                      Waiting for {eventActor(e)} to review your inquiry and send a quote.
                    </div>
                  )}
                  {e.status === 'INQUIRY' && eventVendors[e.id] && (
                    <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-700">
                      <strong>{eventVendors[e.id].vendorBusinessName}</strong> is preparing your quote — you'll see the price here as soon as it's ready.
                    </div>
                  )}
                  {e.status === 'CONFIRMED' && (
                    <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700">
                      Event confirmed! Tap below to view the itemised bill and pay the 50% advance to lock in the booking.
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    {MODIFIABLE_EVENT.includes(e.status) && (
                      <button onClick={() => openEdit(e, 'event')}
                        className="text-xs text-blue-600 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50">Modify</button>
                    )}
                    {e.status === 'QUOTED' && (
                      <button onClick={async () => {
                        if (!confirm(`Accept quote of ${formatPaise(e.totalAmountPaise)}? You'll need to pay 50% advance (${formatPaise(e.advanceAmountPaise)}) to confirm.`)) return;
                        try {
                          const token = localStorage.getItem('access_token')!;
                          const updated = await api.confirmEvent(e.id, token);
                          setEvents(prev => prev.map(ev => ev.id === e.id ? updated : ev));
                        } catch (err: any) { alert(err.message || 'Failed to confirm'); }
                      }}
                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-lg font-medium transition">
                        Accept Quote
                      </button>
                    )}
                    {e.status === 'CONFIRMED' && e.advanceAmountPaise > 0 && (
                      <button onClick={() => setPayAdvanceEvent(e)}
                        className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-1.5 rounded-lg font-semibold shadow-sm hover:shadow transition inline-flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h2m4 0h3M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
                        </svg>
                        View Bill & Pay Advance — {formatPaise(e.advanceAmountPaise)}
                      </button>
                    )}
                    {e.status === 'ADVANCE_PAID' && !e.balancePaidAt && e.balanceAmountPaise > 0 && (
                      <button onClick={async () => {
                        if (!confirm(`Pay remaining balance of ${formatPaise(e.balanceAmountPaise)}?`)) return;
                        try {
                          const token = localStorage.getItem('access_token')!;
                          // Razorpay order first; only mark balance paid in our DB
                          // after checkout success — otherwise the customer gets
                          // a free balance write without any actual transfer.
                          const order = await api.createPaymentOrder(e.id, e.balanceAmountPaise, token);
                          if (!(window as any).Razorpay) {
                            await new Promise<void>((resolve, reject) => {
                              const s = document.createElement('script');
                              s.src = 'https://checkout.razorpay.com/v1/checkout.js';
                              s.onload = () => resolve();
                              s.onerror = () => reject(new Error('Failed to load Razorpay'));
                              document.body.appendChild(s);
                            });
                          }
                          const rzp = new (window as any).Razorpay({
                            key: order.razorpayKeyId,
                            amount: order.amountPaise,
                            currency: 'INR',
                            name: 'Safar',
                            description: `Balance — ${e.bookingRef}`,
                            order_id: order.razorpayOrderId,
                            handler: async (resp: any) => {
                              try {
                                const fresh = localStorage.getItem('access_token') || token;
                                const updated = await api.payEventBookingBalance(
                                  e.id,
                                  resp.razorpay_order_id,
                                  resp.razorpay_payment_id,
                                  fresh,
                                );
                                setEvents(prev => prev.map(ev => ev.id === e.id ? updated : ev));
                              } catch (err: any) {
                                alert(err.message || 'Payment received but our records did not update — please contact support with this booking ref.');
                              }
                            },
                            prefill: { name: e.customerName, contact: e.customerPhone, email: e.customerEmail },
                            theme: { color: '#22c55e' },
                          });
                          rzp.on('payment.failed', (r: any) => alert(r.error?.description || 'Payment failed'));
                          rzp.open();
                        } catch (err: any) { alert(err.message || 'Could not start payment'); }
                      }}
                        className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-1.5 rounded-lg font-semibold shadow-sm hover:shadow transition inline-flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h2m4 0h3M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
                        </svg>
                        Pay Remaining Balance — {formatPaise(e.balanceAmountPaise)}
                      </button>
                    )}
                    {['INQUIRY', 'QUOTED', 'CONFIRMED', 'ADVANCE_PAID'].includes(e.status) && (
                      <button onClick={async () => {
                        const advancePaid = e.status === 'ADVANCE_PAID';
                        const confirmMsg = advancePaid
                          ? `You've already paid ${formatPaise(e.advanceAmountPaise)} as advance. Cancelling now will start the refund process per our policy. Continue?`
                          : 'Cancel this booking?';
                        if (!confirm(confirmMsg)) return;
                        const reason = prompt('Reason for cancellation (optional):') ?? 'Customer cancelled';
                        try {
                          const token = localStorage.getItem('access_token')!;
                          const updated = await api.cancelEvent(e.id, reason, token);
                          setEvents(prev => prev.map(ev => ev.id === e.id ? updated : ev));
                        } catch (err: any) { alert(err.message || 'Failed to cancel'); }
                      }}
                        className="text-xs text-red-600 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50">Cancel</button>
                    )}
                    {(e.status === 'COMPLETED' || e.status === 'CONFIRMED' || e.status === 'ADVANCE_PAID') && (
                      <button onClick={async () => {
                        try {
                          const inv = await api.getEventInvoice(e.id);
                          openInvoice(inv);
                        } catch (err: any) {
                          alert(err.message || 'Could not load invoice');
                        }
                      }}
                        className="text-xs text-gray-600 border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-50">Invoice</button>
                    )}
                    {(() => {
                      // Mirror backend: rating unlocks on COMPLETED OR
                      // (ADVANCE_PAID/IN_PROGRESS + event date today/past).
                      // Skip if customer already rated.
                      if (e.ratingGiven) return null;
                      const eventHappened = e.eventDate
                        && (e.status === 'ADVANCE_PAID' || e.status === 'IN_PROGRESS')
                        && new Date(e.eventDate + 'T23:59:59').getTime() <= Date.now();
                      if (e.status !== 'COMPLETED' && !eventHappened) return null;
                      return (
                        <button onClick={() => setRatingModal({ id: e.id, type: 'event' })}
                          className="text-xs text-orange-600 border border-orange-200 px-3 py-1 rounded-lg hover:bg-orange-50">Rate & Review</button>
                      );
                    })()}
                    {e.ratingGiven && <span className="text-xs text-gray-500">{'★'.repeat(e.ratingGiven)} Rated</span>}
                    {e.status === 'CANCELLED' && e.cancellationReason && (
                      <span className="text-xs text-red-400">{e.cancellationReason}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRatingModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Rate your experience</h3>
            <div className="flex gap-2 mb-4 justify-center">
              {[1,2,3,4,5].map(star => (
                <button key={star} onClick={() => setRating(star)}
                  className={`text-3xl transition ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
              ))}
            </div>
            <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4" rows={3} placeholder="Tell us about your experience..." />
            <div className="flex gap-3">
              <button onClick={() => setRatingModal(null)} className="flex-1 border rounded-lg py-2 text-sm font-medium">Cancel</button>
              <button onClick={handleRate} className="flex-1 bg-orange-500 text-white rounded-lg py-2 text-sm font-semibold">Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">
              Modify {editModal.type === 'booking' ? 'Booking' : editModal.type === 'event' ? 'Event' : 'Subscription'}
            </h3>
            {editModal.type === 'booking' && editModal.item.paymentStatus === 'ADVANCE_PAID' && (
              <div className="text-xs bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4 space-y-1">
                <p className="text-blue-700 font-medium">You have already paid {formatPaise(editModal.item.advancePaidPaise || editModal.item.advanceAmountPaise)} as advance.</p>
                <p className="text-blue-600">If you change guests or meals, pricing will be recalculated:</p>
                <ul className="text-blue-600 list-disc pl-4">
                  <li><strong>Price increases</strong> — you'll need to pay the additional difference</li>
                  <li><strong>Price decreases</strong> — the excess will be credited to your balance</li>
                </ul>
              </div>
            )}
            {editModal.type === 'event' && editModal.item.status === 'QUOTED' && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg mb-4">
                Modifying a quoted event will reset it to INQUIRY status for {eventActor(editModal.item)} to re-quote.
              </p>
            )}
            <div className="space-y-3">
              {editModal.type === 'booking' && (
                <>
                  <Field label="Service Date" type="date" value={editForm.serviceDate} onChange={(v: string) => setEditForm({...editForm, serviceDate: v})} />
                  <Field label="Service Time" value={editForm.serviceTime} onChange={(v: string) => setEditForm({...editForm, serviceTime: v})} placeholder="e.g. 12:00 PM" />
                  <Field label="Guests" type="number" value={editForm.guestsCount} onChange={(v: string) => setEditForm({...editForm, guestsCount: v})} />
                  {editMenus.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Menu</label>
                      <select
                        value={editForm.menuId || ''}
                        onChange={e => setEditForm({...editForm, menuId: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="">No specific menu</option>
                        {editMenus.map((m: any) => (
                          <option key={m.id} value={m.id}>
                            {m.name} — {formatPaise(m.pricePerPlatePaise)}/plate
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-gray-400 mt-1">Changing the menu will recalculate your total.</p>
                    </div>
                  )}
                  <Chips
                    label="Appliances available in your kitchen"
                    options={APPLIANCE_OPTIONS}
                    selected={editForm.appliances || []}
                    onChange={(v) => setEditForm({...editForm, appliances: v})}
                    hint="Helps the cook know what's ready to use."
                  />
                  <Chips
                    label="Crockery available for serving"
                    options={crockeryOptionsFor(Number(editForm.guestsCount) || 0)}
                    selected={editForm.crockery || []}
                    onChange={(v) => setEditForm({...editForm, crockery: v})}
                  />
                  <Field label="Special Requests" value={editForm.specialRequests} onChange={(v: string) => setEditForm({...editForm, specialRequests: v})} textarea />
                  <Field label="Address" value={editForm.address} onChange={(v: string) => setEditForm({...editForm, address: v})} />
                  <div className="grid grid-cols-2 gap-3">
                    <CityAutocomplete value={editForm.city} onChange={(v: string) => setEditForm({...editForm, city: v})} />
                    <Field label="Pincode" value={editForm.pincode} onChange={(v: string) => setEditForm({...editForm, pincode: v})} />
                  </div>
                </>
              )}
              {editModal.type === 'event' && (
                <>
                  <Field label="Event Date" type="date" value={editForm.eventDate} onChange={(v: string) => setEditForm({...editForm, eventDate: v})} />
                  <Field label="Event Time" value={editForm.eventTime} onChange={(v: string) => setEditForm({...editForm, eventTime: v})} placeholder="e.g. 7:00 PM" />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Guests" type="number" value={editForm.guestCount} onChange={(v: string) => setEditForm({...editForm, guestCount: v})} />
                    <Field label="Duration (hrs)" type="number" value={editForm.durationHours} onChange={(v: string) => setEditForm({...editForm, durationHours: v})} />
                  </div>
                  <Field label="Venue Address" value={editForm.venueAddress} onChange={(v: string) => setEditForm({...editForm, venueAddress: v})} />
                  <div className="grid grid-cols-2 gap-3">
                    <CityAutocomplete value={editForm.city} onChange={(v: string) => setEditForm({...editForm, city: v})} />
                    <Field label="Pincode" value={editForm.pincode} onChange={(v: string) => setEditForm({...editForm, pincode: v})} />
                  </div>
                  {/* Menu Details — parse JSON menuDescription into readable form */}
                  <MenuDescriptionEditor
                    value={editForm.menuDescription}
                    onChange={(v: string) => setEditForm({...editForm, menuDescription: v})}
                  />
                  <Field label="Special Requests" value={editForm.specialRequests} onChange={(v: string) => setEditForm({...editForm, specialRequests: v})} textarea />
                </>
              )}
              {editModal.type === 'subscription' && (
                <>
                  <Field label="Meals per Day" type="number" value={editForm.mealsPerDay} onChange={(v: string) => setEditForm({...editForm, mealsPerDay: v})} />
                  <Field label="Meal Types" value={editForm.mealTypes} onChange={(v: string) => setEditForm({...editForm, mealTypes: v})} placeholder="e.g. Lunch, Dinner" />
                  <Field label="Schedule" value={editForm.schedule} onChange={(v: string) => setEditForm({...editForm, schedule: v})} placeholder="e.g. Mon-Sat" />
                  <Field label="Dietary Preferences" value={editForm.dietaryPreferences} onChange={(v: string) => setEditForm({...editForm, dietaryPreferences: v})} />
                  <Field label="Address" value={editForm.address} onChange={(v: string) => setEditForm({...editForm, address: v})} />
                  <div className="grid grid-cols-2 gap-3">
                    <CityAutocomplete value={editForm.city} onChange={(v: string) => setEditForm({...editForm, city: v})} />
                    <Field label="Pincode" value={editForm.pincode} onChange={(v: string) => setEditForm({...editForm, pincode: v})} />
                  </div>
                  <Field label="Special Requests" value={editForm.specialRequests} onChange={(v: string) => setEditForm({...editForm, specialRequests: v})} textarea />
                </>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditModal(null)} className="flex-1 border rounded-lg py-2 text-sm font-medium">Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving}
                className="flex-1 bg-orange-500 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Chef Tracking Modal ──────────────────────────────────── */}
      {trackingData && trackingBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setTrackingData(null); setTrackingBooking(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white">
              <h3 className="text-lg font-bold">Track Your Cook</h3>
              <p className="text-sm opacity-90">{trackingBooking.chefName} — {trackingBooking.bookingRef}</p>
            </div>
            <div className="p-5 space-y-4">
              {/* ETA */}
              <div className="text-center">
                {trackingData.etaMinutes > 0 ? (
                  <div>
                    <p className="text-4xl font-bold text-indigo-600">{trackingData.etaMinutes}</p>
                    <p className="text-sm text-gray-500">minutes away</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl font-bold text-gray-400">—</p>
                    <p className="text-sm text-gray-500">ETA not shared yet</p>
                  </div>
                )}
              </div>

              {/* Location */}
              {trackingData.chefLat && trackingData.chefLng ? (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-500 text-lg">📍</span>
                    <span className="text-sm font-medium text-gray-700">Live Location</span>
                    {trackingData.locationUpdatedAt && (
                      <span className="text-[10px] text-gray-400 ml-auto">
                        Updated {new Date(trackingData.locationUpdatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  {/* Map embed */}
                  <iframe
                    width="100%" height="200" style={{ border: 0, borderRadius: 12 }}
                    loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps?q=${trackingData.chefLat},${trackingData.chefLng}&z=15&output=embed`}
                  />
                  <p className="text-[10px] text-gray-400 mt-1 text-center">
                    {trackingData.chefLat.toFixed(6)}, {trackingData.chefLng.toFixed(6)}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <p className="text-3xl mb-2">🗺️</p>
                  <p className="text-sm text-gray-500">Your cook hasn't shared their location yet.</p>
                  <p className="text-xs text-gray-400 mt-1">They'll share it when they're on the way.</p>
                </div>
              )}

              {/* Booking details */}
              <div className="bg-orange-50 rounded-xl p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service</span>
                  <span className="font-medium">{trackingBooking.serviceDate} at {trackingBooking.serviceTime}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Meal</span>
                  <span className="font-medium">{trackingBooking.mealType} • {trackingBooking.guestsCount} guests</span>
                </div>
              </div>

              {/* Refresh + Close */}
              <div className="flex gap-3">
                <button onClick={async () => {
                  try {
                    const t = await api.getBookingTracking(trackingBooking.id);
                    setTrackingData(t);
                  } catch { alert('Refresh failed'); }
                }} className="flex-1 border border-indigo-200 text-indigo-600 rounded-lg py-2 text-sm font-medium hover:bg-indigo-50">
                  🔄 Refresh
                </button>
                <button onClick={() => { setTrackingData(null); setTrackingBooking(null); }}
                  className="flex-1 bg-gray-100 rounded-lg py-2 text-sm font-medium hover:bg-gray-200">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Pay 50% Advance Modal ──────────────────────────────────── */}
      {payAdvanceEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
             onClick={() => !payingAdvance && setPayAdvanceEvent(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-[fadeIn_.15s_ease-out]"
               onClick={e => e.stopPropagation()}>
            {/* Hero */}
            <div className="relative bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 px-6 pt-8 pb-16 text-white">
              <div className="absolute top-4 right-4">
                <button onClick={() => !payingAdvance && setPayAdvanceEvent(null)}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold tracking-tight">Billing Summary</h3>
              <p className="text-white/80 text-sm mt-1">Review your bill · pay 50% to lock in</p>
            </div>

            {/* Event header */}
            <div className="px-6 -mt-10 relative">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 text-lg">🎉</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{eventHeading(payAdvanceEvent)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Ref {payAdvanceEvent.bookingRef} · {formatDateTime(payAdvanceEvent.eventDate, payAdvanceEvent.eventTime)}</p>
                  <p className="text-xs text-gray-500 truncate">{payAdvanceEvent.guestCount} guests · {payAdvanceEvent.venueAddress}</p>
                </div>
              </div>
            </div>

            {/* Itemised bill */}
            <div className="px-6 pt-5 pb-2 max-h-[45vh] overflow-y-auto">
              {(() => {
                const e = payAdvanceEvent;
                const rows: { label: string; sub?: string; paise: number }[] = [];

                // Food — always present
                const foodPaise = e.totalFoodPaise || (e.pricePerPlatePaise || 0) * (e.guestCount || 0);
                if (foodPaise > 0) {
                  rows.push({
                    label: 'Food',
                    sub: e.pricePerPlatePaise ? `${e.guestCount} guests × ${formatPaise(e.pricePerPlatePaise)}/plate` : `${e.guestCount} guests`,
                    paise: foodPaise,
                  });
                }
                if (e.decorationPaise > 0) rows.push({ label: 'Decoration', paise: e.decorationPaise });
                if (e.cakePaise > 0)       rows.push({ label: 'Cake',       paise: e.cakePaise });

                // Staff breakdown — prefer staffRolesJson, else bulk staffPaise.
                const ROLE_LABEL: Record<string, string> = { waiter: 'Waiter', cleaner: 'Cleaner', bartender: 'Bartender' };
                let staffShown = false;
                if (e.staffRolesJson) {
                  try {
                    const roles = JSON.parse(e.staffRolesJson);
                    const entries = Object.entries(roles).filter(([, n]) => (n as number) > 0) as [string, number][];
                    if (entries.length > 0 && e.staffPaise > 0) {
                      const totalStaff = entries.reduce((sum, [, n]) => sum + n, 0);
                      entries.forEach(([role, count]) => {
                        // Even split by headcount — precise per-role rate isn't stored on the booking.
                        const share = Math.round((e.staffPaise * count) / totalStaff);
                        rows.push({ label: `${ROLE_LABEL[role] || role} × ${count}`, paise: share });
                      });
                      staffShown = true;
                    }
                  } catch { /* fall through to flat staff row */ }
                }
                if (!staffShown && e.staffPaise > 0) {
                  rows.push({ label: 'Service staff', paise: e.staffPaise });
                }

                // Live counters + add-ons from menuDescription (addonsJson mirror)
                if (e.menuDescription) {
                  try {
                    const md = JSON.parse(e.menuDescription);
                    if (Array.isArray(md.liveCounters) && md.liveCounters.length > 0) {
                      const names = md.liveCounters.map((c: string) => c.charAt(0).toUpperCase() + c.slice(1));
                      rows.push({ label: `Live counters`, sub: names.join(', '), paise: 0 });
                    }
                  } catch { /* not JSON */ }
                }
                if (e.otherAddonsPaise > 0) rows.push({ label: 'Other add-ons', paise: e.otherAddonsPaise });

                // Partner services (requested, chef-coordinated).
                // Each service has an estimate (midpoint of the indicative
                // range) stored in servicesJson so we can render a real
                // number per line — chef will confirm the final vendor quote
                // before the balance payment.
                let servicesEstPaise = 0;
                if (e.servicesJson) {
                  try {
                    const svcs = JSON.parse(e.servicesJson);
                    if (Array.isArray(svcs) && svcs.length > 0) {
                      for (const s of svcs) {
                        const est = typeof s.estPaise === 'number' ? s.estPaise : 0;
                        servicesEstPaise += est;
                        rows.push({
                          label: s.label || s.key,
                          sub: (s.range ? `${s.range} · ` : '') + 'estimate · chef to confirm',
                          paise: est,
                        });
                      }
                    }
                  } catch { /* ignore */ }
                }

                return (
                  <div className="space-y-1.5 text-sm">
                    {rows.map((r, i) => (
                      <div key={i} className="flex justify-between items-start gap-3 py-1.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-800">{r.label}</p>
                          {r.sub && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{r.sub}</p>}
                        </div>
                        <span className="text-gray-800 font-medium shrink-0">{r.paise > 0 ? formatPaise(r.paise) : 'Included'}</span>
                      </div>
                    ))}
                    {e.platformFeePaise > 0 && (
                      <div className="flex justify-between py-1.5 text-gray-400 text-xs border-t border-dashed border-gray-200 pt-2 mt-2">
                        <span>Platform fee</span>
                        <span>{formatPaise(e.platformFeePaise)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-3 mt-1 border-t border-gray-200 text-base">
                      <span className="font-semibold text-gray-900">Grand Total</span>
                      <span className="font-bold text-gray-900">{formatPaise(e.totalAmountPaise)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Payment split */}
            <div className="px-6 pt-3 pb-2">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between items-baseline">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-emerald-700 font-semibold">Advance due now (50%)</p>
                    <p className="text-2xl font-bold text-emerald-800 mt-0.5">{formatPaise(payAdvanceEvent.advanceAmountPaise)}</p>
                  </div>
                </div>
                <div className="flex justify-between pt-2 border-t border-emerald-200 text-xs">
                  <span className="text-gray-600">Balance — collected on event day</span>
                  <span className="font-semibold text-gray-800">{formatPaise(payAdvanceEvent.balanceAmountPaise)}</span>
                </div>
              </div>
            </div>

            {/* Trust row */}
            <div className="px-6 pt-3 pb-5">
              <div className="flex items-center gap-4 text-[11px] text-gray-500">
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Secure payment
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" /></svg>
                  Razorpay
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Full refund if chef cancels
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => !payingAdvance && setPayAdvanceEvent(null)}
                      disabled={payingAdvance}
                      className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition">
                Not now
              </button>
              <button disabled={payingAdvance}
                      onClick={async () => {
                        setPayingAdvance(true);
                        try {
                          const token = localStorage.getItem('access_token')!;
                          // Open Razorpay checkout for the advance amount. The
                          // /payments/order endpoint is bookingId-generic, so we
                          // pass the event ID — payment-service only uses it as
                          // a notes reference, it doesn't look up a booking row.
                          const order = await api.createPaymentOrder(payAdvanceEvent.id, payAdvanceEvent.advanceAmountPaise, token);
                          if (!(window as any).Razorpay) {
                            await new Promise<void>((resolve, reject) => {
                              const s = document.createElement('script');
                              s.src = 'https://checkout.razorpay.com/v1/checkout.js';
                              s.onload = () => resolve();
                              s.onerror = () => reject(new Error('Failed to load Razorpay'));
                              document.body.appendChild(s);
                            });
                          }
                          const rzp = new (window as any).Razorpay({
                            key: order.razorpayKeyId,
                            amount: order.amountPaise,
                            currency: 'INR',
                            name: 'Safar Cooks',
                            description: `Event advance — ${payAdvanceEvent.bookingRef}`,
                            order_id: order.razorpayOrderId,
                            handler: async function () {
                              try {
                                const freshToken = localStorage.getItem('access_token') || token;
                                const updated = await api.markEventAdvancePaid(payAdvanceEvent.id, freshToken);
                                setEvents(prev => prev.map(ev => ev.id === payAdvanceEvent.id ? updated : ev));
                                setPayAdvanceEvent(null);
                              } catch (err: any) {
                                alert(err.message || 'Payment succeeded but status update failed — contact support.');
                              } finally {
                                setPayingAdvance(false);
                              }
                            },
                            prefill: { name: payAdvanceEvent.customerName, contact: payAdvanceEvent.customerPhone, email: payAdvanceEvent.customerEmail },
                            theme: { color: '#f97316' },
                            modal: { ondismiss: () => setPayingAdvance(false) },
                          });
                          rzp.on('payment.failed', (r: any) => {
                            alert(r.error?.description || 'Payment failed');
                            setPayingAdvance(false);
                          });
                          rzp.open();
                        } catch (err: any) {
                          alert(err.message || 'Failed to start payment');
                          setPayingAdvance(false);
                        }
                      }}
                      className="flex-[1.4] bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl py-3 text-sm font-bold shadow-md shadow-green-500/30 disabled:opacity-60 transition inline-flex items-center justify-center gap-2">
                {payingAdvance ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Processing…
                  </>
                ) : (
                  <>Pay {formatPaise(payAdvanceEvent.advanceAmountPaise)} →</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <PeopleAlsoBooked />
    </div>
  );
}

// Opens an invoice in a new tab using a Blob URL. Chrome/Firefox block
// data:text/html popups as anti-phishing, so window.open('data:...') silently
// does nothing — that's why the Invoice button appeared broken.
function openInvoice(inv: any) {
  if (!inv) { alert('Invoice not available for this booking yet.'); return; }
  const html = renderInvoiceHtml(inv);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win || win.closed) {
    // Popup blocker — fall back to a download so the user still gets the file.
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${inv.invoiceNumber || inv.bookingRef || 'safar'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  // Release the blob after the new tab has had a chance to load it.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function renderInvoiceHtml(inv: any): string {
  const fmt = (p: number) => '\u20B9' + (p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  // Reconcile: the Food line should equal totalPaise minus all add-ons so the
  // invoice adds up. The backend stores foodPaise as guestCount × perPlate, but
  // the chef may have quoted a different total (discount, packaging, etc.),
  // which previously produced "Food 6,250 vs Total 6,000".
  const addOns = (Number(inv.decorationPaise) || 0)
               + (Number(inv.cakePaise) || 0)
               + (Number(inv.staffPaise) || 0);
  const foodForDisplay = Math.max(0, (Number(inv.totalPaise) || 0) - addOns);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${inv.invoiceNumber}</title>
<style>body{font-family:system-ui;max-width:700px;margin:40px auto;padding:20px;color:#333}
h1{color:#f97316;margin:0}table{width:100%;border-collapse:collapse;margin:16px 0}
td,th{padding:8px 12px;text-align:left;border-bottom:1px solid #eee}th{background:#f9fafb}
.total{font-weight:700;font-size:18px}.right{text-align:right}.badge{background:#f97316;color:#fff;padding:2px 8px;border-radius:12px;font-size:12px}
@media print{button{display:none}}</style></head><body>
<div style="display:flex;justify-content:space-between;align-items:center">
<div><h1>Safar</h1><p style="margin:4px 0;color:#888">${inv.company}</p><p style="margin:0;font-size:12px;color:#aaa">GSTIN: ${inv.gstin}</p></div>
<div style="text-align:right"><h2 style="margin:0">INVOICE</h2><p style="margin:4px 0;font-size:14px">${inv.invoiceNumber}</p>
<span class="badge">${inv.status}</span></div></div><hr>
<table><tr><td><strong>Customer:</strong> ${inv.customerName || '-'}</td><td><strong>Chef:</strong> ${inv.chefName || '-'}</td></tr>
<tr><td><strong>Ref:</strong> ${inv.bookingRef}</td><td><strong>Date:</strong> ${inv.serviceDate || inv.eventDate || '-'}</td></tr>
<tr><td><strong>Address:</strong> ${inv.address || inv.venueAddress || '-'}, ${inv.city || '-'}</td>
<td><strong>${inv.type === 'EVENT_BOOKING' ? 'Guests' : 'Guests'}:</strong> ${inv.guestsCount || inv.guestCount || '-'}</td></tr></table>
<table><tr><th>Item</th><th class="right">Amount</th></tr>
${foodForDisplay > 0 ? `<tr><td>Food (${inv.guestCount} guests)</td><td class="right">${fmt(foodForDisplay)}</td></tr>` : ''}
${inv.decorationPaise > 0 ? `<tr><td>Decoration</td><td class="right">${fmt(inv.decorationPaise)}</td></tr>` : ''}
${inv.cakePaise > 0 ? `<tr><td>Cake</td><td class="right">${fmt(inv.cakePaise)}</td></tr>` : ''}
${inv.staffPaise > 0 ? `<tr><td>Staff</td><td class="right">${fmt(inv.staffPaise)}</td></tr>` : ''}
<tr><td><strong>Total</strong></td><td class="right total">${fmt(inv.totalPaise)}</td></tr>
<tr><td>Advance Paid</td><td class="right" style="color:green">${fmt(inv.advancePaidPaise)}</td></tr>
<tr><td><strong>Balance Due</strong></td><td class="right" style="color:#f97316">${fmt(inv.balanceDuePaise)}</td></tr></table>
<p style="text-align:center;color:#aaa;margin-top:40px;font-size:12px">Thank you for choosing Safar Cooks!</p>
<button onclick="window.print()" style="margin:20px auto;display:block;padding:8px 24px;background:#f97316;color:#fff;border:none;border-radius:8px;cursor:pointer">Print Invoice</button>
</body></html>`;
}

const CATEGORY_META: Record<string, { label: string; icon: string; optional?: boolean }> = {
  SOUPS_BEVERAGES: { label: 'Soups & Beverages', icon: '🍜', optional: true },
  APPETIZERS:      { label: 'Appetizers', icon: '🥘' },
  MAIN_COURSE:     { label: 'Main Course', icon: '🍛' },
  BREADS:          { label: 'Breads', icon: '🫓' },
  RICE:            { label: 'Rice', icon: '🍚' },
  RAITA:           { label: 'Raita', icon: '🥣' },
  DESSERTS:        { label: 'Desserts', icon: '🍮', optional: true },
};
const CATEGORY_ORDER = ['SOUPS_BEVERAGES', 'APPETIZERS', 'MAIN_COURSE', 'BREADS', 'RICE', 'RAITA', 'DESSERTS'];

type CatalogDish = {
  id: string; name: string; category: string; pricePaise: number;
  photoUrl?: string; isVeg: boolean; isRecommended: boolean;
  noOnionGarlic: boolean; isFried: boolean;
};

function MenuDescriptionEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [catalog, setCatalog] = useState<Record<string, CatalogDish[]>>({});
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [dishSearch, setDishSearch] = useState('');

  let parsed: any = null;
  try { parsed = JSON.parse(value); } catch { /* not JSON */ }

  // Load dish catalog on mount
  useEffect(() => {
    setCatalogLoading(true);
    api.getDishCatalog()
      .then((data: any) => setCatalog(data || {}))
      .catch(() => setCatalog({}))
      .finally(() => setCatalogLoading(false));
  }, []);

  if (!parsed || typeof parsed !== 'object') {
    return <Field label="Menu Description" value={value} onChange={onChange} textarea />;
  }

  // Service-only bookings (singer, decor, cake, pandit, staff, appliances)
  // don't have a cooking menu — render their selection as a read-only summary.
  // Customers can still edit date/time/venue/special-requests above.
  const SERVICE_TYPES = ['LIVE_MUSIC', 'EVENT_DECOR', 'DESIGNER_CAKE', 'PANDIT_PUJA', 'STAFF_HIRE', 'APPLIANCE_RENTAL'];
  // Local patch helper — defined before the SERVICE_TYPES early return because
  // the regular `update` further down isn't in scope yet.
  const patchMenu = (patch: Record<string, any>) => onChange(JSON.stringify({ ...parsed, ...patch }));
  if (parsed.type && SERVICE_TYPES.includes(parsed.type)) {
    type Row = { label: string; render: () => any };
    const rows: Row[] = [];
    switch (parsed.type) {
      case 'LIVE_MUSIC':
        rows.push({ label: 'Service', render: () => 'Live Singer' });
        rows.push({
          label: 'Genre',
          render: () => (
            <select
              value={parsed.genre || ''}
              onChange={e => {
                const key = e.target.value;
                const g = SINGER_GENRES.find(x => x.key === key);
                patchMenu({ genre: key, genreLabel: g?.label || key });
              }}
              className="border border-amber-300 bg-white rounded px-2 py-0.5 text-xs text-gray-800 font-medium outline-none focus:ring-2 focus:ring-amber-300"
            >
              {!parsed.genre && <option value="">Select genre</option>}
              {SINGER_GENRES.map(g => (
                <option key={g.key} value={g.key}>{g.label}</option>
              ))}
            </select>
          ),
        });
        if (parsed.preference)            rows.push({ label: 'Sound equipment', render: () => parsed.preference === 'WITH_SOUND' ? 'Included' : 'Customer arranges' });
        if (parsed.performanceHours)      rows.push({ label: 'Performance',     render: () => `${parsed.performanceHours} hrs` });
        break;
      case 'EVENT_DECOR':
        rows.push({ label: 'Service', render: () => 'Event Decor' });
        if (parsed.decorLabel)            rows.push({ label: 'Theme', render: () => parsed.decorLabel });
        if (parsed.decorTier)             rows.push({ label: 'Tier',  render: () => parsed.decorTier });
        if (parsed.setupHours)            rows.push({ label: 'Setup', render: () => `${parsed.setupHours} hrs` });
        break;
      case 'DESIGNER_CAKE':
        rows.push({ label: 'Service', render: () => 'Designer Cake' });
        if (parsed.cakeLabel)             rows.push({ label: 'Design',  render: () => parsed.cakeLabel });
        if (parsed.weight)                rows.push({ label: 'Weight',  render: () => parsed.weight });
        if (parsed.flavour)               rows.push({ label: 'Flavour', render: () => parsed.flavour });
        if (parsed.eggless != null)       rows.push({ label: 'Eggless', render: () => parsed.eggless ? 'Yes' : 'No' });
        if (parsed.messageOnCake)         rows.push({ label: 'Message', render: () => parsed.messageOnCake });
        break;
      case 'PANDIT_PUJA':
        rows.push({ label: 'Service', render: () => 'Pandit / Puja' });
        if (parsed.pujaLabel)             rows.push({ label: 'Puja',          render: () => parsed.pujaLabel });
        if (parsed.language)              rows.push({ label: 'Language',      render: () => parsed.language });
        if (parsed.gotra)                 rows.push({ label: 'Gotra',         render: () => parsed.gotra });
        if (parsed.familyNames)           rows.push({ label: 'Sankalp names', render: () => parsed.familyNames });
        if (parsed.durationHours)         rows.push({ label: 'Duration',      render: () => `${parsed.durationHours} hrs` });
        break;
      case 'STAFF_HIRE':
        rows.push({ label: 'Service', render: () => 'Staff Hire' });
        if (parsed.roleLabel)             rows.push({ label: 'Role',  render: () => parsed.roleLabel });
        if (parsed.count)                 rows.push({ label: 'Count', render: () => String(parsed.count) });
        if (parsed.hours)                 rows.push({ label: 'Hours', render: () => `${parsed.hours} hrs` });
        break;
      case 'APPLIANCE_RENTAL':
        rows.push({ label: 'Service', render: () => 'Appliance Rental' });
        if (parsed.rentalDays)            rows.push({ label: 'Rental days', render: () => String(parsed.rentalDays) });
        if (Array.isArray(parsed.items))  rows.push({ label: 'Items',       render: () => parsed.items.map((i: any) => `${i.qty}× ${i.label}`).join(', ') });
        break;
    }
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Booked Service Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {rows.map(r => (
            <div key={r.label} className="flex justify-between items-center gap-3">
              <span className="text-gray-500 shrink-0">{r.label}</span>
              <span className="text-gray-800 font-medium text-right">{r.render()}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-amber-600/80 pt-1">
          Most service details are locked once booked. Need to swap the package entirely? Cancel and rebook, or contact support.
        </p>
      </div>
    );
  }

  function update(key: string, val: any) {
    const next = { ...parsed, [key]: val };
    onChange(JSON.stringify(next));
  }

  function updateMulti(updates: Record<string, any>) {
    const next = { ...parsed, ...updates };
    onChange(JSON.stringify(next));
  }

  const categoryCounts: Record<string, number> = parsed.categoryCounts || {};
  const selectedDishIds: string[] = parsed.selectedDishIds || [];

  function getSelectedByCategory(cat: string): string[] {
    return (catalog[cat] || []).filter(d => selectedDishIds.includes(d.id)).map(d => d.id);
  }

  function adjustCount(cat: string, delta: number) {
    const cur = categoryCounts[cat] || 0;
    const next = Math.max(0, cur + delta);
    const newCounts = { ...categoryCounts, [cat]: next };
    // Trim selected if count reduced
    const catSelected = getSelectedByCategory(cat);
    let newIds = [...selectedDishIds];
    if (next < catSelected.length) {
      const toRemove = catSelected.slice(next);
      newIds = newIds.filter(id => !toRemove.includes(id));
    }
    updateMulti({ categoryCounts: newCounts, selectedDishIds: newIds });
  }

  function toggleDish(cat: string, dishId: string) {
    const max = categoryCounts[cat] || 0;
    const catSelected = getSelectedByCategory(cat);
    let newIds = [...selectedDishIds];
    if (catSelected.includes(dishId)) {
      newIds = newIds.filter(id => id !== dishId);
    } else {
      if (catSelected.length >= max) return;
      newIds.push(dishId);
    }
    updateMulti({ selectedDishIds: newIds });
  }

  function getFilteredDishes(cat: string): CatalogDish[] {
    return (catalog[cat] || []).filter(d => {
      if (dishSearch && !d.name.toLowerCase().includes(dishSearch.toLowerCase())) return false;
      return true;
    });
  }

  const VEG_LABELS: Record<string, string> = { VEG: 'Veg Only', NON_VEG: 'Non-Veg Only', BOTH: 'Both Veg & Non-Veg' };
  const COUNTER_LABELS: Record<string, string> = {
    dosa: 'Live Dosa Counter', pasta: 'Live Pasta Counter', bbq: 'Live BBQ Counter',
    chaat: 'Live Chaat Counter', tandoor: 'Live Tandoor Counter',
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-gray-600">Menu Preferences</p>

      {/* Veg/Non-Veg */}
      <div>
        <label className="text-[11px] text-gray-500 mb-1 block">Food Preference</label>
        <div className="flex gap-2">
          {['VEG', 'NON_VEG', 'BOTH'].map(opt => (
            <button key={opt} type="button" onClick={() => update('vegNonVeg', opt)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition
                ${(parsed.vegNonVeg || 'BOTH') === opt
                  ? opt === 'VEG' ? 'bg-green-50 border-green-500 text-green-600'
                  : opt === 'NON_VEG' ? 'bg-red-50 border-red-500 text-red-600'
                  : 'bg-orange-50 border-orange-500 text-orange-600'
                  : 'border-gray-200 text-gray-500'}`}>
              {VEG_LABELS[opt]}
            </button>
          ))}
        </div>
      </div>

      {/* Add-ons */}
      <div>
        <label className="text-[11px] text-gray-500 mb-1 block">Add-ons</label>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'decoration', label: 'Decoration', icon: '🎈' },
            { key: 'cake', label: 'Designer Cake', icon: '🎂' },
            { key: 'crockery', label: 'Crockery', icon: '🍽️' },
            { key: 'appliances', label: 'Appliances', icon: '🔌' },
            { key: 'tableSetup', label: 'Table Setup', icon: '🕯️' },
          ].map(addon => (
            <button key={addon.key} type="button" onClick={() => update(addon.key, !parsed[addon.key])}
              className={`text-xs px-3 py-1.5 rounded-lg border transition flex items-center gap-1
                ${parsed[addon.key] ? 'bg-orange-50 border-orange-400 text-orange-700' : 'border-gray-200 text-gray-500'}`}>
              <span>{addon.icon}</span> {addon.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Counters */}
      <div>
        <label className="text-[11px] text-gray-500 mb-1 block">Live Counters</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(COUNTER_LABELS).map(([key, label]) => {
            const selected = (parsed.liveCounters || []).includes(key);
            return (
              <button key={key} type="button"
                onClick={() => {
                  const counters = parsed.liveCounters || [];
                  update('liveCounters', selected ? counters.filter((c: string) => c !== key) : [...counters, key]);
                }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition
                  ${selected ? 'bg-orange-50 border-orange-400 text-orange-700' : 'border-gray-200 text-gray-500'}`}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Extra Staff */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={!!parsed.extraStaff}
            onChange={e => update('extraStaff', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-orange-500" />
          <span className="text-xs text-gray-700">Extra Serving Staff</span>
        </label>
        {parsed.extraStaff && (
          <input type="number" min={1} max={20} value={parsed.staffCount || 2}
            onChange={e => update('staffCount', Number(e.target.value))}
            className="w-16 border rounded px-2 py-1 text-xs" />
        )}
      </div>

      {/* ── Dish Selection (full Coox.in picker) ── */}
      <div className="border-t pt-3">
        <p className="text-xs font-medium text-gray-600 mb-2">Dish Selection</p>

        {catalogLoading ? (
          <div className="animate-pulse space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-8 bg-gray-100 rounded" />)}
          </div>
        ) : (
          <>
            {/* Category dish counts */}
            <div className="space-y-2 mb-3">
              {CATEGORY_ORDER.map(cat => {
                const meta = CATEGORY_META[cat];
                const count = categoryCounts[cat] || 0;
                const dishCount = (catalog[cat] || []).length;
                return (
                  <div key={cat} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{meta.icon}</span>
                      <span className="text-xs font-medium text-gray-700">{meta.label}</span>
                      {meta.optional && <span className="text-[9px] text-gray-400 bg-gray-50 px-1 py-0.5 rounded">opt</span>}
                      <span className="text-[9px] text-gray-400">({dishCount})</span>
                    </div>
                    <div className="flex items-center">
                      <button type="button" onClick={() => adjustCount(cat, -1)}
                        className="w-7 h-7 rounded-l border border-r-0 bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold text-sm flex items-center justify-center">-</button>
                      <div className="w-8 h-7 border flex items-center justify-center text-xs font-bold bg-orange-500 text-white">{count}</div>
                      <button type="button" onClick={() => adjustCount(cat, 1)}
                        className="w-7 h-7 rounded-r border border-l-0 bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold text-sm flex items-center justify-center">+</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dish picker per category */}
            {CATEGORY_ORDER.filter(cat => (categoryCounts[cat] || 0) > 0).length > 0 && (
              <div className="border rounded-lg p-3 bg-gray-50">
                {/* Search */}
                <div className="relative mb-2">
                  <svg className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input value={dishSearch} onChange={e => setDishSearch(e.target.value)}
                    placeholder="Search dishes..." className="w-full border rounded pl-8 pr-3 py-1.5 text-xs bg-white outline-none focus:ring-1 focus:ring-orange-300" />
                </div>

                {CATEGORY_ORDER.filter(cat => (categoryCounts[cat] || 0) > 0).map(cat => {
                  const meta = CATEGORY_META[cat];
                  const maxCount = categoryCounts[cat] || 0;
                  const catSelected = getSelectedByCategory(cat);
                  const filtered = getFilteredDishes(cat);
                  const isExpanded = expandedCat === cat;

                  return (
                    <div key={cat} className="mb-2">
                      <button type="button" onClick={() => setExpandedCat(isExpanded ? null : cat)}
                        className="w-full flex items-center justify-between py-2 border-b hover:bg-white transition px-1 rounded text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{meta.icon}</span>
                          <span className="text-xs font-semibold text-gray-700">{meta.label}</span>
                          <span className="text-[10px] text-gray-400">({catSelected.length}/{maxCount})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {catSelected.length > 0 && (
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {catSelected.map(id => {
                                const d = (catalog[cat] || []).find(x => x.id === id);
                                return d ? (
                                  <span key={id} className="text-[9px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                    {d.name}
                                    <button type="button" onClick={e => { e.stopPropagation(); toggleDish(cat, id); }}
                                      className="text-red-400 hover:text-red-600">&times;</button>
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                          <svg className={`w-3.5 h-3.5 text-gray-400 transition ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="mt-1 space-y-0.5 max-h-52 overflow-y-auto">
                          {filtered.length === 0 ? (
                            <p className="text-[10px] text-gray-400 py-2 text-center">No dishes match</p>
                          ) : filtered.map(dish => {
                            const isSelected = catSelected.includes(dish.id);
                            const canSelect = catSelected.length < maxCount;
                            return (
                              <button key={dish.id} type="button" onClick={() => toggleDish(cat, dish.id)}
                                disabled={!isSelected && !canSelect}
                                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg border transition text-left
                                  ${isSelected ? 'bg-orange-50 border-orange-300' : 'border-transparent hover:bg-white'}
                                  ${!isSelected && !canSelect ? 'opacity-30 cursor-not-allowed' : ''}`}>
                                <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center shrink-0 overflow-hidden">
                                  {dish.photoUrl ? <img src={dish.photoUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-sm opacity-40">{meta.icon}</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span className={`w-3 h-3 rounded-sm border-2 flex items-center justify-center shrink-0 ${dish.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                                    </span>
                                    <span className="text-xs font-medium text-gray-800 truncate">{dish.name}</span>
                                    {dish.isRecommended && <span className="text-[8px] bg-orange-500 text-white px-1 py-0.5 rounded font-bold shrink-0">TOP</span>}
                                  </div>
                                </div>
                                <span className="text-[10px] font-semibold text-gray-600 shrink-0">{formatPaise(dish.pricePaise)}</span>
                                {isSelected && (
                                  <svg className="w-4 h-4 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Summary */}
                {selectedDishIds.length > 0 && (
                  <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                    {selectedDishIds.length} dish{selectedDishIds.length !== 1 ? 'es' : ''} selected
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, textarea }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; textarea?: boolean;
}) {
  const cls = "w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-orange-300 focus:border-orange-400 outline-none";
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} className={cls} rows={2} placeholder={placeholder} />
      ) : type === 'date' ? (
        <DateField value={value} onChange={e => onChange(e.target.value)} className={cls} placeholder={placeholder} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className={cls} placeholder={placeholder} />
      )}
    </div>
  );
}
