'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import type { Booking } from '@/types';

const STATUS_LABEL: Record<string, { label: string; color: string; icon: string }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
  CONFIRMED:       { label: 'Confirmed',        color: 'bg-green-100 text-green-700',   icon: '✓' },
  CANCELLED:       { label: 'Cancelled',        color: 'bg-red-100 text-red-600',        icon: '✕' },
  COMPLETED:       { label: 'Completed',        color: 'bg-gray-100 text-gray-600',      icon: '✓' },
  CHECKED_IN:      { label: 'Checked In',       color: 'bg-blue-100 text-blue-700',      icon: '🏠' },
  NO_SHOW:         { label: 'No Show',          color: 'bg-gray-100 text-gray-500',      icon: '?' },
};

const TYPE_ICONS: Record<string, string> = {
  HOME: '🏠', APARTMENT: '🏢', VILLA: '🏡', PG: '🛏️', COLIVING: '🏘️',
  HOTEL: '🏨', BUDGET_HOTEL: '🏨', HOSTEL_DORM: '🛌', FARMHOUSE: '🌾',
  COMMERCIAL: '🏗️', COTTAGE: '🛖', HOUSEBOAT: '⛵',
};

export default function BookingDetailPage() {
  const { ref } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [srLoading, setSrLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/auth?redirect=/dashboard/bookings/' + ref); return; }

    api.getMyBookings(token)
      .then((bookings: Booking[]) => {
        const b = bookings.find((bk) => bk.bookingRef === ref);
        if (!b) { setError('Booking not found'); return; }
        setBooking(b);

        // Load service requests for active bookings
        if (['CONFIRMED', 'CHECKED_IN'].includes(b.status)) {
          setSrLoading(true);
          api.getServiceRequests(b.id, token)
            .then((res: any) => setServiceRequests(res.content || res || []))
            .catch(() => {})
            .finally(() => setSrLoading(false));
        }
      })
      .catch(() => setError('Failed to load booking'))
      .finally(() => setLoading(false));
  }, [ref]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#003B95] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !booking) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border p-8 max-w-md w-full text-center">
        <p className="text-4xl mb-3">⚠️</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{error || 'Booking not found'}</h2>
        <Link href="/dashboard" className="mt-4 inline-block text-[#003B95] hover:underline font-medium">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );

  const s = STATUS_LABEL[booking.status] ?? { label: booking.status, color: 'bg-gray-100 text-gray-600', icon: '?' };
  const typeIcon = TYPE_ICONS[booking.listingType || ''] || '🏠';
  const typeLabel = booking.listingType?.replace(/_/g, ' ') || 'Stay';
  const unitLabel = booking.pricingUnit === 'MONTH' ? 'month' : booking.pricingUnit === 'HOUR' ? 'hour' : 'night';
  const checkInDate = booking.checkIn?.split('T')[0];
  const checkOutDate = booking.checkOut?.split('T')[0];
  const fmt = (d: string | undefined) => d ? new Date(d + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const isActive = ['CONFIRMED', 'CHECKED_IN'].includes(booking.status);
  const canRequestService = isActive && ['HOTEL', 'BUDGET_HOTEL', 'APARTMENT', 'VILLA', 'HOSTEL_DORM', 'PG', 'COLIVING'].includes(booking.listingType || '');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link href="/dashboard" className="text-sm text-[#003B95] hover:underline mb-4 inline-block">
          ← Back to My Trips
        </Link>

        {/* Hero card with photo */}
        <div className="bg-white rounded-2xl border overflow-hidden mb-6">
          {booking.listingPhotoUrl && (
            <div className="h-48 sm:h-64 relative">
              <img
                src={booking.listingPhotoUrl.startsWith('http') ? booking.listingPhotoUrl : `${process.env.NEXT_PUBLIC_API_URL || ''}${booking.listingPhotoUrl}`}
                alt={booking.listingTitle || ''}
                className="w-full h-full object-cover"
              />
              <span className={`absolute top-4 left-4 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm ${s.color}`}>
                {s.icon} {s.label}
              </span>
            </div>
          )}

          <div className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span>{typeIcon}</span>
                  <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">{typeLabel}</span>
                  <span className="text-xs text-gray-300">|</span>
                  <span className="text-xs font-mono text-gray-400">{booking.bookingRef}</span>
                </div>
                <Link href={`/listings/${booking.listingId}`}
                  className="text-xl font-bold text-gray-900 hover:text-[#003B95] transition">
                  {booking.listingTitle || 'View listing'}
                </Link>
                {booking.listingAddress && (
                  <p className="text-sm text-gray-500 mt-1">{booking.listingAddress}{booking.listingCity ? ', ' + booking.listingCity : ''}</p>
                )}
                {booking.hostName && (
                  <p className="text-sm text-gray-400 mt-0.5">Hosted by {booking.hostName}</p>
                )}
              </div>
              {!booking.listingPhotoUrl && (
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${s.color}`}>
                  {s.icon} {s.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stay details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border p-5">
            <p className="text-xs text-gray-400 font-medium mb-2">DATES</p>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Check-in</p>
                <p className="text-sm text-gray-600">{fmt(checkInDate)}</p>
              </div>
              <span className="text-gray-300 text-lg">→</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Check-out</p>
                <p className="text-sm text-gray-600">{fmt(checkOutDate)}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{booking.nights} {unitLabel}{booking.nights > 1 ? 's' : ''}</p>
          </div>

          <div className="bg-white rounded-2xl border p-5">
            <p className="text-xs text-gray-400 font-medium mb-2">GUESTS & ROOMS</p>
            <p className="text-sm text-gray-900">
              <span className="font-semibold">{booking.guestsCount}</span> guest{booking.guestsCount > 1 ? 's' : ''}
              {booking.roomsCount && booking.roomsCount > 1 && (
                <span> · <span className="font-semibold">{booking.roomsCount}</span> room{booking.roomsCount > 1 ? 's' : ''}</span>
              )}
            </p>
            {booking.roomTypeName && (
              <span className="inline-block mt-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{booking.roomTypeName}</span>
            )}
            {booking.roomSelections && booking.roomSelections.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {booking.roomSelections.map((rs) => (
                  <span key={rs.id} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                    {rs.count}x {rs.roomTypeName} @ {formatPaise(rs.pricePerUnitPaise)}/{unitLabel}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pricing breakdown */}
        <div className="bg-white rounded-2xl border p-5 mb-6">
          <p className="text-xs text-gray-400 font-medium mb-3">PRICE BREAKDOWN</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Base amount</span>
              <span className="text-gray-900 font-medium">{formatPaise(booking.baseAmountPaise)}</span>
            </div>
            {booking.cleaningFeePaise ? (
              <div className="flex justify-between">
                <span className="text-gray-600">Cleaning fee</span>
                <span className="text-gray-900 font-medium">{formatPaise(booking.cleaningFeePaise)}</span>
              </div>
            ) : null}
            {booking.inclusionsTotalPaise ? (
              <div className="flex justify-between">
                <span className="text-gray-600">Inclusions</span>
                <span className="text-gray-900 font-medium">{formatPaise(booking.inclusionsTotalPaise)}</span>
              </div>
            ) : null}
            {booking.insuranceAmountPaise ? (
              <div className="flex justify-between">
                <span className="text-gray-600">Insurance</span>
                <span className="text-gray-900 font-medium">{formatPaise(booking.insuranceAmountPaise)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-gray-600">GST</span>
              <span className="text-gray-900 font-medium">{formatPaise(booking.gstAmountPaise)}</span>
            </div>
            {booking.securityDepositPaise ? (
              <div className="flex justify-between">
                <span className="text-gray-600">Security deposit</span>
                <span className="text-gray-900 font-medium">{formatPaise(booking.securityDepositPaise)}</span>
              </div>
            ) : null}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">{formatPaise(booking.totalAmountPaise)}</span>
            </div>
          </div>
        </div>

        {/* Special requests */}
        {booking.specialRequests && (
          <div className="bg-white rounded-2xl border p-5 mb-6">
            <p className="text-xs text-gray-400 font-medium mb-2">SPECIAL REQUESTS</p>
            <p className="text-sm text-gray-700">{booking.specialRequests}</p>
          </div>
        )}

        {/* Cancellation reason */}
        {booking.status === 'CANCELLED' && booking.cancellationReason && (
          <div className="bg-red-50 rounded-2xl border border-red-100 p-5 mb-6">
            <p className="text-xs text-red-400 font-medium mb-2">CANCELLATION REASON</p>
            <p className="text-sm text-red-700">{booking.cancellationReason}</p>
          </div>
        )}

        {/* Service Requests section (for active hotel/apartment bookings) */}
        {canRequestService && (
          <div className="bg-white rounded-2xl border p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400 font-medium">SERVICE REQUESTS</p>
                <p className="text-sm text-gray-500">Need something? Request water, food, housekeeping & more</p>
              </div>
              <Link href={`/dashboard/bookings/${ref}/services`}
                className="text-sm px-4 py-2 rounded-xl bg-[#003B95] text-white hover:bg-[#002d73] font-medium transition">
                + New Request
              </Link>
            </div>

            {srLoading ? (
              <div className="flex items-center gap-2 py-4">
                <div className="w-4 h-4 border-2 border-[#003B95] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-400">Loading...</span>
              </div>
            ) : serviceRequests.length === 0 ? (
              <p className="text-sm text-gray-400 py-3">No service requests yet</p>
            ) : (
              <div className="space-y-2">
                {serviceRequests.slice(0, 5).map((sr: any) => {
                  const srStatus: Record<string, string> = {
                    OPEN: 'bg-yellow-100 text-yellow-700',
                    ASSIGNED: 'bg-blue-100 text-blue-700',
                    IN_PROGRESS: 'bg-blue-100 text-blue-700',
                    RESOLVED: 'bg-green-100 text-green-700',
                    CLOSED: 'bg-gray-100 text-gray-500',
                  };
                  return (
                    <div key={sr.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{sr.title}</p>
                        <p className="text-xs text-gray-400">{sr.requestNumber} · {sr.category?.replace(/_/g, ' ')}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${srStatus[sr.status] || 'bg-gray-100 text-gray-500'}`}>
                        {sr.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  );
                })}
                {serviceRequests.length > 5 && (
                  <Link href={`/dashboard/bookings/${ref}/services`}
                    className="text-xs text-[#003B95] hover:underline">
                    View all {serviceRequests.length} requests →
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {booking.status === 'PENDING_PAYMENT' && (
            <Link href={`/book/${booking.listingId}?checkIn=${checkInDate}&checkOut=${checkOutDate}&guests=${booking.guestsCount}&bookingId=${booking.id}`}
              className="px-5 py-2.5 rounded-xl bg-[#003B95] text-white hover:bg-[#002d73] font-semibold text-sm transition">
              Complete Payment
            </Link>
          )}
          {(booking.status === 'COMPLETED' || booking.status === 'CHECKED_OUT') && !booking.hasReview && (
            <Link href={`/dashboard/bookings/${ref}/review`}
              className="px-5 py-2.5 rounded-xl bg-[#003B95] text-white hover:bg-[#002d73] font-semibold text-sm transition">
              Write Review
            </Link>
          )}
          {booking.hasReview && (
            <span className="px-5 py-2.5 rounded-xl bg-green-50 text-green-600 font-medium text-sm flex items-center gap-1">
              {booking.reviewRating ? '★'.repeat(booking.reviewRating) : ''} Reviewed
            </span>
          )}
          <Link href={`/listings/${booking.listingId}`}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm transition">
            View Listing
          </Link>
        </div>
      </div>
    </div>
  );
}
