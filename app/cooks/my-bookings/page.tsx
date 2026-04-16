'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import CityAutocomplete from '@/components/CityAutocomplete';
import LocalityAutocomplete from '@/components/LocalityAutocomplete';

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
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingBooking, setTrackingBooking] = useState<any>(null);

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cooks I've Booked</h1>
          <p className="text-sm text-gray-500 mt-1">Bookings you placed as a customer</p>
        </div>
        <Link href="/cooks/dashboard"
          className="text-sm bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition font-semibold shadow-sm">
          Chef Dashboard →
        </Link>
      </div>

      {/* Banner for chefs */}
      <div className="mb-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center justify-between">
        <p className="text-sm text-orange-700">
          <strong>Are you a cook?</strong> This page shows bookings you placed as a customer. To view your <strong>incoming orders</strong>, go to the Chef Dashboard.
        </p>
        <Link href="/cooks/dashboard" className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-orange-600 transition shrink-0 ml-3">
          My Incoming Orders
        </Link>
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
                      <button onClick={async () => { const inv = await api.getBookingInvoice(b.id); window.open(`data:text/html,${encodeURIComponent(renderInvoiceHtml(inv))}`, '_blank'); }}
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
                        <span className="text-blue-700 font-medium">Chef has sent a quote!</span>
                        <span className="text-blue-800 font-bold">{formatPaise(e.totalAmountPaise)}</span>
                      </div>
                      <div className="text-xs text-blue-600 mt-1 space-y-0.5">
                        <p>Advance (50%): <strong>{formatPaise(e.advanceAmountPaise)}</strong> | Balance: {formatPaise(e.balanceAmountPaise)}</p>
                        {e.quotedAt && <p className="text-blue-400">Quoted {new Date(e.quotedAt).toLocaleDateString('en-IN')}</p>}
                      </div>
                    </div>
                  )}
                  {/* Status info banners */}
                  {e.status === 'INQUIRY' && (
                    <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-700">
                      Waiting for the chef to review your inquiry and send a quote.
                    </div>
                  )}
                  {e.status === 'CONFIRMED' && (
                    <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700">
                      Event confirmed! Please pay the 50% advance to lock in the booking.
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
                    {['INQUIRY', 'QUOTED', 'CONFIRMED'].includes(e.status) && (
                      <button onClick={async () => {
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
                      <button onClick={async () => { const inv = await api.getEventInvoice(e.id); window.open(`data:text/html,${encodeURIComponent(renderInvoiceHtml(inv))}`, '_blank'); }}
                        className="text-xs text-gray-600 border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-50">Invoice</button>
                    )}
                    {e.status === 'COMPLETED' && !e.ratingGiven && (
                      <button onClick={() => setRatingModal({ id: e.id, type: 'event' })}
                        className="text-xs text-orange-600 border border-orange-200 px-3 py-1 rounded-lg hover:bg-orange-50">Rate & Review</button>
                    )}
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
    </div>
  );
}

function renderInvoiceHtml(inv: any): string {
  const fmt = (p: number) => '\u20B9' + (p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  return `<!DOCTYPE html><html><head><title>Invoice ${inv.invoiceNumber}</title>
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
${inv.foodPaise ? `<tr><td>Food (${inv.guestCount} guests)</td><td class="right">${fmt(inv.foodPaise)}</td></tr>` : ''}
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
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className={cls} placeholder={placeholder} />
      )}
    </div>
  );
}
