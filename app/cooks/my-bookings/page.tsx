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
  FULLY_PAID: { label: 'Fully Paid', color: 'text-green-700' },
};

const MODIFIABLE_BOOKING = ['PENDING_PAYMENT', 'PENDING'];
const MODIFIABLE_EVENT = ['INQUIRY', 'QUOTED'];
const MODIFIABLE_SUB = ['ACTIVE'];

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
  const [editModal, setEditModal] = useState<{ item: any; type: 'booking' | 'event' | 'subscription' } | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

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

  function openEdit(item: any, type: 'booking' | 'event' | 'subscription') {
    setEditForm(
      type === 'booking' ? {
        serviceDate: item.serviceDate || '', serviceTime: item.serviceTime || '',
        guestsCount: item.guestsCount || '', specialRequests: item.specialRequests || '',
        address: item.address || '', city: item.city || '', pincode: item.pincode || '',
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
      if (v !== '' && v !== null && v !== undefined) {
        payload[k] = ['guestsCount', 'guestCount', 'durationHours', 'mealsPerDay'].includes(k) ? Number(v) : v;
      }
    });

    try {
      let updated;
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
              ) : bookings.map(b => {
                const ps = PAYMENT_STATUS_LABELS[b.paymentStatus] || PAYMENT_STATUS_LABELS['UNPAID'];
                return (
                <div key={b.id} className="border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{b.chefName || 'Cook'}</p>
                      <p className="text-xs text-gray-500">Ref: {b.bookingRef} | {b.serviceDate} at {b.serviceTime}</p>
                      <p className="text-xs text-gray-500">{b.mealType} | {b.guestsCount} guests | {b.address}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[b.status] || 'bg-gray-100'}`}>
                        {b.status === 'PENDING_PAYMENT' ? 'Awaiting Payment' : b.status}
                      </span>
                      {b.totalAmountPaise > 0 && <p className="text-sm font-bold mt-1">{formatPaise(b.totalAmountPaise)}</p>}
                    </div>
                  </div>
                  {/* Payment breakdown */}
                  {b.totalAmountPaise > 0 && b.advanceAmountPaise > 0 && (
                    <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                      <div className="flex gap-4">
                        <span className={`font-medium ${ps.color}`}>{ps.label}</span>
                        {b.paymentStatus === 'ADVANCE_PAID' && (
                          <span className="text-gray-500">Advance: {formatPaise(b.advanceAmountPaise)}</span>
                        )}
                      </div>
                      {b.balanceAmountPaise > 0 && b.paymentStatus !== 'FULLY_PAID' && (
                        <span className="text-orange-600 font-medium">Balance due: {formatPaise(b.balanceAmountPaise)}</span>
                      )}
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
                    {(b.status === 'PENDING' || b.status === 'PENDING_PAYMENT') && (
                      <button onClick={() => handleCancel(b.id)} className="text-xs text-red-600 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50">Cancel</button>
                    )}
                    {b.status === 'COMPLETED' && !b.ratingGiven && (
                      <button onClick={() => setRatingModal({ id: b.id, type: 'booking' })}
                        className="text-xs text-orange-600 border border-orange-200 px-3 py-1 rounded-lg hover:bg-orange-50">Rate & Review</button>
                    )}
                    {b.ratingGiven && <span className="text-xs text-gray-500">{'★'.repeat(b.ratingGiven)} Rated</span>}
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
                      <p className="font-semibold text-gray-900">{e.chefName || 'Cook'} — {e.eventType}</p>
                      <p className="text-xs text-gray-500">Ref: {e.bookingRef} | {e.eventDate} at {e.eventTime}</p>
                      <p className="text-xs text-gray-500">{e.guestCount} guests | {e.venueAddress}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[e.status] || 'bg-gray-100'}`}>{e.status}</span>
                      {e.totalAmountPaise > 0 && <p className="text-sm font-bold mt-1">{formatPaise(e.totalAmountPaise)}</p>}
                    </div>
                  </div>
                  {MODIFIABLE_EVENT.includes(e.status) && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => openEdit(e, 'event')}
                        className="text-xs text-blue-600 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50">Modify</button>
                    </div>
                  )}
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
            {editModal.type === 'event' && editModal.item.status === 'QUOTED' && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg mb-4">
                Modifying a quoted event will reset it to INQUIRY status for the chef to re-quote.
              </p>
            )}
            <div className="space-y-3">
              {editModal.type === 'booking' && (
                <>
                  <Field label="Service Date" type="date" value={editForm.serviceDate} onChange={(v: string) => setEditForm({...editForm, serviceDate: v})} />
                  <Field label="Service Time" value={editForm.serviceTime} onChange={(v: string) => setEditForm({...editForm, serviceTime: v})} placeholder="e.g. 12:00 PM" />
                  <Field label="Guests" type="number" value={editForm.guestsCount} onChange={(v: string) => setEditForm({...editForm, guestsCount: v})} />
                  <Field label="Special Requests" value={editForm.specialRequests} onChange={(v: string) => setEditForm({...editForm, specialRequests: v})} textarea />
                  <Field label="Address" value={editForm.address} onChange={(v: string) => setEditForm({...editForm, address: v})} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="City" value={editForm.city} onChange={(v: string) => setEditForm({...editForm, city: v})} />
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
                    <Field label="City" value={editForm.city} onChange={(v: string) => setEditForm({...editForm, city: v})} />
                    <Field label="Pincode" value={editForm.pincode} onChange={(v: string) => setEditForm({...editForm, pincode: v})} />
                  </div>
                  <Field label="Menu Description" value={editForm.menuDescription} onChange={(v: string) => setEditForm({...editForm, menuDescription: v})} textarea />
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
                    <Field label="City" value={editForm.city} onChange={(v: string) => setEditForm({...editForm, city: v})} />
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
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className={cls} placeholder={placeholder} />
      )}
    </div>
  );
}
