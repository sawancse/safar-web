'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

const CATEGORIES = [
  { key: 'cleanliness', label: 'Cleanliness', desc: 'How clean was the property?' },
  { key: 'accuracy', label: 'Accuracy', desc: 'Was it as described in the listing?' },
  { key: 'communication', label: 'Communication', desc: 'How was the host communication?' },
  { key: 'location', label: 'Location', desc: 'How was the location?' },
  { key: 'checkIn', label: 'Check-in', desc: 'Was check-in smooth?' },
  { key: 'value', label: 'Value', desc: 'Was it worth the price?' },
  { key: 'staff', label: 'Staff', desc: 'How helpful was the staff?' },
  { key: 'facilities', label: 'Facilities', desc: 'Were facilities well maintained?' },
  { key: 'comfort', label: 'Comfort', desc: 'How comfortable was your stay?' },
  { key: 'freeWifi', label: 'Free WiFi', desc: 'How was the internet?' },
] as const;

type CatKey = typeof CATEGORIES[number]['key'];

const RATING_LABELS: Record<number, string> = {
  1: 'Poor', 2: 'Below Average', 3: 'Average', 4: 'Very Good', 5: 'Exceptional',
};

export default function BookingReviewPage() {
  const { ref } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [categories, setCategories] = useState<Record<CatKey, number>>({
    cleanliness: 0, accuracy: 0, communication: 0, location: 0, checkIn: 0,
    value: 0, staff: 0, facilities: 0, comfort: 0, freeWifi: 0,
  });
  const [catComments, setCatComments] = useState<Record<string, string>>({});

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/auth'); return; }

    // Find booking by ref
    api.getMyBookings(token)
      .then((bookings: any[]) => {
        const b = bookings.find((bk: any) => bk.bookingRef === ref);
        if (!b) { setError('Booking not found'); return; }
        if (b.status !== 'COMPLETED' && b.status !== 'CHECKED_OUT') {
          setError('Reviews can only be written for completed stays');
          return;
        }
        if (b.hasReviewed) {
          setSubmitted(true);
        }
        setBooking(b);
      })
      .catch(() => setError('Failed to load booking'))
      .finally(() => setLoading(false));
  }, [ref]);

  async function handleSubmit() {
    const token = localStorage.getItem('access_token');
    if (!token || !booking) return;
    setSubmitting(true);
    try {
      await api.createReview({
        bookingId: booking.id,
        rating,
        comment: comment.trim() || undefined,
        ratingCleanliness: categories.cleanliness || undefined,
        ratingAccuracy: categories.accuracy || undefined,
        ratingCommunication: categories.communication || undefined,
        ratingLocation: categories.location || undefined,
        ratingCheckIn: categories.checkIn || undefined,
        ratingValue: categories.value || undefined,
        ratingStaff: categories.staff || undefined,
        ratingFacilities: categories.facilities || undefined,
        ratingComfort: categories.comfort || undefined,
        ratingFreeWifi: categories.freeWifi || undefined,
        categoryComments: Object.values(catComments).some(v => v.trim())
          ? JSON.stringify(catComments) : undefined,
      }, token);
      setSubmitted(true);
    } catch (e: any) {
      alert(e.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border p-8 max-w-md w-full text-center">
        <span className="text-4xl block mb-3">⚠️</span>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{error}</h2>
        <Link href="/dashboard" className="mt-4 inline-block text-orange-500 hover:underline font-medium">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border p-8 max-w-md w-full text-center">
        <span className="text-5xl block mb-4">🎉</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you for your review!</h2>
        <p className="text-sm text-gray-500 mb-6">
          Your feedback helps other travellers and encourages hosts to keep up the good work.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard"
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition">
            Back to Dashboard
          </Link>
          <Link href="/dashboard/reviews"
            className="border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-xl transition">
            My Reviews
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Booking info header */}
        <div className="bg-white rounded-2xl border p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Reviewing your stay</p>
              <p className="font-semibold text-gray-900 text-lg">{booking.listingTitle || booking.listingName || 'Your Stay'}</p>
              <p className="text-xs text-gray-500">
                {booking.bookingRef} | {booking.checkInDate} — {booking.checkOutDate} | {booking.city}
              </p>
            </div>
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">
              Cancel
            </Link>
          </div>
        </div>

        {/* Review Form */}
        <div className="bg-white rounded-2xl border p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">How was your stay?</h2>
            <p className="text-sm text-gray-500">Your honest review helps the community</p>
          </div>

          {/* Overall rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Overall rating</label>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button" onClick={() => setRating(star)}
                  className={`text-4xl transition hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}>
                  ★
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">{RATING_LABELS[rating]}</p>
          </div>

          {/* Category ratings */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-800">Rate by category</label>
            {CATEGORIES.map(({ key, label, desc }) => (
              <div key={key} className="py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                  <div className="flex gap-1 ml-3">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button"
                        onClick={() => setCategories(prev => ({ ...prev, [key]: prev[key] === star ? 0 : star }))}
                        className={`text-xl transition hover:scale-110 ${star <= (categories[key] || 0) ? 'text-yellow-400' : 'text-gray-200'}`}>
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                {(categories[key] || 0) > 0 && (
                  <input type="text"
                    value={catComments[key] || ''}
                    onChange={e => setCatComments(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={`What about ${label.toLowerCase()}? (optional)`}
                    className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-orange-400 bg-gray-50" />
                )}
              </div>
            ))}
            <p className="text-xs text-gray-400">Tap stars to rate, add optional comments per category</p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Your review</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4}
              className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 resize-none"
              placeholder="Tell others about your stay — what did you like? What could be improved?" />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Link href="/dashboard"
              className="flex-1 px-4 py-3 rounded-xl border text-sm font-medium hover:bg-gray-50 transition text-center">
              Cancel
            </Link>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 px-4 py-3 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
