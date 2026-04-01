'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

/* ── Price formatter (paise → Lakh/Cr) ── */
function formatSalePrice(paise: number): string {
  const inr = paise / 100;
  if (inr >= 10000000) {
    const cr = inr / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  const lakh = inr / 100000;
  return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)} Lakh`;
}

function formatINR(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

const AMENITY_ICONS: Record<string, string> = {
  'Swimming Pool': '🏊', 'Gym': '🏋️', 'Club House': '🏠', 'Children\'s Play Area': '🧒',
  'Landscaped Gardens': '🌿', 'Jogging Track': '🏃', 'Indoor Games': '🎮', 'Party Hall': '🎉',
  'Yoga Room': '🧘', 'Amphitheatre': '🎭', 'Sports Court': '🏸', 'Power Backup': '⚡',
  'Rainwater Harvesting': '💧', 'EV Charging': '🔌', 'Smart Home': '🏡', 'Concierge': '🛎️',
  'Co-working Space': '💻', 'Library': '📚', 'Pet Park': '🐾', 'Infinity Pool': '🌊',
  'SPA': '💆', 'Multipurpose Hall': '🏛️', 'Mini Theatre': '🎬', 'Creche': '👶',
  'Visitor Parking': '🅿️', 'CCTV': '📹', 'Intercom': '📞', 'Fire Safety': '🧯',
  'Vastu': '🧭', 'Senior Citizen Area': '👴',
};

interface UnitType {
  id: string;
  projectId?: string;
  name: string;
  bhk: number;
  carpetAreaSqft?: number;
  builtUpAreaSqft?: number;
  superBuiltUpAreaSqft?: number;
  basePricePaise: number;
  floorRisePaise?: number;
  facingPremiumPaise?: number;
  premiumFloorsFrom?: number;
  totalUnits: number;
  availableUnits?: number;
  bathrooms?: number;
  balconies?: number;
  furnishing?: string;
  floorPlanUrl?: string;
  unitLayoutUrl?: string;
  photos?: string[];
  pricePerSqftPaise?: number;
}

interface ConstructionUpdate {
  id: string;
  projectId?: string;
  title: string;
  description?: string;
  progressPercent: number;
  photos?: string[];
  createdAt: string;
}

interface BuilderProject {
  id: string;
  builderId?: string;
  projectName: string;
  tagline?: string;
  description?: string;
  builderName: string;
  builderLogoUrl?: string;
  verified?: boolean;
  city: string;
  state?: string;
  locality?: string;
  address?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  minPricePaise: number;
  maxPricePaise: number;
  minBhk: number;
  maxBhk: number;
  minAreaSqft?: number;
  maxAreaSqft?: number;
  possessionDate?: string;
  launchDate?: string;
  constructionProgressPercent: number;
  projectStatus: string;
  reraId?: string;
  reraVerified?: boolean;
  totalTowers?: number;
  totalUnits?: number;
  totalFloorsMax?: number;
  availableUnits?: number;
  landAreaSqft?: number;
  projectAreaSqft?: number;
  amenities?: string[];
  bankApprovals?: string[];
  photos?: string[];
  masterPlanUrl?: string;
  brochureUrl?: string;
  walkthroughUrl?: string;
  paymentPlansJson?: string;
  status?: string;
  viewsCount?: number;
  inquiriesCount?: number;
  unitTypes?: UnitType[];
}

interface PriceBreakdown {
  unitTypeName?: string;
  bhk?: number;
  basePricePaise: number;
  floor?: number;
  floorRisePaise: number;
  preferredFacing?: boolean;
  facingPremiumPaise: number;
  totalPricePaise: number;
  pricePerSqftPaise: number;
  estimatedEmiPaise: number;
}

interface SimilarProject {
  id: string;
  projectName: string;
  builderName: string;
  city: string;
  locality?: string;
  minPricePaise: number;
  maxPricePaise: number;
  minBhk: number;
  maxBhk: number;
  primaryPhotoUrl?: string;
  constructionProgressPercent: number;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<BuilderProject | null>(null);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [updates, setUpdates] = useState<ConstructionUpdate[]>([]);
  const [similar, setSimilar] = useState<SimilarProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /* Photo gallery */
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  /* Price calculator */
  const [calcUnitTypeId, setCalcUnitTypeId] = useState('');
  const [calcFloor, setCalcFloor] = useState('5');
  const [calcPreferredFacing, setCalcPreferredFacing] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  /* Inquiry modal */
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySending, setInquirySending] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  /* Master plan zoom */
  const [masterPlanZoom, setMasterPlanZoom] = useState(false);

  /* Floor plan viewer */
  const [floorPlanUrl, setFloorPlanUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const proj = await api.getBuilderProject(id);
        setProject(proj);
        // Use embedded unitTypes from project response as initial data
        if (proj.unitTypes && proj.unitTypes.length > 0) {
          setUnitTypes(proj.unitTypes);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
    (async () => {
      try {
        const types = await api.getUnitTypes(id);
        if (types && types.length > 0) {
          setUnitTypes(types);
        }
      } catch { /* fallback to unitTypes from project response */ }
    })();
    (async () => {
      try {
        const upd = await api.getConstructionUpdates(id);
        setUpdates(upd || []);
      } catch { setUpdates([]); }
    })();
    (async () => {
      try {
        const params: Record<string, string> = { size: '4', excludeId: id };
        const res = await api.searchBuilderProjects(params);
        setSimilar(res?.content || res || []);
      } catch { setSimilar([]); }
    })();
  }, [id]);

  useEffect(() => {
    if (unitTypes.length > 0 && !calcUnitTypeId) {
      setCalcUnitTypeId(unitTypes[0].id);
    }
  }, [unitTypes]);

  async function handleCalculatePrice() {
    if (!calcUnitTypeId) return;
    setCalcLoading(true);
    try {
      const res = await api.calculateUnitPrice(calcUnitTypeId, Number(calcFloor) || 1, calcPreferredFacing);
      setPriceBreakdown(res);
    } catch {
      alert('Failed to calculate price. Please try again.');
    } finally {
      setCalcLoading(false);
    }
  }

  async function handleInquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    setInquirySending(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      await (api as any).createInquiry({
        builderProjectId: id,
        buyerName: inquiryName,
        buyerPhone: inquiryPhone,
        buyerEmail: inquiryEmail,
        message: inquiryMessage,
      }, token);
      setInquirySuccess(true);
    } catch {
      alert('Failed to send inquiry. Please try again.');
    } finally {
      setInquirySending(false);
    }
  }

  const photos = project?.photos || [];
  const paymentPlans = useMemo(() => {
    if (!project?.paymentPlansJson) return [];
    try { return JSON.parse(project.paymentPlansJson); } catch { return []; }
  }, [project?.paymentPlansJson]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
          <div className="h-80 bg-gray-200 rounded-xl mb-6" />
          <div className="h-8 bg-gray-200 rounded w-2/3 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-8" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded-xl" />
            <div className="h-24 bg-gray-200 rounded-xl" />
            <div className="h-24 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏗️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Project not found</h2>
          <p className="text-gray-500 mb-4">The project you are looking for may have been removed or is unavailable.</p>
          <Link href="/projects" className="text-orange-500 hover:text-orange-600 font-medium">
            Browse all projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Photo Gallery ── */}
      <div className="bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            {photos.length > 0 ? (
              <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                {photos.map((url, idx) => (
                  <div
                    key={idx}
                    className="flex-shrink-0 w-full sm:w-2/3 lg:w-1/2 snap-start cursor-pointer"
                    onClick={() => { setSelectedPhotoIdx(idx); setLightboxOpen(true); }}
                  >
                    <img
                      src={url}
                      alt={`${project.projectName} photo ${idx + 1}`}
                      className="w-full h-64 sm:h-80 lg:h-96 object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                <svg className="w-24 h-24 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
            {photos.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                {photos.length} Photos
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && photos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button
            className="absolute top-4 right-4 text-white text-3xl font-light hover:text-gray-300 z-10"
            onClick={() => setLightboxOpen(false)}
          >
            &times;
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300"
            onClick={e => { e.stopPropagation(); setSelectedPhotoIdx(prev => Math.max(0, prev - 1)); }}
          >
            &#8249;
          </button>
          <img
            src={photos[selectedPhotoIdx]}
            alt=""
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300"
            onClick={e => { e.stopPropagation(); setSelectedPhotoIdx(prev => Math.min(photos.length - 1, prev + 1)); }}
          >
            &#8250;
          </button>
          <div className="absolute bottom-4 text-white text-sm">
            {selectedPhotoIdx + 1} / {photos.length}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Main Content ── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Builder Badge + Project Header */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                {project.builderLogoUrl ? (
                  <img src={project.builderLogoUrl} alt={project.builderName} className="w-10 h-10 rounded-full object-cover border-2 border-orange-200" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-lg font-bold">
                    {project.builderName?.[0]}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">{project.builderName}</span>
                    {project.verified && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Verified Builder
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{project.projectName}</h1>
              {project.tagline && <p className="text-gray-500 text-lg mb-3">{project.tagline}</p>}

              {/* RERA */}
              {project.reraId && (
                <div className="flex items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                    project.reraVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {project.reraVerified ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    RERA: {project.reraId}
                  </span>
                </div>
              )}

              {/* Location */}
              <p className="text-gray-500 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {[project.address, project.locality, project.city, project.state, project.pincode].filter(Boolean).join(', ')}
              </p>
            </div>

            {/* ── Key Stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Towers', value: project.totalTowers || '-', icon: '🏢' },
                { label: 'Total Units', value: project.totalUnits || '-', icon: '🏠' },
                { label: 'Available', value: project.availableUnits ?? '-', icon: '✅' },
                { label: 'Floors', value: project.totalFloorsMax || '-', icon: '📐' },
                { label: 'Possession', value: project.possessionDate ? new Date(project.possessionDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '-', icon: '📅' },
                { label: 'Progress', value: `${project.constructionProgressPercent}%`, icon: '🏗️' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
                  <div className="text-xl mb-1">{stat.icon}</div>
                  <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* ── Construction Progress Bar ── */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Construction Progress</h2>
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Overall Completion</span>
                  <span className="text-2xl font-bold text-orange-600">{project.constructionProgressPercent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 h-4 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${project.constructionProgressPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>Foundation</span>
                  <span>Structure</span>
                  <span>Finishing</span>
                  <span>Handover</span>
                </div>
              </div>
            </div>

            {/* ── Description ── */}
            {project.description && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">About This Project</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{project.description}</p>
              </div>
            )}

            {/* ── Unit Types ── */}
            {unitTypes.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Unit Types</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {unitTypes.map(unit => (
                    <div key={unit.id} className="border border-gray-200 rounded-xl p-4 hover:border-orange-300 transition-colors">
                      {/* Floor Plan Thumbnail */}
                      {unit.floorPlanUrl && (
                        <div
                          className="mb-3 rounded-lg overflow-hidden bg-gray-50 h-32 flex items-center justify-center cursor-pointer hover:opacity-80"
                          onClick={() => setFloorPlanUrl(unit.floorPlanUrl!)}
                        >
                          <img src={unit.floorPlanUrl} alt={`${unit.name} floor plan`} className="h-full object-contain" />
                        </div>
                      )}
                      <h3 className="font-semibold text-gray-900 mb-1">{unit.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                        <span>{unit.bhk} BHK</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span>{unit.carpetAreaSqft || unit.builtUpAreaSqft || unit.superBuiltUpAreaSqft || '-'} sqft</span>
                        {unit.bathrooms && (
                          <>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span>{unit.bathrooms} Bath</span>
                          </>
                        )}
                        {unit.balconies && (
                          <>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span>{unit.balconies} Balcony</span>
                          </>
                        )}
                      </div>
                      {unit.furnishing && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mb-2 inline-block">{unit.furnishing}</span>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-bold text-orange-600">{formatSalePrice(unit.basePricePaise)}</span>
                        {unit.availableUnits !== undefined && (
                          <span className="text-xs text-green-600 font-medium">{unit.availableUnits}/{unit.totalUnits} available</span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        {unit.floorPlanUrl && (
                          <button
                            onClick={() => setFloorPlanUrl(unit.floorPlanUrl!)}
                            className="flex-1 px-3 py-1.5 text-xs font-medium border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                          >
                            View Floor Plan
                          </button>
                        )}
                        <button
                          onClick={() => { setCalcUnitTypeId(unit.id); }}
                          className="flex-1 px-3 py-1.5 text-xs font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          Calculate Price
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Floor Plan Viewer Modal ── */}
            {floorPlanUrl && (
              <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setFloorPlanUrl(null)}>
                <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-auto p-4" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">Floor Plan</h3>
                    <button onClick={() => setFloorPlanUrl(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                  </div>
                  <img src={floorPlanUrl} alt="Floor Plan" className="w-full object-contain" />
                </div>
              </div>
            )}

            {/* ── Price Calculator ── */}
            {unitTypes.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Price Calculator</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Unit Type</label>
                    <select
                      value={calcUnitTypeId}
                      onChange={e => setCalcUnitTypeId(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      {unitTypes.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.bhk} BHK - {u.carpetAreaSqft || u.builtUpAreaSqft || u.superBuiltUpAreaSqft || '-'} sqft)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Floor Number</label>
                    <input
                      type="number"
                      min="1"
                      value={calcFloor}
                      onChange={e => setCalcFloor(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Preferred Facing Premium</label>
                    <div className="flex items-center gap-2 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={calcPreferredFacing}
                          onChange={e => setCalcPreferredFacing(e.target.checked)}
                          className="accent-orange-500 w-4 h-4"
                        />
                        <span className="text-sm text-gray-700">Add facing premium</span>
                      </label>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCalculatePrice}
                  disabled={calcLoading}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {calcLoading ? 'Calculating...' : 'Calculate Price'}
                </button>

                {priceBreakdown && (
                  <div className="mt-6 bg-orange-50 rounded-xl p-5 border border-orange-100">
                    <h3 className="font-semibold text-gray-900 mb-3">Price Breakdown</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Price</span>
                        <span className="font-medium">{formatSalePrice(priceBreakdown.basePricePaise)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Floor Rise Premium</span>
                        <span className="font-medium">{formatINR(priceBreakdown.floorRisePaise)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Facing Premium</span>
                        <span className="font-medium">{formatINR(priceBreakdown.facingPremiumPaise)}</span>
                      </div>
                      <div className="border-t border-orange-200 pt-2 flex justify-between">
                        <span className="text-gray-900 font-semibold">Total Price</span>
                        <span className="text-lg font-bold text-orange-600">{formatSalePrice(priceBreakdown.totalPricePaise)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Price per sqft</span>
                        <span>{formatINR(priceBreakdown.pricePerSqftPaise)}/sqft</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>EMI Estimate (20yr @8.5%)</span>
                        <span className="font-medium text-gray-700">{formatINR(priceBreakdown.estimatedEmiPaise)}/mo</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Payment Plans ── */}
            {paymentPlans.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Plan</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-100">
                        <th className="pb-3 font-medium">Milestone</th>
                        <th className="pb-3 font-medium">Percentage</th>
                        <th className="pb-3 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentPlans.map((plan: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-50">
                          <td className="py-3 font-medium text-gray-900">{plan.milestone || `Milestone ${idx + 1}`}</td>
                          <td className="py-3">
                            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                              {plan.percentage}%
                            </span>
                          </td>
                          <td className="py-3 text-gray-600">{plan.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Amenities Grid ── */}
            {project.amenities && project.amenities.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {project.amenities.map(amenity => (
                    <div key={amenity} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className="text-lg">{AMENITY_ICONS[amenity] || '✨'}</span>
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Bank Approvals ── */}
            {project.bankApprovals && project.bankApprovals.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Bank Approvals</h2>
                <div className="flex flex-wrap gap-3">
                  {project.bankApprovals.map(bank => (
                    <span key={bank} className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium border border-blue-100">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {bank}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Construction Updates Timeline ── */}
            {updates.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Construction Updates</h2>
                <div className="space-y-6">
                  {updates.map((update, idx) => (
                    <div key={update.id} className="relative pl-8">
                      {/* Timeline line */}
                      {idx < updates.length - 1 && (
                        <div className="absolute left-3 top-8 w-0.5 h-full bg-gray-200" />
                      )}
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-gray-900">{update.title}</h3>
                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                            {update.progressPercent}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">
                          {new Date(update.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        {update.description && <p className="text-sm text-gray-600 mb-2">{update.description}</p>}
                        {update.photos && update.photos.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto">
                            {update.photos.map((url, pIdx) => (
                              <img
                                key={pIdx}
                                src={url}
                                alt={`Update photo ${pIdx + 1}`}
                                className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Master Plan ── */}
            {project.masterPlanUrl && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Master Plan</h2>
                <div
                  className="cursor-pointer rounded-xl overflow-hidden bg-gray-50 hover:opacity-90 transition-opacity"
                  onClick={() => setMasterPlanZoom(true)}
                >
                  <img src={project.masterPlanUrl} alt="Master Plan" className="w-full object-contain max-h-96" />
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">Click to zoom</p>
              </div>
            )}

            {/* Master Plan Zoom Modal */}
            {masterPlanZoom && project.masterPlanUrl && (
              <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setMasterPlanZoom(false)}>
                <button className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300">&times;</button>
                <img src={project.masterPlanUrl} alt="Master Plan" className="max-h-[90vh] max-w-[95vw] object-contain" onClick={e => e.stopPropagation()} />
              </div>
            )}

            {/* ── Brochure & Walkthrough ── */}
            {(project.brochureUrl || project.walkthroughUrl) && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Downloads & Media</h2>
                <div className="flex flex-wrap gap-3">
                  {project.brochureUrl && (
                    <a
                      href={project.brochureUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Brochure
                    </a>
                  )}
                  {project.walkthroughUrl && (
                    <a
                      href={project.walkthroughUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-medium text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Watch Walkthrough
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* ── Similar Projects ── */}
            {similar.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Similar Projects</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {similar.map(p => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <div className="h-32 bg-gray-100">
                        {p.primaryPhotoUrl ? (
                          <img src={p.primaryPhotoUrl} alt={p.projectName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-gray-500">{p.builderName}</p>
                        <h3 className="font-semibold text-gray-900 text-sm group-hover:text-orange-600 truncate">{p.projectName}</h3>
                        <p className="text-xs text-gray-500">{[p.locality, p.city].filter(Boolean).join(', ')}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-orange-600">{formatSalePrice(p.minPricePaise)} - {formatSalePrice(p.maxPricePaise)}</span>
                          <span className="text-xs text-gray-500">{p.minBhk}-{p.maxBhk} BHK</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sticky Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Price Summary */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="text-sm text-gray-500 mb-1">Price Range</div>
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {formatSalePrice(project.minPricePaise)} - {formatSalePrice(project.maxPricePaise)}
                </div>
                <div className="text-xs text-gray-400 mb-4">
                  {project.minBhk === project.maxBhk
                    ? `${project.minBhk} BHK`
                    : `${project.minBhk}-${project.maxBhk} BHK`} | {project.projectStatus?.replace(/_/g, ' ')}
                </div>

                <button
                  onClick={() => setShowInquiry(true)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors mb-3"
                >
                  Send Inquiry
                </button>
                <button
                  onClick={() => setShowInquiry(true)}
                  className="w-full border border-orange-200 text-orange-600 hover:bg-orange-50 font-semibold py-3 rounded-xl transition-colors mb-3"
                >
                  Schedule Site Visit
                </button>
                {project.brochureUrl && (
                  <a
                    href={project.brochureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block text-center border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-3 rounded-xl transition-colors"
                  >
                    Download Brochure
                  </a>
                )}
              </div>

              {/* Builder Card */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  {project.builderLogoUrl ? (
                    <img src={project.builderLogoUrl} alt={project.builderName} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xl font-bold">
                      {project.builderName?.[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{project.builderName}</h3>
                    {project.verified && (
                      <span className="text-xs text-blue-600">Verified Builder</span>
                    )}
                  </div>
                </div>
              </div>

              {/* RERA Info */}
              {project.reraId && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-semibold text-green-800">RERA Registered</span>
                  </div>
                  <p className="text-xs text-green-700 font-mono">{project.reraId}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Inquiry Modal ── */}
      {showInquiry && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => { if (!inquirySending) setShowInquiry(false); }}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Send Inquiry</h3>
              <button onClick={() => setShowInquiry(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            {inquirySuccess ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">✅</div>
                <h4 className="font-semibold text-gray-900 mb-1">Inquiry Sent!</h4>
                <p className="text-sm text-gray-500 mb-4">The builder will contact you shortly.</p>
                <button onClick={() => { setShowInquiry(false); setInquirySuccess(false); }} className="text-orange-500 font-medium">Close</button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={inquiryName}
                    onChange={e => setInquiryName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={inquiryPhone}
                    onChange={e => setInquiryPhone(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={inquiryEmail}
                    onChange={e => setInquiryEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Message</label>
                  <textarea
                    rows={3}
                    value={inquiryMessage}
                    onChange={e => setInquiryMessage(e.target.value)}
                    placeholder="I am interested in this project..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={inquirySending}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {inquirySending ? 'Sending...' : 'Send Inquiry'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
