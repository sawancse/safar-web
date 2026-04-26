'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import CompleteYourTrip from '@/components/CompleteYourTrip';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'text-amber-700', bg: 'bg-amber-100' },
  CONFIRMED:       { label: 'Confirmed',       color: 'text-green-700', bg: 'bg-green-100' },
  CANCELLED:       { label: 'Cancelled',       color: 'text-red-600',   bg: 'bg-red-100' },
  COMPLETED:       { label: 'Completed',       color: 'text-gray-600',  bg: 'bg-gray-100' },
  TICKETED:        { label: 'Ticketed',         color: 'text-blue-700',  bg: 'bg-blue-100' },
  REFUNDED:        { label: 'Refunded',         color: 'text-purple-600',bg: 'bg-purple-100' },
};

interface Passenger {
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  passportNumber?: string;
  passportExpiry?: string;
}

function formatDate(d: string) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(d: string) {
  if (!d) return '--';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export default function FlightBookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('access_token') ?? '';
    if (!t) {
      router.push('/auth?redirect=' + encodeURIComponent(`/flights/${bookingId}`));
      return;
    }
    setToken(t);
    loadBooking(t);
  }, [bookingId, router]);

  function loadBooking(t: string) {
    setLoading(true);
    api.getFlightBooking(bookingId, t)
      .then((data: any) => setBooking(data))
      .catch(() => setError('Failed to load booking details'))
      .finally(() => setLoading(false));
  }

  async function handleCancel() {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    try {
      await api.cancelFlightBooking(bookingId, token);
      setShowCancelModal(false);
      loadBooking(token);
    } catch (err: any) {
      setError(err?.message || 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  }

  // Parse passengers
  const passengers: Passenger[] = (() => {
    if (!booking) return [];
    if (booking.passengers && Array.isArray(booking.passengers)) return booking.passengers;
    if (booking.passengersJson) {
      try { return JSON.parse(booking.passengersJson); } catch { return []; }
    }
    return [];
  })();

  const status = booking?.status || '';
  const sc = STATUS_CONFIG[status] || { label: status, color: 'text-gray-600', bg: 'bg-gray-100' };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#003B95] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-center shadow-sm max-w-md">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <Link href="/dashboard/flights" className="text-[#003B95] text-sm hover:underline">
            Go to My Flights
          </Link>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  // Timeline steps
  const timeline = [
    { label: 'Booking Created', time: booking.createdAt, done: true },
    { label: 'Payment', time: booking.paidAt, done: !!booking.paidAt || status === 'CONFIRMED' || status === 'TICKETED' || status === 'COMPLETED' },
    { label: 'Confirmed', time: booking.confirmedAt, done: status === 'CONFIRMED' || status === 'TICKETED' || status === 'COMPLETED' },
    { label: 'Check-in Open', time: null, done: status === 'TICKETED' || status === 'COMPLETED' },
    { label: 'Departure', time: booking.departureDate, done: status === 'COMPLETED' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#003B95] text-white py-6">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <p className="text-blue-200 text-sm mb-1">Booking Reference</p>
              <h1 className="text-2xl md:text-3xl font-bold font-mono tracking-wide">
                {booking.bookingRef || bookingId.substring(0, 12).toUpperCase()}
              </h1>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${sc.bg} ${sc.color}`}>
              {sc.label}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Cross-vertical "Complete your trip" hub — only meaningful once
             booking is confirmed (Trip is auto-created on flight.booking.created
             but suggestions are most relevant post-payment). */}
        {(status === 'CONFIRMED' || status === 'TICKETED' || status === 'COMPLETED') && (
          <CompleteYourTrip flightBookingId={bookingId} />
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Flight Details */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Flight Details</h2>
            {booking.international && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                International
              </span>
            )}
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Airline logo */}
            <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-[#003B95] font-bold text-lg">
                {(booking.airline || '').substring(0, 2).toUpperCase() || 'FL'}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-800">{booking.airline}</span>
                <span className="text-sm text-gray-400">{booking.flightNumber}</span>
              </div>
              <div className="flex items-center gap-4 text-sm mt-2">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{booking.origin}</p>
                  <p className="text-gray-400">{formatDate(booking.departureDate)}</p>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="flex-1 h-px bg-gray-300" />
                  <span className="mx-3 text-gray-400 text-xs">&#x2708;&#xFE0F;</span>
                  <div className="flex-1 h-px bg-gray-300" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{booking.destination}</p>
                  <p className="text-gray-400">{booking.returnDate ? formatDate(booking.returnDate) : ''}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {(booking.cabinClass || 'economy').replace('_', ' ')}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {passengers.length} passenger{passengers.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Passengers */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Passengers</h2>
          <div className="space-y-3">
            {passengers.map((p, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-[#003B95] text-white flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800">
                    {p.title} {p.firstName} {p.lastName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {p.gender} &middot; DOB: {formatDate(p.dateOfBirth)} &middot; {p.nationality}
                  </p>
                </div>
                {p.passportNumber && (
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg">
                    Passport: {p.passportNumber}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Details</h2>
          <div className="space-y-2 text-sm">
            {booking.baseFarePaise != null && (
              <div className="flex justify-between text-gray-600">
                <span>Base fare</span>
                <span>{formatPaise(booking.baseFarePaise)}</span>
              </div>
            )}
            {booking.taxesPaise != null && (
              <div className="flex justify-between text-gray-600">
                <span>Taxes &amp; fees</span>
                <span>{formatPaise(booking.taxesPaise)}</span>
              </div>
            )}
            {booking.platformFeePaise != null && (
              <div className="flex justify-between text-gray-600">
                <span>Platform fee</span>
                <span>{formatPaise(booking.platformFeePaise)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base pt-3 border-t border-gray-200">
              <span>Total</span>
              <span className="text-[#003B95]">{formatPaise(booking.totalAmountPaise || 0)}</span>
            </div>
            {booking.paymentStatus && (
              <div className="flex justify-between text-gray-500 pt-2">
                <span>Payment Status</span>
                <span className={`font-medium ${booking.paymentStatus === 'PAID' ? 'text-green-600' : 'text-amber-600'}`}>
                  {booking.paymentStatus}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Booking Timeline</h2>
          <div className="relative">
            {timeline.map((step, idx) => (
              <div key={idx} className="flex items-start gap-4 mb-4 last:mb-0">
                <div className="relative flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    step.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {step.done ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>
                  {idx < timeline.length - 1 && (
                    <div className={`w-0.5 h-6 mt-1 ${step.done ? 'bg-green-300' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className="pt-1">
                  <p className={`text-sm font-medium ${step.done ? 'text-gray-800' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  {step.time && (
                    <p className="text-xs text-gray-400">{formatDateTime(step.time)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {(status === 'CONFIRMED' || status === 'TICKETED') && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-6 py-2.5 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition text-sm"
            >
              Cancel Booking
            </button>
          )}
          {status === 'CANCELLED' && (
            <Link
              href="/flights"
              className="px-6 py-2.5 bg-[#003B95] text-white font-semibold rounded-xl hover:bg-[#002d75] transition text-sm"
            >
              Rebook Flight
            </Link>
          )}
          <Link
            href="/dashboard/flights"
            className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition text-sm"
          >
            My Flights
          </Link>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Cancel Flight Booking</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to cancel this booking? Cancellation fees may apply based on the airline policy.
            </p>
            <label className="block text-sm font-medium text-gray-600 mb-1">Reason for cancellation</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please provide a reason..."
              rows={3}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B95] mb-4"
            />
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling || !cancelReason.trim()}
                className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold rounded-xl transition"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
