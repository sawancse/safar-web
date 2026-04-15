'use client';

import { useState, useEffect } from 'react';
import { formatPaise } from '@/lib/utils';
import type { RoomType, RoomTypeInclusion } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface RoomSelection {
  roomTypeId: string;
  roomTypeName: string;
  count: number;        // total guests (PG: rooms × guestsPerRoom; Hotel: rooms)
  rooms: number;        // number of rooms selected
  guestsPerRoom: number; // guests per room (PG: 1 to maxGuests; Hotel: maxGuests)
  pricePerUnitPaise: number;
  maxGuests: number;
  securityDepositPaise: number;
  availableCount: number; // cap enforced by BookingPanel + book page
}

interface InitialSelection {
  roomTypeId: string;
  rooms: number;
  guestsPerRoom: number;
}

interface Props {
  roomTypes: RoomType[];
  perNightLabel: string;
  listingId: string;
  isPG?: boolean;
  initialSelections?: InitialSelection[];
  onSelect?: (selections: RoomSelection[]) => void;
}

function resolveUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
}

export default function RoomTypeSelector({ roomTypes, perNightLabel, listingId, isPG = false, initialSelections, onSelect }: Props) {
  // For PG: track rooms + guests-per-room separately. For Hotel: just rooms.
  const [roomCounts, setRoomCounts] = useState<Record<string, number>>(() => {
    if (!initialSelections) return {};
    const rc: Record<string, number> = {};
    for (const s of initialSelections) rc[s.roomTypeId] = s.rooms;
    return rc;
  });
  const [guestsPerRoom, setGuestsPerRoom] = useState<Record<string, number>>(() => {
    if (!initialSelections) return {};
    const gpr: Record<string, number> = {};
    for (const s of initialSelections) gpr[s.roomTypeId] = s.guestsPerRoom;
    return gpr;
  });
  const [expandedAddons, setExpandedAddons] = useState<string | null>(null);
  const [photoModal, setPhotoModal] = useState<{ urls: string[]; index: number } | null>(null);

  // Derived quantities: total guests per room type
  const quantities: Record<string, number> = {};
  for (const rt of roomTypes) {
    const rooms = roomCounts[rt.id] || 0;
    const gpr = guestsPerRoom[rt.id] || (isPG ? rt.maxGuests : rt.maxGuests);
    quantities[rt.id] = isPG ? rooms * gpr : rooms;
  }

  function emitSelections(newRoomCounts: Record<string, number>, newGpr: Record<string, number>) {
    const selections: RoomSelection[] = roomTypes
      .filter(rt => (newRoomCounts[rt.id] || 0) > 0)
      .map(rt => {
        const rooms = newRoomCounts[rt.id] || 0;
        const gpr = newGpr[rt.id] || rt.maxGuests;
        const totalGuests = isPG ? rooms * gpr : rooms;
        return {
          roomTypeId: rt.id, roomTypeName: rt.name,
          count: totalGuests, rooms, guestsPerRoom: gpr,
          pricePerUnitPaise: rt.basePricePaise,
          maxGuests: rt.maxGuests, securityDepositPaise: rt.securityDepositPaise ?? 0,
          availableCount: rt.availableCount ?? rt.count ?? 0,
        };
      });
    onSelect?.(selections);
  }

  // Emit initial selections on mount so parent gets the data
  useEffect(() => {
    if (initialSelections && initialSelections.length > 0 && roomTypes.length > 0) {
      emitSelections(roomCounts, guestsPerRoom);
    }
  }, [roomTypes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateRoomCount(rt: RoomType, delta: number) {
    const current = roomCounts[rt.id] || 0;
    const maxAvailable = rt.availableCount ?? rt.count;
    const next = Math.max(0, Math.min(maxAvailable, current + delta));
    const newCounts = { ...roomCounts, [rt.id]: next };
    setRoomCounts(newCounts);
    // If rooms set to 0, reset gpr
    if (next === 0) {
      const newGpr = { ...guestsPerRoom };
      delete newGpr[rt.id];
      setGuestsPerRoom(newGpr);
      emitSelections(newCounts, newGpr);
    } else {
      // Auto-set gpr to max if not set
      const newGpr = { ...guestsPerRoom };
      if (!newGpr[rt.id]) newGpr[rt.id] = rt.maxGuests;
      setGuestsPerRoom(newGpr);
      emitSelections(newCounts, newGpr);
    }
  }

  function updateGuestsPerRoom(rt: RoomType, gpr: number) {
    const newGpr = { ...guestsPerRoom, [rt.id]: Math.max(1, Math.min(rt.maxGuests, gpr)) };
    setGuestsPerRoom(newGpr);
    emitSelections(roomCounts, newGpr);
  }

  function openPhotos(rt: RoomType, e: React.MouseEvent) {
    e.stopPropagation();
    const urls: string[] = [];
    if (rt.primaryPhotoUrl) urls.push(resolveUrl(rt.primaryPhotoUrl));
    if (rt.photoUrls) urls.push(...rt.photoUrls.map(resolveUrl));
    if (urls.length > 0) setPhotoModal({ urls, index: 0 });
  }

  if (roomTypes.length === 0) return null;

  const totalGuests = Object.values(quantities).reduce((s, c) => s + c, 0);
  const totalRoomCount = Object.values(roomCounts).reduce((s, c) => s + c, 0);
  const totalPaise = Object.entries(quantities)
    .filter(([, c]) => c > 0)
    .reduce((sum, [id, count]) => {
      const rt = roomTypes.find(r => r.id === id);
      return sum + (rt ? rt.basePricePaise * count : 0);
    }, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{isPG ? 'Select Rooms & Guests' : 'Choose Your Rooms'}</h2>
        {totalGuests > 0 && (
          <span className="text-sm font-medium text-orange-600">
            {isPG ? `${totalRoomCount} room${totalRoomCount > 1 ? 's' : ''} · ${totalGuests} guest${totalGuests > 1 ? 's' : ''}` : `${totalGuests} room${totalGuests > 1 ? 's' : ''}`} · {formatPaise(totalPaise)}/{perNightLabel.replace('per ', '')}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {roomTypes.map((rt) => {
          const qty = quantities[rt.id] || 0;
          const isSelected = qty > 0;
          const included = rt.inclusions?.filter(i => i.inclusionMode === 'INCLUDED' || i.inclusionMode === 'COMPLIMENTARY') || [];
          const addons = rt.inclusions?.filter(i => i.inclusionMode === 'PAID_ADDON') || [];
          const showAddons = expandedAddons === rt.id;

          return (
            <div key={rt.id}
              className={`bg-white border-2 rounded-xl p-4 transition ${
                isSelected ? 'border-orange-500 ring-1 ring-orange-200 shadow-md' : 'border-gray-200 hover:border-gray-300'
              }`}>
              <div className="flex gap-4">
                {/* Room photo */}
                {rt.primaryPhotoUrl && (
                  <div className="relative shrink-0 cursor-zoom-in group/photo"
                    onClick={(e) => openPhotos(rt, e)}>
                    <img src={resolveUrl(rt.primaryPhotoUrl)} alt={rt.name}
                      className="w-36 h-24 rounded-lg object-cover group-hover/photo:brightness-90 transition" />
                    {rt.photoUrls && rt.photoUrls.length > 0 && (
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">+{rt.photoUrls.length}</span>
                    )}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">{rt.name}</h3>
                      {rt.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{rt.description}</p>}
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-lg font-bold text-gray-900">{formatPaise(rt.basePricePaise)}</p>
                      <p className="text-[11px] text-gray-400">{perNightLabel}</p>
                    </div>
                  </div>

                  {/* Room specs */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {rt.bedType && (
                      <span className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        🛏 {rt.bedType}{rt.bedCount && rt.bedCount > 1 ? ` x${rt.bedCount}` : ''}
                      </span>
                    )}
                    <span className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">👥 {rt.maxGuests} guests</span>
                    {rt.areaSqft && <span className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">📐 {rt.areaSqft} sqft</span>}
                    <span className={`text-[11px] px-1.5 py-0.5 rounded ${rt.count <= 3 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      {rt.availableCount ?? rt.count} available
                    </span>
                    {rt.securityDepositPaise != null && rt.securityDepositPaise > 0 && (
                      <span className="text-[11px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                        Deposit: {formatPaise(rt.securityDepositPaise)}
                      </span>
                    )}
                  </div>

                  {/* Inclusions */}
                  {included.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {included.slice(0, 4).map(inc => (
                        <span key={inc.id} className="text-[11px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded">✓ {inc.name}</span>
                      ))}
                    </div>
                  )}

                  {/* Add-ons expandable */}
                  {addons.length > 0 && (
                    <div className="mt-1.5">
                      <span onClick={(e) => { e.stopPropagation(); setExpandedAddons(showAddons ? null : rt.id); }}
                        className="text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded cursor-pointer hover:bg-blue-100 transition inline-flex items-center gap-1">
                        +{addons.length} add-on{addons.length > 1 ? 's' : ''}
                        <svg className={`w-3 h-3 transition-transform ${showAddons ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                      {showAddons && (
                        <div className="mt-1.5 space-y-1 bg-blue-50/50 rounded-lg p-2 border border-blue-100">
                          {addons.map(a => (
                            <div key={a.id} className="flex items-center justify-between text-[11px]">
                              <span className="font-medium text-gray-800">{a.name}</span>
                              <span className="text-blue-600 font-semibold">
                                {a.chargePaise > 0 ? `+${formatPaise(a.chargePaise)}/${a.chargeType.replace('PER_', '').toLowerCase()}` : 'Free'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selection controls */}
                  <div className="mt-3 pt-2 border-t border-gray-100 space-y-2">
                    {/* Rooms stepper — always shown */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {(roomCounts[rt.id] || 0) > 0
                          ? `${roomCounts[rt.id]} room${(roomCounts[rt.id] || 0) > 1 ? 's' : ''}`
                          : 'Select rooms'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button type="button"
                          onClick={() => updateRoomCount(rt, -1)}
                          disabled={(roomCounts[rt.id] || 0) <= 0}
                          className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-orange-400 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition text-sm font-bold">
                          −
                        </button>
                        <span className={`w-6 text-center text-sm font-bold ${(roomCounts[rt.id] || 0) > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                          {roomCounts[rt.id] || 0}
                        </span>
                        <button type="button"
                          onClick={() => updateRoomCount(rt, 1)}
                          disabled={(roomCounts[rt.id] || 0) >= (rt.availableCount ?? rt.count)}
                          className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-orange-400 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition text-sm font-bold">
                          +
                        </button>
                      </div>
                    </div>

                    {/* PG: Guests per room selector — shown when rooms > 0 and maxGuests > 1 */}
                    {isPG && (roomCounts[rt.id] || 0) > 0 && rt.maxGuests > 1 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Guests / room</span>
                        <div className="flex items-center gap-2">
                          <button type="button"
                            onClick={() => updateGuestsPerRoom(rt, (guestsPerRoom[rt.id] || rt.maxGuests) - 1)}
                            disabled={(guestsPerRoom[rt.id] || rt.maxGuests) <= 1}
                            className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-orange-400 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition text-xs font-bold">
                            −
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-orange-600">
                            {guestsPerRoom[rt.id] || rt.maxGuests}
                          </span>
                          <button type="button"
                            onClick={() => updateGuestsPerRoom(rt, (guestsPerRoom[rt.id] || rt.maxGuests) + 1)}
                            disabled={(guestsPerRoom[rt.id] || rt.maxGuests) >= rt.maxGuests}
                            className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-orange-400 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition text-xs font-bold">
                            +
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Summary when selected */}
                    {qty > 0 && (
                      <p className="text-xs text-orange-600 font-medium text-right">
                        {isPG
                          ? `${qty} guest${qty > 1 ? 's' : ''} · ${formatPaise(rt.basePricePaise * qty)}/${perNightLabel.replace('per ', '')}`
                          : `${qty} room${qty > 1 ? 's' : ''} · ${formatPaise(rt.basePricePaise * qty)}/${perNightLabel.replace('per ', '')}`
                        }
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Photo Lightbox */}
      {photoModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={() => setPhotoModal(null)}>
          <button onClick={() => setPhotoModal(null)} className="absolute top-4 right-4 text-white/80 hover:text-white p-2 z-10">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {photoModal.urls.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setPhotoModal(p => p ? { ...p, index: (p.index - 1 + p.urls.length) % p.urls.length } : null); }}
                className="absolute left-4 bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10 flex items-center justify-center z-10">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setPhotoModal(p => p ? { ...p, index: (p.index + 1) % p.urls.length } : null); }}
                className="absolute right-4 bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10 flex items-center justify-center z-10">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          <img src={photoModal.urls[photoModal.index]} alt="Room photo"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
          <div className="absolute bottom-4 text-white/70 text-sm">{photoModal.index + 1} / {photoModal.urls.length}</div>
        </div>
      )}
    </div>
  );
}
