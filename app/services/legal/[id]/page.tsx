'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import DateField from '@/components/DateField';

function formatPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
}

const STATUS_STEPS = [
  { key: 'CREATED', label: 'Case Created' },
  { key: 'DOCUMENTS_UPLOADED', label: 'Documents Uploaded' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'VERIFICATION_IN_PROGRESS', label: 'Verification In Progress' },
  { key: 'REPORT_READY', label: 'Report Ready' },
  { key: 'COMPLETED', label: 'Completed' },
];

const VERIFICATION_ITEMS = [
  { key: 'TITLE_CHAIN', label: 'Title Chain Verification', desc: 'Verify ownership chain for 30+ years' },
  { key: 'ENCUMBRANCE', label: 'Encumbrance Check', desc: 'Check for existing mortgages, liens, or charges' },
  { key: 'GOVT_APPROVAL', label: 'Government Approvals', desc: 'Building plan approval, RERA, NOCs' },
  { key: 'LITIGATION', label: 'Litigation Check', desc: 'Pending court cases or disputes' },
  { key: 'TAX', label: 'Tax Verification', desc: 'Property tax payments and arrears' },
  { key: 'SURVEY', label: 'Survey Match', desc: 'Match survey records with property boundaries' },
];

const RISK_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  GREEN: { bg: 'bg-green-100', text: 'text-green-700', label: 'Low Risk' },
  YELLOW: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium Risk' },
  RED: { bg: 'bg-red-100', text: 'text-red-700', label: 'High Risk' },
};

const ITEM_STATUS_ICONS: Record<string, { icon: string; color: string }> = {
  CLEAN: { icon: 'check', color: 'text-green-500' },
  ISSUE: { icon: 'x', color: 'text-red-500' },
  PENDING: { icon: 'clock', color: 'text-gray-400' },
};

export default function LegalCaseDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [token, setToken] = useState('');
  const [caseData, setCaseData] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Consultation
  const [consultDate, setConsultDate] = useState('');
  const [consultTime, setConsultTime] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

  // Report download
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('access_token') || '';
    setToken(t);
    if (t && id) {
      Promise.all([
        api.getLegalCase(id, t).catch(() => null),
        api.getLegalDocuments(id, t).catch(() => []),
      ]).then(([c, docs]) => {
        setCaseData(c);
        setDocuments(Array.isArray(docs) ? docs : []);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id]);

  async function downloadReport() {
    setDownloading(true);
    try {
      const blob = await api.downloadLegalReport(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `legal-report-${id.slice(-8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || 'Failed to download report. Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  async function scheduleConsultation() {
    if (!consultDate || !consultTime) return;
    setScheduling(true);
    setScheduleError('');
    try {
      await api.scheduleLegalConsultation(id, { scheduledAt: `${consultDate}T${consultTime}:00` });
      setScheduleSuccess(true);
    } catch (err: any) {
      setScheduleError(err?.message || 'Failed to schedule consultation. An advocate may need to be assigned first.');
    } finally {
      setScheduling(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64" />
            <div className="h-4 bg-gray-200 rounded w-96" />
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center max-w-md">
          <h3 className="font-semibold text-slate-900 mb-2">Sign in to continue</h3>
          <p className="text-sm text-gray-500 mb-4">You need to be logged in to view case details.</p>
          <Link href="/auth" className="inline-flex bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">Sign In</Link>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="font-semibold text-slate-900 mb-2">Case not found</h3>
          <Link href="/services/legal" className="text-sm text-emerald-600 hover:text-emerald-700">Back to Legal Services</Link>
        </div>
      </div>
    );
  }

  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === caseData.status);
  const risk = RISK_COLORS[caseData.riskLevel] || null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/services/legal" className="text-gray-500 hover:text-gray-700 text-sm mb-3 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            My Cases
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Case #{(id || '').slice(-8).toUpperCase()}</h1>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {(caseData.status || '').replace(/_/g, ' ')}
              </span>
              {risk && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${risk.bg} ${risk.text}`}>
                  {risk.label}
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Created {caseData.createdAt ? new Date(caseData.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Status Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Progress</h2>
          <div className="flex items-center gap-0 overflow-x-auto pb-2">
            {STATUS_STEPS.map((s, i) => {
              const done = i <= currentStepIdx;
              const active = i === currentStepIdx;
              return (
                <div key={s.key} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[80px]">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
                    } ${active ? 'ring-2 ring-emerald-300' : ''}`}>
                      {done && !active ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      ) : i + 1}
                    </div>
                    <span className={`text-[10px] mt-1 text-center ${active ? 'font-medium text-emerald-700' : 'text-gray-400'}`}>{s.label}</span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`w-8 h-0.5 ${i < currentStepIdx ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Advocate */}
        {(caseData.advocateName || caseData.advocate) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-3">Assigned Advocate</h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xl">
                {(caseData.advocateName || caseData.advocate?.name || 'A')[0]}
              </div>
              <div>
                <div className="font-medium text-slate-900">{caseData.advocateName || caseData.advocate?.name}</div>
                {(caseData.advocateSpecialization || caseData.advocate?.specialization) && (
                  <div className="text-sm text-gray-500">{caseData.advocateSpecialization || caseData.advocate?.specialization}</div>
                )}
                {(caseData.advocateBarCouncil || caseData.advocate?.barCouncilNumber) && (
                  <div className="text-xs text-gray-400">Bar Council: {caseData.advocateBarCouncil || caseData.advocate?.barCouncilNumber}</div>
                )}
                {(caseData.advocateRating || caseData.advocate?.rating) && (
                  <div className="flex items-center gap-1 mt-1">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    <span className="text-sm text-gray-600">{caseData.advocateRating || caseData.advocate?.rating}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Verification Checklist */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Verification Checklist</h2>
          <div className="space-y-3">
            {VERIFICATION_ITEMS.map((item) => {
              const itemStatus = caseData.verificationItems?.[item.key] || caseData.checklistItems?.find?.((c: any) => c.type === item.key)?.status || 'PENDING';
              return (
                <div key={item.key} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  {itemStatus === 'CLEAN' ? (
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  ) : itemStatus === 'ISSUE' ? (
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    itemStatus === 'CLEAN' ? 'bg-green-100 text-green-700' :
                    itemStatus === 'ISSUE' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {itemStatus === 'CLEAN' ? 'Clear' : itemStatus === 'ISSUE' ? 'Issue Found' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Documents</h2>
          {documents.length === 0 ? (
            <p className="text-sm text-gray-500">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc: any, idx: number) => (
                <div key={doc.id || idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{doc.documentType || doc.name || 'Document'}</div>
                      <div className="text-xs text-gray-500">{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-IN') : ''}</div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    doc.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                    doc.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {doc.verificationStatus || 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report Download */}
        {(caseData.status === 'REPORT_READY' || caseData.status === 'COMPLETED') && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
            <svg className="w-12 h-12 text-emerald-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h3 className="font-semibold text-emerald-800 mb-2">Verification Report Ready</h3>
            <p className="text-sm text-emerald-600 mb-4">Your detailed property verification report is ready for download.</p>
            <button onClick={downloadReport} disabled={downloading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {downloading ? 'Downloading...' : 'Download Report (PDF)'}
            </button>
          </div>
        )}

        {/* Consultation Scheduler */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Schedule Consultation</h2>
          {scheduleSuccess ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
              Consultation scheduled successfully. You will receive a confirmation shortly.
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <DateField value={consultDate} onChange={(e) => setConsultDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                  <select value={consultTime} onChange={(e) => setConsultTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm">
                    <option value="">Select time</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="17:00">5:00 PM</option>
                  </select>
                </div>
                <button onClick={scheduleConsultation} disabled={scheduling || !consultDate || !consultTime}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap">
                  {scheduling ? 'Scheduling...' : 'Schedule Call'}
                </button>
              </div>
              {scheduleError && <p className="text-red-500 text-sm mt-2">{scheduleError}</p>}
            </>
          )}
        </div>

        {/* Case Timeline */}
        {caseData.timeline && caseData.timeline.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Timeline</h2>
            <div className="space-y-4">
              {caseData.timeline.map((event: any, idx: number) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    {idx < caseData.timeline.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                  </div>
                  <div className="pb-4">
                    <div className="text-sm font-medium text-slate-900">{event.title || event.status}</div>
                    <div className="text-xs text-gray-500">{event.timestamp ? new Date(event.timestamp).toLocaleString('en-IN') : ''}</div>
                    {event.description && <div className="text-sm text-gray-500 mt-1">{event.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
