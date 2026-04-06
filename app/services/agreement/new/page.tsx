'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function formatPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
}

const AGREEMENT_TYPES = [
  { value: 'SALE_AGREEMENT', label: 'Sale Agreement' },
  { value: 'SALE_DEED', label: 'Sale Deed' },
  { value: 'RENTAL_AGREEMENT', label: 'Rental Agreement' },
  { value: 'LEAVE_LICENSE', label: 'Leave & License' },
  { value: 'PG_AGREEMENT', label: 'PG Agreement' },
];

const PACKAGES = [
  { value: 'BASIC', label: 'Basic', price: 'Free', pricePaise: 0 },
  { value: 'ESTAMP', label: 'E-Stamp', price: '₹1,499', pricePaise: 149900 },
  { value: 'REGISTERED', label: 'Registered', price: '₹4,999', pricePaise: 499900 },
  { value: 'PREMIUM', label: 'Premium', price: '₹9,999', pricePaise: 999900 },
];

const STATES = [
  'Andhra Pradesh', 'Karnataka', 'Kerala', 'Maharashtra', 'Tamil Nadu', 'Telangana',
  'Delhi', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Madhya Pradesh',
  'Bihar', 'Punjab', 'Haryana', 'Odisha', 'Jharkhand', 'Chhattisgarh', 'Assam', 'Goa',
];

const CLAUSES = [
  { key: 'indemnity', label: 'Indemnity Clause', desc: 'Protection against losses or damages' },
  { key: 'forceMajeure', label: 'Force Majeure', desc: 'Exemption for unforeseen events' },
  { key: 'disputeResolution', label: 'Dispute Resolution', desc: 'Arbitration or court jurisdiction' },
  { key: 'maintenance', label: 'Maintenance Responsibilities', desc: 'Who handles repairs and upkeep' },
  { key: 'penalty', label: 'Penalty for Breach', desc: 'Compensation if either party defaults' },
  { key: 'possession', label: 'Possession Date', desc: 'Specific handover date and conditions' },
  { key: 'encumbrance', label: 'Free from Encumbrance', desc: 'Seller declares no existing claims' },
  { key: 'titleWarranty', label: 'Title Warranty', desc: 'Seller guarantees clear marketable title' },
];

interface Party {
  name: string;
  role: 'BUYER' | 'SELLER' | 'WITNESS' | 'TENANT' | 'LANDLORD';
  aadhaar: string;
  pan: string;
  address: string;
  phone: string;
  email: string;
}

function AgreementWizardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialType = searchParams.get('type') || 'SALE_AGREEMENT';

  const [step, setStep] = useState(1);
  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [agreementType, setAgreementType] = useState(initialType);
  const [packageType, setPackageType] = useState('BASIC');

  // Step 2
  const [parties, setParties] = useState<Party[]>([
    { name: '', role: 'SELLER', aadhaar: '', pan: '', address: '', phone: '', email: '' },
    { name: '', role: 'BUYER', aadhaar: '', pan: '', address: '', phone: '', email: '' },
  ]);

  // Step 3
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertySurveyNo, setPropertySurveyNo] = useState('');
  const [propertyArea, setPropertyArea] = useState('');
  const [propertyState, setPropertyState] = useState('Maharashtra');
  const [propertyValueInr, setPropertyValueInr] = useState('');
  const [stampDuty, setStampDuty] = useState<any>(null);

  // Step 4
  const [clauses, setClauses] = useState<Record<string, boolean>>(
    Object.fromEntries(CLAUSES.map((c) => [c.key, ['indemnity', 'disputeResolution', 'encumbrance', 'titleWarranty'].includes(c.key)]))
  );
  const [customClause, setCustomClause] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('access_token') || '';
    setToken(t);
  }, []);

  useEffect(() => {
    if (step === 3 && propertyValueInr && propertyState) {
      const valuePaise = Math.round(parseFloat(propertyValueInr) * 100);
      if (valuePaise > 0) {
        api.calculateStampDuty(propertyState, agreementType, valuePaise)
          .then(setStampDuty)
          .catch(() => setStampDuty(null));
      }
    }
  }, [step, propertyValueInr, propertyState, agreementType]);

  function updateParty(index: number, field: keyof Party, value: string) {
    const updated = [...parties];
    updated[index] = { ...updated[index], [field]: value };
    setParties(updated);
  }

  function addParty(role: Party['role']) {
    setParties([...parties, { name: '', role, aadhaar: '', pan: '', address: '', phone: '', email: '' }]);
  }

  function removeParty(index: number) {
    if (parties.length <= 2) return;
    setParties(parties.filter((_, i) => i !== index));
  }

  function canProceed(): boolean {
    if (step === 1) return true;
    if (step === 2) return parties.every((p) => p.name && p.phone);
    if (step === 3) return !!propertyAddress && !!propertyValueInr;
    return true;
  }

  async function handleSubmit() {
    if (!token) {
      setError('Please sign in to create an agreement.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const selectedClauses = CLAUSES.filter((c) => clauses[c.key]).map((c) => c.key);
      if (customClause.trim()) selectedClauses.push('custom');

      const data = {
        agreementType,
        packageType,
        partyDetailsJson: JSON.stringify(parties.map((p) => ({
          name: p.name,
          role: p.role,
          aadhaarNumber: p.aadhaar,
          panNumber: p.pan,
          address: p.address,
          phone: p.phone,
          email: p.email,
        }))),
        propertyDetailsJson: JSON.stringify({
          propertyAddress,
          propertySurveyNumber: propertySurveyNo,
          propertyAreaSqft: propertyArea ? parseFloat(propertyArea) : undefined,
          state: propertyState,
          propertyValuePaise: Math.round(parseFloat(propertyValueInr) * 100),
        }),
        clausesJson: JSON.stringify({
          clauses: selectedClauses,
          customClause: customClause.trim() || undefined,
        }),
      };

      const result = await api.createAgreement(data);
      router.push(`/services/agreement?created=${result.id || 'true'}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create agreement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedPkg = PACKAGES.find((p) => p.value === packageType)!;
  const totalPaise = (selectedPkg?.pricePaise || 0) + (stampDuty?.totalPaise || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/services/agreement" className="text-gray-500 hover:text-gray-700 text-sm mb-3 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            Back to Agreements
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Create New Agreement</h1>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-8">
          {['Type & Package', 'Party Details', 'Property Details', 'Review & Submit'].map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > i + 1 ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                ) : i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${step === i + 1 ? 'font-medium text-slate-900' : 'text-gray-500'}`}>{label}</span>
              {i < 3 && <div className={`flex-1 h-0.5 ${step > i + 1 ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {!token && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">Sign in required</p>
              <p className="text-xs text-yellow-600">You will need to <Link href="/auth" className="underline">sign in</Link> to submit the agreement.</p>
            </div>
          </div>
        )}

        {/* Step 1: Type & Package */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Agreement Type</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {AGREEMENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setAgreementType(t.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      agreementType === t.value ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-slate-900">{t.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Select Package</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {PACKAGES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPackageType(p.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      packageType === p.value ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-slate-900">{p.label}</div>
                    <div className="text-sm text-orange-500 font-semibold">{p.price}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Party Details */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Party Details</h2>
            {parties.map((party, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-slate-900">Party {idx + 1}</h3>
                  {parties.length > 2 && (
                    <button onClick={() => removeParty(idx)} className="text-red-500 hover:text-red-600 text-sm">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select value={party.role} onChange={(e) => updateParty(idx, 'role', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm">
                      <option value="BUYER">Buyer</option>
                      <option value="SELLER">Seller</option>
                      <option value="TENANT">Tenant</option>
                      <option value="LANDLORD">Landlord</option>
                      <option value="WITNESS">Witness</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input value={party.name} onChange={(e) => updateParty(idx, 'name', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" placeholder="As per Aadhaar" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
                    <input value={party.aadhaar} onChange={(e) => updateParty(idx, 'aadhaar', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" placeholder="XXXX XXXX XXXX" maxLength={14} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                    <input value={party.pan} onChange={(e) => updateParty(idx, 'pan', e.target.value.toUpperCase())} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" placeholder="ABCDE1234F" maxLength={10} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input value={party.phone} onChange={(e) => updateParty(idx, 'phone', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input value={party.email} onChange={(e) => updateParty(idx, 'email', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" placeholder="name@email.com" type="email" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input value={party.address} onChange={(e) => updateParty(idx, 'address', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" placeholder="Full residential address" />
                  </div>
                </div>
              </div>
            ))}
            <div className="flex gap-3">
              <button onClick={() => addParty('BUYER')} className="text-sm text-orange-500 hover:text-orange-600 font-medium border border-orange-200 rounded-lg px-4 py-2 hover:bg-orange-50 transition-colors">
                + Add Party
              </button>
              <button onClick={() => addParty('WITNESS')} className="text-sm text-gray-500 hover:text-gray-600 font-medium border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
                + Add Witness
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Property Details */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Property Details</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Address *</label>
                  <textarea value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" placeholder="Full property address including flat/house number, street, locality, city, pincode" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <select value={propertyState} onChange={(e) => setPropertyState(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm">
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Survey / Plot Number</label>
                  <input value={propertySurveyNo} onChange={(e) => setPropertySurveyNo(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g. 123/A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Built-up Area (sq ft)</label>
                  <input type="number" value={propertyArea} onChange={(e) => setPropertyArea(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g. 1200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Value (INR) *</label>
                  <input type="number" value={propertyValueInr} onChange={(e) => setPropertyValueInr(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g. 5000000" />
                </div>
              </div>
            </div>
            {stampDuty && (
              <div className="bg-orange-50 rounded-xl border border-orange-200 p-6">
                <h3 className="font-medium text-slate-900 mb-3">Estimated Stamp Duty & Registration</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Stamp Duty</div>
                    <div className="font-bold text-slate-900">{formatPaise(stampDuty.stampDutyPaise || 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Registration Fee</div>
                    <div className="font-bold text-slate-900">{formatPaise(stampDuty.registrationFeePaise || 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Total Govt Charges</div>
                    <div className="font-bold text-orange-600">{formatPaise(stampDuty.totalPaise || 0)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Review & Submit</h2>

            {/* Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Agreement Type</span>
                <span className="font-medium text-slate-900">{AGREEMENT_TYPES.find((t) => t.value === agreementType)?.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Package</span>
                <span className="font-medium text-slate-900">{selectedPkg.label} ({selectedPkg.price})</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Parties</span>
                <span className="font-medium text-slate-900">{parties.filter((p) => p.name).length} parties</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Property</span>
                <span className="font-medium text-slate-900 text-right max-w-xs">{propertyAddress || '-'}</span>
              </div>
              {propertyValueInr && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Property Value</span>
                  <span className="font-medium text-slate-900">{formatPaise(Math.round(parseFloat(propertyValueInr) * 100))}</span>
                </div>
              )}
            </div>

            {/* Parties preview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-medium text-slate-900 mb-3">Parties</h3>
              <div className="space-y-2">
                {parties.filter((p) => p.name).map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <span className="font-medium text-slate-900">{p.name}</span>
                      {p.phone && <span className="text-gray-500 ml-2">{p.phone}</span>}
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{p.role}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clauses */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-medium text-slate-900 mb-4">Agreement Clauses</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CLAUSES.map((c) => (
                  <label key={c.key} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clauses[c.key]}
                      onChange={(e) => setClauses({ ...clauses, [c.key]: e.target.checked })}
                      className="mt-0.5 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{c.label}</div>
                      <div className="text-xs text-gray-500">{c.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Clause (optional)</label>
                <textarea
                  value={customClause}
                  onChange={(e) => setCustomClause(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                  placeholder="Enter any additional custom clause text..."
                />
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-medium text-slate-900 mb-4">Cost Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Package ({selectedPkg.label})</span>
                  <span className="text-slate-900">{selectedPkg.pricePaise === 0 ? 'Free' : formatPaise(selectedPkg.pricePaise)}</span>
                </div>
                {stampDuty && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Stamp Duty</span>
                      <span className="text-slate-900">{formatPaise(stampDuty.stampDutyPaise || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Registration Fee</span>
                      <span className="text-slate-900">{formatPaise(stampDuty.registrationFeePaise || 0)}</span>
                    </div>
                  </>
                )}
                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-semibold">
                  <span className="text-slate-900">Total</span>
                  <span className="text-orange-600">{totalPaise === 0 ? 'Free' : formatPaise(totalPaise)}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="text-sm text-gray-600 hover:text-gray-800 font-medium px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Back
            </button>
          ) : (
            <div />
          )}
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !token}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating Agreement...' : totalPaise > 0 ? 'Proceed to Payment' : 'Create Agreement'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AgreementNewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
      </div>
    }>
      <AgreementWizardContent />
    </Suspense>
  );
}
