'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

function formatPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
}

const DEFAULT_PACKAGES = [
  {
    id: 'title_search',
    name: 'Title Search',
    pricePaise: 299900,
    turnaround: '3-5 days',
    features: ['Title chain verification', 'Ownership history', '30-year title search', 'Digital report'],
  },
  {
    id: 'basic_verification',
    name: 'Basic Verification',
    pricePaise: 499900,
    turnaround: '5-7 days',
    features: ['Title chain verification', 'Encumbrance certificate check', 'Govt approval verification', 'Tax payment status', 'Digital report'],
  },
  {
    id: 'comprehensive',
    name: 'Comprehensive',
    pricePaise: 999900,
    popular: true,
    turnaround: '5-8 days',
    features: ['Title chain verification', 'Encumbrance certificate check', 'Govt approval verification', 'Tax payment status', 'Litigation check', 'Survey verification', 'Risk assessment', 'Detailed PDF report'],
  },
  {
    id: 'premium',
    name: 'Premium + Advocate',
    pricePaise: 1999900,
    turnaround: '7-10 days',
    features: ['All Comprehensive features', 'Dedicated advocate', 'Physical site inspection', 'Legal opinion letter', 'Dispute resolution support', 'Priority support', '1 free consultation call'],
  },
];

const STEPS = [
  { title: 'Upload Documents', desc: 'Share property documents like title deed, sale deed, tax receipts, and EC.' },
  { title: 'Advocate Review', desc: 'A verified advocate reviews all documents for authenticity and legal standing.' },
  { title: 'Verification', desc: 'Cross-check with government records, encumbrance, litigation, and survey data.' },
  { title: 'Report Delivery', desc: 'Receive a detailed verification report with risk assessment and legal opinion.' },
];

const RISK_COLORS: Record<string, string> = {
  GREEN: 'bg-green-100 text-green-700',
  YELLOW: 'bg-yellow-100 text-yellow-700',
  RED: 'bg-red-100 text-red-700',
};

const STATUS_COLORS: Record<string, string> = {
  CREATED: 'bg-gray-100 text-gray-700',
  DOCUMENTS_UPLOADED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  VERIFICATION_IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  REPORT_READY: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-green-200 text-green-800',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function LegalPage() {
  const [token, setToken] = useState('');
  const [packages, setPackages] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [pkgLoading, setPkgLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('access_token') || '';
    setToken(t);

    api.getLegalPackages()
      .then((res) => setPackages(Array.isArray(res) && res.length > 0 ? res : DEFAULT_PACKAGES))
      .catch(() => setPackages(DEFAULT_PACKAGES))
      .finally(() => setPkgLoading(false));

    if (t) {
      setCasesLoading(true);
      api.getMyLegalCases(t)
        .then((res: any) => setCases(Array.isArray(res) ? res : res?.content || []))
        .catch(() => setCases([]))
        .finally(() => setCasesLoading(false));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#003B95] text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Link href="/services" className="text-white/70 hover:text-white text-sm mb-3 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            All Services
          </Link>
          <h1 className="text-3xl font-bold mb-2">Legal Verification</h1>
          <p className="text-white/80">Expert property verification, title search, and risk assessment by verified advocates</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* Packages */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-6">Verification Packages</h2>
          {pkgLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-3" />
                  <div className="h-8 bg-gray-200 rounded w-24 mb-4" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((j) => <div key={j} className="h-4 bg-gray-100 rounded" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {packages.map((pkg) => (
                <div key={pkg.id || pkg.name} className={`bg-white rounded-xl border-2 p-6 relative flex flex-col ${pkg.popular ? 'border-orange-500 shadow-lg' : 'border-gray-200'}`}>
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  <h3 className="font-bold text-slate-900 mb-1">{pkg.name}</h3>
                  <div className="text-2xl font-bold text-orange-500 mb-1">{formatPaise(pkg.pricePaise)}</div>
                  <div className="text-xs text-gray-500 mb-4">Delivery: {pkg.turnaround}</div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {(pkg.features || []).map((f: string) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/services/legal/new?package=${pkg.type || pkg.id || pkg.name}`}
                    className={`block text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      pkg.popular
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : 'border border-orange-200 text-orange-500 hover:bg-orange-50'
                    }`}>
                    Select
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* How It Works */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="bg-white rounded-xl border border-gray-200 p-6 h-full">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 font-bold flex items-center justify-center mb-3">
                    {i + 1}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-gray-300">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* My Cases */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">My Cases</h2>
            {token && (
              <Link href="/services/legal/new" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
                + New Case
              </Link>
            )}
          </div>
          {!token ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
              <h3 className="font-semibold text-slate-900 mb-2">Sign in to continue</h3>
              <p className="text-sm text-gray-500 mb-4">Sign in to view your legal verification cases.</p>
              <Link href="/auth" className="inline-flex bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
                Sign In
              </Link>
            </div>
          ) : casesLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-64" />
                </div>
              ))}
            </div>
          ) : cases.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <h3 className="font-semibold text-slate-900 mb-2">No cases yet</h3>
              <p className="text-sm text-gray-500 mb-4">Start your first property verification to ensure a safe purchase.</p>
              <Link href="/services/legal/new" className="inline-flex bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
                Start Verification
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cases.map((c: any) => (
                <Link key={c.id} href={`/services/legal/${c.id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-slate-900">Case #{(c.id || '').slice(-8).toUpperCase()}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-700'}`}>
                          {(c.status || '').replace(/_/g, ' ')}
                        </span>
                        {c.riskLevel && (
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${RISK_COLORS[c.riskLevel] || 'bg-gray-100 text-gray-700'}`}>
                            {c.riskLevel} Risk
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {c.packageName || c.packageType || 'Verification'}
                        {c.propertyAddress && <span> &middot; {c.propertyAddress}</span>}
                      </p>
                      {c.advocateName && <p className="text-sm text-gray-400 mt-1">Advocate: {c.advocateName}</p>}
                    </div>
                    <div className="text-sm text-gray-400">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : ''}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
