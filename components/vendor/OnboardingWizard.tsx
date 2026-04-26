'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { WizardConfig, WizardField } from '@/lib/vendor-wizard-config';
import { api } from '@/lib/api';

type Props = { config: WizardConfig };

export default function OnboardingWizard({ config }: Props) {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const [shared, setShared] = useState<Record<string, any>>({});
  const [typeAttrs, setTypeAttrs] = useState<Record<string, any>>({});
  const [kycByType, setKycByType] = useState<Record<string, { url: string; number?: string; uploaded?: boolean }>>({});
  const [listingId, setListingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = config.steps[stepIdx];
  const isLast = stepIdx === config.steps.length - 1;
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null) || '';

  // ── DRAFT autosave on every step advance ──────────────────
  async function saveDraft(): Promise<string> {
    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        ...shared,
        serviceType: config.serviceType,
        pricingPattern: shared.pricingPattern || config.pricingPattern,
        calendarMode: shared.calendarMode || config.calendarMode,
        defaultLeadTimeHours: shared.defaultLeadTimeHours ?? config.defaultLeadTimeHours,
        typeAttributes: typeAttrs,
      };

      if (!listingId) {
        const created: any = await api.createServiceListing(payload, token());
        setListingId(created.id);
        return created.id;
      } else {
        // Strip serviceType for PATCH (cannot change once created)
        const { serviceType, ...patch } = payload;
        await api.updateServiceListing(listingId, patch, token());
        return listingId;
      }
    } catch (e: any) {
      setError(e?.message || 'Save failed');
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    try {
      // KYC step uploads happen field-by-field, no draft save
      if (step.key !== 'kyc') {
        await saveDraft();
      }
      if (!isLast) {
        setStepIdx(i => i + 1);
        window.scrollTo({ top: 0 });
      }
    } catch { /* error already shown */ }
  }

  async function uploadKyc(field: WizardField, url: string, number?: string) {
    if (!field.documentType) return;
    let id = listingId;
    if (!id) {
      try { id = await saveDraft(); } catch { return; }
    }
    if (!id) return;

    try {
      await api.uploadServiceListingKyc(id, {
        documentType: field.documentType,
        documentUrl: url,
        documentNumber: number || null,
      }, token());
      setKycByType(prev => ({ ...prev, [field.documentType!]: { url, number, uploaded: true } }));
    } catch (e: any) {
      setError(e?.message || 'KYC upload failed');
    }
  }

  async function submit() {
    if (!listingId) {
      setError('No draft saved — please complete a step first');
      return;
    }
    const missing = config.requiredKyc.filter(d => !kycByType[d]?.uploaded);
    if (missing.length > 0) {
      setError(`Upload required documents before submitting: ${missing.join(', ')}`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.submitServiceListing(listingId, token());
      router.push('/vendor/dashboard?submitted=1');
    } catch (e: any) {
      setError(e?.message || 'Submit failed — check that all KYC docs are uploaded');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="mb-6 flex items-center gap-4">
        <span className="text-5xl">{config.hero.emoji}</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">List your business as a {config.displayName}</h1>
          <p className="text-sm text-gray-500">{config.hero.tagline}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-700">
            Step {stepIdx + 1} of {config.steps.length} — {step.title}
          </span>
          <span className="text-xs text-gray-500">{Math.round(((stepIdx + 1) / config.steps.length) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-orange-500 transition-all"
            style={{ width: `${((stepIdx + 1) / config.steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step body */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h2>
        {step.description && <p className="text-sm text-gray-500 mb-5">{step.description}</p>}

        <div className="space-y-4">
          {step.fields.map(field => (
            <FieldRow
              key={field.key}
              field={field}
              shared={shared}
              setShared={setShared}
              typeAttrs={typeAttrs}
              setTypeAttrs={setTypeAttrs}
              kycByType={kycByType}
              onUploadKyc={uploadKyc}
            />
          ))}
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setStepIdx(i => Math.max(0, i - 1))}
          disabled={stepIdx === 0 || saving}
          className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">
          ← Back
        </button>

        {!isLast ? (
          <button
            onClick={next}
            disabled={saving}
            className="px-6 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition disabled:opacity-50">
            {saving ? 'Saving…' : 'Save & continue →'}
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={saving}
            className="px-6 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition disabled:opacity-50">
            {saving ? 'Submitting…' : 'Submit for review'}
          </button>
        )}
      </div>

      {listingId && (
        <p className="text-[11px] text-gray-400 mt-4 text-center">
          Draft saved · ID {listingId.slice(0, 8)}…
        </p>
      )}
    </div>
  );
}

// ── Field rendering ────────────────────────────────────────

function FieldRow({
  field, shared, setShared, typeAttrs, setTypeAttrs, kycByType, onUploadKyc,
}: {
  field: WizardField;
  shared: Record<string, any>;
  setShared: (fn: (prev: Record<string, any>) => Record<string, any>) => void;
  typeAttrs: Record<string, any>;
  setTypeAttrs: (fn: (prev: Record<string, any>) => Record<string, any>) => void;
  kycByType: Record<string, { url: string; number?: string; uploaded?: boolean }>;
  onUploadKyc: (field: WizardField, url: string, number?: string) => void;
}) {
  const isType = field.target === 'typeAttributes';
  const value = isType ? typeAttrs[field.key] : shared[field.key];
  const setValue = (v: any) => {
    if (isType) setTypeAttrs(prev => ({ ...prev, [field.key]: v }));
    else setShared(prev => ({ ...prev, [field.key]: v }));
  };

  if (field.type === 'kyc-doc') return <KycDocField field={field} kycByType={kycByType} onUpload={onUploadKyc} />;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-800 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {field.type === 'text' && (
        <input
          type="text"
          value={value ?? ''}
          onChange={e => setValue(e.target.value)}
          placeholder={field.placeholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none"
        />
      )}

      {field.type === 'textarea' && (
        <textarea
          value={value ?? ''}
          onChange={e => setValue(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none"
        />
      )}

      {field.type === 'number' && (
        <input
          type="number"
          value={value ?? ''}
          onChange={e => setValue(e.target.value === '' ? undefined : Number(e.target.value))}
          placeholder={field.placeholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none"
        />
      )}

      {field.type === 'select' && field.options && (
        <select
          value={value ?? ''}
          onChange={e => setValue(e.target.value || undefined)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none"
        >
          <option value="">— Select —</option>
          {field.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}

      {field.type === 'multiselect' && field.options && (
        <div className="flex flex-wrap gap-2">
          {field.options.map(opt => {
            const arr: string[] = Array.isArray(value) ? value : [];
            const on = arr.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValue(on ? arr.filter(v => v !== opt.value) : [...arr, opt.value])}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                  on ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}>
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {field.type === 'boolean' && (
        <div className="flex gap-3">
          {[true, false].map(b => (
            <button
              key={String(b)}
              type="button"
              onClick={() => setValue(b)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
                value === b ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}>
              {b ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      )}

      {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
    </div>
  );
}

function KycDocField({
  field, kycByType, onUpload,
}: {
  field: WizardField;
  kycByType: Record<string, { url: string; number?: string; uploaded?: boolean }>;
  onUpload: (field: WizardField, url: string, number?: string) => void;
}) {
  const docType = field.documentType!;
  const existing = kycByType[docType];
  const [url, setUrl] = useState(existing?.url ?? '');
  const [number, setNumber] = useState(existing?.number ?? '');
  const [busy, setBusy] = useState(false);

  // Sync if parent updates (e.g., after saveDraft + upload)
  useEffect(() => {
    setUrl(existing?.url ?? '');
    setNumber(existing?.number ?? '');
  }, [existing?.url, existing?.number]);

  async function submitDoc() {
    if (!url.trim()) return;
    setBusy(true);
    try {
      await onUpload(field, url.trim(), number.trim() || undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-gray-800">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {existing?.uploaded && <span className="text-xs text-green-600">✓ Uploaded</span>}
      </div>
      {field.helpText && <p className="text-xs text-gray-500 mb-3">{field.helpText}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="S3 document URL"
          className="md:col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="text"
          value={number}
          onChange={e => setNumber(e.target.value)}
          placeholder="Document #"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <button
        type="button"
        onClick={submitDoc}
        disabled={busy || !url.trim()}
        className="mt-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40">
        {busy ? 'Uploading…' : (existing?.uploaded ? 'Replace' : 'Upload')}
      </button>
      <p className="text-[11px] text-gray-400 mt-2">
        V1: paste S3 URL after uploading via media-service. V2 will add a direct file picker.
      </p>
    </div>
  );
}
