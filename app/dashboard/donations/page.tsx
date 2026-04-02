'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

const INR = (paise: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(paise / 100);

const DONOR_TIERS = [
  { min: 15000, name: 'Shelter Patron', badge: '\u{1F451}', color: 'text-purple-600 bg-purple-50' },
  { min: 5000, name: 'Shelter Champion', badge: '\u{1F3C6}', color: 'text-amber-600 bg-amber-50' },
  { min: 2000, name: 'Shelter Builder', badge: '\u{1F528}', color: 'text-blue-600 bg-blue-50' },
  { min: 500, name: 'Shelter Friend', badge: '\u{1F91D}', color: 'text-teal-600 bg-teal-50' },
];

function getDonorTier(totalPaise: number) {
  const totalRupees = totalPaise / 100;
  return DONOR_TIERS.find((t) => totalRupees >= t.min) || null;
}

interface Donation {
  id: string;
  razorpayOrderId?: string;
  amountPaise: number;
  frequency: string;
  status: string;
  receiptNumber?: string;
  createdAt: string;
}

export default function DonorDashboardPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('access_token') || '';
        const [statsData, myData] = await Promise.all([
          api.getDonationStats().catch(() => null),
          api.getMyDonations(token, 0, 50).catch(() => null),
        ]);
        setStats(statsData);
        const list = Array.isArray(myData) ? myData : myData?.content || [];
        setDonations(list);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalDonatedPaise = donations
    .filter((d) => d.status === 'CAPTURED')
    .reduce((sum, d) => sum + d.amountPaise, 0);
  const donationCount = donations.filter((d) => d.status === 'CAPTURED').length;
  const taxSavedPaise = Math.round(totalDonatedPaise * 0.5);
  const familiesHelped = Math.floor(totalDonatedPaise / (10000 * 100));
  const hasSip = donations.some((d) => d.frequency === 'MONTHLY' && d.status === 'CAPTURED');
  const tier = getDonorTier(totalDonatedPaise);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-6">{'\u{1F3E0}'}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">My Donations</h1>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            You haven&apos;t made any donations yet. Your contribution to Aashray helps
            provide shelter to families in need across India.
          </p>
          <Link
            href="/aashray/donate"
            className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition"
          >
            Make your first donation
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-orange-100 text-sm font-medium mb-1">Total Donated</p>
              <p className="text-4xl font-bold">{INR(totalDonatedPaise)}</p>
              <p className="text-orange-100 mt-2">
                ~{familiesHelped} {familiesHelped === 1 ? 'family' : 'families'} sheltered for a month
              </p>
            </div>
            <div className="text-right">
              {tier ? (
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${tier.color}`}
                >
                  <span className="text-xl">{tier.badge}</span>
                  {tier.name}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white/20 text-white">
                  Donor
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Donated" value={INR(totalDonatedPaise)} icon={'\u{1F4B0}'} />
          <StatCard label="Donations Made" value={String(donationCount)} icon={'\u{1F4E6}'} />
          <StatCard label="Tax Saved (50%)" value={INR(taxSavedPaise)} icon={'\u{1F4C4}'} />
          <StatCard
            label="Monthly SIP"
            value={hasSip ? 'Active' : 'Not set'}
            icon={'\u{1F504}'}
            highlight={hasSip}
          />
        </div>

        {/* Donation History */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Donation History</h2>
            <Link
              href="/aashray/donate"
              className="text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              Donate Again
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Ref</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3">Frequency</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {donations.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {new Date(d.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-xs">
                      {d.razorpayOrderId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                      {INR(d.amountPaise)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          d.frequency === 'MONTHLY'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {d.frequency === 'MONTHLY' ? 'Monthly' : 'One-time'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {d.status === 'CAPTURED' && d.receiptNumber ? (
                        <span className="text-orange-600 font-medium">{d.receiptNumber}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <p
        className={`text-xl font-bold ${
          highlight ? 'text-green-600' : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    CAPTURED: 'bg-green-50 text-green-700',
    CREATED: 'bg-blue-50 text-blue-700',
    FAILED: 'bg-red-50 text-red-700',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        styles[status] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {status}
    </span>
  );
}
