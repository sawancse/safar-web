'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function formatPaise(paise?: number | null): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((paise || 0) / 100);
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-blue-100 text-blue-700',
  PENDING_SIGNATURE: 'bg-amber-100 text-amber-700',
  SIGNED: 'bg-green-100 text-green-700',
  REGISTERED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-600',
  CANCELLED: 'bg-red-100 text-red-600',
};

const TYPE_LABEL: Record<string, string> = {
  SALE_AGREEMENT: 'Sale Agreement',
  SALE_DEED: 'Sale Deed',
  RENTAL_AGREEMENT: 'Rental Agreement',
  LEAVE_LICENSE: 'Leave & License',
  PG_AGREEMENT: 'PG Agreement',
};

function prettyKey(k: string): string {
  return k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()).trim();
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between gap-3 py-2.5 border-b border-dashed border-gray-100 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-slate-900 text-right">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: any }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">{title}</h2>
      {children}
    </div>
  );
}

export default function AgreementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [agreement, setAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [generating, setGenerating] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    const t = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || '') : '';
    if (!t) { router.push(`/auth?redirect=/services/agreement/${id}`); return; }
    setToken(t);
    load(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load(t: string) {
    setLoading(true);
    setError('');
    try {
      const a = await api.getSaleAgreement(id, t);
      setAgreement(a);
    } catch (e: any) {
      setError(e?.message || 'Agreement not found');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      await api.generateAgreementDraft(id, token);
      await load(token);
    } catch (e: any) {
      alert(e?.message || 'Failed to generate draft');
    } finally {
      setGenerating(false);
    }
  }

  async function handleViewDraft() {
    try {
      await api.viewAgreementDraftPdf(id, token);
    } catch (e: any) {
      alert(e?.message || 'Failed to open draft PDF');
    }
  }

  function openEdit() {
    let parties: any[] = [];
    try {
      const arr = agreement.partyDetailsJson ? JSON.parse(agreement.partyDetailsJson) : [];
      if (Array.isArray(arr)) {
        parties = arr.map((p: any) => ({
          name: p.name || '', role: p.role || 'BUYER', phone: p.phone || '',
          email: p.email || '', pan: p.panNumber || p.pan || '', address: p.address || '',
        }));
      }
    } catch { /* ignore */ }
    if (parties.length === 0) {
      parties = [
        { name: '', role: 'SELLER', phone: '', email: '', pan: '', address: '' },
        { name: '', role: 'BUYER', phone: '', email: '', pan: '', address: '' },
      ];
    }
    setForm({
      agreementType: agreement.agreementType || 'RENTAL_AGREEMENT',
      city: agreement.city || '',
      state: agreement.state || '',
      agreementDate: (agreement.agreementDate || '').slice(0, 10),
      startDate: (agreement.startDate || '').slice(0, 10),
      endDate: (agreement.endDate || '').slice(0, 10),
      monthlyRentInr: agreement.monthlyRentPaise != null ? String(agreement.monthlyRentPaise / 100) : '',
      securityDepositInr: agreement.securityDepositPaise != null ? String(agreement.securityDepositPaise / 100) : '',
      saleValueInr: agreement.saleConsiderationPaise != null ? String(agreement.saleConsiderationPaise / 100) : '',
      parties,
    });
    setEditOpen(true);
  }

  function setParty(i: number, field: string, value: string) {
    setForm((f: any) => {
      const parties = [...(f.parties || [])];
      parties[i] = { ...parties[i], [field]: value };
      return { ...f, parties };
    });
  }
  function addParty(role: string) {
    setForm((f: any) => ({ ...f, parties: [...(f.parties || []), { name: '', role, phone: '', email: '', pan: '', address: '' }] }));
  }
  function removeParty(i: number) {
    setForm((f: any) => ({ ...f, parties: (f.parties || []).filter((_: any, idx: number) => idx !== i) }));
  }

  async function handleSaveEdit() {
    setSaving(true);
    try {
      const num = (v: any) => (v !== '' && v != null ? Math.round(Number(v) * 100) : undefined);
      const body = {
        agreementType: form.agreementType || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        agreementDate: form.agreementDate || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        monthlyRentPaise: num(form.monthlyRentInr),
        securityDepositPaise: num(form.securityDepositInr),
        saleConsiderationPaise: num(form.saleValueInr),
        partyDetailsJson: Array.isArray(form.parties)
          ? JSON.stringify(
              form.parties
                .filter((p: any) => (p.name || '').trim())
                .map((p: any) => ({ name: p.name, role: p.role, panNumber: p.pan, address: p.address, phone: p.phone, email: p.email }))
            )
          : undefined,
      };
      const updated = await api.updateAgreementTerms(id, body, token);
      setAgreement(updated);
      setEditOpen(false);
    } catch (e: any) {
      alert(e?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500 text-sm">Loading…</div>;
  }

  if (error || !agreement) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Agreement not found</h1>
        <p className="text-gray-500 mb-6">{error || "This agreement isn't available."}</p>
        <Link href="/services/agreement" className="text-orange-500 hover:underline">← Back to agreements</Link>
      </div>
    );
  }

  let party: any = {};
  try { party = agreement.partyDetailsJson ? JSON.parse(agreement.partyDetailsJson) : {}; } catch { /* ignore */ }
  let property: any = {};
  try { property = agreement.propertyDetailsJson ? JSON.parse(agreement.propertyDetailsJson) : {}; } catch { /* ignore */ }

  const typeLabel = TYPE_LABEL[agreement.agreementType] || (agreement.agreementType || '').replace(/_/g, ' ');
  const status = (agreement.status || '').replace(/_/g, ' ');
  const draftUrl = agreement.draftPdfUrl;
  const signedUrl = agreement.signedPdfUrl;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/services/agreement" className="text-sm text-orange-500 hover:underline mb-3 inline-block">← My Agreements</Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{typeLabel}</h1>
          <p className="text-xs text-gray-500 mt-1 font-mono">Ref: {agreement.id}</p>
          <p className="text-xs text-gray-500">Created {agreement.createdAt ? new Date(agreement.createdAt).toLocaleDateString('en-IN') : '—'}</p>
        </div>
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[agreement.status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>
      </div>

      {agreement.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
          <strong>Rejected:</strong> {agreement.rejectionReason}
        </div>
      )}

      {/* Fee breakdown */}
      <Section title="Fees">
        <div className="text-sm">
          <Row label="Stamp duty" value={formatPaise(agreement.stampDutyPaise)} />
          <Row label="Registration fee" value={formatPaise(agreement.registrationFeePaise)} />
          <Row label={`Service fee${agreement.packageType ? ` (${agreement.packageType})` : ''}`} value={formatPaise(agreement.serviceFeePaise)} />
          <div className="flex justify-between gap-3 py-2.5 font-bold text-slate-900 border-t mt-1 pt-2.5">
            <span>Total</span><span className="text-orange-600">{formatPaise(agreement.totalAmountPaise)}</span>
          </div>
        </div>
      </Section>

      {/* Property details */}
      {property && Object.keys(property).length > 0 && (
        <Section title="Property details">
          <div className="text-sm">
            {Object.entries(property).map(([k, v]) =>
              (v !== null && v !== undefined && v !== '') ? <Row key={k} label={prettyKey(k)} value={String(v)} /> : null
            )}
          </div>
        </Section>
      )}

      {/* Terms */}
      {(agreement.agreementDate || agreement.startDate || agreement.monthlyRentPaise || agreement.saleConsiderationPaise) && (
        <Section title="Terms">
          <div className="text-sm">
            {agreement.agreementDate && <Row label="Agreement date" value={new Date(agreement.agreementDate).toLocaleDateString('en-IN')} />}
            {agreement.startDate && <Row label="Start date" value={new Date(agreement.startDate).toLocaleDateString('en-IN')} />}
            {agreement.endDate && <Row label="End date" value={new Date(agreement.endDate).toLocaleDateString('en-IN')} />}
            {agreement.monthlyRentPaise ? <Row label="Monthly rent" value={formatPaise(agreement.monthlyRentPaise)} /> : null}
            {agreement.securityDepositPaise ? <Row label="Security deposit" value={formatPaise(agreement.securityDepositPaise)} /> : null}
            {agreement.saleConsiderationPaise ? <Row label="Sale / property value" value={formatPaise(agreement.saleConsiderationPaise)} /> : null}
          </div>
        </Section>
      )}

      {/* Parties */}
      {Array.isArray(agreement.parties) && agreement.parties.length > 0 && (
        <Section title="Parties">
          <div className="space-y-3">
            {agreement.parties.map((p: any) => (
              <div key={p.id} className="border rounded-xl p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900">{p.fullName || '—'}</span>
                  <span className="text-[11px] uppercase tracking-wide bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{(p.partyType || '').replace(/_/g, ' ')}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                  {p.phone && <div>📞 {p.phone}</div>}
                  {p.email && <div>✉️ {p.email}</div>}
                  {p.address && <div>{p.address}</div>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Documents / actions */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-wrap items-center gap-3">
        {agreement.status === 'DRAFT' && (
          <button onClick={openEdit}
             className="bg-white border border-gray-300 text-gray-800 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition">
            Edit draft
          </button>
        )}
        {signedUrl && (
          <a href={signedUrl} target="_blank" rel="noopener noreferrer"
             className="bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-green-700 transition">
            Download signed PDF
          </a>
        )}
        {draftUrl ? (
          <button onClick={handleViewDraft}
             className="bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition">
            View draft PDF
          </button>
        ) : (
          <button onClick={handleGenerate} disabled={generating}
                  className="bg-orange-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition">
            {generating ? 'Generating…' : 'Generate draft'}
          </button>
        )}
        <Link href="/services/agreement" className="text-sm text-gray-500 hover:text-gray-700 px-2 py-2.5">Back</Link>
      </div>

      {/* Edit draft modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !saving && setEditOpen(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Edit draft</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 text-xs text-gray-500">Agreement type
                <select value={form.agreementType} onChange={e => setForm({ ...form, agreementType: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                  {['SALE_AGREEMENT', 'SALE_DEED', 'RENTAL_AGREEMENT', 'LEAVE_LICENSE', 'PG_AGREEMENT'].map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </label>
              <label className="text-xs text-gray-500">City
                <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
              </label>
              <label className="text-xs text-gray-500">State
                <input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
              </label>
              <label className="text-xs text-gray-500">Agreement date
                <input type="date" value={form.agreementDate} onChange={e => setForm({ ...form, agreementDate: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
              </label>
              <label className="text-xs text-gray-500">Start date
                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
              </label>
              <label className="text-xs text-gray-500">End date
                <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
              </label>
              <label className="text-xs text-gray-500">Monthly rent (₹)
                <input type="number" min={0} value={form.monthlyRentInr} onChange={e => setForm({ ...form, monthlyRentInr: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
              </label>
              <label className="text-xs text-gray-500">Security deposit (₹)
                <input type="number" min={0} value={form.securityDepositInr} onChange={e => setForm({ ...form, securityDepositInr: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
              </label>
              <label className="col-span-2 text-xs text-gray-500">Sale / property value (₹)
                <input type="number" min={0} value={form.saleValueInr} onChange={e => setForm({ ...form, saleValueInr: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
              </label>
            </div>

            {/* Parties */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-900">Parties</h4>
                <div className="flex gap-2">
                  <button type="button" onClick={() => addParty('BUYER')} className="text-xs text-orange-600 border border-orange-200 rounded-lg px-2.5 py-1 hover:bg-orange-50">+ Party</button>
                  <button type="button" onClick={() => addParty('WITNESS')} className="text-xs text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50">+ Witness</button>
                </div>
              </div>
              <div className="space-y-3">
                {(form.parties || []).map((p: any, i: number) => (
                  <div key={i} className="border rounded-xl p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <select value={p.role} onChange={e => setParty(i, 'role', e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm">
                        {['BUYER', 'SELLER', 'TENANT', 'LANDLORD', 'WITNESS'].map(r => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
                      </select>
                      <input value={p.name} onChange={e => setParty(i, 'name', e.target.value)} placeholder="Full name" className="border rounded-lg px-2 py-1.5 text-sm" />
                      <input value={p.phone} onChange={e => setParty(i, 'phone', e.target.value)} placeholder="Phone" className="border rounded-lg px-2 py-1.5 text-sm" />
                      <input value={p.email} onChange={e => setParty(i, 'email', e.target.value)} placeholder="Email" className="border rounded-lg px-2 py-1.5 text-sm" />
                      <input value={p.pan} onChange={e => setParty(i, 'pan', e.target.value.toUpperCase())} placeholder="PAN" maxLength={10} className="border rounded-lg px-2 py-1.5 text-sm" />
                      <input value={p.address} onChange={e => setParty(i, 'address', e.target.value)} placeholder="Address" className="border rounded-lg px-2 py-1.5 text-sm" />
                    </div>
                    {(form.parties || []).length > 1 && (
                      <button type="button" onClick={() => removeParty(i)} className="text-[11px] text-red-500 hover:text-red-600 mt-2">Remove</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-gray-400 mt-3">Stamp duty recalculates on save — from the sale value (sale deeds) or 12× rent + deposit (rentals).</p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditOpen(false)} disabled={saving} className="flex-1 border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving} className="flex-1 bg-orange-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving…' : 'Save changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
