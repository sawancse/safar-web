'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatPaise } from '@/lib/utils';
import GuestPicker from '@/components/GuestPicker';
import type { Listing, RoomType } from '@/types';
import type { RoomSelection } from '@/components/RoomTypeSelector';

interface Props {
  listing: Listing;
  selectedRoomType?: RoomType | null;
  roomSelections?: RoomSelection[];
}

export default function BookingPanel({ listing, selectedRoomType, roomSelections = [] }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isCommercial = listing.pricingUnit === 'HOUR';

  // Pre-fill from URL params
  const urlCheckIn = searchParams.get('checkIn') ?? '';
  const urlCheckOut = searchParams.get('checkOut') ?? '';
  const urlGuests = Number(searchParams.get('guests')) || 0;
  const urlChildren = Number(searchParams.get('children')) || 0;
  const urlInfants = Number(searchParams.get('infants')) || 0;
  const urlPets = Number(searchParams.get('pets')) || 0;
  const urlAdults = Math.max(1, urlGuests - urlChildren || 1);

  // Total rooms: use selected room type count, or listing totalRooms, or default to 10 for hotels
  const isHotelType = listing.type === 'HOTEL' || listing.type === 'BUDGET_HOTEL' || listing.type === 'HOSTEL_DORM' || listing.type === 'RESORT';
  const totalRooms = selectedRoomType?.count
    ?? listing.totalRooms
    ?? (isHotelType ? 10 : 1);
  const maxGuestsPerRoom = selectedRoomType?.maxGuests
    ?? (totalRooms > 1 && listing.maxGuests
      ? Math.max(1, Math.floor(listing.maxGuests / totalRooms))
      : Math.min(listing.maxGuests ?? 2, 4));
  const autoRooms = Math.max(1, Math.ceil((urlAdults + urlChildren) / maxGuestsPerRoom));

  // Residential state
  const [checkIn, setCheckIn] = useState(urlCheckIn);
  const [checkOut, setCheckOut] = useState(urlCheckOut);
  const [rooms, setRooms] = useState(autoRooms);


  // Commercial state
  const [bookingDate, setBookingDate] = useState(urlCheckIn);
  const [startTime, setStartTime] = useState(listing.operatingHoursFrom ?? '09:00');
  const [endTime, setEndTime] = useState('');
  const [hours, setHours] = useState(listing.minBookingHours ?? 1);

  // Shared state
  const [guestCounts, setGuestCounts] = useState({
    adults: urlAdults, children: urlChildren,
    infants: urlInfants, pets: urlPets,
    childrenAges: Array.from({ length: urlChildren }, () => 0),
  });
  const [showRoomGuest, setShowRoomGuest] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const totalGuests = guestCounts.adults + guestCounts.children;
  const minHours = listing.minBookingHours ?? 1;

  // Auto-calc end time when start time or hours change
  const computedEndTime = (() => {
    if (!startTime) return '';
    const [h, m] = startTime.split(':').map(Number);
    const endH = h + hours;
    const endM = m;
    if (endH >= 24) return '23:59';
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  })();

  // Calculations
  const nights = !isCommercial && checkIn && checkOut
    ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0;

  const isPG = listing.type === 'PG' || listing.type === 'COLIVING';
  const rawPricingUnit = listing.pricingUnit || 'NIGHT';
  const pricingUnit = isCommercial ? (rawPricingUnit === 'NIGHT' ? 'HOUR' : rawPricingUnit)
    : (rawPricingUnit === 'NIGHT' && isPG) ? 'MONTH' : rawPricingUnit;
  const isMonthly = pricingUnit === 'MONTH';
  const isHourly = pricingUnit === 'HOUR';

  const unitLabel = isMonthly ? 'month' : isHourly ? 'hour' : 'night';
  const unitLabelPlural = isMonthly ? 'months' : isHourly ? 'hours' : 'nights';

  // Use multi-room selection total, single room type price, or listing price
  const hasMultiRoomSelection = roomSelections.length > 0;
  const effectiveRooms = hasMultiRoomSelection
    ? roomSelections.reduce((sum, s) => sum + s.count, 0)
    : rooms;

  // Compute actual max guests from room selections (each type has different maxGuests)
  const maxGuestsAllowed = hasMultiRoomSelection
    ? roomSelections.reduce((sum, s) => sum + s.count * s.maxGuests, 0)
    : effectiveRooms * maxGuestsPerRoom;

  // Auto-adjust guests when room selection changes
  useEffect(() => {
    const maxTotal = maxGuestsAllowed;
    const totalNow = guestCounts.adults + guestCounts.children;

    // Ensure at least 1 adult per room
    if (guestCounts.adults < effectiveRooms) {
      setGuestCounts(g => ({ ...g, adults: effectiveRooms }));
    }
    // Cap guests if over new max
    else if (totalNow > maxTotal) {
      const newChildren = Math.min(guestCounts.children, Math.max(0, maxTotal - 1));
      const newAdults = Math.min(guestCounts.adults, maxTotal - newChildren);
      setGuestCounts(g => ({ ...g, adults: Math.max(1, newAdults), children: newChildren }));
    }
  }, [maxGuestsAllowed]);
  const multiRoomTotalPerUnit = hasMultiRoomSelection
    ? roomSelections.reduce((sum, s) => sum + s.pricePerUnitPaise * s.count, 0)
    : 0;
  const displayPrice = hasMultiRoomSelection
    ? multiRoomTotalPerUnit // already includes count
    : (selectedRoomType?.basePricePaise ?? listing.basePricePaise);

  // Calculate base amount by pricing unit
  const pgFullMonths = isMonthly ? Math.floor(nights / 30) : 0;
  const pgRemainingDays = isMonthly ? nights % 30 : 0;
  const pgProratedPaise = isMonthly && pgRemainingDays > 0
    ? Math.round(displayPrice * pgRemainingDays / 30)
    : 0;

  let basePaise: number;
  const roomMultiplier = hasMultiRoomSelection ? 1 : rooms;
  if (isMonthly) {
    // Monthly: price IS the monthly rent, not per-night
    // For 1 month = displayPrice, for partial months = prorated
    const months = Math.max(1, pgFullMonths + (pgRemainingDays > 0 ? 1 : 0));
    if (pgRemainingDays > 0 && pgFullMonths >= 1) {
      basePaise = (displayPrice * pgFullMonths + pgProratedPaise) * roomMultiplier;
    } else {
      // Exactly N months or less than 1 month
      basePaise = displayPrice * Math.max(1, pgFullMonths) * roomMultiplier;
    }
  } else if (isHourly) {
    basePaise = displayPrice * hours * roomMultiplier;
  } else {
    basePaise = displayPrice * nights * roomMultiplier;
  }

  const duration = isMonthly ? Math.max(1, pgFullMonths) : isHourly ? hours : nights;

  // Discount calculation
  let discountPercent = 0;
  let discountLabel = '';
  if (!isCommercial && !isMonthly && nights >= 28 && listing.monthlyDiscountPercent) {
    discountPercent = listing.monthlyDiscountPercent;
    discountLabel = 'Monthly discount';
  } else if (!isCommercial && !isMonthly && nights >= 7 && listing.weeklyDiscountPercent) {
    discountPercent = listing.weeklyDiscountPercent;
    discountLabel = 'Weekly discount';
  }
  const discountAmount = Math.round(basePaise * discountPercent / 100);
  const discountedBase = basePaise - discountAmount;

  // GST: Only for commercial properties. Residential rent is GST-exempt in India.
  const gstPaise = isCommercial && !isMonthly ? Math.round(discountedBase * 0.18) : 0;

  // Maintenance charges (monthly rentals only, shown separately)
  const maintenancePaise = isMonthly && (listing.maintenanceChargePaise ?? 0) > 0 && !(listing.maintenanceIncluded)
    ? (listing.maintenanceChargePaise ?? 0) * Math.max(1, pgFullMonths)
    : 0;

  // Insurance (optional per listing)
  const insurancePaise = listing.insuranceEnabled && (listing.insuranceAmountPaise ?? 0) > 0
    ? (listing.insuranceAmountPaise ?? 0) : 0;

  // PG/Co-living: deposit is per bed (per adult), multiply by adults count
  const perBedDeposit = listing.securityDepositPaise ?? 0;
  const depositPaise = isPG && guestCounts.adults > 1 ? perBedDeposit * guestCounts.adults : perBedDeposit;
  const totalPaise = discountedBase + gstPaise + insurancePaise + depositPaise + maintenancePaise;

  const canBook = isCommercial
    ? (bookingDate && hours >= minHours)
    : (checkIn && checkOut && nights > 0);

  const guestLabel = [
    `${guestCounts.adults} adult${guestCounts.adults !== 1 ? 's' : ''}`,
    guestCounts.children > 0 ? `${guestCounts.children} child${guestCounts.children !== 1 ? 'ren' : ''}` : '',
    guestCounts.infants > 0 ? `${guestCounts.infants} infant${guestCounts.infants !== 1 ? 's' : ''}` : '',
    guestCounts.pets > 0 ? `${guestCounts.pets} pet${guestCounts.pets !== 1 ? 's' : ''}` : '',
  ].filter(Boolean).join(', ');

  function handleBook() {
    const params = new URLSearchParams();
    if (isCommercial) {
      if (bookingDate) params.set('checkIn', bookingDate);
      params.set('checkOut', bookingDate); // same day
      params.set('startTime', startTime);
      params.set('endTime', computedEndTime);
      params.set('hours', String(hours));
    } else {
      if (checkIn) params.set('checkIn', checkIn);
      if (checkOut) params.set('checkOut', checkOut);
      params.set('rooms', String(effectiveRooms));
    }
    params.set('guests', String(totalGuests));
    params.set('adults', String(guestCounts.adults));
    params.set('children', String(guestCounts.children));
    params.set('infants', String(guestCounts.infants));
    params.set('pets', String(guestCounts.pets));
    if (roomSelections.length > 0) {
      params.set('roomSelections', JSON.stringify(roomSelections.map(s => ({ id: s.roomTypeId, c: s.count }))));
      params.set('rooms', String(roomSelections.reduce((s, r) => s + r.count, 0)));
    } else if (selectedRoomType?.id) {
      params.set('roomTypeId', selectedRoomType.id);
    }
    router.push(`/book/${listing.id}?${params.toString()}`);
  }

  return (
    <div className="border rounded-2xl p-6 sticky top-20 shadow-sm bg-white">
      {/* Price header */}
      <div className="mb-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{formatPaise(displayPrice)}</span>
          <span className="text-gray-500 text-sm">/ {unitLabel}</span>
        </div>
        {hasMultiRoomSelection && (
          <div className="mt-1 space-y-0.5">
            {roomSelections.map(s => (
              <p key={s.roomTypeId} className="text-xs text-gray-500">
                {s.count}x {s.roomTypeName} — {formatPaise(s.pricePerUnitPaise)}/{unitLabel}
              </p>
            ))}
          </div>
        )}
        {!hasMultiRoomSelection && selectedRoomType && (
          <p className="text-xs text-orange-500 font-medium">{selectedRoomType.name}</p>
        )}
      </div>

      {listing.avgRating != null && listing.avgRating > 0 && (
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
          <span className="text-yellow-500">★</span>
          <span className="font-semibold">{listing.avgRating.toFixed(1)}</span>
          {listing.reviewCount != null && (
            <span className="text-gray-400">({listing.reviewCount} reviews)</span>
          )}
        </div>
      )}

      <div className="border rounded-xl overflow-hidden mb-3">
        {isCommercial ? (
          /* ── Commercial: Date + Time + Duration ─────────── */
          <>
            <div className="p-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1">DATE</label>
              <input type="date" className="w-full text-sm outline-none bg-transparent"
                value={bookingDate} min={today}
                onChange={(e) => setBookingDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 divide-x border-t">
              <div className="p-3">
                <label className="block text-xs font-semibold text-gray-500 mb-1">START TIME</label>
                <input type="time" className="w-full text-sm outline-none bg-transparent"
                  value={startTime}
                  min={listing.operatingHoursFrom ?? undefined}
                  max={listing.operatingHoursUntil ?? undefined}
                  onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="p-3">
                <label className="block text-xs font-semibold text-gray-500 mb-1">END TIME</label>
                <p className="text-sm text-gray-800">{computedEndTime || '—'}</p>
              </div>
            </div>
            <div className="border-t p-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                DURATION (min {minHours}h)
              </label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setHours(Math.max(minHours, hours - 1))}
                  disabled={hours <= minHours}
                  className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-gray-500 disabled:opacity-30 transition text-sm">
                  -
                </button>
                <span className="text-sm font-semibold w-12 text-center">{hours} hr{hours > 1 ? 's' : ''}</span>
                <button type="button" onClick={() => setHours(Math.min(12, hours + 1))}
                  disabled={hours >= 12}
                  className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-gray-500 disabled:opacity-30 transition text-sm">
                  +
                </button>
              </div>
            </div>
            {/* Attendees */}
            <div className="border-t p-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1">ATTENDEES</label>
              <div className="flex items-center gap-3">
                <button type="button"
                  onClick={() => setGuestCounts(g => ({ ...g, adults: Math.max(1, g.adults - 1) }))}
                  disabled={guestCounts.adults <= 1}
                  className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-gray-500 disabled:opacity-30 transition text-sm">
                  -
                </button>
                <span className="text-sm font-semibold w-12 text-center">
                  {totalGuests} {totalGuests === 1 ? 'person' : 'people'}
                </span>
                <button type="button"
                  onClick={() => setGuestCounts(g => ({ ...g, adults: Math.min(listing.maxGuests ?? 50, g.adults + 1) }))}
                  disabled={totalGuests >= (listing.maxGuests ?? 50)}
                  className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-gray-500 disabled:opacity-30 transition text-sm">
                  +
                </button>
              </div>
              {totalGuests >= (listing.maxGuests ?? 50) && (
                <p className="text-xs text-orange-500 mt-1">Max capacity: {listing.maxGuests}</p>
              )}
            </div>
          </>
        ) : (
          /* ── Residential: Check-in/out + Rooms + Guests ──── */
          <>
            {isMonthly ? (
              /* ── Monthly Rental: Move-in + Duration ──── */
              <>
                <div className="p-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">MOVE-IN DATE</label>
                  <input type="date" className="w-full text-sm outline-none bg-transparent"
                    value={checkIn} min={today}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      // Auto-set checkout to +1 month
                      const d = new Date(e.target.value);
                      d.setMonth(d.getMonth() + 1);
                      setCheckOut(d.toISOString().split('T')[0]);
                    }} />
                </div>
                <div className="border-t p-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">LEASE DURATION</label>
                  <select className="w-full text-sm outline-none bg-transparent"
                    value={checkIn && checkOut ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (30 * 86400000)) : 1}
                    onChange={(e) => {
                      if (!checkIn) return;
                      const months = Number(e.target.value);
                      const d = new Date(checkIn);
                      d.setMonth(d.getMonth() + months);
                      setCheckOut(d.toISOString().split('T')[0]);
                    }}>
                    {[1, 2, 3, 6, 11, 12, 24].map(m => (
                      <option key={m} value={m}>{m} month{m > 1 ? 's' : ''}{(listing.minLeaseMonths ?? 0) > 0 && m < (listing.minLeaseMonths ?? 0) ? ' (below minimum)' : ''}</option>
                    ))}
                  </select>
                  {(listing.minLeaseMonths ?? 0) > 0 && (
                    <p className="text-[10px] text-gray-400 mt-1">Minimum lease: {listing.minLeaseMonths} months</p>
                  )}
                </div>
                <div className="border-t p-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">OCCUPANTS</label>
                  <div className="flex items-center gap-3">
                    <button type="button"
                      onClick={() => setGuestCounts(g => ({ ...g, adults: Math.max(1, g.adults - 1) }))}
                      disabled={guestCounts.adults <= 1}
                      className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-gray-500 disabled:opacity-30 transition">-</button>
                    <span className="text-sm font-semibold w-16 text-center">{guestCounts.adults} person{guestCounts.adults > 1 ? 's' : ''}</span>
                    <button type="button"
                      onClick={() => setGuestCounts(g => ({ ...g, adults: Math.min(listing.maxGuests ?? 10, g.adults + 1) }))}
                      disabled={guestCounts.adults >= (listing.maxGuests ?? 10)}
                      className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-gray-500 disabled:opacity-30 transition">+</button>
                  </div>
                </div>
              </>
            ) : (
              /* ── Nightly Stay: Check-in/out ──── */
              <div className="grid grid-cols-2 divide-x">
                <div className="p-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">CHECK-IN</label>
                  <input type="date" className="w-full text-sm outline-none bg-transparent"
                    value={checkIn} min={today}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      if (!checkOut || e.target.value >= checkOut) {
                        const d = new Date(e.target.value);
                        d.setDate(d.getDate() + 1);
                        setCheckOut(d.toISOString().split('T')[0]);
                      }
                    }} />
                </div>
                <div className="p-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">CHECK-OUT</label>
                  <input type="date" className="w-full text-sm outline-none bg-transparent"
                    value={checkOut} min={checkIn || today}
                    onChange={(e) => setCheckOut(e.target.value)} />
                </div>
              </div>
            )}

            {/* Rooms & Guests — hide for monthly rentals (occupants shown above) */}
            {!isMonthly && (<>
            <div className="border-t p-3">
              <button type="button" onClick={() => setShowRoomGuest(!showRoomGuest)}
                className="w-full text-left">
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  {hasMultiRoomSelection ? 'GUESTS' : 'ROOMS & GUESTS'}
                </label>
                <div className="flex items-center justify-between text-sm text-gray-800">
                  <span>{hasMultiRoomSelection ? guestLabel : `${effectiveRooms} room${effectiveRooms > 1 ? 's' : ''} · ${guestLabel}`}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${showRoomGuest ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
            </div>

            {showRoomGuest && (
              <div className="border-t p-4 space-y-4 bg-gray-50/50">
                {/* Room stepper — hidden when multi-room selections exist */}
                {!hasMultiRoomSelection && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Rooms</p>
                      <p className="text-xs text-gray-400">Number of rooms</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => {
                        const newRooms = Math.max(1, rooms - 1);
                        setRooms(newRooms);
                        // Cap guests to new capacity
                        const maxTotal = newRooms * maxGuestsPerRoom;
                        const totalNow = guestCounts.adults + guestCounts.children;
                        if (totalNow > maxTotal) {
                          const excessChildren = Math.max(0, guestCounts.children - Math.max(0, maxTotal - guestCounts.adults));
                          const newChildren = guestCounts.children - excessChildren;
                          const newAdults = Math.min(guestCounts.adults, maxTotal - newChildren);
                          setGuestCounts(g => ({ ...g, adults: Math.max(1, newAdults), children: newChildren }));
                        }
                      }}
                        disabled={rooms <= 1}
                        className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-gray-500 disabled:opacity-30 transition">
                        -
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{rooms}</span>
                      <button type="button" onClick={() => {
                        const newRooms = Math.min(totalRooms, rooms + 1);
                        setRooms(newRooms);
                        if (guestCounts.adults < newRooms) {
                          setGuestCounts(g => ({ ...g, adults: newRooms }));
                        }
                      }}
                        disabled={rooms >= totalRooms}
                        className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-gray-500 disabled:opacity-30 transition">
                        +
                      </button>
                    </div>
                  </div>
                )}
                {hasMultiRoomSelection && (
                  <p className="text-xs text-gray-500">
                    {effectiveRooms} room{effectiveRooms > 1 ? 's' : ''} selected — adjust guests below
                  </p>
                )}
                <GuestPicker
                  value={guestCounts}
                  onChange={(g) => {
                    setGuestCounts(g);
                    if (!hasMultiRoomSelection) {
                      const needed = Math.ceil((g.adults + g.children) / maxGuestsPerRoom);
                      if (needed > rooms) setRooms(Math.min(needed, totalRooms));
                    }
                  }}
                  maxGuests={maxGuestsAllowed}
                  petFriendly={listing.petFriendly} maxPets={listing.maxPets}
                  inline />
                <button type="button" onClick={() => setShowRoomGuest(false)}
                  className="w-full text-sm font-semibold text-orange-600 hover:text-orange-700 py-1">
                  Done
                </button>
              </div>
            )}
            </>)}
          </>
        )}
      </div>

      {/* Reserve button */}
      <button onClick={handleBook} disabled={!canBook}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition">
        {!canBook
          ? (isCommercial ? 'Select date & time' : isMonthly ? 'Select move-in date' : 'Select dates')
          : isMonthly ? `Rent Now · ${formatPaise(totalPaise)}/mo` : `Reserve · ${formatPaise(totalPaise)}`
        }
      </button>

      {!canBook && (
        <p className="text-xs text-gray-400 text-center mt-2">
          {isCommercial ? 'Pick a date and duration to see the total' : 'Pick your dates to see the total price'}
        </p>
      )}

      {/* Price breakdown */}
      {duration > 0 && (
        <div className="mt-4 space-y-2 text-sm">
          {/* Rent line */}
          <div className="flex justify-between text-gray-600">
            <span>
              {isMonthly ? (
                <>
                  Rent: {formatPaise(displayPrice)}/month
                  {pgFullMonths > 1 && <> x {pgFullMonths} months</>}
                  {effectiveRooms > 1 ? ` x ${effectiveRooms} rooms` : ''}
                </>
              ) : (
                <>
                  {formatPaise(displayPrice)} x {duration} {duration > 1 ? unitLabelPlural : unitLabel}
                  {effectiveRooms > 1 ? ` x ${effectiveRooms} rooms` : ''}
                </>
              )}
            </span>
            <span>{formatPaise(basePaise)}</span>
          </div>
          {isMonthly && pgRemainingDays > 0 && pgFullMonths >= 1 && (
            <div className="flex justify-between text-xs text-gray-400">
              <span>+ {pgRemainingDays} days prorated</span>
              <span>{formatPaise(pgProratedPaise)}</span>
            </div>
          )}

          {/* Maintenance (monthly only, if extra) */}
          {maintenancePaise > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Maintenance ({Math.max(1, pgFullMonths)} mo × {formatPaise(listing.maintenanceChargePaise ?? 0)})</span>
              <span>{formatPaise(maintenancePaise)}</span>
            </div>
          )}
          {isMonthly && (listing.maintenanceIncluded) && (
            <div className="flex justify-between text-green-600 text-xs">
              <span>Maintenance included in rent</span>
              <span>₹0</span>
            </div>
          )}

          {/* Discount */}
          {discountPercent > 0 && (
            <div className="flex justify-between text-green-600">
              <span>{discountLabel} ({discountPercent}%)</span>
              <span>-{formatPaise(discountAmount)}</span>
            </div>
          )}

          {/* GST — only commercial */}
          {gstPaise > 0 && (
            <div className="flex justify-between text-gray-400">
              <span>GST (18%)</span>
              <span>{formatPaise(gstPaise)}</span>
            </div>
          )}

          {/* Insurance */}
          {insurancePaise > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>{listing.insuranceType === 'PREMIUM' ? 'Premium Protection' : listing.insuranceType === 'DAMAGE_PROTECTION' ? 'Damage Protection' : 'Micro-insurance'}</span>
              <span>{formatPaise(insurancePaise)}</span>
            </div>
          )}

          {/* Security deposit */}
          {depositPaise > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Security deposit{isPG && guestCounts.adults > 1 ? ` (${formatPaise(perBedDeposit)} x ${guestCounts.adults} beds)` : ''}</span>
              <span>{formatPaise(depositPaise)}</span>
            </div>
          )}

          {/* No GST note for residential */}
          {isMonthly && !isCommercial && !listing.gstApplicable && (
            <div className="text-[10px] text-gray-400">
              Residential rent is GST-exempt
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between font-bold border-t pt-2 text-base">
            <span>Total Payable</span>
            <span>{formatPaise(totalPaise)}</span>
          </div>

          {depositPaise > 0 && (
            <p className="text-[10px] text-gray-400 mt-1">
              Includes {formatPaise(depositPaise)} security deposit
              ({listing.depositType === 'REFUNDABLE' ? 'fully refundable at checkout' :
                listing.depositType === 'PARTIAL_REFUNDABLE' ? 'partially refundable' : 'non-refundable'})
            </p>
          )}

          {(listing.maintenanceChargePaise ?? 0) > 0 && (
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Monthly maintenance</span>
              <span>{formatPaise(listing.maintenanceChargePaise ?? 0)}/mo</span>
            </div>
          )}

          {(listing.minLeaseMonths ?? 0) > 0 && (
            <p className="text-[10px] text-gray-400 mt-1">Minimum lease: {listing.minLeaseMonths} month{(listing.minLeaseMonths ?? 0) > 1 ? 's' : ''}</p>
          )}

          {!isCommercial && !isMonthly && effectiveRooms > 1 && nights > 0 && (
            <p className="text-xs text-gray-400 text-right">
              {formatPaise(Math.round(totalPaise / nights))} avg/night for {effectiveRooms} rooms
            </p>
          )}
        </div>
      )}

      {/* Summary chips */}
      {duration > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {isCommercial ? (
            <>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                {bookingDate}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                {startTime} – {computedEndTime}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                {hours} hr{hours > 1 ? 's' : ''}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                {totalGuests} {totalGuests === 1 ? 'person' : 'people'}
              </span>
            </>
          ) : (
            <>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                {isMonthly
                  ? `${Math.max(1, pgFullMonths)} month${pgFullMonths > 1 ? 's' : ''}${pgRemainingDays > 0 ? ` ${pgRemainingDays}d` : ''}`
                  : `${nights} night${nights > 1 ? 's' : ''}`}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                {effectiveRooms} room{effectiveRooms > 1 ? 's' : ''}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                {totalGuests} guest{totalGuests > 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-3">
        {isCommercial ? 'GST invoice included' :
         (listing.securityDepositPaise ?? 0) > 0 ? `${listing.depositType === 'REFUNDABLE' ? 'Refundable' : 'Security'} deposit applies` :
         listing.insuranceEnabled ? 'Protection plan included' :
         'No deposit required'}
      </p>

      {listing.petFriendly && !isCommercial && (
        <p className="text-xs text-center mt-1 text-green-600 font-medium">Pet-friendly property</p>
      )}

      {/* Operating hours / House rules */}
      {isCommercial && listing.operatingHoursFrom && (
        <div className="mt-4 border-t pt-3 text-xs text-gray-500 space-y-1">
          <p>Operating hours: {listing.operatingHoursFrom} – {listing.operatingHoursUntil}</p>
          {minHours > 1 && <p>Minimum booking: {minHours} hours</p>}
          {listing.maxGuests && <p>Max capacity: {listing.maxGuests} people</p>}
        </div>
      )}
      {!isCommercial && (listing.checkInFrom || listing.checkOutUntil) && (
        <div className="mt-4 border-t pt-3 text-xs text-gray-500 space-y-1">
          {listing.checkInFrom && listing.checkInUntil && (
            <p>Check-in: {listing.checkInFrom} – {listing.checkInUntil}</p>
          )}
          {listing.checkOutFrom && listing.checkOutUntil && (
            <p>Check-out: {listing.checkOutFrom} – {listing.checkOutUntil}</p>
          )}
        </div>
      )}
    </div>
  );
}
