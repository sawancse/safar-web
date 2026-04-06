'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

function formatPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
}

const AGREEMENT_TYPES = [
  { value: 'SALE_AGREEMENT', label: 'Sale Agreement', desc: 'For property purchase between buyer and seller. Includes terms, timelines, and payment schedule.', icon: '📋' },
  { value: 'SALE_DEED', label: 'Sale Deed', desc: 'Final transfer of ownership document. Legally required for registration at sub-registrar office.', icon: '📜' },
  { value: 'RENTAL', label: 'Rental Agreement', desc: 'Standard 11-month rental agreement with terms, rent, deposit and maintenance details.', icon: '🏠' },
  { value: 'LEAVE_AND_LICENSE', label: 'Leave & License', desc: 'Maharashtra-style leave and license agreement. Mandatory e-registration in MH.', icon: '📝' },
  { value: 'PG_AGREEMENT', label: 'PG Agreement', desc: 'Paying guest agreement with house rules, notice period, and shared amenity terms.', icon: '🏢' },
];

const PACKAGES = [
  {
    name: 'Basic',
    price: 'Free',
    pricePaise: 0,
    features: ['Draft generation', 'PDF download', 'Basic clauses'],
    missing: ['E-stamping', 'E-signing', 'Registered copy', 'Doorstep delivery'],
  },
  {
    name: 'E-Stamp',
    price: '1,499',
    pricePaise: 149900,
    popular: false,
    features: ['Draft generation', 'PDF download', 'Basic clauses', 'E-stamping', 'E-signing'],
    missing: ['Registered copy', 'Doorstep delivery'],
  },
  {
    name: 'Registered',
    price: '4,999',
    pricePaise: 499900,
    popular: true,
    features: ['Draft generation', 'PDF download', 'Basic clauses', 'E-stamping', 'E-signing', 'Registered copy'],
    missing: ['Doorstep delivery'],
  },
  {
    name: 'Premium',
    price: '9,999',
    pricePaise: 999900,
    features: ['Draft generation', 'PDF download', 'Basic clauses', 'E-stamping', 'E-signing', 'Registered copy', 'Doorstep delivery'],
    missing: [],
  },
];

const STATES = [
  'Andhra Pradesh', 'Karnataka', 'Kerala', 'Maharashtra', 'Tamil Nadu', 'Telangana',
  'Delhi', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Madhya Pradesh',
  'Bihar', 'Punjab', 'Haryana', 'Odisha', 'Jharkhand', 'Chhattisgarh', 'Assam', 'Goa',
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-blue-100 text-blue-700',
  STAMPED: 'bg-indigo-100 text-indigo-700',
  SIGNED: 'bg-emerald-100 text-emerald-700',
  REGISTERED: 'bg-green-100 text-green-700',
  DELIVERED: 'bg-green-200 text-green-800',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function AgreementPage() {
  const [tab, setTab] = useState<'new' | 'my'>('new');
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');

  // Stamp duty calculator
  const [calcState, setCalcState] = useState('Maharashtra');
  const [calcType, setCalcType] = useState('SALE_AGREEMENT');
  const [calcValue, setCalcValue] = useState('5000000');
  const [stampResult, setStampResult] = useState<any>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('access_token') || '';
    setToken(t);
  }, []);

  useEffect(() => {
    if (tab === 'my' && token) {
      setLoading(true);
      api.getMyAgreements(token)
        .then((res: any) => setAgreements(Array.isArray(res) ? res : res?.content || []))
        .catch(() => setAgreements([]))
        .finally(() => setLoading(false));
    }
  }, [tab, token]);

  async function calculateStampDuty() {
    setCalcLoading(true);
    try {
      const valuePaise = Math.round(parseFloat(calcValue) * 100);
      const result = await api.calculateStampDuty(calcState, calcType, valuePaise);
      setStampResult(result);
    } catch {
      setStampResult({ error: true });
    } finally {
      setCalcLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#003B95] text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Link href="/services" className="text-white/70 hover:text-white text-sm mb-3 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            All Services
          </Link>
          <h1 className="text-3xl font-bold mb-2">Sale Agreements</h1>
          <p className="text-white/80">Create legally binding property agreements with e-stamping and e-signing</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-1 bg-white rounded-xl shadow-sm border border-gray-200 p-1 -mt-5 max-w-xs">
          <button
            onClick={() => setTab('new')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${tab === 'new' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            New Agreement
          </button>
          <button
            onClick={() => setTab('my')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${tab === 'my' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            My Agreements
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {tab === 'new' ? (
          <>
            {/* Agreement Types */}
            <h2 className="text-xl font-bold text-slate-900 mb-6">Choose Agreement Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {AGREEMENT_TYPES.map((t) => (
                <Link
                  key={t.value}
                  href={`/services/agreement/new?type=${t.value}`}
                  className="bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all p-6 group"
                >
                  <div className="text-3xl mb-3">{t.icon}</div>
                  <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">{t.label}</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">{t.desc}</p>
                  <span className="text-sm font-medium text-orange-500 inline-flex items-center gap-1">
                    Start
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                  </span>
                </Link>
              ))}
            </div>

            {/* Packages */}
            <h2 className="text-xl font-bold text-slate-900 mb-6">Compare Packages</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {PACKAGES.map((pkg) => (
                <div
                  key={pkg.name}
                  className={`bg-white rounded-xl border-2 p-6 relative ${pkg.popular ? 'border-orange-500 shadow-lg' : 'border-gray-200'}`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  <h3 className="font-bold text-lg text-slate-900 mb-1">{pkg.name}</h3>
                  <div className="text-2xl font-bold text-orange-500 mb-4">
                    {pkg.pricePaise === 0 ? 'Free' : `₹${pkg.price}`}
                  </div>
                  <ul className="space-y-2 mb-4">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        {f}
                      </li>
                    ))}
                    {pkg.missing.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Stamp Duty Calculator */}
            <h2 className="text-xl font-bold text-slate-900 mb-6">Stamp Duty Calculator</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select
                    value={calcState}
                    onChange={(e) => setCalcState(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                  >
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agreement Type</label>
                  <select
                    value={calcType}
                    onChange={(e) => setCalcType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                  >
                    {AGREEMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Value (INR)</label>
                  <input
                    type="number"
                    value={calcValue}
                    onChange={(e) => setCalcValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                    placeholder="e.g. 5000000"
                  />
                </div>
              </div>
              <button
                onClick={calculateStampDuty}
                disabled={calcLoading}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {calcLoading ? 'Calculating...' : 'Calculate'}
              </button>
              {stampResult && !stampResult.error && (
                <div className="mt-4 bg-orange-50 rounded-lg p-4 border border-orange-100">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Stamp Duty</div>
                      <div className="font-bold text-slate-900">{formatPaise(stampResult.stampDutyPaise || 0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Registration Fee</div>
                      <div className="font-bold text-slate-900">{formatPaise(stampResult.registrationFeePaise || 0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Total</div>
                      <div className="font-bold text-orange-600">{formatPaise(stampResult.totalPaise || 0)}</div>
                    </div>
                  </div>
                </div>
              )}
              {stampResult?.error && (
                <p className="mt-4 text-sm text-red-500">Failed to calculate. Please try again.</p>
              )}
            </div>
          </>
        ) : (
          <>
            {/* My Agreements */}
            {!token ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                <h3 className="font-semibold text-slate-900 mb-2">Sign in to continue</h3>
                <p className="text-sm text-gray-500 mb-4">You need to be logged in to view your agreements.</p>
                <Link href="/auth" className="inline-flex bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
                  Sign In
                </Link>
              </div>
            ) : loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-32" />
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : agreements.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                <h3 className="font-semibold text-slate-900 mb-2">No agreements yet</h3>
                <p className="text-sm text-gray-500 mb-4">Create your first property agreement to get started.</p>
                <button onClick={() => setTab('new')} className="inline-flex bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
                  Create Agreement
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {agreements.map((a: any) => (
                  <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-slate-900">{(a.agreementType || a.type || '').replace(/_/g, ' ')}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-700'}`}>
                            {(a.status || '').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          Created {a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                          {a.propertyAddress && <span> &middot; {a.propertyAddress}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/services/agreement/${a.id}`}
                          className="text-sm text-orange-500 hover:text-orange-600 font-medium px-4 py-2 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
