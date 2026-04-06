'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function formatPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
}

const DEFAULT_PACKAGES = [
  { id: 'TITLE_SEARCH', name: 'Title Search', pricePaise: 299900, turnaround: '3-5 days', features: ['Title chain verification', 'Ownership history', '30-year title search', 'Digital report'] },
  { id: 'DUE_DILIGENCE', name: 'Due Diligence', pricePaise: 999900, turnaround: '5-8 days', popular: true, features: ['Title chain verification', 'Encumbrance certificate check', 'Govt approval verification', 'Tax payment status', 'Litigation check', 'Survey verification', 'Risk assessment', 'Detailed PDF report'] },
  { id: 'BUYER_ASSIST', name: 'Buyer Assist', pricePaise: 1999900, turnaround: '10-15 days', features: ['All Due Diligence features', 'Agreement draft', 'SRO registration assistance', 'Khata transfer', 'Tax name change'] },
  { id: 'PREMIUM', name: 'Premium + Advocate', pricePaise: 4999900, turnaround: '15-20 days', features: ['All Buyer Assist features', 'Dedicated advocate', 'Unlimited consultations', 'Legal opinion letter', 'Dispute resolution support', 'Priority support'] },
];

const DOCUMENT_TYPES = [
  { key: 'TITLE_DEED', label: 'Title Deed / Sale Deed', required: true },
  { key: 'PREVIOUS_SALE_DEED', label: 'Previous Sale Deed', required: false },
  { key: 'TAX_RECEIPT', label: 'Property Tax Receipt', required: true },
  { key: 'ENCUMBRANCE_CERTIFICATE', label: 'Encumbrance Certificate (EC)', required: true },
  { key: 'KHATA', label: 'Khata Certificate / Extract', required: false },
  { key: 'BUILDING_APPROVAL', label: 'Building Approval Plan', required: false },
];

const STATES = [
  'Andhra Pradesh', 'Karnataka', 'Kerala', 'Maharashtra', 'Tamil Nadu', 'Telangana',
  'Delhi', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Madhya Pradesh',
];

function LegalNewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPkg = searchParams.get('package') || '';

  const [step, setStep] = useState(1);
  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [selectedPkg, setSelectedPkg] = useState(initialPkg);
  const [packages, setPackages] = useState<any[]>(DEFAULT_PACKAGES);

  // Step 2
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyCity, setPropertyCity] = useState('');
  const [propertyState, setPropertyState] = useState('Karnataka');
  const [surveySurveyNo, setSurveySurveyNo] = useState('');

  // Step 3
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { name: string; uploaded: boolean }>>({});

  useEffect(() => {
    const t = localStorage.getItem('access_token') || '';
    setToken(t);
    api.getLegalPackages()
      .then((res) => { if (Array.isArray(res) && res.length > 0) setPackages(res); })
      .catch(() => {});
  }, []);

  function handleFileSelect(docType: string, file: File | null) {
    if (!file) return;
    setUploadedDocs((prev) => ({ ...prev, [docType]: { name: file.name, uploaded: true } }));
  }

  async function handleSubmit() {
    if (!token) {
      setError('Please sign in to create a legal case.');
      return;
    }
    if (!selectedPkg) {
      setError('Please select a package.');
      return;
    }
    if (!propertyAddress.trim()) {
      setError('Property address is required.');
      return;
    }
    if (!propertyCity.trim()) {
      setError('City is required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const data = {
        packageType: selectedPkg,
        propertyAddress,
        propertyCity,
        propertyState,
        surveyNumber: surveySurveyNo || undefined,
      };
      const result = await api.createLegalCase(data);
      router.push(`/services/legal/${result.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create case. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const pkg = packages.find((p) => (p.type || p.id || p.name) === selectedPkg);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/services/legal" className="text-gray-500 hover:text-gray-700 text-sm mb-3 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            Back to Legal Services
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">New Legal Verification</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {['Select Package', 'Property Details', 'Upload Documents'].map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > i + 1 ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                ) : i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${step === i + 1 ? 'font-medium text-slate-900' : 'text-gray-500'}`}>{label}</span>
              {i < 2 && <div className={`flex-1 h-0.5 ${step > i + 1 ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {!token && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm">
            <Link href="/auth" className="text-yellow-800 font-medium underline">Sign in</Link>
            <span className="text-yellow-700"> to submit your verification request.</span>
          </div>
        )}

        {/* Step 1: Select Package */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Select Verification Package</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map((p) => (
                <button
                  key={p.id || p.name}
                  onClick={() => setSelectedPkg(p.type || p.id || p.name)}
                  className={`text-left p-6 rounded-xl border-2 transition-all ${
                    (selectedPkg === (p.type || p.id || p.name))
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">{p.name}</h3>
                    <span className="text-lg font-bold text-orange-500">{formatPaise(p.pricePaise)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">Delivery: {p.turnaround}</div>
                  <ul className="space-y-1">
                    {(p.features || []).slice(0, 4).map((f: string) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        {f}
                      </li>
                    ))}
                    {(p.features || []).length > 4 && (
                      <li className="text-xs text-gray-400">+{p.features.length - 4} more</li>
                    )}
                  </ul>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Property Details */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Property Details</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Address *</label>
                  <textarea value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" placeholder="Full property address" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input value={propertyCity} onChange={(e) => setPropertyCity(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g. Bangalore" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <select value={propertyState} onChange={(e) => setPropertyState(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm">
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Survey / Plot Number</label>
                  <input value={surveySurveyNo} onChange={(e) => setSurveySurveyNo(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" placeholder="Optional" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Upload Documents */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload Documents</h2>
            <p className="text-sm text-gray-500 mb-6">Upload your property documents for verification. Required documents are marked with *.</p>
            <div className="space-y-3">
              {DOCUMENT_TYPES.map((doc) => (
                <div key={doc.key} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {uploadedDocs[doc.key]?.uploaded ? (
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0v3.375m0-3.375v-2.625" /></svg>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {doc.label}{doc.required && <span className="text-red-500"> *</span>}
                      </div>
                      {uploadedDocs[doc.key]?.name && (
                        <div className="text-xs text-gray-500">{uploadedDocs[doc.key].name}</div>
                      )}
                    </div>
                  </div>
                  <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 font-medium transition-colors text-center">
                    {uploadedDocs[doc.key]?.uploaded ? 'Replace' : 'Upload'}
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileSelect(doc.key, e.target.files?.[0] || null)} />
                  </label>
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mt-6">{error}</div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="text-sm text-gray-600 hover:text-gray-800 font-medium px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Back
            </button>
          ) : <div />}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !selectedPkg}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !token}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit for Verification'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LegalNewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
      </div>
    }>
      <LegalNewContent />
    </Suspense>
  );
}
