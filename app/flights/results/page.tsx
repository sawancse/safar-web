'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';

interface Segment {
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
  duration: string;
}

interface FlightOffer {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stops: number;
  totalPaise: number;
  cabinClass: string;
  segments: Segment[];
}

type SortKey = 'cheapest' | 'fastest' | 'best';
type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getTimeSlot(iso: string): TimeSlot {
  const h = new Date(iso).getHours();
  if (h < 6) return 'night';
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

export default function FlightResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const departureDate = searchParams.get('departureDate') || '';
  const passengers = Number(searchParams.get('passengers')) || 1;
  const cabinClass = searchParams.get('cabinClass') || 'economy';
  const returnDate = searchParams.get('returnDate') || '';
  const international = searchParams.get('international') === 'true';

  const [offers, setOffers] = useState<FlightOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [maxStops, setMaxStops] = useState<number | null>(null);
  const [selectedAirlines, setSelectedAirlines] = useState<Set<string>>(new Set());
  const [timeSlots, setTimeSlots] = useState<Set<TimeSlot>>(new Set());
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000000]);
  const [sortBy, setSortBy] = useState<SortKey>('best');

  useEffect(() => {
    if (!origin || !destination || !departureDate) return;
    setLoading(true);
    setError('');
    const params: any = { origin, destination, departureDate, passengers, cabinClass };
    if (returnDate) params.returnDate = returnDate;
    api.searchFlights(params)
      .then((data: any) => {
        const list = data?.offers || data?.content || data || [];
        setOffers(Array.isArray(list) ? list : []);
      })
      .catch((e: any) => {
        setError(e?.message || 'Failed to search flights');
        setOffers([]);
      })
      .finally(() => setLoading(false));
  }, [origin, destination, departureDate, passengers, cabinClass, returnDate]);

  // Derived airline list
  const airlines = useMemo(() => {
    const set = new Set(offers.map(o => o.airline));
    return Array.from(set).sort();
  }, [offers]);

  // Price bounds
  const priceBounds = useMemo(() => {
    if (offers.length === 0) return [0, 100000000] as [number, number];
    const prices = offers.map(o => o.totalPaise);
    return [Math.min(...prices), Math.max(...prices)] as [number, number];
  }, [offers]);

  // Filtered & sorted
  const filtered = useMemo(() => {
    let list = [...offers];

    if (maxStops !== null) {
      list = list.filter(o => (maxStops === 2 ? o.stops >= 2 : o.stops === maxStops));
    }

    if (selectedAirlines.size > 0) {
      list = list.filter(o => selectedAirlines.has(o.airline));
    }

    if (timeSlots.size > 0) {
      list = list.filter(o => timeSlots.has(getTimeSlot(o.departureTime)));
    }

    list = list.filter(o => o.totalPaise >= priceRange[0] && o.totalPaise <= priceRange[1]);

    list.sort((a, b) => {
      if (sortBy === 'cheapest') return a.totalPaise - b.totalPaise;
      if (sortBy === 'fastest') return a.durationMinutes - b.durationMinutes;
      // best: balanced score
      const scoreA = a.totalPaise / 100 + a.durationMinutes * 5 + a.stops * 500;
      const scoreB = b.totalPaise / 100 + b.durationMinutes * 5 + b.stops * 500;
      return scoreA - scoreB;
    });

    return list;
  }, [offers, maxStops, selectedAirlines, timeSlots, priceRange, sortBy]);

  function toggleAirline(a: string) {
    setSelectedAirlines(prev => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a); else next.add(a);
      return next;
    });
  }

  function toggleTimeSlot(s: TimeSlot) {
    setTimeSlots(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }

  function handleBook(offer: FlightOffer) {
    const params = new URLSearchParams({
      offerId: offer.id,
      origin,
      destination,
      departureDate,
      passengers: String(passengers),
      cabinClass,
      international: String(international),
      totalPaise: String(offer.totalPaise),
      airline: offer.airline,
      flightNumber: offer.flightNumber,
    });
    router.push(`/flights/book?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#003B95] text-white py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">
              {origin} &rarr; {destination}
            </h1>
            <p className="text-blue-200 text-sm">
              {departureDate}{returnDate && ` - ${returnDate}`} &middot; {passengers} passenger{passengers > 1 ? 's' : ''} &middot; {cabinClass.replace('_', ' ')}
            </p>
          </div>
          <Link
            href="/flights"
            className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
          >
            Modify Search
          </Link>
        </div>
      </div>

      {/* Sort bar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 font-medium">Sort by:</span>
          {(['best', 'cheapest', 'fastest'] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-3 py-1.5 rounded-full transition font-medium ${
                sortBy === key
                  ? 'bg-[#003B95] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
          <span className="ml-auto text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12 flex flex-col lg:flex-row gap-6">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-6 sticky top-20">
            {/* Stops */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Stops</h4>
              {[
                { label: 'Non-stop', value: 0 },
                { label: '1 stop', value: 1 },
                { label: '2+ stops', value: 2 },
              ].map((s) => (
                <label key={s.value} className="flex items-center gap-2 text-sm text-gray-600 mb-2 cursor-pointer">
                  <input
                    type="radio"
                    name="stops"
                    checked={maxStops === s.value}
                    onChange={() => setMaxStops(maxStops === s.value ? null : s.value)}
                    className="accent-[#003B95]"
                  />
                  {s.label}
                </label>
              ))}
              {maxStops !== null && (
                <button onClick={() => setMaxStops(null)} className="text-xs text-[#003B95] hover:underline">
                  Clear
                </button>
              )}
            </div>

            {/* Airlines */}
            {airlines.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Airlines</h4>
                {airlines.map((a) => (
                  <label key={a} className="flex items-center gap-2 text-sm text-gray-600 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAirlines.has(a)}
                      onChange={() => toggleAirline(a)}
                      className="accent-[#003B95]"
                    />
                    {a}
                  </label>
                ))}
              </div>
            )}

            {/* Departure Time */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Departure Time</h4>
              {([
                { label: 'Morning (6am-12pm)', slot: 'morning' as TimeSlot },
                { label: 'Afternoon (12pm-6pm)', slot: 'afternoon' as TimeSlot },
                { label: 'Evening (6pm-12am)', slot: 'evening' as TimeSlot },
                { label: 'Night (12am-6am)', slot: 'night' as TimeSlot },
              ]).map((t) => (
                <label key={t.slot} className="flex items-center gap-2 text-sm text-gray-600 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={timeSlots.has(t.slot)}
                    onChange={() => toggleTimeSlot(t.slot)}
                    className="accent-[#003B95]"
                  />
                  {t.label}
                </label>
              ))}
            </div>

            {/* Price Range */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Price Range</h4>
              <input
                type="range"
                min={priceBounds[0]}
                max={priceBounds[1]}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-full accent-[#003B95]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{formatPaise(priceBounds[0])}</span>
                <span>Up to {formatPaise(priceRange[1])}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <main className="flex-1 space-y-4">
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-600 font-medium">{error}</p>
              <Link href="/flights" className="text-sm text-[#003B95] hover:underline mt-2 inline-block">
                Try a new search
              </Link>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <div className="text-5xl mb-4">&#x2708;&#xFE0F;</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No flights found</h3>
              <p className="text-sm text-gray-500 mb-4">
                {offers.length > 0
                  ? 'Try adjusting your filters to see more results.'
                  : 'No flights available for this route and date. Try different dates or airports.'}
              </p>
              <Link href="/flights" className="text-[#003B95] text-sm font-medium hover:underline">
                Search again
              </Link>
            </div>
          )}

          {!loading && filtered.map((offer) => (
            <div key={offer.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition p-5">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                {/* Airline logo placeholder */}
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-[#003B95] font-bold text-xs">{offer.airline?.substring(0, 2).toUpperCase() || 'FL'}</span>
                </div>

                {/* Flight info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-800">{offer.airline}</span>
                    <span className="text-xs text-gray-400">{offer.flightNumber}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-gray-900 text-lg">{formatTime(offer.departureTime)}</p>
                      <p className="text-xs text-gray-400">{offer.origin}</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center px-2">
                      <span className="text-xs text-gray-400">{formatDuration(offer.durationMinutes)}</span>
                      <div className="w-full flex items-center gap-1">
                        <div className="flex-1 h-px bg-gray-300" />
                        {offer.stops > 0 && (
                          <span className="text-[10px] text-orange-500 font-medium px-1">
                            {offer.stops === 1 ? '1 stop' : `${offer.stops} stops`}
                          </span>
                        )}
                        {offer.stops === 0 && (
                          <span className="text-[10px] text-green-600 font-medium px-1">Non-stop</span>
                        )}
                        <div className="flex-1 h-px bg-gray-300" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900 text-lg">{formatTime(offer.arrivalTime)}</p>
                      <p className="text-xs text-gray-400">{offer.destination}</p>
                    </div>
                  </div>
                </div>

                {/* Price + Book */}
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-[#003B95]">{formatPaise(offer.totalPaise)}</p>
                  <p className="text-xs text-gray-400 mb-2">per person</p>
                  <button
                    onClick={() => handleBook(offer)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition"
                  >
                    Book
                  </button>
                </div>
              </div>

              {/* Segments */}
              {offer.stops > 0 && offer.segments && offer.segments.length > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-2">Flight segments</p>
                  <div className="space-y-2">
                    {offer.segments.map((seg, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                        <span className="font-medium text-[#003B95]">{seg.flightNumber}</span>
                        <span>{seg.departureAirport} {formatTime(seg.departureTime)}</span>
                        <span className="text-gray-300">&rarr;</span>
                        <span>{seg.arrivalAirport} {formatTime(seg.arrivalTime)}</span>
                        <span className="ml-auto text-gray-400">{seg.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
