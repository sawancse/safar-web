'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

const STEPS = [
  { icon: '📞', title: 'Intimate the claim', body: 'Tell us as soon as the event happens. Share your policy reference and what occurred — we notify the insurer and open your claim.' },
  { icon: '📄', title: 'Submit documents', body: 'Upload bills, reports, ID and policy proof. Our team checks completeness so the insurer does not reject on paperwork.' },
  { icon: '🏥', title: 'Cashless or reimbursement', body: 'For cashless (health/motor), we coordinate with the network hospital/garage. Else you pay and we fast-track reimbursement.' },
  { icon: '✅', title: 'Settlement', body: 'We track the claim end-to-end and keep you updated until the amount is settled to you or the provider.' },
];

const FAQS = [
  { q: 'How fast are cashless claims approved?', a: 'Pre-authorisation at network hospitals is usually approved within a few hours; we escalate if it stalls.' },
  { q: 'What if my claim is rejected?', a: 'We review the rejection reason, help you appeal with the right documents, and liaise with the insurer on your behalf.' },
  { q: 'Do I need the original policy document?', a: 'Your policy reference (INS-XXXX) is enough to start — we pull the rest. Keep hospital/repair bills and reports handy.' },
];

export default function ClaimsHub() {
  const [form, setForm] = useState({ name: '', phone: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || undefined : undefined;
      await api.insuranceAdvisorCallback({
        name: form.name, phone: form.phone, product: 'claims',
        preferredTime: 'Claim assistance', notes: form.notes,
      }, token);
      setDone(true);
    } catch { alert('Could not submit. Please try again.'); } finally { setBusy(false); }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="text-4xl">🛟</div>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Claims Assistance</h1>
        <p className="text-gray-600 mt-2">We handle the paperwork and follow-ups so your claim gets settled — fast.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-12">
        {STEPS.map((s, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 p-5 bg-white">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{s.icon}</span>
              <h3 className="font-semibold text-gray-900">{i + 1}. {s.title}</h3>
            </div>
            <p className="text-sm text-gray-600 mt-2">{s.body}</p>
          </div>
        ))}
      </div>

      {/* Get help form */}
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 mb-12">
        {done ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-2">✅</div>
            <h3 className="font-semibold text-lg text-gray-900">We've got your request</h3>
            <p className="text-sm text-gray-600 mt-1">A claims specialist will call you back shortly.</p>
          </div>
        ) : (
          <>
            <h2 className="font-semibold text-lg text-gray-900">Start a claim / get help</h2>
            <p className="text-sm text-gray-600 mt-1">Tell us a bit and a claims specialist will call you back.</p>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm mt-3" rows={3} placeholder="Policy reference (INS-…) and what happened" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <button onClick={submit} disabled={busy || !form.name || !form.phone}
              className="mt-3 rounded-lg bg-orange-600 text-white px-6 py-2.5 text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
              {busy ? 'Submitting…' : 'Request claim help'}
            </button>
          </>
        )}
      </div>

      {/* FAQ */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently asked</h2>
      <div className="space-y-3 mb-10">
        {FAQS.map((f, i) => (
          <div key={i} className="rounded-xl border border-gray-200 p-4 bg-white">
            <p className="font-medium text-gray-900 text-sm">{f.q}</p>
            <p className="text-sm text-gray-600 mt-1">{f.a}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link href="/services/insurance" className="text-sm text-orange-600 font-medium hover:underline">← Back to Insurance & Loans</Link>
      </div>
    </div>
  );
}
