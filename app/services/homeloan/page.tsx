'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

function formatPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
}

function formatINR(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(2)} L`;
  return new Intl.NumberFormat('en-IN').format(amount);
}

function calculateEmiLocal(principal: number, annualRate: number, tenureMonths: number): number {
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / tenureMonths;
  return (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
}

export default function HomeLoanPage() {
  const [token, setToken] = useState('');

  // EMI Calculator
  const [loanAmount, setLoanAmount] = useState(5000000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);

  // Eligibility
  const [employmentType, setEmploymentType] = useState('SALARIED');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [currentEmis, setCurrentEmis] = useState('');
  const [desiredAmount, setDesiredAmount] = useState('');
  const [desiredTenure, setDesiredTenure] = useState('20');
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);
  const [eligLoading, setEligLoading] = useState(false);

  // Banks
  const [banks, setBanks] = useState<any[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'rate' | 'name'>('rate');

  // Apply Modal
  const [applyBank, setApplyBank] = useState<any>(null);
  const [applyForm, setApplyForm] = useState({ loanAmount: '', tenure: '20', name: '', phone: '', email: '' });
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // My Applications
  const [applications, setApplications] = useState<any[]>([]);
  const [showApplications, setShowApplications] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('access_token') || '';
    setToken(t);
    api.getPartnerBanks()
      .then((res) => setBanks(Array.isArray(res) ? res : []))
      .catch(() => setBanks([]))
      .finally(() => setBanksLoading(false));
  }, []);

  useEffect(() => {
    if (token) {
      api.getMyLoanApplications(token)
        .then((res) => {
          const items = res?.content || res || [];
          setApplications(Array.isArray(items) ? items : []);
        })
        .catch(() => setApplications([]));
    }
  }, [token, applySuccess]);

  const emi = useMemo(() => calculateEmiLocal(loanAmount, interestRate, tenure * 12), [loanAmount, interestRate, tenure]);
  const totalAmount = emi * tenure * 12;
  const totalInterest = totalAmount - loanAmount;

  const emiPercent = totalAmount > 0 ? (loanAmount / totalAmount) * 100 : 50;

  async function checkEligibility() {
    if (!token) return;
    setEligLoading(true);
    try {
      const data = {
        employmentType,
        monthlyIncomePaise: Math.round(parseFloat(monthlyIncome) * 100),
        currentEmisPaise: currentEmis ? Math.round(parseFloat(currentEmis) * 100) : 0,
        desiredLoanAmountPaise: Math.round(parseFloat(desiredAmount) * 100),
        desiredTenureMonths: parseInt(desiredTenure) * 12,
      };
      const result = await api.checkLoanEligibility(data, token);
      setEligibilityResult(result);
    } catch {
      setEligibilityResult({ error: true });
    } finally {
      setEligLoading(false);
    }
  }

  async function handleApply() {
    if (!token || !applyBank) return;
    setApplyLoading(true);
    try {
      await api.applyLoan({
        bankId: applyBank.id,
        loanAmountPaise: Math.round(parseFloat(applyForm.loanAmount) * 100),
        tenureMonths: parseInt(applyForm.tenure) * 12,
        applicantName: applyForm.name,
        applicantPhone: applyForm.phone,
        applicantEmail: applyForm.email,
      }, token);
      setApplySuccess(true);
      setTimeout(() => {
        setApplyBank(null);
        setApplySuccess(false);
        setApplyForm({ loanAmount: '', tenure: '20', name: '', phone: '', email: '' });
      }, 2000);
    } catch {
      alert('Application failed. Please try again.');
    } finally {
      setApplyLoading(false);
    }
  }

  const sortedBanks = useMemo(() => {
    const b = [...banks];
    if (sortBy === 'rate') b.sort((a, z) => (a.minInterestRate || 0) - (z.minInterestRate || 0));
    else b.sort((a, z) => (a.bankName || '').localeCompare(z.bankName || ''));
    return b;
  }, [banks, sortBy]);

  const statusColor: Record<string, string> = {
    APPLIED: 'bg-blue-100 text-blue-700',
    DOCUMENTS_PENDING: 'bg-yellow-100 text-yellow-700',
    UNDER_REVIEW: 'bg-purple-100 text-purple-700',
    SANCTIONED: 'bg-green-100 text-green-700',
    DISBURSED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#003B95] text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Link href="/services" className="text-white/70 hover:text-white text-sm mb-3 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            All Services
          </Link>
          <h1 className="text-3xl font-bold mb-2">Home Loan</h1>
          <p className="text-white/80">Compare rates from 15+ banks. Check eligibility instantly. Completely free.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* EMI Calculator */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-6">EMI Calculator</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              {/* Loan Amount */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Loan Amount</label>
                  <span className="text-sm font-semibold text-slate-900">{formatINR(loanAmount)}</span>
                </div>
                <input type="range" min={500000} max={50000000} step={100000} value={loanAmount} onChange={(e) => setLoanAmount(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>5 L</span><span>5 Cr</span></div>
              </div>
              {/* Interest Rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Interest Rate (% p.a.)</label>
                  <span className="text-sm font-semibold text-slate-900">{interestRate.toFixed(1)}%</span>
                </div>
                <input type="range" min={7} max={12} step={0.1} value={interestRate} onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>7%</span><span>12%</span></div>
              </div>
              {/* Tenure */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Loan Tenure (Years)</label>
                  <span className="text-sm font-semibold text-slate-900">{tenure} Years</span>
                </div>
                <input type="range" min={5} max={30} step={1} value={tenure} onChange={(e) => setTenure(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>5 Yrs</span><span>30 Yrs</span></div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center">
              {/* Donut chart visual */}
              <div className="relative w-48 h-48 mb-6">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" strokeWidth="12" stroke="#E2E8F0" />
                  <circle cx="50" cy="50" r="40" fill="none" strokeWidth="12" stroke="#3B82F6"
                    strokeDasharray={`${emiPercent * 2.51} ${251.2 - emiPercent * 2.51}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-xs text-gray-500">Monthly EMI</div>
                  <div className="text-xl font-bold text-slate-900">{formatINR(Math.round(emi))}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 w-full text-center">
                <div>
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="text-xs text-gray-500">Principal</span>
                  </div>
                  <div className="font-semibold text-sm text-slate-900">{formatINR(loanAmount)}</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span className="text-xs text-gray-500">Interest</span>
                  </div>
                  <div className="font-semibold text-sm text-slate-900">{formatINR(Math.round(totalInterest))}</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-800" />
                    <span className="text-xs text-gray-500">Total</span>
                  </div>
                  <div className="font-semibold text-sm text-slate-900">{formatINR(Math.round(totalAmount))}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Eligibility Calculator */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-6">Check Eligibility</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm">
                  <option value="SALARIED">Salaried</option>
                  <option value="SELF_EMPLOYED">Self-Employed</option>
                  <option value="BUSINESS">Business Owner</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income (INR)</label>
                <input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g. 100000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current EMIs (INR/month)</label>
                <input type="number" value={currentEmis} onChange={(e) => setCurrentEmis(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desired Loan Amount (INR)</label>
                <input type="number" value={desiredAmount} onChange={(e) => setDesiredAmount(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g. 5000000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenure (Years)</label>
                <select value={desiredTenure} onChange={(e) => setDesiredTenure(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm">
                  {[5, 10, 15, 20, 25, 30].map((y) => <option key={y} value={String(y)}>{y} Years</option>)}
                </select>
              </div>
            </div>
            {!token ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                <Link href="/auth" className="text-yellow-800 font-medium underline">Sign in</Link>
                <span className="text-yellow-700"> to check your eligibility.</span>
              </div>
            ) : (
              <button onClick={checkEligibility} disabled={eligLoading || !monthlyIncome || !desiredAmount}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {eligLoading ? 'Checking...' : 'Check Eligibility'}
              </button>
            )}
            {eligibilityResult && !eligibilityResult.error && (
              <div className="mt-6 bg-orange-50 rounded-xl border border-orange-200 p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Eligible Amount</div>
                    <div className="text-xl font-bold text-orange-600">{formatPaise(eligibilityResult.maxEligibleAmountPaise || 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Max Monthly EMI</div>
                    <div className="text-xl font-bold text-slate-900">{formatPaise(eligibilityResult.maxEmiPaise || 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Status</div>
                    <div className={`text-xl font-bold ${eligibilityResult.eligible ? 'text-green-600' : 'text-red-600'}`}>
                      {eligibilityResult.eligible ? 'Eligible' : 'Not Eligible'}
                    </div>
                  </div>
                </div>
                {eligibilityResult.eligible && eligibilityResult.id && (
                  <div className="mt-4 text-center">
                    <Link href={`/services/homeloan/compare?eligibilityId=${eligibilityResult.id}`}
                      className="inline-flex bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
                      Compare Bank Offers
                    </Link>
                  </div>
                )}
              </div>
            )}
            {eligibilityResult?.error && (
              <p className="mt-4 text-sm text-red-500">Failed to check eligibility. Please try again.</p>
            )}
          </div>
        </section>

        {/* My Applications */}
        {token && applications.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">My Applications</h2>
              <button onClick={() => setShowApplications(!showApplications)} className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                {showApplications ? 'Hide' : `View All (${applications.length})`}
              </button>
            </div>
            {showApplications && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {applications.map((app: any) => (
                  <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-slate-900">{app.bankName || 'Bank'}</div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[app.status] || 'bg-gray-100 text-gray-700'}`}>
                        {app.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Amount: </span>
                        <span className="font-medium">{app.loanAmountPaise ? formatPaise(app.loanAmountPaise) : '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tenure: </span>
                        <span className="font-medium">{app.tenureMonths ? `${Math.round(app.tenureMonths / 12)} yrs` : '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Rate: </span>
                        <span className="font-medium">{app.interestRate ? `${app.interestRate}%` : '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">EMI: </span>
                        <span className="font-medium">{app.emiPaise ? formatPaise(app.emiPaise) : '-'}</span>
                      </div>
                      {app.referenceNumber && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Ref: </span>
                          <span className="font-medium font-mono text-xs">{app.referenceNumber}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      Applied: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-IN') : app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-IN') : '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Partner Banks */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Partner Banks</h2>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="rate">Sort by Interest Rate</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
          {banksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                    <div className="h-5 bg-gray-200 rounded w-32" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-40" />
                </div>
              ))}
            </div>
          ) : sortedBanks.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500">No partner banks available. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedBanks.map((bank, idx) => (
                <div key={bank.id || idx} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    {bank.logoUrl ? (
                      <img src={bank.logoUrl} alt={bank.bankName} className="w-12 h-12 rounded-xl object-contain" />
                    ) : (
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500 font-bold text-lg">
                        {(bank.bankName || 'B')[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-slate-900">{bank.bankName || 'Bank'}</h3>
                      {bank.preApprovalAvailable && <p className="text-xs text-green-600">Pre-approval available</p>}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Interest Rate</span>
                      <span className="font-medium text-slate-900">
                        {bank.minInterestRate || '8.5'}% - {bank.maxInterestRate || '9.5'}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Max Tenure</span>
                      <span className="font-medium text-slate-900">{bank.maxTenureMonths ? Math.round(bank.maxTenureMonths / 12) : 30} Years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Processing Fee</span>
                      <span className="font-medium text-slate-900">
                        {bank.processingFeePercent ? `${bank.processingFeePercent}%` : '0.5%'}
                        {bank.processingFeeCapPaise ? ` (max ${formatPaise(bank.processingFeeCapPaise)})` : ' + GST'}
                      </span>
                    </div>
                    {bank.maxLoanAmountPaise && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Max Loan</span>
                        <span className="font-medium text-slate-900">{formatPaise(bank.maxLoanAmountPaise)}</span>
                      </div>
                    )}
                    {bank.balanceTransferAvailable && (
                      <div className="text-xs text-blue-600 mt-1">Balance transfer available</div>
                    )}
                  </div>
                  {token ? (
                    <button onClick={() => { setApplyBank(bank); setApplyForm({ loanAmount: '', tenure: '20', name: '', phone: '', email: '' }); setApplySuccess(false); }}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                      Apply Now
                    </button>
                  ) : (
                    <Link href="/auth" className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                      Sign in to Apply
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Apply Modal */}
      {applyBank && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !applyLoading && setApplyBank(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            {applySuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Application Submitted!</h3>
                <p className="text-sm text-gray-500">Your home loan application to {applyBank.bankName} has been submitted. You can track it in "My Applications".</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Apply for Home Loan</h3>
                    <p className="text-sm text-gray-500">{applyBank.bankName} - {applyBank.minInterestRate}% onwards</p>
                  </div>
                  <button onClick={() => setApplyBank(null)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount (INR)</label>
                    <input type="number" value={applyForm.loanAmount} onChange={(e) => setApplyForm({ ...applyForm, loanAmount: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g. 5000000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tenure (Years)</label>
                    <select value={applyForm.tenure} onChange={(e) => setApplyForm({ ...applyForm, tenure: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm">
                      {[5, 10, 15, 20, 25, 30].map((y) => <option key={y} value={String(y)}>{y} Years</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" value={applyForm.name} onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="tel" value={applyForm.phone} onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" placeholder="10-digit mobile number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={applyForm.email} onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" placeholder="your@email.com" />
                  </div>
                </div>
                <button onClick={handleApply}
                  disabled={applyLoading || !applyForm.loanAmount || !applyForm.name || !applyForm.phone || !applyForm.email}
                  className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                  {applyLoading ? 'Submitting...' : 'Submit Application'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
