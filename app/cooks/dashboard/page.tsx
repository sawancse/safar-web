'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPaise, formatDate, formatDateTime } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
  NO_SHOW: 'bg-gray-200 text-gray-600',
  INQUIRY: 'bg-yellow-100 text-yellow-700',
  QUOTED: 'bg-blue-100 text-blue-700',
  ADVANCE_PAID: 'bg-indigo-100 text-indigo-700',
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
};

const BADGE_STYLES: Record<string, string> = {
  TOP_CHEF: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white',
  TOP_10: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white',
  RISING_STAR: 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white',
  VERIFIED_PRO: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
};

type ViewState = 'loading' | 'not-logged-in' | 'not-chef' | 'suspended' | 'error' | 'ready';

export default function ChefDashboardPage() {
  const router = useRouter();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [chef, setChef] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [bookingsError, setBookingsError] = useState('');
  const [gallery, setGallery] = useState<any[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [quoteModal, setQuoteModal] = useState<string | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', cuisines: '', dailyRate: '', monthlyRate: '', eventRate: '',
    experience: '', specialties: '', bio: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { setViewState('not-logged-in'); return; }

    api.getMyChefProfile(token)
      .then(async (profile) => {
        setChef(profile);
        if (profile?.verificationStatus === 'SUSPENDED') {
          setViewState('suspended');
          return;
        }
        // Load bookings + gallery
        try {
          const [b, e, s] = await Promise.all([
            api.getChefIncomingBookings(token),
            api.getChefIncomingEvents(token).catch(() => []),
            api.getChefIncomingSubscriptions(token).catch(() => []),
          ]);
          setBookings(b || []);
          setEvents(e || []);
          setSubscriptions(s || []);
        } catch (err: any) {
          console.error('Failed to load chef bookings:', err);
          setBookingsError(err?.message || 'Failed to load bookings');
        }
        // Load gallery
        if (profile?.id) {
          api.getChefPhotos(profile.id).then(p => setGallery(p || [])).catch(() => {});
        }
        setViewState('ready');
      })
      .catch((err) => {
        if (err?.message?.includes('not found') || err?.status === 404) {
          setViewState('not-chef');
        } else {
          setErrorMsg(err?.message || 'Failed to load chef profile');
          setViewState('error');
        }
      });
  }, []);

  const token = () => localStorage.getItem('access_token')!;

  async function handleConfirm(id: string) {
    try {
      const updated = await api.confirmChefBooking(id, token());
      setBookings(prev => prev.map(b => b.id === id ? updated : b));
    } catch (e: any) { alert(e.message || 'Failed to confirm'); }
  }

  async function handleComplete(id: string) {
    try {
      const updated = await api.completeChefBooking(id, token());
      setBookings(prev => prev.map(b => b.id === id ? updated : b));
    } catch (e: any) { alert(e.message || 'Failed to complete'); }
  }

  async function handleCancelBooking(id: string) {
    if (!confirm('Decline this booking? The customer will be notified.')) return;
    try {
      await api.cancelChefBooking(id, 'Chef declined', token());
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b));
    } catch (e: any) { alert(e.message || 'Failed to cancel'); }
  }

  async function handleSendQuote() {
    if (!quoteModal || !quoteAmount) return;
    try {
      const paise = Math.round(Number(quoteAmount) * 100);
      const updated = await api.quoteEvent(quoteModal, paise, token());
      setEvents(prev => prev.map(e => e.id === quoteModal ? updated : e));
      setQuoteModal(null);
      setQuoteAmount('');
    } catch (e: any) { alert(e.message || 'Failed to send quote'); }
  }

  async function handleCompleteEvent(id: string) {
    try {
      const updated = await api.completeEvent(id, token());
      setEvents(prev => prev.map(e => e.id === id ? updated : e));
    } catch (e: any) { alert(e.message || 'Failed to complete'); }
  }

  async function handleToggleAvailability() {
    try {
      const updated = await api.toggleChefAvailability(token());
      setChef(updated);
    } catch (e: any) { alert(e.message || 'Failed to toggle'); }
  }

  // Active watchPosition per booking so the chef can auto-share location
  // (like Swiggy's delivery partner tracking) instead of pressing "Share" every few min.
  const liveWatchRef = useRef<Record<string, { watchId: number; lastPostMs: number; eta: number }>>({});
  const [liveSharing, setLiveSharing] = useState<Set<string>>(new Set());

  function startLiveShare(bookingId: string) {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    const etaStr = prompt('How many minutes until you arrive? (e.g. 15)');
    if (etaStr == null) return;
    const eta = parseInt(etaStr) || 0;
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        const entry = liveWatchRef.current[bookingId];
        // Throttle to one POST per 30s so we don't hammer the API.
        if (entry && now - entry.lastPostMs < 30_000) return;
        try {
          await api.updateChefLocation(bookingId, pos.coords.latitude, pos.coords.longitude, entry?.eta ?? eta, token());
          if (liveWatchRef.current[bookingId]) liveWatchRef.current[bookingId].lastPostMs = now;
          setBookings(prev => prev.map(b => b.id === bookingId
            ? { ...b, chefLat: pos.coords.latitude, chefLng: pos.coords.longitude, etaMinutes: entry?.eta ?? eta, locationUpdatedAt: new Date().toISOString() }
            : b));
        } catch {}
      },
      (err) => { alert('Location access denied: ' + err.message); stopLiveShare(bookingId); },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 }
    );
    liveWatchRef.current[bookingId] = { watchId, lastPostMs: 0, eta };
    setLiveSharing(prev => new Set([...prev, bookingId]));
  }

  function stopLiveShare(bookingId: string) {
    const entry = liveWatchRef.current[bookingId];
    if (entry) {
      navigator.geolocation.clearWatch(entry.watchId);
      delete liveWatchRef.current[bookingId];
    }
    setLiveSharing(prev => { const n = new Set(prev); n.delete(bookingId); return n; });
  }

  // Stop all watches on unmount to avoid leaking geolocation listeners.
  useEffect(() => () => {
    Object.values(liveWatchRef.current).forEach(e => { try { navigator.geolocation.clearWatch(e.watchId); } catch {} });
    liveWatchRef.current = {};
  }, []);

  async function shareLocation(bookingId: string) {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const etaStr = prompt('How many minutes until you arrive? (e.g. 15)');
        const eta = etaStr ? parseInt(etaStr) : 0;
        try {
          await api.updateChefLocation(bookingId, pos.coords.latitude, pos.coords.longitude, eta, token());
          alert(`Location shared! ETA: ${eta} min\nCustomer can now track you.`);
          // Update booking in state
          setBookings(prev => prev.map(b => b.id === bookingId
            ? { ...b, chefLat: pos.coords.latitude, chefLng: pos.coords.longitude, etaMinutes: eta }
            : b));
        } catch (e: any) { alert(e.message || 'Failed to share location'); }
      },
      (err) => { alert('Location access denied: ' + err.message); },
      { enableHighAccuracy: true }
    );
  }

  // ── Non-ready states ──────────────────────────────────────────

  if (viewState === 'loading') return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="flex items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Loading your chef dashboard...</p>
        </div>
      </div>
    </div>
  );

  if (viewState === 'not-logged-in') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔐</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
        <p className="text-sm text-gray-500 mb-6">Please login to access your chef dashboard.</p>
        <Link href="/auth" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-xl transition">
          Login / Sign Up
        </Link>
      </div>
    </div>
  );

  if (viewState === 'not-chef') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-lg w-full text-center">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">👨‍🍳</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Become a Safar Cook</h2>
        <p className="text-gray-500 mb-2">You haven't registered as a chef yet.</p>
        <p className="text-sm text-gray-400 mb-8">Join hundreds of home cooks and professional chefs earning on Safar. Set your own hours, menu, and pricing.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/cooks/register"
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-xl transition text-center">
            Register as Chef
          </Link>
          <Link href="/cooks"
            className="border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-8 py-3 rounded-xl transition text-center">
            Browse Cooks
          </Link>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-3">Already registered with a different login?</p>
          <button
            onClick={async () => {
              try {
                await api.claimChefProfile(token());
                window.location.reload();
              } catch (err: any) {
                const msg = err?.status === 404
                  ? 'No existing chef profile found matching your phone or email.'
                  : (err?.message || 'Could not claim profile');
                alert(msg);
              }
            }}
            className="text-sm text-[#003B95] font-medium hover:underline">
            Claim my existing chef profile →
          </button>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-orange-500">0%</p>
            <p className="text-xs text-gray-400">Commission first month</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-500">85%</p>
            <p className="text-xs text-gray-400">You keep per booking</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-500">500+</p>
            <p className="text-xs text-gray-400">Cities across India</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (viewState === 'suspended') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-lg w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">⛔</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Account Suspended</h2>
        <p className="text-gray-600 mb-2">Your chef account has been suspended by Safar admin.</p>
        <p className="text-sm text-gray-400 mb-8">You cannot accept new bookings or appear in search results. If you believe this is a mistake, please reach out to our support team.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="mailto:support@safar.com?subject=Chef%20Account%20Suspension%20Appeal"
            className="bg-[#003B95] hover:bg-[#00296b] text-white font-semibold px-8 py-3 rounded-xl transition text-center">
            Contact Support
          </a>
          <Link href="/"
            className="border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-8 py-3 rounded-xl transition text-center">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );

  if (viewState === 'error') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-500 mb-4">{errorMsg}</p>
        <button onClick={() => window.location.reload()}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-xl transition">
          Try Again
        </button>
      </div>
    </div>
  );

  if (!chef) return null;

  // ── Dashboard data ────────────────────────────────────────────

  const pendingBookings = bookings.filter(b => b.status === 'PENDING' || b.status === 'PENDING_PAYMENT');
  const activeBookings = bookings.filter(b => ['CONFIRMED', 'IN_PROGRESS'].includes(b.status));
  const inquiryEvents = events.filter(e => e.status === 'INQUIRY');
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
  const completedEvents = events.filter(e => e.status === 'COMPLETED');
  const totalEarnings = completedBookings.reduce((s, b) => s + (b.chefEarningsPaise || 0), 0)
    + completedEvents.reduce((s, e) => s + (e.chefEarningsPaise || 0), 0);
  const thisMonthEarnings = [...completedBookings, ...completedEvents]
    .filter(b => b.completedAt && new Date(b.completedAt).getMonth() === new Date().getMonth())
    .reduce((s, b) => s + (b.chefEarningsPaise || 0), 0);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'bookings', label: `Bookings (${bookings.length})` },
    { key: 'events', label: `Events (${events.length})` },
    { key: 'subscriptions', label: `Subscriptions (${subscriptions.length})` },
    { key: 'gallery', label: `Gallery (${gallery.length})` },
    { key: 'profile', label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {chef.profilePhotoUrl ? (
              <img src={chef.profilePhotoUrl} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-200" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg">👨‍🍳</div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-gray-900">{chef.name}</h1>
                {chef.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${BADGE_STYLES[chef.badge] || 'bg-gray-200'}`}>
                    {chef.badge.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">{chef.chefType?.replace(/_/g, ' ')} | {chef.city}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 text-sm">
              <span className="text-yellow-500">★</span>
              <span className="font-semibold">{chef.rating?.toFixed(1) || '0.0'}</span>
              <span className="text-gray-400">({chef.reviewCount || 0})</span>
            </div>
            <button onClick={handleToggleAvailability}
              className={`text-xs px-4 py-2 rounded-full font-semibold transition-all shadow-sm ${
                chef.available
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
              }`}>
              <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${chef.available ? 'bg-green-200' : 'bg-gray-400'}`} />
              {chef.available ? 'Online' : 'Offline'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition
                ${activeTab === t.key
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ──────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {bookingsError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <span className="text-red-500 text-lg">!</span>
                <div>
                  <p className="text-sm font-semibold text-red-700">Failed to load bookings</p>
                  <p className="text-xs text-red-600 mt-0.5">{bookingsError}</p>
                  <button onClick={() => window.location.reload()} className="text-xs text-red-700 underline mt-1">Retry</button>
                </div>
              </div>
            )}
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon="🔔" label="Pending" value={pendingBookings.length} sub="need confirmation" accent="orange" />
              <StatCard icon="📩" label="Inquiries" value={inquiryEvents.length} sub="need quotes" accent="blue" />
              <StatCard icon="📅" label="Active" value={activeBookings.length} sub="upcoming / in-progress" accent="purple" />
              <StatCard icon="💰" label="This Month" value={formatPaise(thisMonthEarnings)} sub="earnings" accent="green" />
            </div>

            {/* Quick Actions */}
            {(pendingBookings.length > 0 || inquiryEvents.length > 0) && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Needs Your Attention</h3>
                {pendingBookings.map(b => (
                  <ActionCard key={b.id} type="booking"
                    title={`${b.customerName || 'Customer'} — ${b.mealType || 'Meal'}`}
                    subtitle={`${formatDateTime(b.serviceDate, b.serviceTime)} · ${b.guestsCount} guests · ${b.city}`}
                    amount={b.chefEarningsPaise}
                    status={b.status}
                    actions={
                      b.status === 'PENDING' ? (
                        <>
                          <button onClick={() => handleConfirm(b.id)}
                            className="text-xs bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg font-medium transition">Accept</button>
                          <button onClick={() => handleCancelBooking(b.id)}
                            className="text-xs border border-red-200 text-red-600 px-4 py-1.5 rounded-lg hover:bg-red-50 transition">Decline</button>
                        </>
                      ) : (
                        <span className="text-xs text-amber-600 font-medium">Awaiting customer payment</span>
                      )
                    }
                  />
                ))}
                {inquiryEvents.map(e => (
                  <ActionCard key={e.id} type="event"
                    title={`${e.customerName || 'Customer'} — ${e.eventType}`}
                    subtitle={`${formatDate(e.eventDate)} · ${e.guestCount} guests · ${e.city}${e.customerPhone ? ' · ' + e.customerPhone : ''}`}
                    note={formatEventMenu(e.menuDescription) || e.cuisinePreferences}
                    amount={e.totalAmountPaise}
                    status={e.status}
                    actions={
                      <button onClick={() => { setQuoteModal(e.id); setQuoteAmount(String((e.totalAmountPaise || 0) / 100)); }}
                        className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg font-medium transition">Send Quote</button>
                    }
                  />
                ))}
              </div>
            )}

            {pendingBookings.length === 0 && inquiryEvents.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border">
                <span className="text-4xl block mb-3">✨</span>
                <p className="text-gray-700 font-medium">All caught up!</p>
                <p className="text-sm text-gray-400 mt-1">No pending bookings or inquiries right now.</p>
              </div>
            )}

            {/* Earnings Summary */}
            <div className="bg-white rounded-2xl border p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Earnings Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{formatPaise(totalEarnings)}</p>
                  <p className="text-xs text-gray-400 mt-1">Total Lifetime</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{completedBookings.length + completedEvents.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Completed Orders</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-500">{chef.completionRate?.toFixed(0) || 100}%</p>
                  <p className="text-xs text-gray-400 mt-1">Completion Rate</p>
                </div>
              </div>
              {chef.referralCode && (
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Your Referral Code</p>
                    <p className="font-bold text-orange-500">{chef.referralCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Referral Earnings</p>
                    <p className="font-bold text-green-600">{formatPaise(chef.referralEarningsPaise || 0)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Bookings Tab ──────────────────────────────────────── */}
        {activeTab === 'bookings' && (
          <div className="space-y-3">
            {bookingsError ? (
              <div className="text-center py-16 bg-white rounded-2xl border">
                <span className="text-5xl block mb-3">⚠️</span>
                <p className="text-gray-700 font-medium">Could not load bookings</p>
                <p className="text-sm text-red-500 mt-1">{bookingsError}</p>
                <button onClick={() => window.location.reload()} className="mt-3 text-sm text-orange-500 underline">Retry</button>
              </div>
            ) : bookings.length === 0 ? (
              <EmptyState icon="📋" title="No bookings yet" sub="When customers book you, their requests will appear here." />
            ) : bookings.map(b => (
              <div key={b.id} className="bg-white border rounded-2xl p-5 hover:shadow-sm transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{b.customerName || 'Customer'}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status] || 'bg-gray-100'}`}>
                        {b.status === 'PENDING_PAYMENT' ? 'Awaiting Payment' : b.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{b.bookingRef} · {formatDateTime(b.serviceDate, b.serviceTime)} · {b.mealType}</p>
                    <p className="text-xs text-gray-500">{b.guestsCount} guests | {b.address}, {b.city}</p>
                    {b.specialRequests && <p className="text-xs text-orange-600 mt-1 italic">"{b.specialRequests}"</p>}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-gray-900">{formatPaise(b.totalAmountPaise)}</p>
                    <p className="text-xs text-green-600 font-medium">You earn {formatPaise(b.chefEarningsPaise)}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  {b.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleConfirm(b.id)}
                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg font-medium transition">Accept</button>
                      <button onClick={() => handleCancelBooking(b.id)}
                        className="text-xs border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">Decline</button>
                    </>
                  )}
                  {(b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') && (
                    <>
                      <button onClick={() => handleComplete(b.id)}
                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg font-medium transition">Mark Complete</button>
                      <button onClick={() => shareLocation(b.id)}
                        className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-medium transition">📍 Share once</button>
                      {liveSharing.has(b.id) ? (
                        <button onClick={() => stopLiveShare(b.id)}
                          className="text-xs bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg font-medium transition flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Stop live
                        </button>
                      ) : (
                        <button onClick={() => startLiveShare(b.id)}
                          className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-medium transition">🛰️ Share live</button>
                      )}
                    </>
                  )}
                  {b.status === 'COMPLETED' && <span className="text-xs text-green-600 font-medium">Completed ✓</span>}
                  {b.status === 'CANCELLED' && <span className="text-xs text-red-500">Cancelled</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Events Tab ────────────────────────────────────────── */}
        {activeTab === 'events' && (
          <div className="space-y-3">
            {events.length === 0 ? (
              <EmptyState icon="🎉" title="No event inquiries yet" sub="Event catering requests from customers will show up here." />
            ) : events.map(e => (
              <div key={e.id} className="bg-white border rounded-2xl p-5 hover:shadow-sm transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{e.customerName || 'Customer'}</p>
                      <span className="text-xs text-gray-400">— {e.eventType}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[e.status] || 'bg-gray-100'}`}>
                        {e.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{e.bookingRef} · {formatDateTime(e.eventDate, e.eventTime)} · {e.durationHours}h</p>
                    <p className="text-xs text-gray-500">{e.guestCount} guests | {e.venueAddress}, {e.city}</p>
                    {e.cuisinePreferences && <p className="text-xs text-gray-500">Cuisine: {e.cuisinePreferences}</p>}
                    {e.menuDescription && (() => {
                      let md: any = null;
                      try { md = JSON.parse(e.menuDescription); } catch { /* not JSON */ }
                      if (!md || typeof md !== 'object') {
                        return <p className="text-xs text-orange-600 mt-1 italic">Menu: "{e.menuDescription}"</p>;
                      }
                      const VEG_LABEL: Record<string, string> = { VEG: 'Veg', NON_VEG: 'Non-Veg', BOTH: 'Veg + Non-Veg' };
                      const CAT_LABEL: Record<string, string> = {
                        SOUPS_BEVERAGES: 'Soups/Beverages', APPETIZERS: 'Appetizers',
                        MAIN_COURSE: 'Main Course', BREADS: 'Breads', RICE: 'Rice',
                        RAITA: 'Raita', DESSERTS: 'Desserts',
                      };
                      const COUNTER_LABEL: Record<string, string> = {
                        dosa: 'Dosa', pasta: 'Pasta', bbq: 'BBQ', chaat: 'Chaat', tandoor: 'Tandoor',
                      };
                      const chips: { label: string; tone: 'green' | 'red' | 'orange' | 'blue' | 'gray' }[] = [];
                      if (md.vegNonVeg) chips.push({
                        label: VEG_LABEL[md.vegNonVeg] || md.vegNonVeg,
                        tone: md.vegNonVeg === 'VEG' ? 'green' : md.vegNonVeg === 'NON_VEG' ? 'red' : 'orange',
                      });
                      if (md.decoration) chips.push({ label: 'Decoration', tone: 'orange' });
                      if (md.cake) chips.push({ label: 'Cake', tone: 'orange' });
                      if (md.crockery) chips.push({ label: 'Crockery', tone: 'gray' });
                      if (md.appliances) chips.push({ label: 'Appliances', tone: 'gray' });
                      if (md.tableSetup) chips.push({ label: 'Table Setup', tone: 'gray' });
                      if (md.extraStaff) chips.push({ label: `${md.staffCount || 2} staff`, tone: 'blue' });
                      (md.liveCounters || []).forEach((c: string) =>
                        chips.push({ label: `${COUNTER_LABEL[c] || c} counter`, tone: 'blue' })
                      );
                      const counts = md.categoryCounts || {};
                      const dishLines = Object.keys(counts)
                        .filter(k => counts[k] > 0)
                        .map(k => `${counts[k]} ${CAT_LABEL[k] || k}`);
                      const selCount = (md.selectedDishIds || []).length;
                      const TONE: Record<string, string> = {
                        green: 'bg-green-50 text-green-700',
                        red: 'bg-red-50 text-red-700',
                        orange: 'bg-orange-50 text-orange-700',
                        blue: 'bg-blue-50 text-blue-700',
                        gray: 'bg-gray-100 text-gray-600',
                      };
                      return (
                        <div className="mt-1">
                          {chips.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {chips.map((c, i) => (
                                <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full ${TONE[c.tone]}`}>{c.label}</span>
                              ))}
                            </div>
                          )}
                          {dishLines.length > 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                              Menu: {dishLines.join(' · ')}
                              {selCount > 0 && <span className="text-gray-400"> ({selCount} dish{selCount === 1 ? '' : 'es'} picked)</span>}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                    {e.specialRequests && <p className="text-xs text-orange-600 italic">Note: "{e.specialRequests}"</p>}
                    {e.customerPhone && <p className="text-xs text-blue-600 mt-1">Contact: {e.customerPhone} {e.customerEmail ? `| ${e.customerEmail}` : ''}</p>}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-gray-900">{formatPaise(e.totalAmountPaise)}</p>
                    <p className="text-xs text-green-600 font-medium">You earn {formatPaise(e.chefEarningsPaise)}</p>
                    {e.decorationPaise > 0 && <p className="text-[10px] text-gray-400">+Decor {formatPaise(e.decorationPaise)}</p>}
                    {e.staffPaise > 0 && <p className="text-[10px] text-gray-400">+Staff {formatPaise(e.staffPaise)}</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  {e.status === 'INQUIRY' && (
                    <button onClick={() => { setQuoteModal(e.id); setQuoteAmount(String((e.totalAmountPaise || 0) / 100)); }}
                      className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg font-medium transition">Send Quote</button>
                  )}
                  {e.status === 'QUOTED' && <span className="text-xs text-blue-600 font-medium">Quote sent — waiting for customer</span>}
                  {(e.status === 'ADVANCE_PAID' || e.status === 'IN_PROGRESS') && (
                    <button onClick={() => handleCompleteEvent(e.id)}
                      className="text-xs bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg font-medium transition">Mark Complete</button>
                  )}
                  {e.status === 'COMPLETED' && <span className="text-xs text-green-600 font-medium">Completed ✓</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Subscriptions Tab ─────────────────────────────────── */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-3">
            {subscriptions.length === 0 ? (
              <EmptyState icon="📆" title="No subscriptions yet" sub="Monthly meal subscription customers will appear here." />
            ) : subscriptions.map(s => (
              <div key={s.id} className="bg-white border rounded-2xl p-5 hover:shadow-sm transition">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{s.customerName || 'Customer'}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status] || 'bg-gray-100'}`}>{s.status}</span>
                    </div>
                    <p className="text-xs text-gray-500">{s.subscriptionRef} | {s.mealsPerDay} meals/day | {s.schedule}</p>
                    <p className="text-xs text-gray-500">{s.mealTypes} | {s.address}, {s.city}</p>
                    {s.dietaryPreferences && <p className="text-xs text-orange-600 mt-1">Diet: {s.dietaryPreferences}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatPaise(s.monthlyRatePaise)}<span className="text-xs text-gray-400">/mo</span></p>
                    <p className="text-xs text-green-600 font-medium">You earn {formatPaise(s.chefEarningsPaise)}/mo</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Gallery Tab ───────────────────────────────────────── */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-2xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">My Cooking Gallery</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Upload photos and videos of your dishes to attract customers ({gallery.length}/20)</p>
                </div>
              </div>
              <div className="flex gap-3">
                <label className="flex-1 border-2 border-dashed border-orange-200 rounded-xl py-6 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 transition">
                  <span className="text-3xl mb-1">📷</span>
                  <span className="text-sm font-medium text-orange-600">Upload Photo</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">JPG, PNG (max 5MB)</span>
                  <input type="file" accept="image/*" className="hidden" disabled={galleryUploading} onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !token) return;
                    setGalleryUploading(true);
                    try {
                      const caption = prompt('Add a caption (optional):') || '';
                      const url = await api.uploadGenericFile(file, 'chef-gallery', token());
                      const photo = await api.addChefPhoto(url, caption, 'FOOD', token(), 'IMAGE');
                      setGallery(prev => [...prev, photo]);
                    } catch { alert('Failed to upload photo'); }
                    setGalleryUploading(false);
                    e.target.value = '';
                  }} />
                </label>
                <label className="flex-1 border-2 border-dashed border-purple-200 rounded-xl py-6 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 transition">
                  <span className="text-3xl mb-1">🎬</span>
                  <span className="text-sm font-medium text-purple-600">Upload Video</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">MP4, MOV (max 50MB, 5 max)</span>
                  <input type="file" accept="video/*" className="hidden" disabled={galleryUploading} onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !token) return;
                    if (file.size > 50 * 1024 * 1024) { alert('Video must be under 50MB'); return; }
                    setGalleryUploading(true);
                    try {
                      const caption = prompt('Add a caption (optional):') || '';
                      const url = await api.uploadGenericFile(file, 'chef-videos', token());
                      const video = await api.addChefPhoto(url, caption, 'COOKING', token(), 'VIDEO');
                      setGallery(prev => [...prev, video]);
                    } catch { alert('Failed to upload video'); }
                    setGalleryUploading(false);
                    e.target.value = '';
                  }} />
                </label>
              </div>
              {galleryUploading && (
                <div className="mt-3 flex items-center gap-2 text-sm text-orange-600">
                  <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </div>
              )}
            </div>

            {/* Intro Video */}
            <div className="bg-white rounded-2xl border p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Intro Video</h3>
              <p className="text-xs text-gray-400 mb-3">A short intro video shown prominently on your profile. Tell customers about yourself and your cooking style.</p>
              {chef.introVideoUrl ? (
                <div className="space-y-2">
                  <video src={chef.introVideoUrl} controls className="w-full rounded-xl max-h-64 bg-black" />
                  <button onClick={async () => {
                    try {
                      await api.updateChefProfile({ introVideoUrl: '' }, token());
                      setChef((prev: any) => ({ ...prev, introVideoUrl: null }));
                    } catch { alert('Failed to remove video'); }
                  }} className="text-xs text-red-500 hover:underline">Remove intro video</button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition">
                  <span className="text-4xl mb-2">🎥</span>
                  <span className="text-sm font-medium text-gray-600">Upload Intro Video</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">MP4, MOV (max 50MB)</span>
                  <input type="file" accept="video/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !token) return;
                    if (file.size > 50 * 1024 * 1024) { alert('Video must be under 50MB'); return; }
                    setGalleryUploading(true);
                    try {
                      const url = await api.uploadGenericFile(file, 'chef-intro', token());
                      await api.updateChefProfile({ introVideoUrl: url }, token());
                      setChef((prev: any) => ({ ...prev, introVideoUrl: url }));
                    } catch { alert('Failed to upload intro video'); }
                    setGalleryUploading(false);
                    e.target.value = '';
                  }} />
                </label>
              )}
            </div>

            {/* Gallery Grid */}
            {gallery.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border">
                <span className="text-5xl block mb-3">📸</span>
                <p className="text-gray-700 font-medium">No photos or videos yet</p>
                <p className="text-sm text-gray-400 mt-1">Upload your best dishes to attract more customers.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gallery.map((item: any) => (
                  <div key={item.id} className="relative group rounded-xl overflow-hidden border bg-white">
                    {item.mediaType === 'VIDEO' ? (
                      <video src={item.url} controls className="w-full h-48 object-cover bg-black" />
                    ) : (
                      <img src={item.url} alt={item.caption || 'Cooking photo'} className="w-full h-48 object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-3">
                      <div className="flex-1">
                        {item.caption && <p className="text-white text-xs font-medium">{item.caption}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">{item.photoType}</span>
                          {item.mediaType === 'VIDEO' && <span className="text-[10px] bg-purple-500/80 text-white px-2 py-0.5 rounded-full">VIDEO</span>}
                        </div>
                      </div>
                      <button onClick={async () => {
                        if (!confirm('Delete this item?')) return;
                        try {
                          await api.deleteChefPhoto(item.id, token());
                          setGallery(prev => prev.filter(p => p.id !== item.id));
                        } catch { alert('Failed to delete'); }
                      }} className="text-white/80 hover:text-red-400 transition p-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Profile Tab ───────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white border rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-5">
                {/* Photo with upload */}
                <div className="relative">
                  {chef.profilePhotoUrl ? (
                    <img src={chef.profilePhotoUrl} alt="" className="w-24 h-24 rounded-2xl object-cover ring-2 ring-orange-100" />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-orange-50 flex items-center justify-center text-4xl">👨‍🍳</div>
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <label className="absolute -bottom-1 -right-1 w-9 h-9 bg-[#003B95] rounded-full flex items-center justify-center cursor-pointer shadow-lg ring-2 ring-white hover:bg-[#00296b] transition" title="Change photo">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !token) return;
                      setUploadingPhoto(true);
                      try {
                        const url = await api.uploadGenericFile(file, 'chef-photos', token());
                        await api.updateChefProfile({ profilePhotoUrl: url }, token());
                        setChef((prev: any) => ({ ...prev, profilePhotoUrl: url }));
                      } catch (err: any) {
                        alert('Failed to upload photo: ' + (err?.message || 'unknown error'));
                      } finally {
                        setUploadingPhoto(false);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }} />
                  </label>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{chef.name}</h2>
                  <p className="text-sm text-gray-500">{chef.chefType?.replace(/_/g, ' ')} | {chef.experienceYears || 0} years exp</p>
                  <p className="text-sm text-gray-500">{chef.city}, {chef.state}</p>
                  <p className="text-sm text-gray-500">{chef.cuisines}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <ProfileField label="Daily Rate" value={chef.dailyRatePaise ? formatPaise(chef.dailyRatePaise) : 'Not set'} />
                <ProfileField label="Monthly Rate" value={chef.monthlyRatePaise ? formatPaise(chef.monthlyRatePaise) : 'Not set'} />
                <ProfileField label="Event Min/Plate" value={chef.eventMinPlatePaise ? formatPaise(chef.eventMinPlatePaise) : 'Not set'} />
                <ProfileField label="Guests Range" value={`${chef.minGuests || 1} – ${chef.maxGuests || 100}`} />
                <ProfileField label="Verification" value={chef.verificationStatus} />
                <ProfileField label="Food Safety" value={chef.foodSafetyCertificate ? 'Certified' : 'Not certified'} />
              </div>

              {chef.bio && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Bio</p>
                  <p className="text-sm text-gray-700">{chef.bio}</p>
                </div>
              )}

              {chef.specialties && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Specialties</p>
                  <p className="text-sm text-gray-700">{chef.specialties}</p>
                </div>
              )}

              <div className="pt-4 border-t flex items-center justify-between">
                <Link href={`/cooks/${chef.id}`} className="text-sm text-orange-500 hover:underline font-medium">
                  View my public profile →
                </Link>
                <button onClick={() => {
                  if (!editMode && chef) {
                    setEditForm({
                      name: chef.name || '',
                      cuisines: chef.cuisines || '',
                      dailyRate: chef.dailyRatePaise ? String(chef.dailyRatePaise / 100) : '',
                      monthlyRate: chef.monthlyRatePaise ? String(chef.monthlyRatePaise / 100) : '',
                      eventRate: chef.eventMinPlatePaise ? String(chef.eventMinPlatePaise / 100) : '',
                      experience: chef.experienceYears ? String(chef.experienceYears) : '',
                      specialties: chef.specialties || '',
                      bio: chef.bio || '',
                    });
                  }
                  setEditMode(!editMode);
                }}
                  className="px-4 py-2 bg-[#003B95] text-white rounded-lg text-sm font-medium hover:bg-[#00296b] transition">
                  {editMode ? 'Cancel Edit' : 'Edit Profile'}
                </button>
              </div>
            </div>

            {/* Edit Form */}
            {editMode && (
              <div className="bg-white border rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">Edit Profile</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#003B95]/30" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cuisines</label>
                      <input type="text" value={editForm.cuisines} onChange={e => setEditForm(f => ({ ...f, cuisines: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#003B95]/30"
                        placeholder="North Indian, South Indian, Chinese" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (INR)</label>
                      <input type="number" value={editForm.dailyRate} onChange={e => setEditForm(f => ({ ...f, dailyRate: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#003B95]/30" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rate (INR)</label>
                      <input type="number" value={editForm.monthlyRate} onChange={e => setEditForm(f => ({ ...f, monthlyRate: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#003B95]/30" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Event Min/Plate (INR)</label>
                      <input type="number" value={editForm.eventRate} onChange={e => setEditForm(f => ({ ...f, eventRate: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#003B95]/30" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                      <input type="number" value={editForm.experience} onChange={e => setEditForm(f => ({ ...f, experience: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#003B95]/30" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Specialties</label>
                      <input type="text" value={editForm.specialties} onChange={e => setEditForm(f => ({ ...f, specialties: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#003B95]/30"
                        placeholder="Biryani, Tandoori, Desserts" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#003B95]/30 resize-none"
                      placeholder="Tell customers about yourself..." />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setEditMode(false)}
                      className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
                    <button disabled={savingProfile} onClick={async () => {
                      if (!token()) return;
                      setSavingProfile(true);
                      try {
                        await api.updateChefProfile({
                          name: editForm.name || undefined,
                          cuisines: editForm.cuisines || undefined,
                          dailyRatePaise: editForm.dailyRate ? Math.round(Number(editForm.dailyRate) * 100) : undefined,
                          monthlyRatePaise: editForm.monthlyRate ? Math.round(Number(editForm.monthlyRate) * 100) : undefined,
                          eventMinPlatePaise: editForm.eventRate ? Math.round(Number(editForm.eventRate) * 100) : undefined,
                          experienceYears: editForm.experience ? Number(editForm.experience) : undefined,
                          specialties: editForm.specialties || undefined,
                          bio: editForm.bio || undefined,
                        }, token());
                        const updated = await api.getMyChefProfile(token());
                        setChef(updated);
                        setEditMode(false);
                      } catch (err: any) {
                        alert('Failed to update profile: ' + (err?.message || 'unknown error'));
                      } finally {
                        setSavingProfile(false);
                      }
                    }}
                      className="flex-1 bg-[#003B95] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#00296b] transition disabled:opacity-60">
                      {savingProfile ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Quote Modal ──────────────────────────────────────────── */}
      {quoteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setQuoteModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-1">Send Quote</h3>
            <p className="text-xs text-gray-500 mb-4">Enter your total price for this event (INR)</p>
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">₹</span>
              <input type="number" value={quoteAmount} onChange={e => setQuoteAmount(e.target.value)}
                className="w-full border-2 border-orange-200 rounded-xl pl-8 pr-4 py-3 text-2xl font-bold focus:border-orange-400 outline-none"
                placeholder="25000" autoFocus />
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Platform fee (15%)</span>
                <span className="text-red-500">-{formatPaise(Math.round(Number(quoteAmount || 0) * 100 * 0.15))}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-gray-700">You will earn</span>
                <span className="text-green-600">{formatPaise(Math.round(Number(quoteAmount || 0) * 100 * 0.85))}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setQuoteModal(null)} className="flex-1 border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleSendQuote} disabled={!quoteAmount || Number(quoteAmount) <= 0}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-40">
                Send Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, accent }: { icon: string; label: string; value: string | number; sub: string; accent: string }) {
  const colors: Record<string, string> = {
    orange: 'bg-orange-50 text-orange-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
  };
  return (
    <div className="bg-white border rounded-2xl p-4 hover:shadow-sm transition">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${colors[accent]}`}>{icon}</span>
        <span className="text-xs text-gray-400 font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${colors[accent]?.split(' ')[1] || 'text-gray-900'}`}>{value}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

/**
 * Events are booked with a JSON blob that packs veg choice, add-ons, live
 * counters, extra staff and per-category dish counts. Printing the raw JSON
 * on the chef's "Needs Your Attention" card is ugly and unreadable, so we
 * parse it here and emit a terse human sentence. Falls through to the raw
 * string on malformed input so nothing disappears silently.
 */
function formatEventMenu(raw?: string): string | undefined {
  if (!raw) return undefined;
  let md: any;
  try { md = JSON.parse(raw); }
  catch { return raw; }
  if (!md || typeof md !== 'object') return raw;

  const parts: string[] = [];
  if (md.vegNonVeg) parts.push(md.vegNonVeg === 'BOTH' ? 'Veg + Non-Veg' : md.vegNonVeg === 'VEG' ? 'Veg only' : 'Non-Veg only');
  const addons = ['decoration', 'cake', 'crockery', 'appliances', 'tableSetup']
    .filter(k => md[k])
    .map(k => k === 'tableSetup' ? 'Table setup' : k[0].toUpperCase() + k.slice(1));
  if (addons.length) parts.push(addons.join(', '));
  if (md.extraStaff && md.staffCount > 0) parts.push(`${md.staffCount} extra staff`);
  if (Array.isArray(md.liveCounters) && md.liveCounters.length) parts.push(`Live: ${md.liveCounters.join(', ')}`);

  const cats = md.categoryCounts && typeof md.categoryCounts === 'object' ? md.categoryCounts : {};
  const dishCount = Object.values(cats).reduce((sum: number, n: any) => sum + (Number(n) || 0), 0);
  if (dishCount > 0) {
    const top = Object.entries(cats)
      .filter(([, v]) => Number(v) > 0)
      .map(([k, v]) => `${v} ${k.replace(/_/g, ' ').toLowerCase()}`)
      .slice(0, 3)
      .join(' · ');
    parts.push(`Menu (${dishCount} dishes): ${top}`);
  }
  return parts.length ? parts.join(' · ') : undefined;
}

function ActionCard({ type, title, subtitle, note, amount, status, actions }: {
  type: string; title: string; subtitle: string; note?: string; amount: number; status: string; actions: React.ReactNode;
}) {
  return (
    <div className="bg-white border-l-4 border-l-orange-400 rounded-r-2xl border border-l-0 p-4 hover:shadow-sm transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium uppercase">{type}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status]}`}>{status}</span>
          </div>
          <p className="font-semibold text-gray-900 mt-1">{title}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
          {note && <p className="text-xs text-orange-600 mt-1 italic">"{note}"</p>}
        </div>
        <p className="text-lg font-bold text-gray-900 ml-4">{formatPaise(amount)}</p>
      </div>
      <div className="flex gap-2 mt-3">{actions}</div>
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border">
      <span className="text-5xl block mb-3">{icon}</span>
      <p className="text-gray-700 font-medium">{title}</p>
      <p className="text-sm text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-[11px] text-gray-400 font-medium mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}
