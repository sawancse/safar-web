'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
  INQUIRY: 'bg-yellow-100 text-yellow-700',
  QUOTED: 'bg-blue-100 text-blue-700',
  ADVANCE_PAID: 'bg-indigo-100 text-indigo-700',
  ACTIVE: 'bg-green-100 text-green-700',
};

export default function ChefDashboardPage() {
  const router = useRouter();
  const [chef, setChef] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(true);
  const [quoteModal, setQuoteModal] = useState<string | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/auth'); return; }

    Promise.all([
      api.getMyChefProfile(token).catch(() => null),
      api.getChefIncomingBookings(token).catch(() => []),
      api.getChefIncomingEvents(token).catch(() => []),
      api.getChefIncomingSubscriptions(token).catch(() => []),
    ]).then(([p, b, e, s]) => {
      if (!p) { router.push('/cooks/register'); return; }
      setChef(p);
      setBookings(b || []);
      setEvents(e || []);
      setSubscriptions(s || []);
    }).finally(() => setLoading(false));
  }, []);

  const token = () => localStorage.getItem('access_token')!;

  async function handleConfirm(id: string) {
    const updated = await api.confirmChefBooking(id, token());
    setBookings(prev => prev.map(b => b.id === id ? updated : b));
  }

  async function handleComplete(id: string) {
    const updated = await api.completeChefBooking(id, token());
    setBookings(prev => prev.map(b => b.id === id ? updated : b));
  }

  async function handleCancelBooking(id: string) {
    if (!confirm('Cancel this booking?')) return;
    await api.cancelChefBooking(id, 'Chef cancelled', token());
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b));
  }

  async function handleSendQuote() {
    if (!quoteModal || !quoteAmount) return;
    const paise = Math.round(Number(quoteAmount) * 100);
    const updated = await api.quoteEvent(quoteModal, paise, token());
    setEvents(prev => prev.map(e => e.id === quoteModal ? updated : e));
    setQuoteModal(null);
    setQuoteAmount('');
  }

  async function handleCompleteEvent(id: string) {
    const updated = await api.completeEvent(id, token());
    setEvents(prev => prev.map(e => e.id === id ? updated : e));
  }

  async function handleToggleAvailability() {
    const updated = await api.toggleChefAvailability(token());
    setChef(updated);
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-20">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="h-32 bg-gray-100 rounded-xl" />
        <div className="h-24 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );

  if (!chef) return null;

  const pendingBookings = bookings.filter(b => b.status === 'PENDING');
  const inquiryEvents = events.filter(e => e.status === 'INQUIRY');
  const totalEarnings = bookings.filter(b => b.status === 'COMPLETED').reduce((sum, b) => sum + (b.chefEarningsPaise || 0), 0)
    + events.filter(e => e.status === 'COMPLETED').reduce((sum, e) => sum + (e.chefEarningsPaise || 0), 0);

  const tabs = [
    { key: 'bookings', label: `Bookings (${bookings.length})` },
    { key: 'events', label: `Events (${events.length})` },
    { key: 'subscriptions', label: `Subscriptions (${subscriptions.length})` },
    { key: 'profile', label: 'My Profile' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chef Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, {chef.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {chef.badge && (
            <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
              chef.badge === 'TOP_CHEF' ? 'bg-yellow-400 text-yellow-900' :
              chef.badge === 'TOP_10' ? 'bg-purple-500 text-white' :
              chef.badge === 'RISING_STAR' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
            }`}>{chef.badge.replace(/_/g, ' ')}</span>
          )}
          <button onClick={handleToggleAvailability}
            className={`text-xs px-4 py-2 rounded-full font-medium transition ${
              chef.available ? 'bg-green-500 text-white' : 'bg-red-100 text-red-600'}`}>
            {chef.available ? 'Available' : 'Unavailable'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pending Bookings" value={pendingBookings.length} color="text-yellow-600" bg="bg-yellow-50" />
        <StatCard label="New Inquiries" value={inquiryEvents.length} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Total Bookings" value={chef.totalBookings || 0} color="text-purple-600" bg="bg-purple-50" />
        <StatCard label="Total Earnings" value={formatPaise(totalEarnings)} color="text-green-600" bg="bg-green-50" />
      </div>

      {/* Rating */}
      <div className="flex items-center gap-6 mb-8 bg-white border rounded-xl px-6 py-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-orange-500">{chef.rating?.toFixed(1) || '0.0'}</p>
          <p className="text-xs text-gray-500">{chef.reviewCount || 0} reviews</p>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Completion Rate: <strong>{chef.completionRate?.toFixed(0) || 100}%</strong></span>
            <span className="mx-2">|</span>
            <span>Referrals: <strong>{chef.referralCount || 0}</strong></span>
            {chef.referralCode && <span className="mx-2">|</span>}
            {chef.referralCode && <span>Code: <strong className="text-orange-500">{chef.referralCode}</strong></span>}
          </div>
        </div>
      </div>

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

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No bookings yet</p>
          ) : bookings.map(b => (
            <div key={b.id} className="border rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{b.customerName || 'Customer'}</p>
                  <p className="text-xs text-gray-500">Ref: {b.bookingRef} | {b.serviceDate} at {b.serviceTime}</p>
                  <p className="text-xs text-gray-500">{b.mealType} | {b.guestsCount} guests | {b.address}, {b.city}</p>
                  {b.specialRequests && <p className="text-xs text-orange-600 mt-1">Note: {b.specialRequests}</p>}
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[b.status] || 'bg-gray-100'}`}>{b.status}</span>
                  <p className="text-sm font-bold mt-1">{formatPaise(b.totalAmountPaise)}</p>
                  <p className="text-xs text-green-600">Your earning: {formatPaise(b.chefEarningsPaise)}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {b.status === 'PENDING' && (
                  <>
                    <button onClick={() => handleConfirm(b.id)}
                      className="text-xs text-green-600 border border-green-200 px-3 py-1 rounded-lg hover:bg-green-50 font-medium">Confirm</button>
                    <button onClick={() => handleCancelBooking(b.id)}
                      className="text-xs text-red-600 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50">Decline</button>
                  </>
                )}
                {(b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') && (
                  <button onClick={() => handleComplete(b.id)}
                    className="text-xs text-green-600 border border-green-200 px-3 py-1 rounded-lg hover:bg-green-50 font-medium">Mark Complete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-3">
          {events.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No event inquiries yet</p>
          ) : events.map(e => (
            <div key={e.id} className="border rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{e.customerName || 'Customer'} — {e.eventType}</p>
                  <p className="text-xs text-gray-500">Ref: {e.bookingRef} | {e.eventDate} at {e.eventTime} | {e.durationHours}h</p>
                  <p className="text-xs text-gray-500">{e.guestCount} guests | {e.venueAddress}, {e.city}</p>
                  {e.cuisinePreferences && <p className="text-xs text-gray-500">Cuisine: {e.cuisinePreferences}</p>}
                  {e.menuDescription && <p className="text-xs text-orange-600 mt-1">Menu: {e.menuDescription}</p>}
                  {e.specialRequests && <p className="text-xs text-orange-600">Note: {e.specialRequests}</p>}
                  {e.customerPhone && <p className="text-xs text-blue-600 mt-1">Phone: {e.customerPhone}</p>}
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[e.status] || 'bg-gray-100'}`}>{e.status}</span>
                  <p className="text-sm font-bold mt-1">{formatPaise(e.totalAmountPaise)}</p>
                  <p className="text-xs text-green-600">Your earning: {formatPaise(e.chefEarningsPaise)}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {e.status === 'INQUIRY' && (
                  <button onClick={() => { setQuoteModal(e.id); setQuoteAmount(String((e.totalAmountPaise || 0) / 100)); }}
                    className="text-xs text-blue-600 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50 font-medium">Send Quote</button>
                )}
                {(e.status === 'ADVANCE_PAID' || e.status === 'IN_PROGRESS') && (
                  <button onClick={() => handleCompleteEvent(e.id)}
                    className="text-xs text-green-600 border border-green-200 px-3 py-1 rounded-lg hover:bg-green-50 font-medium">Mark Complete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-3">
          {subscriptions.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No subscriptions yet</p>
          ) : subscriptions.map(s => (
            <div key={s.id} className="border rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{s.customerName || 'Customer'} — {s.plan}</p>
                  <p className="text-xs text-gray-500">Ref: {s.subscriptionRef} | {s.mealsPerDay} meals/day | {s.schedule}</p>
                  <p className="text-xs text-gray-500">{s.mealTypes} | {s.address}, {s.city}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[s.status] || 'bg-gray-100'}`}>{s.status}</span>
                  <p className="text-sm font-bold mt-1">{formatPaise(s.monthlyRatePaise)}/mo</p>
                  <p className="text-xs text-green-600">Your earning: {formatPaise(s.chefEarningsPaise)}/mo</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          <div className="border rounded-xl p-6">
            <div className="flex items-center gap-4 mb-6">
              {chef.profilePhotoUrl && (
                <img src={chef.profilePhotoUrl} alt={chef.name} className="w-20 h-20 rounded-xl object-cover" />
              )}
              <div>
                <h2 className="text-xl font-bold">{chef.name}</h2>
                <p className="text-sm text-gray-500">{chef.chefType} | {chef.experienceYears || 0} years | {chef.city}</p>
                <p className="text-sm text-gray-500">{chef.cuisines}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Daily Rate</p>
                <p className="font-bold">{chef.dailyRatePaise ? formatPaise(chef.dailyRatePaise) : 'Not set'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Monthly Rate</p>
                <p className="font-bold">{chef.monthlyRatePaise ? formatPaise(chef.monthlyRatePaise) : 'Not set'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Event Min/Plate</p>
                <p className="font-bold">{chef.eventMinPlatePaise ? formatPaise(chef.eventMinPlatePaise) : 'Not set'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Min Guests</p>
                <p className="font-bold">{chef.minGuests || 1}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Max Guests</p>
                <p className="font-bold">{chef.maxGuests || 100}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Verification</p>
                <p className="font-bold">{chef.verificationStatus}</p>
              </div>
            </div>
            {chef.bio && <p className="text-sm text-gray-600 mt-4">{chef.bio}</p>}
          </div>
        </div>
      )}

      {/* Quote Modal */}
      {quoteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setQuoteModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Send Quote</h3>
            <p className="text-sm text-gray-500 mb-3">Enter total amount for this event (in INR):</p>
            <input type="number" value={quoteAmount} onChange={e => setQuoteAmount(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-lg font-bold mb-4" placeholder="e.g. 25000" />
            <p className="text-xs text-gray-400 mb-4">
              Platform fee (15%): {formatPaise(Math.round(Number(quoteAmount || 0) * 100 * 0.15))} |
              Your earning: {formatPaise(Math.round(Number(quoteAmount || 0) * 100 * 0.85))}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setQuoteModal(null)} className="flex-1 border rounded-lg py-2 text-sm font-medium">Cancel</button>
              <button onClick={handleSendQuote} className="flex-1 bg-orange-500 text-white rounded-lg py-2 text-sm font-semibold">Send Quote</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, bg }: { label: string; value: string | number; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-4`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
