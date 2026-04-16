'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';

type TabKey = 'upcoming' | 'past' | 'cancelled';

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'bg-amber-100 text-amber-700' },
  CONFIRMED:       { label: 'Confirmed',       color: 'bg-green-100 text-green-700' },
  TICKETED:        { label: 'Ticketed',         color: 'bg-blue-100 text-blue-700' },
  CANCELLED:       { label: 'Cancelled',        color: 'bg-red-100 text-red-600' },
  COMPLETED:       { label: 'Completed',        color: 'bg-gray-100 text-gray-600' },
  REFUNDED:        { label: 'Refunded',         color: 'bg-purple-100 text-purple-600' },
};

function formatDate(d: string) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MyFlightsPage() {
  const router = useRouter();
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [token, setToken] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('access_token') ?? '';
    if (!t) {
      router.push('/auth?redirect=/dashboard/flights');
      return;
    }
    setToken(t);
    loadFlights(t, 0);
  }, [router]);

  useEffect(() => {
    if (token) loadFlights(token, 0);
    setPage(0);
  }, [activeTab]);

  useEffect(() => {
    if (token) loadFlights(token, page);
  }, [page]);

  function loadFlights(t: string, p: number) {
    setLoading(true);
    api.getMyFlights(t, p)
      .then((data: any) => {
        const list = data?.content || data || [];
        setFlights(Array.isArray(list) ? list : []);
        setTotalPages(data?.totalPages || 1);
      })
      .catch(() => setFlights([]))
      .finally(() => setLoading(false));
  }

  const now = new Date();

  const filtered = flights.filter((f) => {
    const dep = new Date(f.departureDate);
    if (activeTab === 'cancelled') return f.status === 'CANCELLED' || f.status === 'REFUNDED';
    if (activeTab === 'past') return (f.status === 'COMPLETED' || dep < now) && f.status !== 'CANCELLED' && f.status !== 'REFUNDED';
    // upcoming
    return (dep >= now || f.status === 'CONFIRMED' || f.status === 'TICKETED' || f.status === 'PENDING_PAYMENT') &&
           f.status !== 'CANCELLED' && f.status !== 'REFUNDED' && f.status !== 'COMPLETED';
  });

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const EMPTY_MESSAGES: Record<TabKey, { icon: string; title: string; subtitle: string }> = {
    upcoming: { icon: '&#x2708;&#xFE0F;', title: 'No upcoming flights', subtitle: 'Book your next adventure on Safar!' },
    past: { icon: '&#x1F30D;', title: 'No past flights', subtitle: 'Your travel history will appear here.' },
    cancelled: { icon: '&#x274C;', title: 'No cancelled flights', subtitle: 'Good news - nothing cancelled.' },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#003B95] text-white py-8">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">My Flights</h1>
          <p className="text-blue-200 text-sm">Manage your flight bookings</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-white text-[#003B95] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4" dangerouslySetInnerHTML={{ __html: EMPTY_MESSAGES[activeTab].icon }} />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{EMPTY_MESSAGES[activeTab].title}</h3>
            <p className="text-sm text-gray-500 mb-4">{EMPTY_MESSAGES[activeTab].subtitle}</p>
            <Link
              href="/flights"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition"
            >
              Search Flights
            </Link>
          </div>
        )}

        {/* Flight Cards */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((f) => {
              const badge = STATUS_BADGE[f.status] || { label: f.status, color: 'bg-gray-100 text-gray-600' };
              return (
                <Link
                  key={f.id}
                  href={`/flights/${f.id}`}
                  className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition p-5"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    {/* Airline placeholder */}
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-[#003B95] font-bold text-xs">
                        {(f.airline || '').substring(0, 2).toUpperCase() || 'FL'}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">
                          {f.origin} &rarr; {f.destination}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDate(f.departureDate)} &middot; {f.airline} {f.flightNumber}
                      </p>
                      {f.bookingRef && (
                        <p className="text-xs text-gray-400 font-mono mt-1">Ref: {f.bookingRef}</p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-[#003B95]">
                        {formatPaise(f.totalAmountPaise || 0)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {f.passengerCount || '--'} pax
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
