'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';

interface Segment {
  segmentId: string;
  airline: string;
  flightNumber: string;
  originCode: string;
  originCity: string;
  destinationCode: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  aircraft: string;
}

interface FlightOffer {
  offerId: string;
  airline: string;
  airlineLogo: string | null;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  pricePaise: number;
  currency: string;
  cabinClass: string;
  segments: Segment[];
  provider: 'AMADEUS' | 'DUFFEL' | 'TRIPJACK' | 'TBO' | 'TRAVCLAN';
}

type SortKey = 'cheapest' | 'fastest' | 'best';
type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

function parseIsoDurationMinutes(iso: string): number {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 0;
  return (Number(m[1] || 0) * 60) + Number(m[2] || 0);
}

function formatDuration(mins: number) {
  if (!mins) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function formatTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function getTimeSlot(iso: string): TimeSlot {
  const h = new Date(iso).getHours();
  if (h < 6) return 'night';
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

function offerOriginCode(o: FlightOffer, fallback: string): string {
  return o.segments?.[0]?.originCode || fallback;
}

function offerDestinationCode(o: FlightOffer, fallback: string): string {
  return o.segments?.[o.segments.length - 1]?.destinationCode || fallback;
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
    const params: Record<string, string> = { origin, destination, departureDate, passengers: String(passengers), cabinClass };
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

  const airlines = useMemo(() => {
    const set = new Set(offers.map(o => o.airline));
    return Array.from(set).sort();
  }, [offers]);

  const priceBounds = useMemo(() => {
    if (offers.length === 0) return [0, 100000000] as [number, number];
    const prices = offers.map(o => o.pricePaise);
    return [Math.min(...prices), Math.max(...prices)] as [number, number];
  }, [offers]);

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
    list = list.filter(o => o.pricePaise >= priceRange[0] && o.pricePaise <= priceRange[1]);

    list.sort((a, b) => {
      if (sortBy === 'cheapest') return a.pricePaise - b.pricePaise;
      if (sortBy === 'fastest') return parseIsoDurationMinutes(a.duration) - parseIsoDurationMinutes(b.duration);
      const scoreA = a.pricePaise / 100 + parseIsoDurationMinutes(a.duration) * 5 + a.stops * 500;
      const scoreB = b.pricePaise / 100 + parseIsoDurationMinutes(b.duration) * 5 + b.stops * 500;
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
      offerId: offer.offerId,
      origin: offerOriginCode(offer, origin),
      destination: offerDestinationCode(offer, destination),
      departureDate,
      passengers: String(passengers),
      cabinClass,
      international: String(international),
      totalPaise: String(offer.pricePaise),
      airline: offer.airline,
      flightNumber: offer.flightNumber,
    });
    router.push(`/flights/book?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#003B95] text-white py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{origin} &rarr; {destination}</h1>
            <p className="text-blue-200 text-sm">
              {departureDate}{returnDate && ` - ${returnDate}`} &middot; {passengers} passenger{passengers > 1 ? 's' : ''} &middot; {cabinClass.replace('_', ' ')}
            </p>
          </div>
          <Link href="/flights" className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-xl transition">
            Modify Search
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 font-medium">Sort by:</span>
          {(['best', 'cheapest', 'fastest'] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-3 py-1.5 rounded-full transition font-medium ${
                sortBy === key ? 'bg-[#003B95] text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
          <span className="ml-auto text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12 flex flex-col lg:flex-row gap-6">
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-6 sticky top-20">
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Stops</h4>
              {[
                { label: 'Non-stop', value: 0 },
                { label: '1 stop', value: 1 },
                { label: '2+ stops', value: 2 },
              ].map((s) => (
                <label key={s.value} className="flex items-center gap-2 text-sm text-gray-600 mb-2 cursor-pointer">
                  <input
                    type="radio" name="stops"
                    checked={maxStops === s.value}
                    onChange={() => setMaxStops(maxStops === s.value ? null : s.value)}
                    className="accent-[#003B95]"
                  />
                  {s.label}
                </label>
              ))}
              {maxStops !== null && (
                <button onClick={() => setMaxStops(null)} className="text-xs text-[#003B95] hover:underline">Clear</button>
              )}
            </div>

            {airlines.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Airlines</h4>
                {airlines.map((a) => (
                  <label key={a} className="flex items-center gap-2 text-sm text-gray-600 mb-2 cursor-pointer">
                    <input type="checkbox" checked={selectedAirlines.has(a)} onChange={() => toggleAirline(a)} className="accent-[#003B95]" />
                    {a}
                  </label>
                ))}
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Departure Time</h4>
              {([
                { label: 'Morning (6am-12pm)', slot: 'morning' as TimeSlot },
                { label: 'Afternoon (12pm-6pm)', slot: 'afternoon' as TimeSlot },
                { label: 'Evening (6pm-12am)', slot: 'evening' as TimeSlot },
                { label: 'Night (12am-6am)', slot: 'night' as TimeSlot },
              ]).map((t) => (
                <label key={t.slot} className="flex items-center gap-2 text-sm text-gray-600 mb-2 cursor-pointer">
                  <input type="checkbox" checked={timeSlots.has(t.slot)} onChange={() => toggleTimeSlot(t.slot)} className="accent-[#003B95]" />
                  {t.label}
                </label>
              ))}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Price Range</h4>
              <input
                type="range"
                min={priceBounds[0]} max={priceBounds[1]} value={priceRange[1]}
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
              <Link href="/flights" className="text-sm text-[#003B95] hover:underline mt-2 inline-block">Try a new search</Link>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <div className="text-5xl mb-4">&#x2708;&#xFE0F;</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No flights found</h3>
              <p className="text-sm text-gray-500 mb-4">
                {offers.length > 0 ? 'Try adjusting your filters to see more results.' : 'No flights available for this route and date. Try different dates or airports.'}
              </p>
              <Link href="/flights" className="text-[#003B95] text-sm font-medium hover:underline">Search again</Link>
            </div>
          )}

          {!loading && filtered.map((offer) => {
            const durationMins = parseIsoDurationMinutes(offer.duration);
            const originCode = offerOriginCode(offer, origin);
            const destCode = offerDestinationCode(offer, destination);

            return (
              <div key={offer.offerId} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition p-5">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  {offer.airlineLogo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={offer.airlineLogo} alt={offer.airline} className="w-12 h-12 rounded-xl shrink-0 object-contain bg-blue-50" />
                  ) : (
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-[#003B95] font-bold text-xs">{offer.airline?.substring(0, 2).toUpperCase() || 'FL'}</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">{offer.airline}</span>
                      {offer.flightNumber && <span className="text-xs text-gray-400">{offer.flightNumber}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="text-center">
                        <p className="font-bold text-gray-900 text-lg">{formatTime(offer.departureTime)}</p>
                        <p className="text-xs text-gray-400">{originCode}</p>
                      </div>
                      <div className="flex-1 flex flex-col items-center px-2">
                        <span className="text-xs text-gray-400">{formatDuration(durationMins)}</span>
                        <div className="w-full flex items-center gap-1">
                          <div className="flex-1 h-px bg-gray-300" />
                          {offer.stops > 0 ? (
                            <span className="text-[10px] text-orange-500 font-medium px-1">
                              {offer.stops === 1 ? '1 stop' : `${offer.stops} stops`}
                            </span>
                          ) : (
                            <span className="text-[10px] text-green-600 font-medium px-1">Non-stop</span>
                          )}
                          <div className="flex-1 h-px bg-gray-300" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-gray-900 text-lg">{formatTime(offer.arrivalTime)}</p>
                        <p className="text-xs text-gray-400">{destCode}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-[#003B95]">{formatPaise(offer.pricePaise)}</p>
                    <p className="text-xs text-gray-400 mb-2">per person</p>
                    <button
                      onClick={() => handleBook(offer)}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition whitespace-nowrap"
                    >
                      Book
                    </button>
                  </div>
                </div>

                {offer.stops > 0 && offer.segments && offer.segments.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-medium mb-2">Flight segments</p>
                    <div className="space-y-2">
                      {offer.segments.map((seg, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                          <span className="font-medium text-[#003B95]">{seg.flightNumber}</span>
                          <span>{seg.originCode} {formatTime(seg.departureTime)}</span>
                          <span className="text-gray-300">&rarr;</span>
                          <span>{seg.destinationCode} {formatTime(seg.arrivalTime)}</span>
                          <span className="ml-auto text-gray-400">{formatDuration(parseIsoDurationMinutes(seg.duration))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </main>
      </div>
    </div>
  );
}
