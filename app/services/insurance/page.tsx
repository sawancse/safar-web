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
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Insurance & Loans</h1>
        <p className="text-gray-600 mt-2">Protect what matters and fund your goals — powered by trusted partners.</p>
        <Link href="/services/insurance/claims" className="inline-block mt-3 text-sm text-orange-600 font-medium hover:underline">🛟 Need to file a claim? Get claims assistance →</Link>
      </div>

      {result && (
        <div className="mb-8 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800 flex flex-wrap items-center justify-between gap-2">
          <span>✅ Policy <b>{result.policyRef}</b> issued. Premium {inr(result.premiumPaise)}. A copy has been emailed to you.</span>
          <a href={`${API_BASE}/api/v1/insurance/certificate/${result.policyRef}`} target="_blank" rel="noreferrer"
            className="rounded-lg bg-green-700 text-white px-4 py-1.5 text-sm font-medium hover:bg-green-800">View certificate</a>
        </div>
      )}

      {/* Insurance */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Insurance</h2>
      {loading ? <p className="text-gray-500">Loading…</p> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {insurance.map(p => {
            const q = quotes[p.key];
            const compareKey = p.coverageType ? COMPARE_PRODUCT[p.coverageType] : undefined;
            return (
              <div key={p.key} className="rounded-2xl border border-gray-200 p-5 hover:shadow-md transition bg-white flex flex-col">
                <h3 className="font-semibold text-gray-900">{p.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{p.tagline}</p>
                <ul className="mt-3 space-y-1 flex-1">
                  {p.highlights.map((h, i) => <li key={i} className="text-xs text-gray-500 flex gap-1"><span className="text-orange-500">✓</span>{h}</li>)}
                </ul>
                {compareKey ? (
                  <Link href={`/services/insurance/compare?product=${compareKey}`}
                    className="mt-4 w-full rounded-lg bg-orange-600 text-white py-2 text-sm font-medium hover:bg-orange-700 text-center">
                    Compare plans →
                  </Link>
                ) : q ? (
                  <div className="mt-4">
                    <p className="text-sm text-gray-700">From <b className="text-lg text-gray-900">{inr(q.premiumPaise)}</b> · cover {inr(q.sumInsuredPaise)}</p>
                    <button onClick={() => { setBuyFor(p); setResult(null); }}
                      className="mt-2 w-full rounded-lg bg-orange-600 text-white py-2 text-sm font-medium hover:bg-orange-700">Buy now</button>
                  </div>
                ) : (
                  <button onClick={() => getQuote(p)} disabled={quoting === p.key}
                    className="mt-4 w-full rounded-lg border border-orange-600 text-orange-600 py-2 text-sm font-medium hover:bg-orange-50 disabled:opacity-50">
                    {quoting === p.key ? 'Getting price…' : 'Get price'}</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Loans */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Loans</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
        {loans.map(p => (
          <Link key={p.key} href={p.applyPath || '#'}
            className="rounded-2xl border border-gray-200 p-5 hover:shadow-md transition bg-white block">
            <h3 className="font-semibold text-gray-900">{p.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{p.tagline}</p>
            <ul className="mt-3 space-y-1">
              {p.highlights.map((h, i) => <li key={i} className="text-xs text-gray-500 flex gap-1"><span className="text-blue-500">✓</span>{h}</li>)}
            </ul>
            <span className="mt-3 inline-block text-sm text-blue-600 font-medium">Apply →</span>
          </Link>
        ))}
      </div>

      {/* My policies */}
      {policies.length > 0 && (
        <>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Policies</h2>
          <div className="space-y-2">
            {policies.map((pol, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-3 flex justify-between text-sm bg-white">
                <span className="font-medium">{pol.policyRef} · {pol.coverageType}</span>
                <span className="text-gray-600">{pol.status} · {pol.premiumPaise ? inr(pol.premiumPaise) : ''}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Buy modal */}
      {buyFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setBuyFor(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg text-gray-900">Buy {buyFor.title}</h3>
            <p className="text-sm text-gray-600 mt-1">Premium {quotes[buyFor.key] ? inr(quotes[buyFor.key].premiumPaise) : ''}</p>
            <div className="mt-4 space-y-3">
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Full name"
                value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Email" type="email"
                value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Phone"
                value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} />
            </div>
            <button onClick={confirmBuy} disabled={buying || !form.fullName || !form.contactEmail || !form.contactPhone}
              className="mt-5 w-full rounded-lg bg-orange-600 text-white py-2.5 font-medium hover:bg-orange-700 disabled:opacity-50">
              {buying ? 'Processing…' : 'Confirm & pay'}</button>
            <p className="text-[11px] text-gray-400 mt-2 text-center">Sandbox mode — no real charge. IRDAI-compliant partner flow when live.</p>
          </div>
        </div>
      )}
    </div>
  );
}
