'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import type { RoomType } from '@/types';

interface Tenancy {
  id: string;
  tenancyRef: string;
  tenantId: string;
  listingId: string;
  roomTypeId: string;
  bedNumber: string;
  sharingType: string;
  status: string;
  moveInDate: string;
  moveOutDate: string | null;
  monthlyRentPaise: number;
  mealsIncluded: boolean;
  wifiIncluded: boolean;
  laundryIncluded: boolean;
}

interface BookingLite {
  id: string;
  bookingRef: string;
  listingId: string;
  roomTypeId?: string;
  roomsCount?: number;
  checkIn: string;
  checkOut: string;
  status: string;
  guestFirstName?: string;
  guestLastName?: string;
  roomSelections?: { roomTypeId: string; count: number }[];
}

interface Listing {
  id: string;
  title: string;
  type: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  NOTICE_PERIOD: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  VACATED: 'bg-gray-100 text-gray-500 border-gray-200',
  TERMINATED: 'bg-red-100 text-red-800 border-red-200',
};

const BED_LABELS: Record<string, number> = {
  PRIVATE: 1,
  TWO_SHARING: 2,
  THREE_SHARING: 3,
  FOUR_SHARING: 4,
  DORMITORY: 6,
};

export default function HostRoomOccupancyTab({ token, listings }: { token: string; listings: Listing[] }) {
  const [selectedListingId, setSelectedListingId] = useState('');
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [bookings, setBookings] = useState<BookingLite[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter PG/hostel listings only
  const pgListings = listings.filter(l =>
    ['PG', 'COLIVING', 'HOSTEL_DORM', 'HOTEL', 'BUDGET_HOTEL'].includes(l.type)
  );

  useEffect(() => {
    if (pgListings.length > 0 && !selectedListingId) {
      setSelectedListingId(pgListings[0].id);
    }
  }, [pgListings.length]);

  useEffect(() => {
    if (!selectedListingId) return;
    setLoading(true);
    Promise.all([
      api.getRoomTypes(selectedListingId),
      api.getPgTenancies(`listingId=${selectedListingId}`, token),
      api.getHostBookings(token).catch(() => []),
    ]).then(([rt, tn, bk]) => {
      setRoomTypes(rt || []);
      const content = tn?.content || tn || [];
      setTenancies(Array.isArray(content) ? content : []);
      const bkList: BookingLite[] = Array.isArray(bk) ? (bk as any[]) : [];
      const today = new Date().toISOString().slice(0, 10);
      setBookings(
        bkList.filter(b =>
          b.listingId === selectedListingId &&
          ['CONFIRMED', 'CHECKED_IN', 'PENDING_PAYMENT'].includes(b.status) &&
          b.checkOut >= today
        )
      );
    }).catch(() => {
      setRoomTypes([]);
      setTenancies([]);
      setBookings([]);
    }).finally(() => setLoading(false));
  }, [selectedListingId, token]);

  // Aggregate stats
  const totalBeds = roomTypes.reduce((s, rt) => s + (rt.totalBeds || rt.count), 0);
  const occupiedBeds = roomTypes.reduce((s, rt) => s + (rt.occupiedBeds || 0), 0);
  const vacantBeds = totalBeds - occupiedBeds;
  const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const activeTenancies = tenancies.filter(t => t.status === 'ACTIVE');
  const noticeTenancies = tenancies.filter(t => t.status === 'NOTICE_PERIOD');

  // Map tenancies to room types
  const tenancyByRoom = new Map<string, Tenancy[]>();
  tenancies.filter(t => t.status !== 'VACATED').forEach(t => {
    const key = t.roomTypeId;
    if (!tenancyByRoom.has(key)) tenancyByRoom.set(key, []);
    tenancyByRoom.get(key)!.push(t);
  });

  if (pgListings.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg font-medium">No PG/Hostel listings found</p>
        <p className="text-sm mt-1">Room occupancy board is available for PG, Hostel, and Co-living properties.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Listing Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-600">Property:</label>
        <select
          value={selectedListingId}
          onChange={e => setSelectedListingId(e.target.value)}
          className="border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 min-w-[250px]"
        >
          {pgListings.map(l => (
            <option key={l.id} value={l.id}>{l.title} ({l.type})</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading occupancy data...</div>
      ) : (
        <>
          {/* Summary Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Total Beds</p>
              <p className="text-2xl font-bold mt-1">{totalBeds}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Occupied</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{occupiedBeds}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Vacant</p>
              <p className="text-2xl font-bold mt-1 text-orange-500">{vacantBeds}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Notice Period</p>
              <p className="text-2xl font-bold mt-1 text-yellow-600">{noticeTenancies.length}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Occupancy Rate</p>
              <p className="text-2xl font-bold mt-1">{occupancyPct}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all ${occupancyPct >= 80 ? 'bg-green-500' : occupancyPct >= 50 ? 'bg-orange-400' : 'bg-red-400'}`}
                  style={{ width: `${occupancyPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Room Type Boards */}
          {roomTypes.length === 0 ? (
            <div className="text-center py-10 text-gray-400">No room types configured for this property.</div>
          ) : (
            <div className="space-y-6">
              {roomTypes.map(rt => {
                // Beds per room: prefer physical bedCount (handles "Double" PRIVATE
                // = 2 beds/room). Fall back to sharingType-based default.
                const bedsPerRoom = (rt.bedCount && rt.bedCount > 0)
                  ? rt.bedCount
                  : (BED_LABELS[rt.sharingType || 'PRIVATE'] || 1);
                const rtTenancies = tenancyByRoom.get(rt.id) || [];
                const rtTotal = rt.count * bedsPerRoom;

                // Build booking occupancy for this room type (legacy single + multi-select)
                const rtBookings: { booking: BookingLite; rooms: number }[] = [];
                bookings.forEach(b => {
                  if (b.roomSelections && b.roomSelections.length > 0) {
                    b.roomSelections
                      .filter(s => s.roomTypeId === rt.id)
                      .forEach(s => rtBookings.push({ booking: b, rooms: s.count }));
                  } else if (b.roomTypeId === rt.id) {
                    rtBookings.push({ booking: b, rooms: b.roomsCount || 1 });
                  }
                });

                // Pre-assign cell indices to bookings, skipping cells already held by tenancies.
                // For PRIVATE rooms, booking.count = rooms → consumes `bedsPerRoom` cells each.
                // For shared sharing types (TWO/THREE/FOUR/DORMITORY), billing is per-bed
                // so booking.count already represents beds — consume 1 cell per unit.
                const isPrivate = (rt.sharingType || 'PRIVATE') === 'PRIVATE';
                const tenancyCells = new Set<number>();
                rtTenancies.forEach(t => {
                  // If tenancy.bedNumber encodes room-bed, try to decode; else first free
                  const match = /^(\d+)-([A-Z])$/.exec(t.bedNumber || '');
                  if (match) {
                    const roomNum = parseInt(match[1], 10) - 1;
                    const bedOffset = match[2].charCodeAt(0) - 65;
                    tenancyCells.add(roomNum * bedsPerRoom + bedOffset);
                  }
                });
                const bookingCellMap = new Map<number, BookingLite>();
                let cursor = 0;
                rtBookings.forEach(({ booking, rooms }) => {
                  const beds = isPrivate ? rooms * bedsPerRoom : rooms;
                  let placed = 0;
                  while (placed < beds && cursor < rtTotal) {
                    if (!tenancyCells.has(cursor) && !bookingCellMap.has(cursor)) {
                      bookingCellMap.set(cursor, booking);
                      placed++;
                    }
                    cursor++;
                  }
                });

                const bookingBeds = bookingCellMap.size;
                const tenancyBedsLive = rtTenancies.length;
                const rtOccupied = Math.min(rtTotal, Math.max(rt.occupiedBeds || 0, tenancyBedsLive + bookingBeds));
                const rtVacant = rtTotal - rtOccupied;
                const roomsOccupied = bedsPerRoom > 0 ? Math.ceil(rtOccupied / bedsPerRoom) : 0;
                const roomsVacant = (rt.count ?? 0) - roomsOccupied;

                return (
                  <div key={rt.id} className="bg-white rounded-xl border overflow-hidden">
                    {/* Room Type Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
                      <div className="flex items-center gap-3">
                        {rt.primaryPhotoUrl && (
                          <img src={rt.primaryPhotoUrl} alt={rt.name} className="w-10 h-10 rounded-lg object-cover" />
                        )}
                        <div>
                          <h3 className="font-semibold text-sm">{rt.name}</h3>
                          <p className="text-xs text-gray-400">
                            {rt.count} rooms  |  {rt.sharingType?.replace('_', ' ') || 'Private'}  |  {formatPaise(rt.basePricePaise)}/month
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end text-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-green-600 font-medium">{rtOccupied} beds occupied</span>
                          <span className="text-orange-500 font-medium">{rtVacant} beds vacant</span>
                          <span className="text-gray-400">/ {rtTotal} beds</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {roomsOccupied} / {rt.count ?? 0} rooms booked
                          {bedsPerRoom > 1 && <span className="ml-1">({bedsPerRoom} beds/room)</span>}
                        </div>
                      </div>
                    </div>

                    {/* Bed Grid */}
                    <div className="p-5">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {Array.from({ length: rtTotal }).map((_, idx) => {
                          const bedLabel = String.fromCharCode(65 + (idx % bedsPerRoom)); // A, B, C...
                          const roomNum = Math.floor(idx / bedsPerRoom) + 1;
                          const bedId = `${roomNum}-${bedLabel}`;

                          // Find tenant for this bed
                          const tenant = rtTenancies.find(t => t.bedNumber === bedId || t.bedNumber === bedLabel);
                          const booking = !tenant ? bookingCellMap.get(idx) : undefined;
                          const isOccupied = !!tenant || !!booking;
                          const isNotice = tenant?.status === 'NOTICE_PERIOD';
                          const isBooking = !!booking;

                          return (
                            <div
                              key={idx}
                              className={`rounded-xl border-2 p-3 text-center transition ${
                                isNotice
                                  ? 'border-yellow-300 bg-yellow-50'
                                  : isBooking
                                  ? 'border-blue-300 bg-blue-50'
                                  : isOccupied
                                  ? 'border-green-300 bg-green-50'
                                  : 'border-dashed border-gray-200 bg-gray-50'
                              }`}
                            >
                              <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                                Room {roomNum} - Bed {bedLabel}
                              </p>
                              {tenant ? (
                                <>
                                  <p className={`text-xs font-semibold mt-1 ${isNotice ? 'text-yellow-700' : 'text-green-700'}`}>
                                    {tenant.tenancyRef}
                                  </p>
                                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[tenant.status] || ''}`}>
                                    {tenant.status.replace('_', ' ')}
                                  </span>
                                  {tenant.moveOutDate && (
                                    <p className="text-[10px] text-gray-400 mt-1">Out: {tenant.moveOutDate}</p>
                                  )}
                                </>
                              ) : booking ? (
                                <>
                                  <p className="text-xs font-semibold mt-1 text-blue-700 truncate">
                                    {booking.bookingRef}
                                  </p>
                                  {(booking.guestFirstName || booking.guestLastName) && (
                                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                                      {[booking.guestFirstName, booking.guestLastName].filter(Boolean).join(' ')}
                                    </p>
                                  )}
                                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                    {booking.status.replace('_', ' ')}
                                  </span>
                                  <p className="text-[10px] text-gray-400 mt-1">Out: {booking.checkOut?.slice(0, 10)}</p>
                                </>
                              ) : (
                                <p className="text-xs text-gray-400 mt-2 font-medium">Vacant</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-6 text-xs text-gray-500 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-green-100 border-2 border-green-300 inline-block" /> Tenant
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-100 border-2 border-blue-300 inline-block" /> Booking
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-yellow-100 border-2 border-yellow-300 inline-block" /> Notice Period
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border-2 border-dashed border-gray-300 inline-block" /> Vacant
            </span>
          </div>
        </>
      )}
    </div>
  );
}
