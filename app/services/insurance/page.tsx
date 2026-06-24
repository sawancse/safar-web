'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

type Product = {
  key: string; category: string; coverageType: string | null;
  title: string; tagline: string; highlights: string[]; applyPath: string | null;
};
type Quote = { quoteId: string; premiumPaise: number; sumInsuredPaise: number; currency: string; coverageHighlights: string[] };

const inr = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const API_BASE = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:8080';

function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) return resolve();
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(s);
  });
}

// Products with a full PolicyBazaar-style compare journey
const COMPARE_PRODUCT: Record<string, string> = {
  HEALTH: 'health', LIFE_TERM: 'term', MOTOR: 'motor', INTERNATIONAL_TRAVEL: 'travel',
};

// ── Line-icons keyed by coverage type / loan key ──────────────────────────────
const svgProps = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function CoverIcon({ type, className = 'w-6 h-6' }: { type: string | null; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...svgProps}>
      {type === 'HEALTH' && <path d="M3 12h3l2-5 4 10 2-5h7" />}
      {type === 'LIFE_TERM' && <path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3zM9.2 12l1.9 1.9L15 10" />}
      {type === 'MOTOR' && <><path d="M5 13l1.6-4.4A2 2 0 018.5 7h7a2 2 0 011.9 1.4L19 13v4h-2m-10 0H5v-4m0 0h14" /><circle cx="7.5" cy="17" r="1.4" /><circle cx="16.5" cy="17" r="1.4" /></>}
      {type === 'INTERNATIONAL_TRAVEL' && <path d="M3 13.5l18-7.5-7.5 18-2.5-7.5L3 13.5z" />}
      {type === 'HOME' && <path d="M4 11l8-6 8 6M6 10v9h12v-9" />}
      {type === 'PERSONAL_ACCIDENT' && <><path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z" /><path d="M12 9v6M9 12h6" /></>}
      {type === 'TENANT_CONTENTS' && <><path d="M4 11l8-6 8 6M6 10v9h12v-9" /><path d="M11 19v-4h2v4" /></>}
      {!type && <><path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z" /><path d="M9.2 12l1.9 1.9L15 10" /></>}
    </svg>
  );
}

function LoanIcon({ k, className = 'w-6 h-6' }: { k: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...svgProps}>
      {k === 'home-loan' && <><path d="M4 11l8-6 8 6M6 10v9h12v-9" /><path d="M10 14h4" /></>}
      {k === 'personal-loan' && <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 14h2" /></>}
      {k === 'business-loan' && <><rect x="3" y="8" width="18" height="11" rx="2" /><path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2" /></>}
      {k === 'lap' && <><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-5h6v5M9 11h.01M15 11h.01" /></>}
      {!['home-loan', 'personal-loan', 'business-loan', 'lap'].includes(k) && <><path d="M3 21h18M5 21V10l7-5 7 5v11" /><path d="M9 21v-6h6v6" /></>}
    </svg>
  );
}

const TRUST = [
  { t: 'IRDAI-registered partners', d: 'Policies underwritten by licensed insurers', icon: 'M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3zM9.2 12l1.9 1.9L15 10' },
  { t: 'Cashless claims support', d: 'Help every step, from filing to payout', icon: 'M12 8v8M8 12h8M4 4h16v16H4z' },
  { t: '100% paperless', d: 'Quote, buy and store policies online', icon: 'M7 8h10M7 12h6M5 3h9l5 5v13H5z' },
  { t: 'Pay only on cover', d: 'No charge until your policy is issued', icon: 'M3 10h18M3 6h18v12H3zM7 15h4' },
];

const STEPS = [
  { n: '1', t: 'Tell us a little', d: 'Share a few details — age, city or trip. No paperwork.' },
  { n: '2', t: 'Compare real plans', d: 'See premiums, cover, claim ratios and cashless networks side by side.' },
  { n: '3', t: 'Buy & get covered', d: 'Pay securely and your certificate lands in your inbox instantly.' },
];

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700', ISSUED: 'bg-green-100 text-green-700',
  PENDING_PAYMENT: 'bg-amber-100 text-amber-700', CANCELLED: 'bg-gray-200 text-gray-600',
  REFUNDED: 'bg-blue-100 text-blue-700', EXPIRED: 'bg-gray-200 text-gray-600',
};

export default function InsuranceLoansHub() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [quoting, setQuoting] = useState<string | null>(null);
  const [buyFor, setBuyFor] = useState<Product | null>(null);
  const [form, setForm] = useState({ fullName: '', contactEmail: '', contactPhone: '' });
  const [buying, setBuying] = useState(false);
  const [result, setResult] = useState<{ policyRef: string; premiumPaise: number } | null>(null);
  const [policies, setPolicies] = useState<any[]>([]);
  const [advisorOpen, setAdvisorOpen] = useState(false);

  useEffect(() => {
    api.getInsuranceProducts().then(setProducts).catch(() => setProducts([])).finally(() => setLoading(false));
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) api.getMyInsurancePolicies(token).then(r => setPolicies(r.content || [])).catch(() => {});
  }, []);

  const insurance = products.filter(p => p.category === 'INSURANCE');
  const loans = products.filter(p => p.category === 'LOAN');

  async function getQuote(p: Product) {
    if (!p.coverageType) return;
    setQuoting(p.key);
    try {
      const q = await api.quoteInsurance({ coverageType: p.coverageType });
      setQuotes(prev => ({ ...prev, [p.key]: q }));
    } catch { /* ignore */ } finally { setQuoting(null); }
  }

  function finishBuy(res: { policyRef: string; premiumPaise: number }, token: string) {
    setResult({ policyRef: res.policyRef, premiumPaise: res.premiumPaise });
    setBuyFor(null);
    setBuying(false);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    api.getMyInsurancePolicies(token).then(r => setPolicies(r.content || [])).catch(() => {});
  }

  async function confirmBuy() {
    if (!buyFor?.coverageType) return;
    const token = localStorage.getItem('access_token');
    if (!token) { window.location.href = '/auth?redirect=/services/insurance'; return; }
    setBuying(true);
    try {
      const order = await api.createInsuranceOrder({
        quoteId: quotes[buyFor.key]?.quoteId,
        coverageType: buyFor.coverageType,
        fullName: form.fullName, contactEmail: form.contactEmail, contactPhone: form.contactPhone,
      }, token);
      if (order.razorpayEnabled && order.razorpayOrderId) {
        await loadRazorpay();
        const rzp = new (window as any).Razorpay({
          key: order.razorpayKeyId,
          amount: order.amountPaise,
          currency: 'INR',
          name: 'BhramanKaro',
          description: buyFor.title,
          order_id: order.razorpayOrderId,
          prefill: { name: form.fullName, email: form.contactEmail, contact: form.contactPhone },
          theme: { color: '#f97316' },
          handler: async (response: any) => {
            try {
              const res = await api.confirmInsurancePayment({
                policyId: order.policyId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }, token);
              finishBuy(res, token);
            } catch { alert('Payment verification failed. Please contact support.'); setBuying(false); }
          },
          modal: { ondismiss: () => setBuying(false) },
        });
        rzp.open();
      } else {
        const res = await api.confirmInsurancePayment({ policyId: order.policyId }, token);
        finishBuy(res, token);
      }
    } catch { alert('Could not complete purchase. Please try again.'); setBuying(false); }
  }

  return (
    <div className="bg-gradient-to-b from-orange-50/40 to-white min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">

        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 text-white px-6 py-10 sm:px-10 sm:py-14">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute -right-8 -top-8 w-64 h-64 text-white/10" {...svgProps} aria-hidden>
            <path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z" />
          </svg>
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium tracking-wide">
              <CoverIcon type={null} className="w-4 h-4" /> BhramanKaro Protect
            </span>
            <h1 className="mt-4 text-3xl sm:text-[2.6rem] font-bold leading-tight">
              Insurance &amp; loans, the simple way
            </h1>
            <p className="mt-3 text-orange-50 text-base sm:text-lg">
              Compare plans from trusted insurers, buy in minutes, and keep every policy in one place — right alongside your travel and home on BhramanKaro.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#insurance" className="rounded-xl bg-white text-orange-700 px-5 py-2.5 text-sm font-semibold hover:bg-orange-50 transition">
                Explore plans
              </a>
              <button onClick={() => setAdvisorOpen(true)}
                className="rounded-xl bg-white/15 backdrop-blur border border-white/30 px-5 py-2.5 text-sm font-semibold hover:bg-white/25 transition">
                Talk to an advisor
              </button>
            </div>
            <Link href="/services/insurance/claims" className="mt-5 inline-flex items-center gap-1.5 text-sm text-orange-50 hover:text-white">
              <CoverIcon type="PERSONAL_ACCIDENT" className="w-4 h-4" /> Need to file a claim? Get assistance →
            </Link>
          </div>
        </section>

        {/* ── Trust strip ────────────────────────────────────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          {TRUST.map((t) => (
            <div key={t.t} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl bg-orange-50 text-orange-600">
                <svg viewBox="0 0 24 24" className="w-5 h-5" {...svgProps}><path d={t.icon} /></svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-snug">{t.t}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.d}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── Success banner ─────────────────────────────────────── */}
        {result && (
          <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800 flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white text-sm">✓</span>
              Policy <b>{result.policyRef}</b> issued · premium {inr(result.premiumPaise)}. A copy is on its way to your inbox.
            </span>
            <a href={`${API_BASE}/api/v1/insurance/certificate/${result.policyRef}`} target="_blank" rel="noreferrer"
              className="rounded-lg bg-green-700 text-white px-4 py-1.5 text-sm font-medium hover:bg-green-800">View certificate</a>
          </div>
        )}

        {/* ── Insurance ──────────────────────────────────────────── */}
        <section id="insurance" className="mt-12 scroll-mt-20">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">Cover what matters</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">Insurance</h2>
            </div>
            <span className="hidden sm:block text-sm text-gray-400">{insurance.length} plans</span>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-gray-100" />
                  <div className="h-4 bg-gray-100 rounded mt-4 w-2/3" />
                  <div className="h-3 bg-gray-100 rounded mt-2 w-full" />
                  <div className="h-9 bg-gray-100 rounded-lg mt-6" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
              {insurance.map(p => {
                const q = quotes[p.key];
                const compareKey = p.coverageType ? COMPARE_PRODUCT[p.coverageType] : undefined;
                return (
                  <div key={p.key} className="group relative rounded-2xl border border-gray-200 bg-white p-5 flex flex-col hover:shadow-lg hover:border-orange-200 transition">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition">
                      <CoverIcon type={p.coverageType} className="w-6 h-6" />
                    </span>
                    <h3 className="font-semibold text-gray-900 mt-4">{p.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{p.tagline}</p>
                    <ul className="mt-3 space-y-1.5 flex-1">
                      {p.highlights.map((h, i) => (
                        <li key={i} className="text-xs text-gray-500 flex gap-1.5"><span className="text-orange-500 mt-px">✓</span>{h}</li>
                      ))}
                    </ul>
                    {compareKey ? (
                      <Link href={`/services/insurance/compare?product=${compareKey}`}
                        className="mt-4 w-full rounded-xl bg-orange-600 text-white py-2.5 text-sm font-semibold hover:bg-orange-700 text-center transition">
                        Compare plans →
                      </Link>
                    ) : q ? (
                      <div className="mt-4">
                        <p className="text-sm text-gray-700">From <b className="text-lg text-gray-900">{inr(q.premiumPaise)}</b> · cover {inr(q.sumInsuredPaise)}</p>
                        <button onClick={() => { setBuyFor(p); setResult(null); }}
                          className="mt-2 w-full rounded-xl bg-orange-600 text-white py-2.5 text-sm font-semibold hover:bg-orange-700 transition">Buy now</button>
                      </div>
                    ) : (
                      <button onClick={() => getQuote(p)} disabled={quoting === p.key}
                        className="mt-4 w-full rounded-xl border border-orange-600 text-orange-600 py-2.5 text-sm font-semibold hover:bg-orange-50 disabled:opacity-50 transition">
                        {quoting === p.key ? 'Getting price…' : 'Get price'}</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── How it works ───────────────────────────────────────── */}
        <section className="mt-14 rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">Three quiet steps</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">Covered before your chai goes cold</h2>
          <div className="grid sm:grid-cols-3 gap-6 mt-6">
            {STEPS.map((s) => (
              <div key={s.n} className="relative">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-600 text-white font-bold">{s.n}</span>
                <h3 className="font-semibold text-gray-900 mt-3">{s.t}</h3>
                <p className="text-sm text-gray-500 mt-1">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Loans ──────────────────────────────────────────────── */}
        <section id="loans" className="mt-14 scroll-mt-20">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Fund your goals</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">Loans</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
            {loans.map(p => (
              <Link key={p.key} href={p.applyPath || '#'}
                className="group rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-lg hover:border-blue-200 transition block">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                  <LoanIcon k={p.key} className="w-6 h-6" />
                </span>
                <h3 className="font-semibold text-gray-900 mt-4">{p.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{p.tagline}</p>
                <ul className="mt-3 space-y-1.5">
                  {p.highlights.map((h, i) => (
                    <li key={i} className="text-xs text-gray-500 flex gap-1.5"><span className="text-blue-500 mt-px">✓</span>{h}</li>
                  ))}
                </ul>
                <span className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 font-semibold group-hover:gap-2 transition-all">Apply →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── My policies ────────────────────────────────────────── */}
        {policies.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-bold text-gray-900">My policies</h2>
            <div className="grid sm:grid-cols-2 gap-3 mt-5">
              {policies.map((pol, i) => (
                <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 text-gray-500">
                      <CoverIcon type={pol.coverageType} className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{pol.policyRef}</p>
                      <p className="text-xs text-gray-500">{(pol.coverageType || '').replace(/_/g, ' ')}{pol.premiumPaise ? ` · ${inr(pol.premiumPaise)}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[pol.status] || 'bg-gray-100 text-gray-600'}`}>{pol.status}</span>
                    {pol.policyRef && (
                      <a href={`${API_BASE}/api/v1/insurance/certificate/${pol.policyRef}`} target="_blank" rel="noreferrer"
                        className="text-xs text-orange-600 font-medium hover:underline">View</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Claims band ────────────────────────────────────────── */}
        <section className="mt-14 rounded-3xl bg-gray-900 text-white p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Already insured with us?</h2>
            <p className="text-gray-300 text-sm mt-1">File a claim or get help — our team walks you through it end to end.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/services/insurance/claims" className="rounded-xl bg-white text-gray-900 px-5 py-2.5 text-sm font-semibold hover:bg-gray-100 transition">File a claim</Link>
            <button onClick={() => setAdvisorOpen(true)} className="rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold hover:bg-white/10 transition">Talk to advisor</button>
          </div>
        </section>
      </div>

      {/* ── Buy modal ────────────────────────────────────────────── */}
      {buyFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setBuyFor(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-orange-50 text-orange-600">
                <CoverIcon type={buyFor.coverageType} className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Buy {buyFor.title}</h3>
                <p className="text-sm text-gray-600">Premium {quotes[buyFor.key] ? inr(quotes[buyFor.key].premiumPaise) : ''}</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" placeholder="Full name"
                value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" placeholder="Email" type="email"
                value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} />
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" placeholder="Phone"
                value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} />
            </div>
            <button onClick={confirmBuy} disabled={buying || !form.fullName || !form.contactEmail || !form.contactPhone}
              className="mt-5 w-full rounded-xl bg-orange-600 text-white py-2.5 font-semibold hover:bg-orange-700 disabled:opacity-50 transition">
              {buying ? 'Processing…' : 'Confirm & pay'}</button>
            <p className="text-[11px] text-gray-400 mt-2 text-center">Sandbox mode — no real charge. IRDAI-compliant partner flow when live.</p>
          </div>
        </div>
      )}

      {advisorOpen && <AdvisorModal onClose={() => setAdvisorOpen(false)} />}
    </div>
  );
}

function AdvisorModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: '', phone: '', preferredTime: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function submit() {
    setBusy(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || undefined : undefined;
      await api.insuranceAdvisorCallback({ ...form, product: 'general', coverageType: 'HEALTH', city: '' }, token);
      setDone(true);
    } catch { alert('Could not submit. Please try again.'); } finally { setBusy(false); }
  }
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 text-green-600 text-2xl">✓</div>
            <h3 className="font-semibold text-lg text-gray-900 mt-3">We'll call you back</h3>
            <p className="text-sm text-gray-600 mt-1">An insurance advisor will reach out shortly.</p>
            <button onClick={onClose} className="mt-5 w-full rounded-xl bg-orange-600 text-white py-2.5 font-semibold hover:bg-orange-700">Done</button>
          </div>
        ) : (
          <>
            <h3 className="font-semibold text-lg text-gray-900">Talk to an advisor</h3>
            <p className="text-sm text-gray-600 mt-1">Free, no-obligation guidance on the right plan for you.</p>
            <div className="mt-4 space-y-3">
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" placeholder="Phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" placeholder="Preferred time (e.g. Today 6–8 PM)" value={form.preferredTime} onChange={e => setForm({ ...form, preferredTime: e.target.value })} />
            </div>
            <button onClick={submit} disabled={busy || !form.name || !form.phone}
              className="mt-5 w-full rounded-xl bg-orange-600 text-white py-2.5 font-semibold hover:bg-orange-700 disabled:opacity-50 transition">
              {busy ? 'Submitting…' : 'Request callback'}</button>
          </>
        )}
      </div>
    </div>
  );
}
