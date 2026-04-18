'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';

type UtilityReading = {
  id: string;
  utilityType: string;
  readingDate: string;
  meterNumber: string;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  ratePerUnit: number;
  totalChargePaise: number;
  billed: boolean;
  createdAt: string;
};

type UnbilledSummary = {
  electricityTotalPaise: number;
  waterTotalPaise: number;
  totalPaise: number;
  readings: UtilityReading[];
};

const TYPE_TABS = ['ALL', 'ELECTRICITY', 'WATER'] as const;

export default function UtilitiesPage() {
  const router = useRouter();
  const [readings, setReadings] = useState<UtilityReading[]>([]);
  const [unbilled, setUnbilled] = useState<UnbilledSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [tenancyId, setTenancyId] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Record reading form
  const [formType, setFormType] = useState<string>('ELECTRICITY');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formMeter, setFormMeter] = useState('');
  const [formPrevious, setFormPrevious] = useState('');
  const [formCurrent, setFormCurrent] = useState('');
  const [formRate, setFormRate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    if (!token) {
      router.push('/auth?redirect=/pg-dashboard/utilities');
      return;
    }
    setIsHost(role === 'HOST' || role === 'ADMIN');

    try {
      const dashboard = await api.getTenantDashboard(token);
      const tid = dashboard?.tenancy?.id;
      if (!tid) { setReadings([]); setUnbilled(null); setLoading(false); return; }
      setTenancyId(tid);

      const [readingsData, unbilledData] = await Promise.all([
        api.getUtilityReadings(tid, token) as Promise<UtilityReading[] | { content: UtilityReading[] }>,
        api.getUnbilledUtilities(tid, token),
      ]);

      setReadings(Array.isArray(readingsData) ? readingsData : (readingsData as { content: UtilityReading[] })?.content ?? []);
      setUnbilled(unbilledData);
    } catch {
      setReadings([]);
      setUnbilled(null);
    } finally {
      setLoading(false);
    }
  }

  const filtered = activeTab === 'ALL'
    ? readings
    : readings.filter((r) => r.utilityType === activeTab);

  async function handleRecordReading() {
    const token = localStorage.getItem('access_token');
    if (!token || !tenancyId) return;
    setSubmitting(true);
    try {
      await api.recordUtilityReading(
        tenancyId,
        {
          utilityType: formType,
          readingDate: formDate,
          meterNumber: formMeter,
          previousReading: parseFloat(formPrevious),
          currentReading: parseFloat(formCurrent),
          ratePerUnit: parseFloat(formRate),
        },
        token
      );
      setShowRecordModal(false);
      setFormMeter('');
      setFormPrevious('');
      setFormCurrent('');
      setFormRate('');
      setLoading(true);
      await loadData();
    } catch {
      alert('Failed to record reading');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-gray-400">
        <div className="text-4xl mb-4 animate-spin">&#x23F3;</div>
        <p>Loading utility readings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Utility Readings</h1>
          <p className="text-sm text-gray-500 mt-1">Electricity and water meter readings for your tenancy</p>
        </div>
        {isHost && (
          <button
            onClick={() => setShowRecordModal(true)}
            className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 text-sm"
          >
            + Record Reading
          </button>
        )}
      </div>

      {/* Unbilled Summary */}
      {unbilled && (unbilled.electricityTotalPaise > 0 || unbilled.waterTotalPaise > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="border rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1">Unbilled Electricity</p>
            <p className="text-xl font-bold text-yellow-600">
              {formatPaise(unbilled.electricityTotalPaise)}
            </p>
          </div>
          <div className="border rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1">Unbilled Water</p>
            <p className="text-xl font-bold text-blue-600">
              {formatPaise(unbilled.waterTotalPaise)}
            </p>
          </div>
          <div className="border rounded-2xl p-4 bg-orange-50">
            <p className="text-xs text-gray-500 mb-1">Total Unbilled</p>
            <p className="text-xl font-bold text-orange-600">
              {formatPaise(unbilled.totalPaise)}
            </p>
          </div>
        </div>
      )}

      {/* Type Tabs */}
      <div className="flex gap-2 mb-6">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              activeTab === tab
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Readings Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">&#x1F4A7;</p>
          <p className="text-sm font-medium">No utility readings</p>
          <p className="text-xs text-gray-400 mt-1">
            {activeTab === 'ALL'
              ? 'No meter readings recorded yet'
              : `No ${activeTab.toLowerCase()} readings`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Meter No.</th>
                <th className="px-4 py-3 text-right">Previous</th>
                <th className="px-4 py-3 text-right">Current</th>
                <th className="px-4 py-3 text-right">Units</th>
                <th className="px-4 py-3 text-right">Rate/Unit</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Billed</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((reading) => (
                <tr key={reading.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(reading.readingDate).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        reading.utilityType === 'ELECTRICITY'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {reading.utilityType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{reading.meterNumber}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{reading.previousReading}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{reading.currentReading}</td>
                  <td className="px-4 py-3 text-right font-medium">{reading.unitsConsumed}</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {formatPaise(reading.ratePerUnit)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatPaise(reading.totalChargePaise)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {reading.billed ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700">
                        Yes
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-100 text-red-600">
                        No
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Reading Modal (Host Only) */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Record Utility Reading</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Utility Type</label>
                <div className="flex gap-2">
                  {(['ELECTRICITY', 'WATER'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFormType(t)}
                      className={`flex-1 text-sm font-medium py-2 rounded-xl transition ${
                        formType === t
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reading Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meter Number</label>
                <input
                  type="text"
                  value={formMeter}
                  onChange={(e) => setFormMeter(e.target.value)}
                  placeholder="e.g. EM-2024-001"
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previous Reading</label>
                  <input
                    type="number"
                    value={formPrevious}
                    onChange={(e) => setFormPrevious(e.target.value)}
                    placeholder="0"
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Reading</label>
                  <input
                    type="number"
                    value={formCurrent}
                    onChange={(e) => setFormCurrent(e.target.value)}
                    placeholder="0"
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate per Unit (paise)</label>
                <input
                  type="number"
                  value={formRate}
                  onChange={(e) => setFormRate(e.target.value)}
                  placeholder="e.g. 800 for ₹8/unit"
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRecordModal(false)}
                className="flex-1 border rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordReading}
                disabled={submitting || !formMeter.trim() || !formPrevious || !formCurrent || !formRate}
                className="flex-1 bg-orange-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Reading'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
