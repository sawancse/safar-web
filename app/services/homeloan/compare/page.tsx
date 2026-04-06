'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function formatPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
}

function CompareContent() {
  const searchParams = useSearchParams();
  const eligibilityId = searchParams.get('eligibilityId') || '';

  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loanFilter, setLoanFilter] = useState('');

  useEffect(() => {
    const fetchBanks = async () => {
      setLoading(true);
      try {
        let result: any[];
        if (eligibilityId) {
          result = await api.compareBanks(eligibilityId);
        } else {
          result = await api.getPartnerBanks();
        }
        setBanks(Array.isArray(result) ? result : []);
      } catch {
        setBanks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBanks();
  }, [eligibilityId]);

  const filteredBanks = loanFilter
    ? banks.filter((b) => {
        const filterAmount = parseFloat(loanFilter) * 100;
        return !b.maxLoanAmountPaise || b.maxLoanAmountPaise >= filterAmount;
      })
    : banks;

  const bestRate = filteredBanks.length > 0
    ? Math.min(...filteredBanks.map((b) => b.minInterestRate || 99))
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#003B95] text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Link href="/services/homeloan" className="text-white/70 hover:text-white text-sm mb-3 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            Home Loan
          </Link>
          <h1 className="text-3xl font-bold mb-2">Compare Bank Offers</h1>
          <p className="text-white/80">Side-by-side comparison of interest rates, fees, and terms</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <label className="text-sm font-medium text-gray-700 flex-shrink-0">Filter by Loan Amount (INR)</label>
          <input
            type="number"
            value={loanFilter}
            onChange={(e) => setLoanFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm max-w-xs"
            placeholder="e.g. 5000000"
          />
          {loanFilter && (
            <button onClick={() => setLoanFilter('')} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-6" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded mb-2" />
            ))}
          </div>
        ) : filteredBanks.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18" />
            </svg>
            <h3 className="font-semibold text-slate-900 mb-2">No banks match your criteria</h3>
            <p className="text-sm text-gray-500">Try adjusting your loan amount filter.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-4 font-medium text-gray-500">Bank</th>
                    <th className="text-left px-6 py-4 font-medium text-gray-500">Interest Rate</th>
                    <th className="text-left px-6 py-4 font-medium text-gray-500">Processing Fee</th>
                    <th className="text-left px-6 py-4 font-medium text-gray-500">Max Tenure</th>
                    <th className="text-left px-6 py-4 font-medium text-gray-500">Max LTV</th>
                    <th className="text-left px-6 py-4 font-medium text-gray-500">Min Income</th>
                    <th className="text-left px-6 py-4 font-medium text-gray-500">Special Offers</th>
                    <th className="text-right px-6 py-4 font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBanks.map((bank, idx) => {
                    const isBest = bank.minInterestRate === bestRate;
                    return (
                      <tr key={bank.id || idx} className={`hover:bg-gray-50 ${isBest ? 'bg-green-50' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-500 font-bold text-sm flex-shrink-0">
                              {(bank.bankName || 'B')[0]}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{bank.bankName || 'Bank'}</div>
                              {isBest && <span className="text-xs text-green-600 font-medium">Best Rate</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-semibold ${isBest ? 'text-green-700' : 'text-slate-900'}`}>
                            {bank.minInterestRate || '8.5'}%
                          </span>
                          <span className="text-gray-400"> - {bank.maxInterestRate || '9.5'}%</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{bank.processingFeePercent ? `${bank.processingFeePercent}% + GST` : '0.5% + GST'}</td>
                        <td className="px-6 py-4 text-gray-600">{bank.maxTenureMonths ? Math.round(bank.maxTenureMonths / 12) : 30} Years</td>
                        <td className="px-6 py-4 text-gray-600">{bank.maxLtv || '80'}%</td>
                        <td className="px-6 py-4 text-gray-600">
                          {bank.minIncomePaise ? formatPaise(bank.minIncomePaise) : '₹25,000'}/mo
                        </td>
                        <td className="px-6 py-4">
                          {bank.specialOffer ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{bank.specialOffer}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors">
                            Apply
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mobile cards for banks (shown on small screens) */}
        {!loading && filteredBanks.length > 0 && (
          <div className="md:hidden space-y-4 mt-6">
            {filteredBanks.map((bank, idx) => {
              const isBest = bank.minInterestRate === bestRate;
              return (
                <div key={`mobile-${bank.id || idx}`} className={`bg-white rounded-xl border p-4 ${isBest ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-500 font-bold">
                      {(bank.bankName || 'B')[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{bank.bankName}</div>
                      {isBest && <span className="text-xs text-green-600 font-medium">Best Rate</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div><span className="text-gray-500">Rate: </span><span className="font-medium">{bank.minInterestRate}% - {bank.maxInterestRate}%</span></div>
                    <div><span className="text-gray-500">Tenure: </span><span className="font-medium">{bank.maxTenureMonths ? Math.round(bank.maxTenureMonths / 12) : 30} Yrs</span></div>
                    <div><span className="text-gray-500">Fee: </span><span className="font-medium">{bank.processingFeePercent ? `${bank.processingFeePercent}%` : '0.5%'}</span></div>
                    <div><span className="text-gray-500">LTV: </span><span className="font-medium">{bank.maxLtv || 80}%</span></div>
                  </div>
                  <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-medium">Apply</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
