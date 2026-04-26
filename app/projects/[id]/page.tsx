'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import DateField from '@/components/DateField';

/* ── Leaflet map (dynamic, SSR off) ── */
const LeafletMap = dynamic(() => import('./LeafletMap').catch(() => () => null), { ssr: false });

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

/* ── YouTube URL → embed URL ── */
function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    let vid = '';
    if (u.hostname.includes('youtube.com')) vid = u.searchParams.get('v') || '';
    else if (u.hostname.includes('youtu.be')) vid = u.pathname.slice(1);
    if (vid) return `https://www.youtube.com/embed/${vid}?rel=0`;
  } catch {}
  return null;
}

/* ── EMI formula ── */
function calcEMI(principal: number, annualRate: number, tenureYears: number) {
  const r = annualRate / 12 / 100;
  const n = tenureYears * 12;
  if (r === 0) return { emi: principal / n, totalInterest: 0, totalPayment: principal };
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayment = emi * n;
  return { emi, totalInterest: totalPayment - principal, totalPayment };
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

/* ── Locality score data ── */
const LOCALITY_SCORES = [
  { name: 'Connectivity', score: 8.5, color: 'bg-blue-500' },
  { name: 'Safety', score: 7.8, color: 'bg-green-500' },
  { name: 'Livability', score: 8.2, color: 'bg-purple-500' },
  { name: 'Education', score: 7.5, color: 'bg-yellow-500' },
  { name: 'Healthcare', score: 8.0, color: 'bg-red-500' },
];

/* ── Mock nearby places ── */
const NEARBY_PLACES = [
  { name: 'Delhi Public School', type: 'School', distance: '1.2 km', icon: '🏫' },
  { name: 'Greenwood International School', type: 'School', distance: '2.5 km', icon: '🏫' },
  { name: 'St. Mary\'s High School', type: 'School', distance: '3.1 km', icon: '🏫' },
  { name: 'Apollo Hospital', type: 'Hospital', distance: '1.8 km', icon: '🏥' },
  { name: 'City Care Clinic', type: 'Hospital', distance: '0.9 km', icon: '🏥' },
  { name: 'MG Road Metro Station', type: 'Metro', distance: '2.0 km', icon: '🚇' },
  { name: 'Central Station', type: 'Metro', distance: '3.5 km', icon: '🚇' },
  { name: 'Phoenix Mall', type: 'Mall', distance: '1.5 km', icon: '🏬' },
  { name: 'City Centre Mall', type: 'Mall', distance: '2.8 km', icon: '🏬' },
];

/* ── Construction milestones ── */
const CONSTRUCTION_MILESTONES = [
  { name: 'Foundation', percent: 20 },
  { name: 'Structure', percent: 40 },
  { name: 'Plumbing / Electrical', percent: 60 },
  { name: 'Finishing', percent: 80 },
  { name: 'Handover', percent: 100 },
];

/* ── Mock price trend (6 quarters) ── */
function generatePriceTrend(basePricePaise: number) {
  const basePerSqft = basePricePaise / 100 / 1000; // approx per sqft in thousands
  const quarters = ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Q1 2026', 'Q2 2026'];
  const data = quarters.map((q, i) => {
    const factor = 1 + i * 0.025 + (Math.sin(i) * 0.01);
    return { quarter: q, pricePerSqft: Math.round(basePerSqft * factor) };
  });
  const first = data[0].pricePerSqft;
  const last = data[data.length - 1].pricePerSqft;
  const appreciation = ((last - first) / first * 100).toFixed(1);
  return { data, appreciation };
}

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
  possessionDate?: string;
  reraVerified?: boolean;
  amenities?: string[];
  minAreaSqft?: number;
  maxAreaSqft?: number;
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
  const [showAllPhotos, setShowAllPhotos] = useState(false);

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

  /* Visit modal */
  const [showVisit, setShowVisit] = useState(false);
  const [visitName, setVisitName] = useState('');
  const [visitPhone, setVisitPhone] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('10:00');
  const [visitSending, setVisitSending] = useState(false);
  const [visitSuccess, setVisitSuccess] = useState(false);

  /* Master plan zoom */
  const [masterPlanZoom, setMasterPlanZoom] = useState(false);

  /* Floor plan viewer */
  const [floorPlanUrl, setFloorPlanUrl] = useState<string | null>(null);
  const [floorPlanZoom, setFloorPlanZoom] = useState(1);

  /* EMI Calculator (Feature 1) */
  const [emiUnitTypeId, setEmiUnitTypeId] = useState('');
  const [emiLoanAmount, setEmiLoanAmount] = useState(0);
  const [emiRate, setEmiRate] = useState(8.5);
  const [emiTenure, setEmiTenure] = useState(20);

  /* Cost of ownership (Feature 7) */
  const [costUnitTypeId, setCostUnitTypeId] = useState('');

  /* Compare modal (Feature 11) */
  const [showCompare, setShowCompare] = useState(false);

  /* Brochure request (Feature 12) */
  const [brochureReqName, setBrochureReqName] = useState('');
  const [brochureReqPhone, setBrochureReqPhone] = useState('');
  const [brochureRequested, setBrochureRequested] = useState(false);

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
    if (unitTypes.length > 0 && !emiUnitTypeId) {
      setEmiUnitTypeId(unitTypes[0].id);
      // Auto-fill loan amount: price - 20% down payment
      const firstUnit = unitTypes[0];
      const priceINR = firstUnit.basePricePaise / 100;
      setEmiLoanAmount(Math.round(priceINR * 0.8));
    }
    if (unitTypes.length > 0 && !costUnitTypeId) {
      setCostUnitTypeId(unitTypes[0].id);
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

  async function handleVisitSubmit(e: React.FormEvent) {
    e.preventDefault();
    setVisitSending(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      await (api as any).createInquiry({
        builderProjectId: id,
        buyerName: visitName,
        buyerPhone: visitPhone,
        preferredVisitDate: visitDate,
        message: `Site visit request for ${visitDate} at ${visitTime}`,
      }, token);
      setVisitSuccess(true);
    } catch {
      alert('Failed to schedule visit. Please try again.');
    } finally {
      setVisitSending(false);
    }
  }

  const photos = project?.photos || [];
  const paymentPlans = useMemo(() => {
    if (!project?.paymentPlansJson) return [];
    try { return JSON.parse(project.paymentPlansJson); } catch { return []; }
  }, [project?.paymentPlansJson]);

  /* EMI computed values */
  const emiResult = useMemo(() => {
    if (emiLoanAmount <= 0) return null;
    return calcEMI(emiLoanAmount, emiRate, emiTenure);
  }, [emiLoanAmount, emiRate, emiTenure]);

  /* Possession countdown (Feature 2) */
  const possessionCountdown = useMemo(() => {
    if (!project?.possessionDate) return null;
    const target = new Date(project.possessionDate);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return null;
    const totalDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const months = Math.floor(totalDays / 30);
    const days = totalDays % 30;
    // Progress: assume 3 year project cycle
    const totalProjectDays = 3 * 365;
    const elapsed = totalProjectDays - totalDays;
    const progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalProjectDays) * 100)));
    return { months, days, totalDays, progressPercent };
  }, [project?.possessionDate]);

  /* Price trend (Feature 4) */
  const priceTrend = useMemo(() => {
    if (!project) return null;
    return generatePriceTrend(project.minPricePaise);
  }, [project?.minPricePaise]);

  /* Cost of ownership (Feature 7) */
  const costBreakdown = useMemo(() => {
    if (!costUnitTypeId || unitTypes.length === 0) return null;
    const unit = unitTypes.find(u => u.id === costUnitTypeId);
    if (!unit) return null;
    const basePaise = unit.basePricePaise;
    const baseINR = basePaise / 100;
    const gst = baseINR * 0.05;
    const registration = baseINR * 0.07;
    const stampDuty = baseINR * 0.06;
    const maintenanceDeposit = baseINR * 0.02;
    const total = baseINR + gst + registration + stampDuty + maintenanceDeposit;
    return {
      baseINR,
      gst,
      registration,
      stampDuty,
      maintenanceDeposit,
      total,
      unitName: unit.name,
    };
  }, [costUnitTypeId, unitTypes]);

  /* Video embed URL (Feature 14) */
  const videoEmbedUrl = useMemo(() => {
    if (!project?.walkthroughUrl) return null;
    const yt = toYouTubeEmbed(project.walkthroughUrl);
    if (yt) return yt;
    // If it's already an embeddable URL or a direct video
    return project.walkthroughUrl;
  }, [project?.walkthroughUrl]);

  /* WhatsApp URL (Feature 13) */
  const whatsappUrl = useMemo(() => {
    if (!project) return '#';
    const text = encodeURIComponent(`Hi, I'm interested in ${project.projectName} in ${project.city}. Please share more details.`);
    return `https://wa.me/919999999999?text=${text}`;
  }, [project]);

  function formatCostINR(amount: number): string {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} Lakh`;
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  }

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
      {/* ── Photo Gallery — Airbnb grid style ── */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="relative rounded-2xl overflow-hidden">
          {/* Offer Badges */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            {project.projectStatus === 'UNDER_CONSTRUCTION' && (
              <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                Early Bird Offer
              </span>
            )}
            <span className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              Zero Brokerage
            </span>
          </div>

          {photos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-1 sm:h-[420px]">
              {/* Main large photo */}
              <div className="sm:col-span-2 sm:row-span-2 cursor-pointer relative group"
                onClick={() => { setSelectedPhotoIdx(0); setLightboxOpen(true); }}>
                <img src={photos[0]} alt={project.projectName}
                  className="w-full h-64 sm:h-full object-cover group-hover:brightness-90 transition" />
              </div>
              {/* 4 smaller photos */}
              {photos.slice(1, 5).map((url, idx) => (
                <div key={idx} className="hidden sm:block cursor-pointer relative group"
                  onClick={() => { setSelectedPhotoIdx(idx + 1); setLightboxOpen(true); }}>
                  <img src={url} alt={`Photo ${idx + 2}`}
                    className="w-full h-full object-cover group-hover:brightness-90 transition" />
                  {/* "+N more" overlay on last visible photo */}
                  {idx === 3 && photos.length > 5 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center"
                      onClick={e => { e.stopPropagation(); setShowAllPhotos(true); }}>
                      <span className="text-white text-lg font-bold">+{photos.length - 5} more</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 sm:h-[420px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-2xl">
              <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          )}

          {/* Bottom bar with actions */}
          {photos.length > 0 && (
            <div className="absolute bottom-4 right-4 flex gap-2">
              {project.walkthroughUrl && (
                <a href={project.walkthroughUrl} target="_blank" rel="noopener noreferrer"
                  className="bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-semibold px-3 py-2 rounded-lg shadow-md hover:bg-white transition flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>
                  Walkthrough
                </a>
              )}
              <button onClick={() => setShowAllPhotos(true)}
                className="bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-semibold px-3 py-2 rounded-lg shadow-md hover:bg-white transition flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                All {photos.length} Photos
              </button>
            </div>
          )}
        </div>

        {/* Documents strip */}
        {(project.masterPlanUrl || project.brochureUrl) && (
          <div className="flex gap-3 mt-3">
            {project.masterPlanUrl && (
              <a href={project.masterPlanUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#003B95] rounded-xl text-sm font-medium hover:bg-blue-100 transition border border-blue-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                Master Plan
              </a>
            )}
            {project.brochureUrl && (
              <a href={project.brochureUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#003B95] rounded-xl text-sm font-medium hover:bg-blue-100 transition border border-blue-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Download Brochure
              </a>
            )}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && photos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={() => setLightboxOpen(false)}>
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-medium">{selectedPhotoIdx + 1} / {photos.length}</span>
            <button onClick={() => setLightboxOpen(false)} className="text-white/70 hover:text-white text-2xl">&times;</button>
          </div>
          {/* Main image */}
          <div className="flex-1 flex items-center justify-center relative">
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-xl transition"
              onClick={e => { e.stopPropagation(); setSelectedPhotoIdx(prev => Math.max(0, prev - 1)); }}>
              &#8249;
            </button>
            <img src={photos[selectedPhotoIdx]} alt=""
              className="max-h-[75vh] max-w-[85vw] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-xl transition"
              onClick={e => { e.stopPropagation(); setSelectedPhotoIdx(prev => Math.min(photos.length - 1, prev + 1)); }}>
              &#8250;
            </button>
          </div>
          {/* Thumbnail strip */}
          <div className="flex gap-1.5 justify-center px-4 py-3 overflow-x-auto" onClick={e => e.stopPropagation()}>
            {photos.map((url, idx) => (
              <button key={idx} onClick={() => setSelectedPhotoIdx(idx)}
                className={`w-14 h-10 rounded-md overflow-hidden shrink-0 transition-all ${
                  idx === selectedPhotoIdx ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-80'
                }`}>
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── All Photos Modal ── */}
      {showAllPhotos && photos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="sticky top-0 bg-white border-b z-10">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{project.projectName} — {photos.length} Photos</h2>
              <button onClick={() => setShowAllPhotos(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>
          </div>
          <div className="max-w-5xl mx-auto px-4 py-6">
            {/* Group photos: Exterior (first 3), Interior (next batch), Amenities (rest) */}
            {[
              { label: 'Exterior & Overview', start: 0, end: Math.min(3, photos.length) },
              { label: 'Interior & Rooms', start: 3, end: Math.min(7, photos.length) },
              { label: 'Amenities & Surroundings', start: 7, end: photos.length },
            ].filter(g => g.start < photos.length && g.start < g.end).map(group => (
              <div key={group.label} className="mb-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">{group.label}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {photos.slice(group.start, group.end).map((url, idx) => (
                    <div key={group.start + idx}
                      className="aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group"
                      onClick={() => { setSelectedPhotoIdx(group.start + idx); setShowAllPhotos(false); setLightboxOpen(true); }}>
                      <img src={url} alt={`Photo ${group.start + idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Unit type floor plans */}
            {unitTypes.some(u => u.floorPlanUrl) && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Floor Plans</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {unitTypes.filter(u => u.floorPlanUrl).map(u => (
                    <div key={u.id} className="aspect-[4/3] rounded-xl overflow-hidden border bg-white p-2 flex flex-col">
                      <img src={u.floorPlanUrl!} alt={`${u.name} floor plan`} className="flex-1 object-contain" />
                      <p className="text-xs font-medium text-gray-600 text-center mt-1">{u.name} — {u.bhk} BHK</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Master Plan */}
            {project.masterPlanUrl && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Master Plan</h3>
                <div className="rounded-xl overflow-hidden border bg-white p-3">
                  <img src={project.masterPlanUrl} alt="Master Plan" className="w-full object-contain max-h-[500px]" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Main Content ── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Builder Badge + Project Header + Builder Trust Score (Feature 6) */}
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
                    {/* Builder Trust Score Badge (Feature 6) */}
                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Score: 4.2/5
                    </span>
                  </div>
                </div>
              </div>

              {/* Builder Trust Score Detail (Feature 6) */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">
                <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Builder Trust Metrics
                </h3>
                <div className="space-y-2">
                  {[
                    { label: 'On-time Delivery', value: 85 },
                    { label: 'RERA Compliance', value: 100 },
                    { label: 'Quality Rating', value: 78 },
                  ].map(m => (
                    <div key={m.label} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-32 flex-shrink-0">{m.label}</span>
                      <div className="flex-1 bg-amber-200/50 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${m.value}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-amber-700 w-10 text-right">{m.value}%</span>
                    </div>
                  ))}
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

              {/* Possession Countdown (Feature 2) */}
              {possessionCountdown && (
                <div className="mt-4 bg-gradient-to-r from-orange-50 to-green-50 border border-orange-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Possession Countdown
                    </span>
                    <span className={`text-sm font-bold ${possessionCountdown.totalDays < 180 ? 'text-green-600' : 'text-orange-600'}`}>
                      {possessionCountdown.months > 0 && `${possessionCountdown.months} months `}{possessionCountdown.days} days
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-1000 ${
                        possessionCountdown.totalDays < 180
                          ? 'bg-gradient-to-r from-green-400 to-green-600'
                          : 'bg-gradient-to-r from-orange-400 to-orange-600'
                      }`}
                      style={{ width: `${possessionCountdown.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                    <span>Launch</span>
                    <span>Possession: {new Date(project.possessionDate!).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              )}
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

            {/* ── Construction Timeline (Feature 9 — enhanced progress) ── */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Construction Progress</h2>
              <div className="relative mb-6">
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
              </div>

              {/* Milestone Timeline (Feature 9) */}
              <div className="relative flex items-center justify-between mt-6">
                {/* Background line */}
                <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200" />
                <div
                  className="absolute top-3 left-0 h-0.5 bg-orange-500 transition-all duration-1000"
                  style={{ width: `${Math.min(100, project.constructionProgressPercent)}%` }}
                />
                {CONSTRUCTION_MILESTONES.map((ms) => {
                  const reached = project.constructionProgressPercent >= ms.percent;
                  const current = project.constructionProgressPercent >= ms.percent - 20 && project.constructionProgressPercent < ms.percent;
                  return (
                    <div key={ms.name} className="relative flex flex-col items-center z-10">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                          reached
                            ? 'bg-orange-500 border-orange-500 text-white'
                            : current
                              ? 'bg-white border-orange-400 text-orange-500 ring-4 ring-orange-100'
                              : 'bg-white border-gray-300 text-gray-400'
                        }`}
                      >
                        {reached ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="text-[8px]">{ms.percent}%</span>
                        )}
                      </div>
                      <span className={`text-[10px] mt-1 text-center max-w-[60px] leading-tight ${reached ? 'text-orange-600 font-semibold' : 'text-gray-400'}`}>
                        {ms.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Inline construction updates */}
              {updates.length > 0 && (
                <div className="mt-6 border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Updates</h3>
                  <div className="space-y-3">
                    {updates.slice(0, 3).map(update => (
                      <div key={update.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-orange-600">{update.progressPercent}%</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{update.title}</span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(update.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          {update.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{update.description}</p>}
                        </div>
                        {update.photos && update.photos.length > 0 && (
                          <img src={update.photos[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Description ── */}
            {project.description && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">About This Project</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{project.description}</p>
              </div>
            )}

            {/* ── Unit Types (enhanced with Floor Plan Viewer — Feature 10) ── */}
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
                          onClick={() => { setFloorPlanUrl(unit.floorPlanUrl!); setFloorPlanZoom(1); }}
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
                            onClick={() => { setFloorPlanUrl(unit.floorPlanUrl!); setFloorPlanZoom(1); }}
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

            {/* ── Floor Plan Viewer Modal (Feature 10 — with zoom) ── */}
            {floorPlanUrl && (
              <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setFloorPlanUrl(null)}>
                <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-auto p-4" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">Floor Plan</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setFloorPlanZoom(z => Math.max(0.5, z - 0.25))}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600 font-bold"
                      >
                        -
                      </button>
                      <span className="text-xs text-gray-500 w-12 text-center">{Math.round(floorPlanZoom * 100)}%</span>
                      <button
                        onClick={() => setFloorPlanZoom(z => Math.min(3, z + 0.25))}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600 font-bold"
                      >
                        +
                      </button>
                      <button onClick={() => setFloorPlanUrl(null)} className="text-gray-400 hover:text-gray-600 text-2xl ml-2">&times;</button>
                    </div>
                  </div>
                  <div className="overflow-auto max-h-[70vh] flex items-center justify-center">
                    <img
                      src={floorPlanUrl}
                      alt="Floor Plan"
                      className="transition-transform duration-200"
                      style={{ transform: `scale(${floorPlanZoom})`, transformOrigin: 'center center' }}
                    />
                  </div>
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

            {/* ── EMI Calculator (Feature 1) ── */}
            {unitTypes.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">EMI Calculator</h2>
                <p className="text-xs text-gray-400 mb-4">Calculate your monthly EMI for home loan</p>

                <div className="space-y-5">
                  {/* Unit type selector */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Select Unit Type</label>
                    <select
                      value={emiUnitTypeId}
                      onChange={e => {
                        setEmiUnitTypeId(e.target.value);
                        const unit = unitTypes.find(u => u.id === e.target.value);
                        if (unit) setEmiLoanAmount(Math.round(unit.basePricePaise / 100 * 0.8));
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      {unitTypes.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.bhk} BHK) - {formatSalePrice(u.basePricePaise)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Loan amount slider */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-500">Loan Amount (80% of price)</label>
                      <span className="text-sm font-bold text-gray-900">{formatCostINR(emiLoanAmount)}</span>
                    </div>
                    <input
                      type="range"
                      min={100000}
                      max={emiLoanAmount * 2 || 50000000}
                      step={100000}
                      value={emiLoanAmount}
                      onChange={e => setEmiLoanAmount(Number(e.target.value))}
                      className="w-full accent-orange-500"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>{formatCostINR(100000)}</span>
                      <span>{formatCostINR(emiLoanAmount * 2 || 50000000)}</span>
                    </div>
                  </div>

                  {/* Interest rate */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-500">Interest Rate (% p.a.)</label>
                      <span className="text-sm font-bold text-gray-900">{emiRate}%</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={15}
                      step={0.1}
                      value={emiRate}
                      onChange={e => setEmiRate(Number(e.target.value))}
                      className="w-full accent-orange-500"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>5%</span>
                      <span>15%</span>
                    </div>
                  </div>

                  {/* Tenure slider */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-500">Loan Tenure</label>
                      <span className="text-sm font-bold text-gray-900">{emiTenure} years</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={30}
                      step={1}
                      value={emiTenure}
                      onChange={e => setEmiTenure(Number(e.target.value))}
                      className="w-full accent-orange-500"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>5 yrs</span>
                      <span>30 yrs</span>
                    </div>
                  </div>
                </div>

                {/* EMI Result Card */}
                {emiResult && (
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
                      <div className="text-xs text-gray-500 mb-1">Monthly EMI</div>
                      <div className="text-xl font-bold text-orange-600">{formatCostINR(emiResult.emi)}</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                      <div className="text-xs text-gray-500 mb-1">Total Interest</div>
                      <div className="text-xl font-bold text-blue-600">{formatCostINR(emiResult.totalInterest)}</div>
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                      <div className="text-xs text-gray-500 mb-1">Total Payment</div>
                      <div className="text-xl font-bold text-green-600">{formatCostINR(emiResult.totalPayment)}</div>
                    </div>
                  </div>
                )}

                {/* Visual bar */}
                {emiResult && (
                  <div className="mt-4">
                    <div className="flex rounded-full overflow-hidden h-3">
                      <div
                        className="bg-orange-500"
                        style={{ width: `${(emiLoanAmount / emiResult.totalPayment) * 100}%` }}
                        title="Principal"
                      />
                      <div
                        className="bg-blue-400"
                        style={{ width: `${(emiResult.totalInterest / emiResult.totalPayment) * 100}%` }}
                        title="Interest"
                      />
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Principal</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Interest</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Cost of Ownership Breakdown (Feature 7) ── */}
            {unitTypes.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Cost of Ownership</h2>
                <p className="text-xs text-gray-400 mb-4">Total estimated cost including taxes and charges</p>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Select Unit Type</label>
                  <select
                    value={costUnitTypeId}
                    onChange={e => setCostUnitTypeId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    {unitTypes.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.bhk} BHK)</option>
                    ))}
                  </select>
                </div>

                {costBreakdown && (
                  <div className="space-y-3">
                    {[
                      { label: 'Base Price', value: costBreakdown.baseINR, color: 'bg-orange-500', pct: 83 },
                      { label: 'GST (5%)', value: costBreakdown.gst, color: 'bg-blue-500', pct: 5 },
                      { label: 'Registration (7%)', value: costBreakdown.registration, color: 'bg-purple-500', pct: 7 },
                      { label: 'Stamp Duty (6%)', value: costBreakdown.stampDuty, color: 'bg-green-500', pct: 6 },
                      { label: 'Maintenance Deposit (est. 2%)', value: costBreakdown.maintenanceDeposit, color: 'bg-yellow-500', pct: 2 },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="font-medium text-gray-900">{formatCostINR(item.value)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className={`${item.color} h-1.5 rounded-full`} style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 pt-3 flex justify-between">
                      <span className="text-base font-bold text-gray-900">Total Cost</span>
                      <span className="text-base font-bold text-orange-600">{formatCostINR(costBreakdown.total)}</span>
                    </div>
                    {/* Stacked bar */}
                    <div className="flex rounded-full overflow-hidden h-4 mt-2">
                      <div className="bg-orange-500" style={{ width: '83%' }} title="Base Price" />
                      <div className="bg-blue-500" style={{ width: '5%' }} title="GST" />
                      <div className="bg-purple-500" style={{ width: '5%' }} title="Registration" />
                      <div className="bg-green-500" style={{ width: '5%' }} title="Stamp Duty" />
                      <div className="bg-yellow-500" style={{ width: '2%' }} title="Maintenance" />
                    </div>
                    <div className="flex flex-wrap gap-3 text-[10px] text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Base</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> GST</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Registration</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Stamp Duty</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Maintenance</span>
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

            {/* ── Locality Score Card (Feature 3) ── */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Locality Scores</h2>
              <p className="text-xs text-gray-400 mb-4">
                {project.locality ? `${project.locality}, ${project.city}` : project.city}
              </p>
              <div className="space-y-4">
                {LOCALITY_SCORES.map(ls => (
                  <div key={ls.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 font-medium">{ls.name}</span>
                      <span className="text-sm font-bold text-gray-900">{ls.score}/10</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className={`${ls.color} h-3 rounded-full transition-all duration-700`}
                        style={{ width: `${ls.score * 10}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-4 italic">
                Locality scores are indicative and based on available data
              </p>
            </div>

            {/* ── Price Trend Graph (Feature 4) ── */}
            {priceTrend && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Price Trend</h2>
                    <p className="text-xs text-gray-400">Price per sqft over last 6 quarters</p>
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    +{priceTrend.appreciation}%
                  </span>
                </div>
                {/* CSS Bar Chart */}
                <div className="flex items-end gap-3 h-40">
                  {priceTrend.data.map((d, i) => {
                    const maxVal = Math.max(...priceTrend.data.map(x => x.pricePerSqft));
                    const heightPct = (d.pricePerSqft / maxVal) * 100;
                    return (
                      <div key={d.quarter} className="flex-1 flex flex-col items-center">
                        <span className="text-[10px] font-semibold text-gray-700 mb-1">₹{d.pricePerSqft}</span>
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 ${
                            i === priceTrend.data.length - 1 ? 'bg-orange-500' : 'bg-orange-200'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-[9px] text-gray-400 mt-1 text-center leading-tight">{d.quarter}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Nearby Places / Map (Feature 5) ── */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Nearby Infrastructure</h2>

              {/* Leaflet Map (if lat/lng available) */}
              {project.lat && project.lng && (
                <div className="mb-4 rounded-xl overflow-hidden border border-gray-200" style={{ height: 300 }}>
                  <LeafletMap lat={project.lat} lng={project.lng} projectName={project.projectName} nearbyPlaces={NEARBY_PLACES} />
                </div>
              )}

              {/* Nearby places list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {NEARBY_PLACES.map((place, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-xl">{place.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{place.name}</div>
                      <div className="text-xs text-gray-500">{place.type}</div>
                    </div>
                    <span className="text-xs font-semibold text-orange-600 flex-shrink-0">{place.distance}</span>
                  </div>
                ))}
              </div>
            </div>

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

            {/* ── Construction Updates Timeline (full, kept from original) ── */}
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

            {/* ── Virtual Tour / Video Embed (Feature 14) ── */}
            {project.walkthroughUrl && videoEmbedUrl && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Virtual Tour
                </h2>
                <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
                  {videoEmbedUrl.includes('youtube.com/embed') ? (
                    <iframe
                      src={videoEmbedUrl}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  ) : (
                    <video
                      src={videoEmbedUrl}
                      controls
                      className="absolute inset-0 w-full h-full object-contain"
                    />
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
                  onClick={() => setShowVisit(true)}
                  className="w-full border border-orange-200 text-orange-600 hover:bg-orange-50 font-semibold py-3 rounded-xl transition-colors mb-3"
                >
                  Schedule Site Visit
                </button>

                {/* WhatsApp Inquiry (Feature 13) */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors mb-3"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Chat on WhatsApp
                </a>

                {/* Download Brochure / Request Brochure (Feature 12) */}
                {project.brochureUrl ? (
                  <a
                    href={project.brochureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block text-center border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-3 rounded-xl transition-colors"
                  >
                    Download Brochure
                  </a>
                ) : (
                  <div className="border border-gray-200 rounded-xl p-4">
                    {brochureRequested ? (
                      <div className="text-center py-2">
                        <span className="text-sm text-green-600 font-medium">Brochure request sent!</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-gray-500 mb-2 font-medium">Request Brochure</p>
                        <input
                          type="text"
                          placeholder="Your name"
                          value={brochureReqName}
                          onChange={e => setBrochureReqName(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                        <input
                          type="tel"
                          placeholder="Phone number"
                          value={brochureReqPhone}
                          onChange={e => setBrochureReqPhone(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                        <button
                          onClick={() => {
                            if (brochureReqName && brochureReqPhone) setBrochureRequested(true);
                          }}
                          disabled={!brochureReqName || !brochureReqPhone}
                          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-colors text-sm disabled:opacity-50"
                        >
                          Request Brochure
                        </button>
                      </>
                    )}
                  </div>
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

              {/* Compare Projects CTA (Feature 11) */}
              {similar.length > 0 && (
                <button
                  onClick={() => setShowCompare(true)}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-orange-300 text-orange-600 hover:bg-orange-50 font-semibold py-3 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Compare with Similar Projects
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating WhatsApp Button (Feature 13) ── */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110"
        title="Chat on WhatsApp"
      >
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      {/* ── Compare Projects Modal (Feature 11) ── */}
      {showCompare && similar.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCompare(false)}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[85vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Compare Projects</h3>
              <button onClick={() => setShowCompare(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="py-3 px-4 text-left text-gray-500 font-medium w-36">Feature</th>
                    <th className="py-3 px-4 text-left font-semibold text-orange-600 bg-orange-50 rounded-tl-lg">
                      {project.projectName}
                      <span className="block text-xs text-gray-400 font-normal">This project</span>
                    </th>
                    {similar.slice(0, 2).map(s => (
                      <th key={s.id} className="py-3 px-4 text-left font-medium text-gray-700">
                        <Link href={`/projects/${s.id}`} className="hover:text-orange-600">{s.projectName}</Link>
                        <span className="block text-xs text-gray-400 font-normal">{s.builderName}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-500">Price Range</td>
                    <td className="py-3 px-4 bg-orange-50 font-semibold">{formatSalePrice(project.minPricePaise)} - {formatSalePrice(project.maxPricePaise)}</td>
                    {similar.slice(0, 2).map(s => (
                      <td key={s.id} className="py-3 px-4">{formatSalePrice(s.minPricePaise)} - {formatSalePrice(s.maxPricePaise)}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-500">BHK</td>
                    <td className="py-3 px-4 bg-orange-50">{project.minBhk === project.maxBhk ? `${project.minBhk} BHK` : `${project.minBhk}-${project.maxBhk} BHK`}</td>
                    {similar.slice(0, 2).map(s => (
                      <td key={s.id} className="py-3 px-4">{s.minBhk === s.maxBhk ? `${s.minBhk} BHK` : `${s.minBhk}-${s.maxBhk} BHK`}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-500">Area (sqft)</td>
                    <td className="py-3 px-4 bg-orange-50">{project.minAreaSqft && project.maxAreaSqft ? `${project.minAreaSqft}-${project.maxAreaSqft}` : '-'}</td>
                    {similar.slice(0, 2).map(s => (
                      <td key={s.id} className="py-3 px-4">{(s as any).minAreaSqft && (s as any).maxAreaSqft ? `${(s as any).minAreaSqft}-${(s as any).maxAreaSqft}` : '-'}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-500">Amenities</td>
                    <td className="py-3 px-4 bg-orange-50">{project.amenities?.length || 0}</td>
                    {similar.slice(0, 2).map(s => (
                      <td key={s.id} className="py-3 px-4">{(s as any).amenities?.length || '-'}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-500">Possession</td>
                    <td className="py-3 px-4 bg-orange-50">{project.possessionDate ? new Date(project.possessionDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '-'}</td>
                    {similar.slice(0, 2).map(s => (
                      <td key={s.id} className="py-3 px-4">{(s as any).possessionDate ? new Date((s as any).possessionDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '-'}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-500">RERA</td>
                    <td className="py-3 px-4 bg-orange-50">
                      {project.reraVerified ? (
                        <span className="text-green-600 font-medium">Verified</span>
                      ) : project.reraId ? (
                        <span className="text-yellow-600">Registered</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    {similar.slice(0, 2).map(s => (
                      <td key={s.id} className="py-3 px-4">
                        {(s as any).reraVerified ? (
                          <span className="text-green-600 font-medium">Verified</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-500">Progress</td>
                    <td className="py-3 px-4 bg-orange-50">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${project.constructionProgressPercent}%` }} />
                        </div>
                        <span className="text-xs font-semibold">{project.constructionProgressPercent}%</span>
                      </div>
                    </td>
                    {similar.slice(0, 2).map(s => (
                      <td key={s.id} className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${s.constructionProgressPercent}%` }} />
                          </div>
                          <span className="text-xs font-semibold">{s.constructionProgressPercent}%</span>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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

      {/* ── Schedule Visit Modal ── */}
      {showVisit && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => { if (!visitSending) setShowVisit(false); }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Schedule Site Visit</h3>
              <button onClick={() => setShowVisit(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            {visitSuccess ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">📅</div>
                <h4 className="font-semibold text-gray-900 mb-1">Visit Scheduled!</h4>
                <p className="text-sm text-gray-500 mb-4">The builder will confirm your visit shortly.</p>
                <button onClick={() => { setShowVisit(false); setVisitSuccess(false); }} className="text-orange-500 font-medium">Close</button>
              </div>
            ) : (
              <form onSubmit={handleVisitSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Your Name *</label>
                  <input
                    required
                    value={visitName}
                    onChange={e => setVisitName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Phone *</label>
                  <input
                    required
                    type="tel"
                    value={visitPhone}
                    onChange={e => setVisitPhone(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Preferred Date *</label>
                  <DateField
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={visitDate}
                    onChange={e => setVisitDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Preferred Time</label>
                  <select
                    value={visitTime}
                    onChange={e => setVisitTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="17:00">5:00 PM</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={visitSending}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {visitSending ? 'Scheduling...' : 'Schedule Visit'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
