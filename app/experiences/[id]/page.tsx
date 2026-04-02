'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import type { Experience, ExperienceSession, Review, ReviewStats } from '@/types';

const CATEGORY_ICONS: Record<string, string> = {
  CULINARY: '🍳', CULTURAL: '🏛️', WELLNESS: '🧘', ADVENTURE: '🏔️', CREATIVE: '🎨',
};

const CANCELLATION_LABELS: Record<string, string> = {
  FLEXIBLE: 'Free cancellation up to 24h before',
  MODERATE: 'Free cancellation up to 5 days before',
  STRICT: 'Non-refundable',
};

export default function ExperienceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [exp, setExp] = useState<Experience | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ExperienceSession | null>(null);
  const [guests, setGuests] = useState(1);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.getExperience(id),
      api.getExperienceReviews?.(id).catch(() => null),
      api.getExperienceReviewStats?.(id).catch(() => null),
    ]).then(([experience, reviewData, statsData]) => {
      setExp(experience ?? null);
      setReviews(reviewData?.content ?? []);
      setStats(statsData ?? null);
      if (experience?.upcomingSessions?.length) {
        setSelectedSession(experience.upcomingSessions[0]);
      }
      setLoading(false);
    });
  }, [id]);

  async function handleBook() {
    if (!selectedSession || !exp) return;
    setBooking(true);
    try {
      await api.bookExperience({ sessionId: selectedSession.id, numGuests: guests });
      alert('Booking confirmed!');
      router.push('/experiences');
    } catch (err: any) {
      alert(err?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded-xl" />
          <div className="h-40 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!exp) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h2 className="text-xl font-semibold">Experience not found</h2>
        <Link href="/experiences" className="text-orange-500 underline mt-4 inline-block">
          Browse experiences
        </Link>
      </div>
    );
  }

  const photos = exp.mediaUrls ? exp.mediaUrls.split(',').filter(Boolean) : [];
  const languages = exp.languagesSpoken ? exp.languagesSpoken.split(',').map(l => l.trim()) : [];
  const totalPrice = exp.pricePaise * guests;
  const discount = exp.groupDiscountPct && guests >= 3
    ? totalPrice * exp.groupDiscountPct / 100
    : 0;

  function formatDuration(mins: number) {
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs} hours`;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-4">
        <Link href="/experiences" className="hover:text-orange-500">Experiences</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">{exp.title}</span>
      </nav>

      {/* Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo gallery or placeholder */}
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
              {photos.slice(0, 4).map((url, i) => (
                <img key={i} src={url} alt={`${exp.title} ${i + 1}`}
                  className={`w-full object-cover ${i === 0 ? 'col-span-2 h-64' : 'h-40'}`} />
              ))}
            </div>
          ) : (
            <div className="h-64 bg-gradient-to-br from-orange-100 to-pink-100 rounded-xl flex items-center justify-center">
              <span className="text-8xl">{CATEGORY_ICONS[exp.category] ?? '🎯'}</span>
            </div>
          )}

          {/* Title + Meta */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                {exp.category}
              </span>
              {exp.isPrivate && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Private</span>
              )}
            </div>
            <h1 className="text-3xl font-bold">{exp.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-gray-500 text-sm">
              <span>{exp.city}</span>
              {exp.locationName && <span>{exp.locationName}</span>}
              <span>{formatDuration(exp.durationMinutes)}</span>
              <span>Up to {exp.maxGuests} guests</span>
            </div>
            {stats && stats.count > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg font-bold">★ {stats.avgRating?.toFixed(1)}</span>
                <span className="text-gray-400">({stats.count} reviews)</span>
              </div>
            )}
          </div>

          {/* Host */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center text-xl font-bold">
              {exp.hostName?.charAt(0)}
            </div>
            <div>
              <p className="font-semibold">Hosted by {exp.hostName}</p>
              {languages.length > 0 && (
                <p className="text-sm text-gray-500">Speaks {languages.join(', ')}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold mb-2">About this experience</h2>
            <p className="text-gray-600 whitespace-pre-line">{exp.description}</p>
          </div>

          {/* Itinerary */}
          {exp.itinerary && (
            <div>
              <h2 className="text-xl font-semibold mb-2">What you&apos;ll do</h2>
              <div className="text-gray-600 whitespace-pre-line">{exp.itinerary}</div>
            </div>
          )}

          {/* What's Included / Not Included */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {exp.whatsIncluded && (
              <div>
                <h3 className="font-semibold mb-2 text-green-700">What&apos;s included</h3>
                <ul className="space-y-1 text-gray-600 text-sm">
                  {exp.whatsIncluded.split('\n').filter(Boolean).map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">&#10003;</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {exp.whatsNotIncluded && (
              <div>
                <h3 className="font-semibold mb-2 text-gray-500">Not included</h3>
                <ul className="space-y-1 text-gray-600 text-sm">
                  {exp.whatsNotIncluded.split('\n').filter(Boolean).map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">&#10007;</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Meeting Point */}
          {exp.meetingPoint && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Meeting point</h2>
              <p className="text-gray-600">{exp.meetingPoint}</p>
            </div>
          )}

          {/* Accessibility */}
          {exp.accessibility && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Accessibility</h2>
              <p className="text-gray-600">{exp.accessibility}</p>
            </div>
          )}

          {/* Policies */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl text-sm">
            <div>
              <p className="font-medium text-gray-700">Cancellation</p>
              <p className="text-gray-500">{CANCELLATION_LABELS[exp.cancellationPolicy ?? 'FLEXIBLE']}</p>
            </div>
            {exp.minAge && (
              <div>
                <p className="font-medium text-gray-700">Minimum age</p>
                <p className="text-gray-500">{exp.minAge}+ years</p>
              </div>
            )}
            {exp.groupDiscountPct && (
              <div>
                <p className="font-medium text-gray-700">Group discount</p>
                <p className="text-gray-500">{exp.groupDiscountPct}% off for 3+ guests</p>
              </div>
            )}
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Reviews ({stats?.count ?? reviews.length})
              </h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{review.guestName ?? 'Guest'}</span>
                      <span className="text-orange-500 text-sm">{'★'.repeat(review.rating)}</span>
                    </div>
                    {review.comment && <p className="text-gray-600 text-sm">{review.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Booking Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="text-center">
              <span className="text-3xl font-bold text-orange-600">
                {formatPaise(exp.pricePaise)}
              </span>
              <span className="text-gray-500 text-sm"> / person</span>
            </div>

            {/* Session Selector */}
            {exp.upcomingSessions && exp.upcomingSessions.length > 0 ? (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Select a date</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {exp.upcomingSessions.map((session) => {
                    const spotsLeft = session.availableSpots - session.bookedSpots;
                    return (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className={`w-full text-left p-3 rounded-lg border text-sm transition ${
                          selectedSession?.id === session.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <div className="font-medium">
                          {new Date(session.sessionDate).toLocaleDateString('en-IN', {
                            weekday: 'short', month: 'short', day: 'numeric'
                          })}
                        </div>
                        <div className="text-gray-500">
                          {session.startTime?.slice(0, 5)} - {session.endTime?.slice(0, 5)}
                          <span className="ml-2 text-xs">
                            {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center">No upcoming sessions</p>
            )}

            {/* Guest Count */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Guests</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                >
                  -
                </button>
                <span className="font-semibold text-lg">{guests}</span>
                <button
                  onClick={() => setGuests(Math.min(exp.maxGuests, guests + 1))}
                  className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price Summary */}
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>{formatPaise(exp.pricePaise)} x {guests} guests</span>
                <span>{formatPaise(totalPrice)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Group discount ({exp.groupDiscountPct}%)</span>
                  <span>-{formatPaise(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>Total</span>
                <span>{formatPaise(totalPrice - discount)}</span>
              </div>
            </div>

            {/* Book Button */}
            <button
              onClick={handleBook}
              disabled={!selectedSession || booking}
              className="w-full py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {booking ? 'Booking...' : 'Reserve'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
