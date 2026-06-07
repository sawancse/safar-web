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
    </div>
  );
}
