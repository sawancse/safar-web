'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

type Row = { id: string; date: string; status: string; notes?: string };

const STATUS_STYLE: Record<string, string> = {
  AVAILABLE:   'bg-green-100 text-green-800 border-green-300',
  BLACKOUT:    'bg-gray-200 text-gray-400 border-gray-300 line-through',
  HIGH_DEMAND: 'bg-amber-100 text-amber-800 border-amber-300',
  BOOKED:      'bg-blue-100 text-blue-700 border-blue-300 cursor-not-allowed',
};

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function VendorAvailabilityPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const listingId = String(params?.id ?? '');

  const today = useMemo(() => new Date(), []);
  const todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate());

  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null) || '';

  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const firstWeekday = new Date(cursor.y, cursor.m, 1).getDay();
  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  async function load() {
    setLoading(true); setError(null);
    try {
      const from = iso(cursor.y, cursor.m, 1);
      const to = iso(cursor.y, cursor.m, daysInMonth);
      const data = await api.getServiceListingAvailability(listingId, from, to);
      const map: Record<string, Row> = {};
      (data || []).forEach((r: Row) => { map[r.date] = r; });
      setRows(map);
    } catch (e: any) {
      setError(e?.message || 'Failed to load availability (is the listing verified and the service up?)');
      setRows({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('access_token')) {
      router.push(`/auth?next=/vendor/listings/${listingId}/availability`);
      return;
    }
    load();
    setSelected(new Set());
    /* eslint-disable-next-line */
  }, [listingId, cursor.y, cursor.m]);

  function toggle(dateIso: string) {
    if (dateIso < todayIso) return;                          // past
    if (rows[dateIso]?.status === 'BOOKED') return;          // locked by a booking
    setSelected(prev => {
      const next = new Set(prev);
      next.has(dateIso) ? next.delete(dateIso) : next.add(dateIso);
      return next;
    });
  }

  async function apply(status: string) {
    if (selected.size === 0) return;
    setSaving(true); setError(null);
    try {
      await api.setServiceListingAvailability(listingId, [...selected], status, undefined, token());
      setSelected(new Set());
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to update availability');
    } finally {
      setSaving(false);
    }
  }

  // Build the calendar cells (leading blanks + days).
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/vendor/dashboard" className="text-sm text-orange-500 hover:underline">← My listings</Link>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mt-1">Availability calendar</h1>
        <p className="text-sm text-gray-500">
          Block dates you can&apos;t take, or mark high-demand days. Open dates need no action — you&apos;re
          available by default. Booked dates are locked automatically.
        </p>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCursor(c => c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 })}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">←</button>
        <span className="font-semibold text-gray-900">{monthLabel}</span>
        <button onClick={() => setCursor(c => c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 })}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">→</button>
      </div>

      {/* Calendar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {WEEKDAYS.map(w => <div key={w} className="text-center text-[11px] font-semibold text-gray-400 py-1">{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((d, i) => {
            if (d === null) return <div key={`b${i}`} />;
            const dIso = iso(cursor.y, cursor.m, d);
            const past = dIso < todayIso;
            const row = rows[dIso];
            const isBooked = row?.status === 'BOOKED';
            const isSelected = selected.has(dIso);
            const style = row ? (STATUS_STYLE[row.status] ?? '') : '';
            return (
              <button key={dIso} type="button" onClick={() => toggle(dIso)}
                disabled={past || isBooked}
                className={`aspect-square rounded-lg border text-sm font-medium flex items-center justify-center transition
                  ${past ? 'text-gray-300 border-transparent cursor-default'
                         : style || 'bg-white border-gray-200 hover:border-orange-300'}
                  ${isSelected ? 'ring-2 ring-orange-500 ring-offset-1' : ''}`}>
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-gray-500">
        <span><span className="inline-block w-3 h-3 rounded bg-white border border-gray-300 align-middle mr-1" />Open (default)</span>
        <span><span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-300 align-middle mr-1" />Available</span>
        <span><span className="inline-block w-3 h-3 rounded bg-amber-100 border border-amber-300 align-middle mr-1" />High demand</span>
        <span><span className="inline-block w-3 h-3 rounded bg-gray-200 border border-gray-300 align-middle mr-1" />Blocked</span>
        <span><span className="inline-block w-3 h-3 rounded bg-blue-100 border border-blue-300 align-middle mr-1" />Booked (locked)</span>
      </div>

      {error && <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
      {loading && <p className="mt-4 text-sm text-gray-500">Loading…</p>}

      {/* Action bar */}
      <div className="sticky bottom-0 mt-4 bg-white border border-gray-200 rounded-2xl p-3 shadow-lg flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-600 mr-auto">
          {selected.size > 0 ? `${selected.size} date${selected.size > 1 ? 's' : ''} selected` : 'Tap dates to select'}
        </span>
        <button onClick={() => apply('AVAILABLE')} disabled={saving || selected.size === 0}
          className="px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold">Mark available</button>
        <button onClick={() => apply('HIGH_DEMAND')} disabled={saving || selected.size === 0}
          className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-semibold">High demand</button>
        <button onClick={() => apply('BLACKOUT')} disabled={saving || selected.size === 0}
          className="px-3 py-2 rounded-xl bg-gray-700 hover:bg-gray-800 disabled:opacity-40 text-white text-sm font-semibold">Block</button>
      </div>
    </div>
  );
}
