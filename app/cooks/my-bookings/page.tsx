'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
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

export default function MyChefBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState<{ id: string; type: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/auth'); return; }

    Promise.all([
      api.getMyChefBookings(token).catch(() => []),
      api.getMyChefSubscriptions(token).catch(() => []),
      api.getMyEventBookings(token).catch(() => []),
    ]).then(([b, s, e]) => {
      setBookings(b || []);
      setSubscriptions(s || []);
      setEvents(e || []);
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
    await api.rateChefBooking(ratingModal.id, rating, reviewComment, token);
    setBookings(prev => prev.map(b => b.id === ratingModal.id ? { ...b, ratingGiven: rating, reviewComment } : b));
    setRatingModal(null);
    setRating(5);
    setReviewComment('');
  }

  const tabs = [
    { key: 'bookings', label: `Bookings (${bookings.length})` },
    { key: 'subscriptions', label: `Subscriptions (${subscriptions.length})` },
    { key: 'events', label: `Events (${events.length})` },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Cook Bookings</h1>

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
              ) : bookings.map(b => (
                <div key={b.id} className="border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{b.chefName || 'Cook'}</p>
                      <p className="text-xs text-gray-500">Ref: {b.bookingRef} | {b.serviceDate} at {b.serviceTime}</p>
                      <p className="text-xs text-gray-500">{b.mealType} | {b.guestsCount} guests | {b.address}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[b.status] || 'bg-gray-100'}`}>{b.status}</span>
                      {b.totalAmountPaise > 0 && <p className="text-sm font-bold mt-1">{formatPaise(b.totalAmountPaise)}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {b.status === 'PENDING' && (
                      <button onClick={() => handleCancel(b.id)} className="text-xs text-red-600 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50">Cancel</button>
                    )}
                    {b.status === 'COMPLETED' && !b.ratingGiven && (
                      <button onClick={() => setRatingModal({ id: b.id, type: 'booking' })}
                        className="text-xs text-orange-600 border border-orange-200 px-3 py-1 rounded-lg hover:bg-orange-50">Rate & Review</button>
                    )}
                    {b.ratingGiven && <span className="text-xs text-gray-500">{'★'.repeat(b.ratingGiven)} Rated</span>}
                  </div>
                </div>
              ))}
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
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[s.status] || 'bg-gray-100'}`}>{s.status}</span>
                      <p className="text-sm font-bold mt-1">{formatPaise(s.monthlyRatePaise)}/mo</p>
                    </div>
                  </div>
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
                      <p className="font-semibold text-gray-900">{e.chefName || 'Cook'} — {e.eventType}</p>
                      <p className="text-xs text-gray-500">Ref: {e.bookingRef} | {e.eventDate} at {e.eventTime}</p>
                      <p className="text-xs text-gray-500">{e.guestCount} guests | {e.venueAddress}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[e.status] || 'bg-gray-100'}`}>{e.status}</span>
                      {e.totalAmountPaise > 0 && <p className="text-sm font-bold mt-1">{formatPaise(e.totalAmountPaise)}</p>}
                    </div>
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
    </div>
  );
}
