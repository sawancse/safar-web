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

      {field.type === 'image' && (
        <ImageField value={value} onChange={setValue} placeholder={field.placeholder} />
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
  const [number, setNumber] = useState(existing?.number ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    setNumber(existing?.number ?? '');
  }, [existing?.number]);

  // PDF for cert scans, JPG/PNG for phone-camera captures, HEIC for iPhone
  // shooters who don't convert. KYC scans run bigger than listing photos so
  // bump the cap to 20 MB.
  const ACCEPT = '.pdf,application/pdf,image/jpeg,image/png,image/jpg,image/heic,image/heif';
  const MAX_BYTES = 20 * 1024 * 1024;

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    const isImg = file.type.startsWith('image/');
    if (!isPdf && !isImg) { setErr('PDF or image only'); e.target.value = ''; return; }
    if (file.size > MAX_BYTES) { setErr('File must be under 20 MB'); e.target.value = ''; return; }
    setErr(null);
    setBusy(true);
    setFileName(file.name);
    try {
      const t = (typeof window !== 'undefined' ? localStorage.getItem('access_token') : '') || '';
      const url = await api.uploadGenericFile(file, 'vendor-kyc', t);
      await onUpload(field, url, number.trim() || undefined);
    } catch (ex: any) {
      setErr(ex?.message || 'Upload failed');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  // After-the-fact number edit — re-submits the existing URL with the new
  // number so the back-end record stays in sync without re-uploading.
  async function saveNumber() {
    if (!existing?.url) return;
    setBusy(true);
    try {
      await onUpload(field, existing.url, number.trim() || undefined);
    } catch (ex: any) {
      setErr(ex?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  const isPdfPreview = !!existing?.url && /\.pdf(\?|$)/i.test(existing.url);

  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-gray-800">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {existing?.uploaded && <span className="text-xs text-green-600 font-semibold">✓ Uploaded</span>}
      </div>
      {field.helpText && <p className="text-xs text-gray-500 mb-3">{field.helpText}</p>}

      {existing?.uploaded && existing.url ? (
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
          {isPdfPreview ? (
            <div className="w-14 h-14 rounded-md bg-red-50 border border-red-200 flex items-center justify-center text-red-600 text-xs font-bold shrink-0">
              PDF
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={existing.url} alt={field.label} className="w-14 h-14 object-cover rounded-md border shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <a href={existing.url} target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold text-blue-600 hover:underline truncate block">
              View document ↗
            </a>
            <p className="text-[11px] text-gray-400 truncate">{fileName || existing.url}</p>
          </div>
          <label className="cursor-pointer text-xs font-semibold text-orange-600 hover:underline shrink-0">
            Replace
            <input type="file" accept={ACCEPT} className="hidden" onChange={pick} disabled={busy} />
          </label>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-gray-300 rounded-xl px-4 py-6 mb-3 hover:border-orange-400 hover:bg-orange-50/40 transition">
          <span className="text-2xl mb-1">📄</span>
          <span className="text-sm font-semibold text-gray-700">
            {busy ? 'Uploading…' : 'Browse from your device'}
          </span>
          <span className="text-[11px] text-gray-500 mt-1">PDF or photo · up to 20 MB</span>
          <input type="file" accept={ACCEPT} className="hidden" onChange={pick} disabled={busy} />
        </label>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={number}
          onChange={e => setNumber(e.target.value)}
          placeholder="Document number (e.g. PAN / GSTIN)"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        {existing?.uploaded && number !== (existing.number ?? '') && (
          <button
            type="button"
            onClick={saveNumber}
            disabled={busy}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 whitespace-nowrap">
            Save number
          </button>
        )}
      </div>

      {err && <p className="text-xs text-red-500 mt-2">{err}</p>}
    </div>
  );
}

function ImageField({ value, onChange, placeholder }: {
  value?: string; onChange: (url: string) => void; placeholder?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState<string | null>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErr('Please pick an image file'); return; }
    if (file.size > 10 * 1024 * 1024)    { setErr('Image must be under 10 MB');  return; }
    setErr(null);
    setBusy(true);
    try {
      const t = (typeof window !== 'undefined' ? localStorage.getItem('access_token') : '') || '';
      const url = await api.uploadGenericFile(file, 'vendor-onboarding', t);
      onChange(url);
    } catch (e: any) {
      setErr(e?.message || 'Upload failed');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Hero" className="w-24 h-24 object-cover rounded-lg border" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 truncate">{value}</p>
            <div className="mt-1 flex gap-2">
              <label className="cursor-pointer text-xs font-semibold text-orange-600 hover:underline">
                Replace
                <input type="file" accept="image/*" className="hidden" onChange={pick} disabled={busy} />
              </label>
              <button type="button" onClick={() => onChange('')}
                className="text-xs font-semibold text-gray-500 hover:text-red-600">
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-gray-300 rounded-xl px-4 py-8 hover:border-orange-400 hover:bg-orange-50/40 transition">
          <span className="text-2xl mb-1">📷</span>
          <span className="text-sm font-semibold text-gray-700">{busy ? 'Uploading…' : 'Browse a photo'}</span>
          <span className="text-[11px] text-gray-500 mt-1">{placeholder || 'JPG / PNG, under 10 MB'}</span>
          <input type="file" accept="image/*" className="hidden" onChange={pick} disabled={busy} />
        </label>
      )}
      {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
    </div>
  );
}
