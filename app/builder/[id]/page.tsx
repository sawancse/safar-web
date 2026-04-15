'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function formatSalePrice(paise: number): string {
  if (!paise) return 'Price on Request';
  const inr = paise / 100;
  if (inr >= 10000000) return `₹${(inr / 10000000).toFixed(2)} Cr`;
  return `₹${(inr / 100000).toFixed(1)} Lakh`;
}

interface UnitType {
  id: string;
  bhk: number;
  carpetAreaSqft: number;
  superBuiltUpAreaSqft?: number;
  basePricePaise: number;
  floorRisePaise?: number;
  facingPremiumPercent?: number;
  availableCount: number;
}

interface ConstructionUpdate {
  id: string;
  title: string;
  description: string;
  progressPercent: number;
  photoUrls?: string[];
  createdAt: string;
}

interface BuilderProject {
  id: string;
  builderId: string;
  builderName: string;
  projectName: string;
  description?: string;
  city: string;
  state?: string;
  locality?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  projectStatus: string;
  launchDate?: string;
  possessionDate?: string;
  constructionProgressPercent?: number;
  minPricePaise: number;
  maxPricePaise: number;
  minBhk?: number;
  maxBhk?: number;
  minAreaSqft?: number;
  maxAreaSqft?: number;
  photos?: string[];
  masterPlanUrl?: string;
  brochureUrl?: string;
  walkthroughUrl?: string;
  bankApprovals?: string[];
  amenities?: string[];
  reraId?: string;
  reraVerified?: boolean;
  verified?: boolean;
  bookingAmountPaise?: number;
}

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: 'bg-blue-100 text-blue-700',
  UNDER_CONSTRUCTION: 'bg-yellow-100 text-yellow-700',
  READY_TO_MOVE: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

export default function BuilderProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<BuilderProject | null>(null);
  const [units, setUnits] = useState<UnitType[]>([]);
  const [updates, setUpdates] = useState<ConstructionUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'units' | 'updates'>('overview');

  // Inquiry form
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ message: '', buyerName: '', buyerPhone: '', unitTypeId: '', preferredFloor: '' });
  const [payToken, setPayToken] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('access_token') ?? '';
    setToken(t);
    loadProject();
  }, [id]);

  async function loadProject() {
    setLoading(true);
    try {
      const [proj, unitList, updateList] = await Promise.all([
        api.getBuilderProject(id),
        api.getUnitTypes(id).catch(() => []),
        api.getConstructionUpdates(id).catch(() => []),
      ]);
      setProject(proj);
      setUnits(Array.isArray(unitList) ? unitList : unitList?.content ?? []);
      setUpdates(Array.isArray(updateList) ? updateList : updateList?.content ?? []);
    } catch {
      setProject(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitInquiry() {
    if (!token || !project) {
      router.push(`/auth?redirect=/builder/${id}`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.createInquiry({
        builderProjectId: project.id,
        message: inquiryForm.message || `Interested in ${project.projectName}`,
        buyerName: inquiryForm.buyerName,
        buyerPhone: inquiryForm.buyerPhone,
        unitTypeId: inquiryForm.unitTypeId || undefined,
        preferredFloor: inquiryForm.preferredFloor || undefined,
        tokenAmountPaise: payToken ? (project.bookingAmountPaise || 2500000) : undefined,
        payWithToken: payToken,
      }, token);

      if (payToken && res?.razorpayOrderId) {
        // Open Razorpay checkout
        alert(`Razorpay order created: ${res.razorpayOrderId}. Payment integration ready.`);
      } else {
        alert('Interest registered successfully! The builder will contact you soon.');
      }
      setShowInquiry(false);
    } catch (e: any) {
      alert(e.message || 'Failed to submit inquiry');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Project Not Found</h2>
          <Link href="/buy?tab=projects" className="text-orange-500 hover:underline">Browse Projects</Link>
        </div>
      </div>
    );
  }

  const bookingAmount = project.bookingAmountPaise || Math.round(project.minPricePaise * 0.01); // 1% default

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative h-72 md:h-96 bg-slate-800">
        {project.photos && project.photos.length > 0 ? (
          <img src={project.photos[0]} alt={project.projectName} className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40 text-6xl">🏗️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2 mb-2">
            {project.reraVerified && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">RERA Verified</span>}
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[project.projectStatus] || 'bg-gray-100 text-gray-700'}`}>
              {project.projectStatus?.replace(/_/g, ' ')}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{project.projectName}</h1>
          <p className="text-white/80 text-sm mt-1">by {project.builderName} &middot; {project.locality}, {project.city}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price + Config Summary */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex flex-wrap gap-6 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Starting Price</p>
                  <p className="text-2xl font-bold text-orange-600">{formatSalePrice(project.minPricePaise)}</p>
                  {project.maxPricePaise > project.minPricePaise && (
                    <p className="text-sm text-gray-400">to {formatSalePrice(project.maxPricePaise)}</p>
                  )}
                </div>
                {project.minBhk && (
                  <div>
                    <p className="text-sm text-gray-500">Configuration</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {project.minBhk === project.maxBhk ? `${project.minBhk} BHK` : `${project.minBhk}-${project.maxBhk} BHK`}
                    </p>
                  </div>
                )}
                {project.possessionDate && (
                  <div>
                    <p className="text-sm text-gray-500">Possession</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {new Date(project.possessionDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                )}
                {project.constructionProgressPercent != null && (
                  <div>
                    <p className="text-sm text-gray-500">Construction</p>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${project.constructionProgressPercent}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{project.constructionProgressPercent}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white rounded-xl border p-1">
              {(['overview', 'units', 'updates'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition ${
                    activeTab === tab ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab === 'overview' ? 'Overview' : tab === 'units' ? `Unit Types (${units.length})` : `Updates (${updates.length})`}
                </button>
              ))}
            </div>

            {/* Tab Content: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {project.description && (
                  <div className="bg-white rounded-xl border p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{project.description}</p>
                  </div>
                )}
                {project.amenities && project.amenities.length > 0 && (
                  <div className="bg-white rounded-xl border p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Amenities</h2>
                    <div className="flex flex-wrap gap-2">
                      {project.amenities.map((a, i) => (
                        <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
                {project.bankApprovals && project.bankApprovals.length > 0 && (
                  <div className="bg-white rounded-xl border p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Bank Approvals</h2>
                    <div className="flex flex-wrap gap-2">
                      {project.bankApprovals.map((b, i) => (
                        <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg font-medium">{b}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab Content: Unit Types */}
            {activeTab === 'units' && (
              <div className="space-y-4">
                {units.length === 0 ? (
                  <div className="bg-white rounded-xl border p-6 text-center text-gray-400">No unit types configured yet</div>
                ) : units.map(unit => (
                  <div key={unit.id} className="bg-white rounded-xl border p-5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{unit.bhk} BHK</p>
                      <p className="text-sm text-gray-500">
                        {unit.carpetAreaSqft} sqft carpet
                        {unit.superBuiltUpAreaSqft ? ` / ${unit.superBuiltUpAreaSqft} sqft super` : ''}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{unit.availableCount} units available</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">{formatSalePrice(unit.basePricePaise)}</p>
                      <p className="text-xs text-gray-400">onwards</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab Content: Construction Updates */}
            {activeTab === 'updates' && (
              <div className="space-y-4">
                {updates.length === 0 ? (
                  <div className="bg-white rounded-xl border p-6 text-center text-gray-400">No construction updates yet</div>
                ) : updates.map(upd => (
                  <div key={upd.id} className="bg-white rounded-xl border p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900">{upd.title}</p>
                      <span className="text-xs text-gray-400">{new Date(upd.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{upd.description}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${upd.progressPercent}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-600">{upd.progressPercent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Express Interest + Token Booking */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Interested?</h3>

              {!showInquiry ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowInquiry(true)}
                    className="w-full px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-semibold"
                  >
                    Express Interest
                  </button>
                  <button
                    onClick={() => { setShowInquiry(true); setPayToken(true); }}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-semibold"
                  >
                    Book with Token ({formatSalePrice(bookingAmount)})
                  </button>
                  <p className="text-xs text-gray-400 text-center">Token is 100% refundable within 30 days</p>
                  <Link
                    href={`/messages?listingId=${project.id}&recipientId=${project.builderId}`}
                    className="block w-full px-4 py-3 border-2 border-orange-500 text-orange-600 rounded-xl hover:bg-orange-50 transition font-semibold text-center"
                  >
                    Chat with Builder
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={inquiryForm.buyerName}
                    onChange={e => setInquiryForm(p => ({ ...p, buyerName: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={inquiryForm.buyerPhone}
                    onChange={e => setInquiryForm(p => ({ ...p, buyerPhone: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                  />
                  {units.length > 0 && (
                    <select
                      value={inquiryForm.unitTypeId}
                      onChange={e => setInquiryForm(p => ({ ...p, unitTypeId: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                    >
                      <option value="">Select Unit Type</option>
                      {units.map(u => (
                        <option key={u.id} value={u.id}>{u.bhk} BHK - {u.carpetAreaSqft} sqft - {formatSalePrice(u.basePricePaise)}</option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    placeholder="Preferred Floor (e.g., 5-10)"
                    value={inquiryForm.preferredFloor}
                    onChange={e => setInquiryForm(p => ({ ...p, preferredFloor: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                  />
                  <textarea
                    placeholder="Message (optional)"
                    value={inquiryForm.message}
                    onChange={e => setInquiryForm(p => ({ ...p, message: e.target.value }))}
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 resize-none"
                  />

                  {payToken && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm font-semibold text-green-700">Token Amount: {formatSalePrice(bookingAmount)}</p>
                      <p className="text-xs text-green-600 mt-1">Refundable within 30 days. Paid securely via Razorpay.</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowInquiry(false); setPayToken(false); }}
                      className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitInquiry}
                      disabled={submitting || !inquiryForm.buyerName || !inquiryForm.buyerPhone}
                      className={`flex-1 px-4 py-2.5 text-white rounded-lg transition font-semibold disabled:opacity-50 ${
                        payToken ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'
                      }`}
                    >
                      {submitting ? 'Submitting...' : payToken ? 'Pay & Book' : 'Submit'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Downloads */}
            {(project.brochureUrl || project.masterPlanUrl || project.walkthroughUrl) && (
              <div className="bg-white rounded-xl border p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Downloads</h3>
                <div className="space-y-2">
                  {project.brochureUrl && (
                    <a href={project.brochureUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-orange-600 hover:underline">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Brochure
                    </a>
                  )}
                  {project.masterPlanUrl && (
                    <a href={project.masterPlanUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-orange-600 hover:underline">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                      Master Plan
                    </a>
                  )}
                  {project.walkthroughUrl && (
                    <a href={project.walkthroughUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-orange-600 hover:underline">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      Video Walkthrough
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
