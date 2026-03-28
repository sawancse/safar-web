'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';

interface HostPayout {
  id: string;
  tenancyId: string;
  hostId: string;
  invoiceId: string;
  grossAmountPaise: number;
  commissionRateBps: number;
  commissionPaise: number;
  gstOnCommissionPaise: number;
  tdsAmountPaise: number;
  netPayoutPaise: number;
  payoutStatus: string;
  razorpayTransferId: string | null;
  payoutDate: string | null;
  createdAt: string;
}

interface PayoutSummary {
  totalGrossPaise: number;
  totalCommissionPaise: number;
  totalGstPaise: number;
  totalTdsPaise: number;
  totalNetPayoutPaise: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function HostPayoutsTab({ token }: { token: string }) {
  const [payouts, setPayouts] = useState<HostPayout[]>([]);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') ?? '' : '';

  useEffect(() => {
    if (userId) loadData();
  }, [userId, selectedMonth, selectedYear, page]);

  async function loadData() {
    setLoading(true);
    try {
      const [payoutRes, summaryRes] = await Promise.all([
        api.getHostPayouts(userId, token),
        api.getHostPayoutSummary(userId, selectedMonth, selectedYear, token),
      ]);
      setPayouts(payoutRes.content || []);
      setTotalPages(payoutRes.totalPages || 1);
      setSummary(summaryRes);
    } catch (e) {
      console.error('Failed to load payouts:', e);
    }
    setLoading(false);
  }

  const yearOptions: number[] = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) {
    yearOptions.push(y);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month/Year Selector */}
      <div className="flex items-center gap-3">
        <select
          value={selectedMonth}
          onChange={(e) => { setSelectedMonth(Number(e.target.value)); setPage(0); }}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => { setSelectedYear(Number(e.target.value)); setPage(0); }}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Monthly Summary Card */}
      {summary && (
        <div className="bg-white border rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Payout Summary — {MONTHS[selectedMonth - 1]} {selectedYear}
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0 flex-wrap text-sm">
            {/* Gross */}
            <div className="flex flex-col items-center px-4 py-3 bg-gray-50 rounded-lg min-w-[130px]">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Gross Collected</span>
              <span className="text-xl font-bold text-gray-900 mt-1">
                {formatPaise(summary.totalGrossPaise)}
              </span>
            </div>

            <span className="hidden sm:block text-gray-400 text-xl px-2">−</span>

            {/* Commission */}
            <div className="flex flex-col items-center px-4 py-3 bg-orange-50 rounded-lg min-w-[130px]">
              <span className="text-xs text-orange-600 uppercase tracking-wide">Commission</span>
              <span className="text-xl font-bold text-orange-600 mt-1">
                {formatPaise(summary.totalCommissionPaise)}
              </span>
            </div>

            <span className="hidden sm:block text-gray-400 text-xl px-2">−</span>

            {/* GST */}
            <div className="flex flex-col items-center px-4 py-3 bg-orange-50 rounded-lg min-w-[130px]">
              <span className="text-xs text-orange-600 uppercase tracking-wide">GST on Comm.</span>
              <span className="text-xl font-bold text-orange-600 mt-1">
                {formatPaise(summary.totalGstPaise)}
              </span>
            </div>

            <span className="hidden sm:block text-gray-400 text-xl px-2">−</span>

            {/* TDS */}
            <div className="flex flex-col items-center px-4 py-3 bg-orange-50 rounded-lg min-w-[130px]">
              <span className="text-xs text-orange-600 uppercase tracking-wide">TDS</span>
              <span className="text-xl font-bold text-orange-600 mt-1">
                {formatPaise(summary.totalTdsPaise)}
              </span>
            </div>

            <span className="hidden sm:block text-gray-400 text-xl px-2">=</span>

            {/* Net */}
            <div className="flex flex-col items-center px-4 py-3 bg-green-50 rounded-lg min-w-[130px] border-2 border-green-200">
              <span className="text-xs text-green-700 uppercase tracking-wide">Net Payout</span>
              <span className="text-xl font-bold text-green-700 mt-1">
                {formatPaise(summary.totalNetPayoutPaise)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payout History Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Payout History</h3>
        </div>

        {payouts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No payouts found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Invoice</th>
                  <th className="px-4 py-3 text-right">Gross</th>
                  <th className="px-4 py-3 text-right">Commission</th>
                  <th className="px-4 py-3 text-right">GST</th>
                  <th className="px-4 py-3 text-right">TDS</th>
                  <th className="px-4 py-3 text-right">Net Payout</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-left">Transfer ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {p.payoutDate
                        ? new Date(p.payoutDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600 font-mono text-xs">
                      {p.invoiceId ? p.invoiceId.slice(0, 8) + '...' : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatPaise(p.grossAmountPaise)}
                    </td>
                    <td className="px-4 py-3 text-right text-orange-600">
                      {formatPaise(p.commissionPaise)}
                      <span className="text-xs text-gray-400 ml-1">
                        ({(p.commissionRateBps / 100).toFixed(0)}%)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatPaise(p.gstOnCommissionPaise)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatPaise(p.tdsAmountPaise)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">
                      {formatPaise(p.netPayoutPaise)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.payoutStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {p.payoutStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500 font-mono text-xs">
                      {p.razorpayTransferId || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-sm rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-sm rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
