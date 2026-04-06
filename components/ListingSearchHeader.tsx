'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const TYPE_LABELS: Record<string, string> = {
  HOME: 'Homes', ROOM: 'Rooms', VILLA: 'Villas', HOTEL: 'Hotels',
  RESORT: 'Resorts', HOMESTAY: 'Homestays', PG: 'PG', COLIVING: 'Co-living',
  FARMSTAY: 'Farm Stays', HOSTEL: 'Hostels', UNIQUE: 'Unique Stays',
  COMMERCIAL: 'Commercial', BUDGET_HOTEL: 'Budget Hotels', HOSTEL_DORM: 'Hostels',
  GUESTHOUSE: 'Guesthouses', LODGE: 'Lodges', BNB: 'B&Bs', APARTMENT: 'Apartments',
};

interface Props {
  city: string;
  state: string;
  type: string;
}

export default function ListingSearchHeader({ city, state, type }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(city || '');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [showGuests, setShowGuests] = useState(false);
  const guestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (guestRef.current && !guestRef.current.contains(e.target as Node)) setShowGuests(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Set default dates (today + tomorrow)
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    setCheckIn(today.toISOString().split('T')[0]);
    setCheckOut(tomorrow.toISOString().split('T')[0]);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('city', query.trim());
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    const totalGuests = adults + children;
    if (totalGuests > 1) params.set('guests', String(totalGuests));
    router.push(`/search?${params.toString()}`);
  }

  const guestLabel = `${adults} adult${adults !== 1 ? 's' : ''}${children > 0 ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''} · ${rooms} room${rooms !== 1 ? 's' : ''}`;

  function formatDateShort(dateStr: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  return (
    <div className="bg-[#003B95]">
      <div className="max-w-6xl mx-auto px-4 py-3">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-white/60 mb-3">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <span>/</span>
          <Link href={`/search?city=${encodeURIComponent(city)}`} className="hover:text-white transition">{city}</Link>
          <span>/</span>
          <Link href={`/search?type=${type}&city=${encodeURIComponent(city)}`} className="hover:text-white transition">
            {TYPE_LABELS[type] || type}
          </Link>
        </nav>

        {/* Booking.com-style search bar: destination + check-in + check-out + guests + search */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-1 bg-[#FFB700] rounded-xl p-1">
          {/* Destination */}
          <div className="flex items-center bg-white rounded-lg flex-1 min-w-0">
            <span className="pl-3 text-gray-400 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <input
              className="flex-1 px-3 py-2.5 text-sm text-gray-900 outline-none placeholder-gray-400 bg-transparent min-w-0"
              placeholder="Where are you going?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Check-in */}
          <div className="flex items-center bg-white rounded-lg min-w-0">
            <span className="pl-3 text-gray-400 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            <div className="relative">
              <input
                type="date"
                value={checkIn}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setCheckIn(e.target.value);
                  if (e.target.value && (!checkOut || e.target.value >= checkOut)) {
                    const next = new Date(e.target.value);
                    next.setDate(next.getDate() + 1);
                    setCheckOut(next.toISOString().split('T')[0]);
                  }
                }}
                className="px-2 py-2.5 text-sm text-gray-900 outline-none bg-transparent w-[130px] cursor-pointer"
              />
            </div>
          </div>

          {/* Check-out */}
          <div className="flex items-center bg-white rounded-lg min-w-0">
            <span className="pl-3 text-gray-400 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            <div className="relative">
              <input
                type="date"
                value={checkOut}
                min={checkIn || new Date().toISOString().split('T')[0]}
                onChange={(e) => setCheckOut(e.target.value)}
                className="px-2 py-2.5 text-sm text-gray-900 outline-none bg-transparent w-[130px] cursor-pointer"
              />
            </div>
          </div>

          {/* Guests & Rooms */}
          <div ref={guestRef} className="relative">
            <button
              type="button"
              onClick={() => setShowGuests(!showGuests)}
              className="flex items-center gap-2 bg-white rounded-lg px-3 py-2.5 text-sm text-gray-700 whitespace-nowrap w-full sm:w-auto"
            >
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="truncate">{guestLabel}</span>
              <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showGuests && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-4 w-72">
                {/* Adults */}
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Adults</p>
                    <p className="text-xs text-gray-400">Age 18+</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))}
                      className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-gray-500 disabled:opacity-30"
                      disabled={adults <= 1}>-</button>
                    <span className="text-sm font-semibold w-4 text-center">{adults}</span>
                    <button type="button" onClick={() => setAdults(adults + 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-gray-500">+</button>
                  </div>
                </div>
                {/* Children */}
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Children</p>
                    <p className="text-xs text-gray-400">Age 0-17</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setChildren(Math.max(0, children - 1))}
                      className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-gray-500 disabled:opacity-30"
                      disabled={children <= 0}>-</button>
                    <span className="text-sm font-semibold w-4 text-center">{children}</span>
                    <button type="button" onClick={() => setChildren(children + 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-gray-500">+</button>
                  </div>
                </div>
                {/* Rooms */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Rooms</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setRooms(Math.max(1, rooms - 1))}
                      className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-gray-500 disabled:opacity-30"
                      disabled={rooms <= 1}>-</button>
                    <span className="text-sm font-semibold w-4 text-center">{rooms}</span>
                    <button type="button" onClick={() => setRooms(rooms + 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-gray-500">+</button>
                  </div>
                </div>
                <button type="button" onClick={() => setShowGuests(false)}
                  className="w-full mt-3 bg-[#003B95] text-white text-sm font-semibold rounded-lg py-2 hover:bg-[#00296b] transition">
                  Done
                </button>
              </div>
            )}
          </div>

          {/* Search button */}
          <button type="submit"
            className="bg-[#003B95] hover:bg-[#00296b] text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-all flex items-center justify-center gap-1.5 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
