'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Trip {
  id: string;
  tripName: string;
  originCity: string;
  destinationCity: string;
  startDate: string;
  endDate: string;
  tripIntent: string;
  paxCount: number;
  status: string;
}

interface Suggestions {
  tripId: string;
  intent: string;
  suggestedVerticals: string[];   // ["STAY", "CAB", "COOK", "INSURANCE", ...]
  matchedRules: string[];
}

const VERTICAL_META: Record<string, { label: string; tagline: string; emoji: string; href: (t: Trip) => string }> = {
  STAY: {
    label: 'Stay',
    tagline: 'Apartments, hotels & PG at your destination',
    emoji: '🏠',
    href: (t) => `/search?city=${encodeURIComponent(t.destinationCity)}&checkIn=${t.startDate}&checkOut=${t.endDate}&guests=${t.paxCount}`,
  },
  CAB: {
    label: 'Airport cab',
    tagline: 'Pre-book a cab to / from the airport',
    emoji: '🚕',
    href: (t) => `/services/cab?dropCity=${encodeURIComponent(t.destinationCity)}&date=${t.startDate}`,
  },
  COOK: {
    label: 'Cook on demand',
    tagline: 'Home-style meals at your destination',
    emoji: '🍳',
    href: (t) => `/cooks?city=${encodeURIComponent(t.destinationCity)}&date=${t.startDate}`,
  },
  INSURANCE: {
    label: 'Travel insurance',
    tagline: 'Cover lost baggage, delays & medical',
    emoji: '🛡️',
    href: (_t) => `/services/insurance`,
  },
  PANDIT: {
    label: 'Pandit booking',
    tagline: 'Pooja & ceremony at the temple',
    emoji: '🪔',
    href: (t) => `/services/pandit?city=${encodeURIComponent(t.destinationCity)}`,
  },
  DECOR: {
    label: 'Event decor',
    tagline: 'Decoration for weddings & events',
    emoji: '🎀',
    href: (t) => `/services/decor?city=${encodeURIComponent(t.destinationCity)}`,
  },
  SPA: {
    label: 'Spa & wellness',
    tagline: 'Pamper yourself on this trip',
    emoji: '💆',
    href: (t) => `/services/spa?city=${encodeURIComponent(t.destinationCity)}`,
  },
  EXPERIENCE: {
    label: 'Experiences',
    tagline: 'Local tours & activities at your destination',
    emoji: '🗺️',
    href: (t) => `/experiences?city=${encodeURIComponent(t.destinationCity)}`,
  },
};

const INTENT_LABEL: Record<string, string> = {
  PILGRIMAGE: 'pilgrimage',
  WEDDING: 'wedding',
  BUSINESS: 'business',
  LEISURE: 'leisure',
  MOVE_IN: 'PG move-in',
  MEDICAL: 'medical',
  FAMILY: 'family',
  EDUCATION: 'education',
  UNCLASSIFIED: '',
};

interface Props {
  flightBookingId: string;
}

export default function CompleteYourTrip({ flightBookingId }: Props) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [tripNotReady, setTripNotReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 5;            // poll for ~10s — Kafka event may lag
    const pollInterval = 2000;

    async function pollForTrip() {
      while (!cancelled && attempts < maxAttempts) {
        attempts++;
        try {
          const t = await api.getTripByFlightBooking(flightBookingId);
          if (cancelled || !t) break;
          setTrip(t);
          const s = await api.getTripSuggestions(t.id);
          if (cancelled) return;
          setSuggestions(s);
          setLoading(false);
          return;
        } catch (e: any) {
          // 404 = trip not yet created (Kafka catching up); keep polling
          if (attempts >= maxAttempts) {
            if (!cancelled) {
              setTripNotReady(true);
              setLoading(false);
            }
            return;
          }
          await new Promise((r) => setTimeout(r, pollInterval));
        }
      }
    }

    pollForTrip();
    return () => { cancelled = true; };
  }, [flightBookingId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-[#003B95] rounded-full animate-spin" />
          <span className="text-sm">Building your trip suggestions…</span>
        </div>
      </div>
    );
  }

  if (tripNotReady || !trip || !suggestions || suggestions.suggestedVerticals.length === 0) {
    return null; // silently skip the section if no trip / no suggestions
  }

  const intentText = INTENT_LABEL[suggestions.intent] || '';

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-xl border border-blue-100 shadow-sm p-6 mb-6">
      {/* Header */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#003B95] mb-1">
          ✨ Complete your trip
        </p>
        <h2 className="text-xl font-bold text-gray-900">
          {intentText
            ? <>We&apos;ve picked these for your <span className="text-[#003B95]">{intentText} trip</span></>
            : <>Here&apos;s what else you might need</>}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Add any of these to your trip in one click. Save up to 12% with bundle pricing.
        </p>
      </div>

      {/* Suggestion cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.suggestedVerticals.map((v) => {
          const meta = VERTICAL_META[v];
          if (!meta) return null;
          return (
            <Link
              key={v}
              href={meta.href(trip)}
              className="group bg-white rounded-lg border border-gray-200 hover:border-[#003B95] hover:shadow-md transition p-4 flex items-start gap-3"
            >
              <div className="text-3xl shrink-0">{meta.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-[#003B95]">
                  {meta.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{meta.tagline}</p>
                <p className="text-xs font-medium text-[#003B95] mt-2 opacity-0 group-hover:opacity-100 transition">
                  Add to your trip →
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer micro-copy */}
      <p className="text-[11px] text-gray-400 mt-4 text-center">
        Suggestions based on your destination, dates and travel pattern.
        {suggestions.matchedRules.length > 0 && (
          <span className="ml-1">Matched: {suggestions.matchedRules.join(', ')}.</span>
        )}
      </p>
    </div>
  );
}
