'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, type InsurancePlan } from '@/lib/api';

const inr = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

type ProductKey = 'health' | 'term' | 'motor' | 'travel';
const PRODUCTS: Record<ProductKey, { title: string; coverageType: string; icon: string }> = {
  health: { title: 'Health Insurance', coverageType: 'HEALTH', icon: '🏥' },
  term: { title: 'Term Life Insurance', coverageType: 'LIFE_TERM', icon: '🛡️' },
  motor: { title: 'Car & Bike Insurance', coverageType: 'MOTOR', icon: '🚗' },
  travel: { title: 'Travel Insurance', coverageType: 'INTERNATIONAL_TRAVEL', icon: '✈️' },
};

function CompareInner() {
  const params = useSearchParams();
  const product = (params.get('product') as ProductKey) || 'health';
  const cfg = PRODUCTS[product] || PRODUCTS.health;

  const [step, setStep] = useState<'form' | 'results'>('form');
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [sortBy, setSortBy] = useState<'premium' | 'claim' | 'cover'>('premium');
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, string[]>>({});
  const [buyFor, setBuyFor] = useState<InsurancePlan | null>(null);
  const [advisorOpen, setAdvisorOpen] = useState(false);

  // form state (product-specific)
  const [members, setMembers] = useState<number[]>([30]);            // health/travel ages
  const [age, setAge] = useState(30);                                // term/motor
  const [smoker, setSmoker] = useState(false);                       // term
  const [income, setIncome] = useState('');                          // term
  const [tenureYears, setTenureYears] = useState(1);                 // term/health
  const [city, setCity] = useState('');                              // health/motor
  const [preExisting, setPreExisting] = useState(false);            // health
  const [regNo, setRegNo] = useState('');                            // motor
  const [makeModel, setMakeModel] = useState('');                    // motor
  const [destination, setDestination] = useState('');               // travel
  const [tripStart, setTripStart] = useState('');                   // travel
  const [tripEnd, setTripEnd] = useState('');                       // travel
  const [intl, setIntl] = useState(true);                            // travel

  useEffect(() => { setStep('form'); setPlans([]); }, [product]);

  async function loadPlans() {
    setLoading(true);
    try {
      let ages: number[] = [age];
      let tenureDays = tenureYears * 365;
      let coverageType = cfg.coverageType;
      if (product === 'health') ages = members;
      if (product === 'travel') {
        ages = members;
        coverageType = intl ? 'INTERNATIONAL_TRAVEL' : 'DOMESTIC_TRAVEL';
        if (tripStart && tripEnd) {
          const d = Math.ceil((new Date(tripEnd).getTime() - new Date(tripStart).getTime()) / 86400000);
          if (d > 0) tenureDays = d;
        }
      }
      const res = await api.compareInsurance({ coverageType, tenureDays, ages });
      setPlans(res.plans || []);
      setStep('results');
    } catch { alert('Could not fetch plans. Please try again.'); } finally { setLoading(false); }
  }

  const sorted = useMemo(() => {
    const arr = [...plans];
    arr.sort((a, b) => {
      if (sortBy === 'premium') return a.premiumPaise - b.premiumPaise;
      if (sortBy === 'cover') return b.sumInsuredPaise - a.sumInsuredPaise;
      return (b.claimSettlementRatio || 0) - (a.claimSettlementRatio || 0);
    });
    return arr;
  }, [plans, sortBy]);

  function toggleAddOn(planId: string, code: string) {
    setSelectedAddOns((prev) => {
      const cur = prev[planId] || [];
      return { ...prev, [planId]: cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code] };
    });
  }
  function planTotal(p: InsurancePlan) {
    const codes = selectedAddOns[p.quoteId] || [];
    const add = p.addOns.filter((a) => codes.includes(a.code)).reduce((s, a) => s + a.premiumPaise, 0);
    return p.premiumPaise + add;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{cfg.icon}</span>
        <h1 className="text-2xl font-bold text-gray-900">{cfg.title}</h1>
      </div>
      <p className="text-gray-500 text-sm mb-6">Compare plans from top insurers · powered by BhramanKaro partners</p>

      {/* Product tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {(Object.keys(PRODUCTS) as ProductKey[]).map((k) => (
          <a key={k} href={`/services/insurance/compare?product=${k}`}
             className={`px-4 py-2 rounded-full text-sm font-medium border transition ${k === product ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-700 border-gray-200 hover:border-orange-400'}`}>
            {PRODUCTS[k].icon} {PRODUCTS[k].title.split(' ')[0]}
          </a>
        ))}
      </div>

      {step === 'form' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-2xl">
          <h2 className="font-semibold text-gray-900 mb-4">Tell us a few details</h2>
          <div className="space-y-4">
            {product === 'health' && (
              <>
                <label className="block text-sm text-gray-600">Members & ages
                  <div className="flex flex-wrap gap-2 mt-2">
                    {members.map((m, i) => (
                      <input key={i} type="number" min={0} max={99} value={m}
                        onChange={(e) => setMembers(members.map((x, j) => j === i ? +e.target.value : x))}
                        className="w-20 border rounded-lg px-2 py-1.5 text-sm" />
                    ))}
                    {members.length < 6 && <button onClick={() => setMembers([...members, 25])} className="px-3 py-1.5 text-sm rounded-lg border border-dashed border-orange-400 text-orange-600">+ Add</button>}
                    {members.length > 1 && <button onClick={() => setMembers(members.slice(0, -1))} className="px-3 py-1.5 text-sm rounded-lg border text-gray-500">− Remove</button>}
                  </div>
                </label>
                <Field label="City"><input value={city} onChange={(e) => setCity(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Bengaluru" /></Field>
                <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={preExisting} onChange={(e) => setPreExisting(e.target.checked)} /> Any pre-existing conditions</label>
              </>
            )}
            {product === 'term' && (
              <>
                <Field label="Age"><input type="number" value={age} onChange={(e) => setAge(+e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></Field>
                <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={smoker} onChange={(e) => setSmoker(e.target.checked)} /> Do you smoke?</label>
                <Field label="Annual income (₹)"><input value={income} onChange={(e) => setIncome(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 1200000" /></Field>
                <Field label="Cover tenure (years)"><input type="number" value={tenureYears} onChange={(e) => setTenureYears(+e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></Field>
              </>
            )}
            {product === 'motor' && (
              <>
                <Field label="Registration number"><input value={regNo} onChange={(e) => setRegNo(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. KA01AB1234" /></Field>
                <Field label="Make & model"><input value={makeModel} onChange={(e) => setMakeModel(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Maruti Swift VXI" /></Field>
                <Field label="City"><input value={city} onChange={(e) => setCity(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Pune" /></Field>
              </>
            )}
            {product === 'travel' && (
              <>
                <div className="flex gap-2">
                  <button onClick={() => setIntl(true)} className={`px-3 py-1.5 rounded-lg text-sm border ${intl ? 'bg-orange-50 border-orange-400 text-orange-700' : 'border-gray-200'}`}>International</button>
                  <button onClick={() => setIntl(false)} className={`px-3 py-1.5 rounded-lg text-sm border ${!intl ? 'bg-orange-50 border-orange-400 text-orange-700' : 'border-gray-200'}`}>Domestic</button>
                </div>
                <Field label="Destination"><input value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Thailand" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="From"><input type="date" value={tripStart} onChange={(e) => setTripStart(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></Field>
                  <Field label="To"><input type="date" value={tripEnd} onChange={(e) => setTripEnd(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></Field>
                </div>
                <label className="block text-sm text-gray-600">Traveller ages
                  <div className="flex flex-wrap gap-2 mt-2">
                    {members.map((m, i) => (
                      <input key={i} type="number" min={0} max={99} value={m}
                        onChange={(e) => setMembers(members.map((x, j) => j === i ? +e.target.value : x))}
                        className="w-20 border rounded-lg px-2 py-1.5 text-sm" />
                    ))}
                    {members.length < 6 && <button onClick={() => setMembers([...members, 25])} className="px-3 py-1.5 text-sm rounded-lg border border-dashed border-orange-400 text-orange-600">+ Add</button>}
                  </div>
                </label>
              </>
            )}
          </div>
          <button onClick={loadPlans} disabled={loading}
            className="mt-6 w-full rounded-lg bg-orange-600 text-white py-2.5 font-medium hover:bg-orange-700 disabled:opacity-50">
            {loading ? 'Finding best plans…' : 'See plans'}
          </button>
        </div>
      )}

      {step === 'results' && (
        <>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <p className="text-sm text-gray-600"><b>{sorted.length}</b> plans found{sorted[0]?.sandbox && <span className="ml-2 text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Demo data</span>}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Sort by</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="border rounded-lg px-2 py-1.5">
                <option value="premium">Lowest premium</option>
                <option value="claim">Claim ratio</option>
                <option value="cover">Highest cover</option>
              </select>
              <button onClick={() => setStep('form')} className="ml-2 text-orange-600 font-medium">Edit details</button>
            </div>
          </div>

          <div className="space-y-4">
            {sorted.map((p) => {
              const codes = selectedAddOns[p.quoteId] || [];
              return (
                <div key={p.quoteId} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition">
                  <div className="grid md:grid-cols-[1fr_auto] gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{p.planName}</h3>
                        {p.recommended && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">RECOMMENDED</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{p.insurer}{p.tagline ? ` · ${p.tagline}` : ''}</p>
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-600">
                        <span>Cover <b className="text-gray-900">{inr(p.sumInsuredPaise)}</b></span>
                        {p.claimSettlementRatio != null && <span>Claims settled <b className="text-gray-900">{p.claimSettlementRatio}%</b></span>}
                        {p.cashlessCount != null && <span><b className="text-gray-900">{p.cashlessCount.toLocaleString('en-IN')}</b> cashless</span>}
                        {p.insurerRating != null && <span>★ <b className="text-gray-900">{p.insurerRating}</b></span>}
                      </div>
                      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                        {p.features.slice(0, 4).map((f, i) => <li key={i} className="text-[11px] text-gray-500 flex gap-1"><span className="text-orange-500">✓</span>{f}</li>)}
                      </ul>
                      {p.addOns.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-[11px] font-semibold text-gray-400 uppercase mb-1.5">Add-ons</p>
                          <div className="flex flex-wrap gap-3">
                            {p.addOns.map((a) => (
                              <label key={a.code} className="flex items-center gap-1.5 text-xs text-gray-700">
                                <input type="checkbox" checked={codes.includes(a.code)} onChange={() => toggleAddOn(p.quoteId, a.code)} />
                                {a.label} <span className="text-gray-400">+{inr(a.premiumPaise)}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right md:min-w-[160px] flex md:flex-col items-center md:items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{inr(planTotal(p))}</p>
                        <p className="text-[11px] text-gray-400">premium{codes.length ? ' incl. add-ons' : ''}</p>
                      </div>
                      <button onClick={() => setBuyFor(p)} className="mt-2 rounded-lg bg-orange-600 text-white px-6 py-2 text-sm font-medium hover:bg-orange-700">Buy now</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Floating advisor button */}
      <button onClick={() => setAdvisorOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-blue-600 text-white shadow-lg px-5 py-3 text-sm font-medium hover:bg-blue-700">
        📞 Talk to an advisor
      </button>

      {buyFor && <BuyModal plan={buyFor} addOnCodes={selectedAddOns[buyFor.quoteId] || []} coverageType={product === 'travel' ? (intl ? 'INTERNATIONAL_TRAVEL' : 'DOMESTIC_TRAVEL') : cfg.coverageType} total={planTotal(buyFor)} onClose={() => setBuyFor(null)} />}
      {advisorOpen && <AdvisorModal product={product} coverageType={cfg.coverageType} city={city} onClose={() => setAdvisorOpen(false)} />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm text-gray-600">{label}<div className="mt-1">{children}</div></label>;
}

function BuyModal({ plan, addOnCodes, coverageType, total, onClose }: { plan: InsurancePlan; addOnCodes: string[]; coverageType: string; total: number; onClose: () => void }) {
  const [form, setForm] = useState({ fullName: '', contactEmail: '', contactPhone: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ policyRef: string } | null>(null);
  async function submit() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) { window.location.href = '/auth?redirect=/services/insurance/compare'; return; }
    setBusy(true);
    try {
      const res = await api.buyInsurance({ quoteId: plan.quoteId, coverageType, addOnCodes, ...form }, token);
      setDone({ policyRef: res.policyRef });
    } catch { alert('Could not complete purchase. Please try again.'); } finally { setBusy(false); }
  }
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="font-semibold text-lg text-gray-900">Policy {done.policyRef} issued</h3>
            <p className="text-sm text-gray-600 mt-1">Your certificate has been emailed to you.</p>
            <button onClick={onClose} className="mt-5 w-full rounded-lg bg-orange-600 text-white py-2.5 font-medium">Done</button>
          </div>
        ) : (
          <>
            <h3 className="font-semibold text-lg text-gray-900">Buy {plan.planName}</h3>
            <p className="text-sm text-gray-600 mt-1">{plan.insurer} · Premium {inr(total)}</p>
            <div className="mt-4 space-y-3">
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            </div>
            <button onClick={submit} disabled={busy || !form.fullName || !form.contactEmail || !form.contactPhone}
              className="mt-5 w-full rounded-lg bg-orange-600 text-white py-2.5 font-medium hover:bg-orange-700 disabled:opacity-50">
              {busy ? 'Processing…' : 'Confirm & pay'}
            </button>
            <p className="text-[11px] text-gray-400 mt-2 text-center">{plan.sandbox ? 'Sandbox mode — no real charge. IRDAI-compliant partner flow when live.' : 'Secured by BhramanKaro insurance partner.'}</p>
          </>
        )}
      </div>
    </div>
  );
}

function AdvisorModal({ product, coverageType, city, onClose }: { product: string; coverageType: string; city: string; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', phone: '', preferredTime: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function submit() {
    setBusy(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || undefined : undefined;
      await api.insuranceAdvisorCallback({ ...form, product, coverageType, city }, token);
      setDone(true);
    } catch { alert('Could not submit. Please try again.'); } finally { setBusy(false); }
  }
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">📞</div>
            <h3 className="font-semibold text-lg text-gray-900">We'll call you back</h3>
            <p className="text-sm text-gray-600 mt-1">An insurance advisor will reach out shortly.</p>
            <button onClick={onClose} className="mt-5 w-full rounded-lg bg-blue-600 text-white py-2.5 font-medium">Done</button>
          </div>
        ) : (
          <>
            <h3 className="font-semibold text-lg text-gray-900">Talk to an advisor</h3>
            <p className="text-sm text-gray-600 mt-1">Free, no-obligation guidance on the best plan for you.</p>
            <div className="mt-4 space-y-3">
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Preferred time (e.g. Today 6–8 PM)" value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })} />
            </div>
            <button onClick={submit} disabled={busy || !form.name || !form.phone}
              className="mt-5 w-full rounded-lg bg-blue-600 text-white py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50">
              {busy ? 'Submitting…' : 'Request callback'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-10 text-gray-500">Loading…</div>}>
      <CompareInner />
    </Suspense>
  );
}
