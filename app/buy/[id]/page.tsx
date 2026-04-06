'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

/* ── Price formatter for sale prices (paise → Lakh/Cr) ── */
function formatSalePrice(paise: number): string {
  const inr = paise / 100;
  if (inr >= 10000000) {
    const cr = inr / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  const lakh = inr / 100000;
  return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)} Lakh`;
}

function formatPricePerSqft(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}/sqft`;
}

/* ── Types ── */
interface SaleProperty {
  id: string;
  title: string;
  description?: string;
  city: string;
  state?: string;
  locality?: string;
  address?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  pricePaise: number;
  pricePerSqftPaise?: number;
  maintenancePaise?: number;
  negotiable?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  areaSqft?: number;
  carpetAreaSqft?: number;
  builtUpAreaSqft?: number;
  superBuiltUpAreaSqft?: number;
  floor?: number;
  totalFloors?: number;
  facing?: string;
  furnishing?: string;
  age?: string;
  parking?: string;
  propertyType: string;
  possessionStatus?: string;
  possessionDate?: string;
  reraVerified?: boolean;
  reraNumber?: string;
  reraExpiry?: string;
  verified?: boolean;
  sellerType?: string;
  sellerName?: string;
  sellerPhone?: string;
  primaryPhotoUrl?: string;
  photos?: string[];
  floorPlanUrl?: string;
  videoTourUrl?: string;
  amenities?: string[];
  linkedListingId?: string;
  rentalAvgRating?: number;
  rentalReviewCount?: number;
  rentalMonthlyPaise?: number;
  createdAt?: string;
  vastuCompliant?: boolean;
  gatedCommunity?: boolean;
  societyName?: string;
}

interface SimilarProperty {
  id: string;
  title: string;
  city: string;
  locality?: string;
  pricePaise: number;
  bedrooms?: number;
  areaSqft?: number;
  propertyType: string;
  primaryPhotoUrl?: string;
  reraVerified?: boolean;
}

export default function BuyPropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [property, setProperty] = useState<SaleProperty | null>(null);
  const [similar, setSimilar] = useState<SimilarProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [sellerPhone, setSellerPhone] = useState<string | null>(null);
  const [showInquiry, setShowInquiry] = useState(false);
  const [showVisit, setShowVisit] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  /* EMI Calculator State */
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('8.5');
  const [tenure, setTenure] = useState(20);

  /* Inquiry Form State */
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryFinancing, setInquiryFinancing] = useState('HOME_LOAN');
  const [inquiryVisitDate, setInquiryVisitDate] = useState('');
  const [inquirySending, setInquirySending] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  /* Visit Form State */
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('10:00');
  const [visitName, setVisitName] = useState('');
  const [visitPhone, setVisitPhone] = useState('');
  const [visitSending, setVisitSending] = useState(false);
  const [visitSuccess, setVisitSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const raw = await (api as any).getSaleProperty(id);
        const prop = {
          ...raw,
          pricePaise: raw.pricePaise ?? raw.askingPricePaise,
          pricePerSqftPaise: raw.pricePerSqftPaise ?? raw.pricePerSqftPaise,
          maintenancePaise: raw.maintenancePaise ?? raw.maintenancePaise,
          negotiable: raw.negotiable ?? raw.priceNegotiable,
          bedrooms: raw.bedrooms ?? raw.bhk,
          areaSqft: raw.areaSqft ?? raw.carpetAreaSqft,
          photos: raw.photos ?? raw.photoUrls ?? [],
          latitude: raw.latitude ?? raw.lat,
          longitude: raw.longitude ?? raw.lng,
        };
        setProperty(prop);
        if (prop.pricePaise) {
          setLoanAmount(String(Math.round(prop.pricePaise * 0.8 / 100)));
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
    (async () => {
      try {
        const res = await (api as any).getSimilarSaleProperties(id);
        setSimilar(res?.content || res || []);
      } catch {
        setSimilar([]);
      }
    })();
  }, [id]);

  /* ── EMI Calculation ── */
  const emi = useMemo(() => {
    const P = Number(loanAmount);
    const annualRate = Number(interestRate);
    const N = tenure * 12;
    if (!P || !annualRate || !N) return null;
    const r = annualRate / 100 / 12;
    const emiVal = (P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
    const totalPayment = emiVal * N;
    const totalInterest = totalPayment - P;
    return {
      monthly: Math.round(emiVal),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
      principal: P,
    };
  }, [loanAmount, interestRate, tenure]);

  /* ── Rental Yield ── */
  const rentalYield = useMemo(() => {
    if (!property?.rentalMonthlyPaise || !property?.pricePaise) return null;
    return ((property.rentalMonthlyPaise * 12) / property.pricePaise * 100).toFixed(2);
  }, [property]);

  async function handleInquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    setInquirySending(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await (api as any).createInquiry({
        salePropertyId: id,
        name: inquiryName,
        phone: inquiryPhone,
        email: inquiryEmail,
        message: inquiryMessage,
        financingType: inquiryFinancing,
        preferredVisitDate: inquiryVisitDate || undefined,
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      // Combine date + time into ISO 8601 scheduledAt for backend
      const scheduledAt = `${visitDate}T${visitTime}:00+05:30`;
      await (api as any).scheduleSiteVisit({
        salePropertyId: id,
        scheduledAt,
      }, token);
      setVisitSuccess(true);
    } catch {
      alert('Failed to schedule visit. Please try again.');
    } finally {
      setVisitSending(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/3" />
            <div className="grid grid-cols-4 gap-2 h-80">
              <div className="col-span-2 row-span-2 bg-slate-200 rounded-xl" />
              <div className="bg-slate-200 rounded-xl" />
              <div className="bg-slate-200 rounded-xl" />
              <div className="bg-slate-200 rounded-xl" />
              <div className="bg-slate-200 rounded-xl" />
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-4">
                <div className="h-6 bg-slate-200 rounded w-1/2" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
              </div>
              <div className="bg-slate-200 rounded-xl h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🏠</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Property not found</h2>
          <p className="text-slate-500 text-sm mb-6">This property may have been removed or the link is invalid.</p>
          <Link href="/buy" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm">
            Back to Buy
          </Link>
        </div>
      </div>
    );
  }

  const allPhotos = property.photos?.length ? property.photos : (property.primaryPhotoUrl ? [property.primaryPhotoUrl] : []);
  const photoUrl = (url: string) => url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL || ''}${url}`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/buy" className="hover:text-orange-500 transition-colors">Buy</Link>
          <span>/</span>
          <Link href={`/buy/search?city=${property.city}`} className="hover:text-orange-500 transition-colors">{property.city}</Link>
          {property.locality && (
            <>
              <span>/</span>
              <span>{property.locality}</span>
            </>
          )}
          <span>/</span>
          <span className="text-slate-900 font-medium truncate">{property.title}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* ── Photo Gallery ── */}
        {allPhotos.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-4 gap-2 rounded-2xl overflow-hidden" style={{ maxHeight: '420px' }}>
              {/* Main photo */}
              <div
                className="col-span-2 row-span-2 relative cursor-pointer group"
                onClick={() => { setSelectedPhotoIdx(0); setLightboxOpen(true); }}
              >
                <img src={photoUrl(allPhotos[0])} alt={property.title} className="w-full h-full object-cover group-hover:brightness-90 transition" />
              </div>
              {/* Secondary photos */}
              {allPhotos.slice(1, 5).map((photo, i) => (
                <div
                  key={i}
                  className="relative cursor-pointer group bg-slate-100"
                  onClick={() => { setSelectedPhotoIdx(i + 1); setLightboxOpen(true); }}
                >
                  <img src={photoUrl(photo)} alt={`Photo ${i + 2}`} className="w-full h-full object-cover group-hover:brightness-90 transition" />
                  {i === 3 && allPhotos.length > 5 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">+{allPhotos.length - 5} more</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Floor plan / Video links */}
            <div className="flex gap-3 mt-3">
              {property.floorPlanUrl && (
                <a href={property.floorPlanUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                  Floor Plan
                </a>
              )}
              {property.videoTourUrl && (
                <a href={property.videoTourUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Video Tour
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── Lightbox ── */}
        {lightboxOpen && allPhotos.length > 0 && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
            <button className="absolute top-4 right-4 text-white/80 hover:text-white z-10" onClick={() => setLightboxOpen(false)}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-black/30 rounded-full p-2"
              onClick={(e) => { e.stopPropagation(); setSelectedPhotoIdx((prev) => (prev - 1 + allPhotos.length) % allPhotos.length); }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <img
              src={photoUrl(allPhotos[selectedPhotoIdx])}
              alt=""
              className="max-w-[90vw] max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-black/30 rounded-full p-2"
              onClick={(e) => { e.stopPropagation(); setSelectedPhotoIdx((prev) => (prev + 1) % allPhotos.length); }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <div className="absolute bottom-4 text-white/60 text-sm">{selectedPhotoIdx + 1} / {allPhotos.length}</div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Title & Badges */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {property.reraVerified && (
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">RERA Verified</span>
                )}
                {property.verified && (
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">Verified</span>
                )}
                {property.possessionStatus && (
                  <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
                    {property.possessionStatus.replace(/_/g, ' ').toLowerCase()}
                  </span>
                )}
                {property.sellerType && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    property.sellerType === 'OWNER' ? 'bg-emerald-100 text-emerald-700'
                    : property.sellerType === 'BUILDER' ? 'bg-blue-100 text-blue-700'
                    : 'bg-amber-100 text-amber-700'
                  }`}>
                    {property.sellerType}
                  </span>
                )}
                {property.vastuCompliant && (
                  <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">Vastu</span>
                )}
                {property.gatedCommunity && (
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">Gated Community</span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{property.title}</h1>
              <p className="text-slate-500 text-sm mt-1">
                {property.locality ? `${property.locality}, ` : ''}{property.city}{property.state ? `, ${property.state}` : ''}
                {property.pincode ? ` - ${property.pincode}` : ''}
              </p>
              {property.societyName && (
                <p className="text-slate-400 text-xs mt-1">{property.societyName}</p>
              )}
            </div>

            {/* ── Overview Grid ── */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Overview</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {property.bedrooms != null && (
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-400 mb-1">BHK</p>
                    <p className="text-base font-bold text-slate-900">{property.bedrooms}</p>
                  </div>
                )}
                {property.bathrooms != null && (
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-400 mb-1">Bathrooms</p>
                    <p className="text-base font-bold text-slate-900">{property.bathrooms}</p>
                  </div>
                )}
                {property.areaSqft != null && (
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-400 mb-1">Area</p>
                    <p className="text-base font-bold text-slate-900">{property.areaSqft.toLocaleString('en-IN')} sqft</p>
                  </div>
                )}
                {property.facing && (
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-400 mb-1">Facing</p>
                    <p className="text-base font-bold text-slate-900 capitalize">{property.facing.replace(/_/g, ' ').toLowerCase()}</p>
                  </div>
                )}
                {property.floor != null && (
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-400 mb-1">Floor</p>
                    <p className="text-base font-bold text-slate-900">{property.floor}{property.totalFloors ? ` / ${property.totalFloors}` : ''}</p>
                  </div>
                )}
                {property.furnishing && (
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-400 mb-1">Furnishing</p>
                    <p className="text-base font-bold text-slate-900 capitalize">{property.furnishing.replace(/_/g, ' ').toLowerCase()}</p>
                  </div>
                )}
                {property.age && (
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-400 mb-1">Age</p>
                    <p className="text-base font-bold text-slate-900">{property.age}</p>
                  </div>
                )}
                {property.parking && (
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-400 mb-1">Parking</p>
                    <p className="text-base font-bold text-slate-900 capitalize">{property.parking.replace(/_/g, ' ').toLowerCase()}</p>
                  </div>
                )}
                {property.balconies != null && (
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-400 mb-1">Balconies</p>
                    <p className="text-base font-bold text-slate-900">{property.balconies}</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Area Details ── */}
            {(property.carpetAreaSqft || property.builtUpAreaSqft || property.superBuiltUpAreaSqft) && (
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Area Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {property.carpetAreaSqft != null && (
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm text-slate-500">Carpet Area</span>
                      <span className="text-sm font-bold text-slate-900">{property.carpetAreaSqft.toLocaleString('en-IN')} sqft</span>
                    </div>
                  )}
                  {property.builtUpAreaSqft != null && (
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm text-slate-500">Built-up Area</span>
                      <span className="text-sm font-bold text-slate-900">{property.builtUpAreaSqft.toLocaleString('en-IN')} sqft</span>
                    </div>
                  )}
                  {property.superBuiltUpAreaSqft != null && (
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm text-slate-500">Super Built-up</span>
                      <span className="text-sm font-bold text-slate-900">{property.superBuiltUpAreaSqft.toLocaleString('en-IN')} sqft</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Price Section ── */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Price</h2>
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-3xl font-extrabold text-slate-900">{formatSalePrice(property.pricePaise)}</span>
                {property.negotiable && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">Negotiable</span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                {property.pricePerSqftPaise != null && (
                  <span>{formatPricePerSqft(property.pricePerSqftPaise)}</span>
                )}
                {property.maintenancePaise != null && (
                  <span>Maintenance: ₹{Math.round(property.maintenancePaise / 100).toLocaleString('en-IN')}/month</span>
                )}
              </div>
            </div>

            {/* ── EMI Calculator ── */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">EMI Calculator</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Loan Amount (INR)</label>
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g. 5000000"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Tenure: {tenure} years</label>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    value={tenure}
                    onChange={(e) => setTenure(Number(e.target.value))}
                    className="w-full mt-2 accent-orange-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>5 yrs</span>
                    <span>30 yrs</span>
                  </div>
                </div>
              </div>
              {emi && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5">
                  <div className="text-center mb-4">
                    <p className="text-xs text-slate-500 mb-1">Your Monthly EMI</p>
                    <p className="text-3xl font-extrabold text-orange-600">₹{emi.monthly.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-slate-400">Principal</p>
                      <p className="text-sm font-bold text-slate-900">₹{emi.principal.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Total Interest</p>
                      <p className="text-sm font-bold text-slate-900">₹{emi.totalInterest.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Total Payment</p>
                      <p className="text-sm font-bold text-slate-900">₹{emi.totalPayment.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center mt-3">
                    EMI = [P x R x (1+R)^N] / [(1+R)^N - 1] where P = Principal, R = Monthly rate, N = Months
                  </p>
                </div>
              )}
            </div>

            {/* ── Description ── */}
            {property.description && (
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Description</h2>
                <div className={`text-sm text-slate-600 leading-relaxed whitespace-pre-line ${!descExpanded ? 'line-clamp-4' : ''}`}>
                  {property.description}
                </div>
                {property.description.length > 300 && (
                  <button
                    onClick={() => setDescExpanded(!descExpanded)}
                    className="text-orange-500 hover:text-orange-600 text-sm font-medium mt-2"
                  >
                    {descExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}

            {/* ── Society Amenities ── */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Society Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {property.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700 capitalize">{amenity.replace(/_/g, ' ').toLowerCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── RERA Details ── */}
            {property.reraVerified && (
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">RERA Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {property.reraNumber && (
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                      <span className="text-sm text-slate-500">RERA Number</span>
                      <span className="text-sm font-bold text-green-700">{property.reraNumber}</span>
                    </div>
                  )}
                  {property.reraExpiry && (
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                      <span className="text-sm text-slate-500">RERA Expiry</span>
                      <span className="text-sm font-bold text-green-700">{property.reraExpiry}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                    <span className="text-sm text-slate-500">Status</span>
                    <span className="text-sm font-bold text-green-700">Registered</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Rental History ── */}
            {property.linkedListingId && (
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Rental History</h2>
                <p className="text-xs text-slate-400 mb-4">This property was previously listed for rent on Safar</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {property.rentalAvgRating != null && (
                    <div className="text-center p-3 bg-orange-50 rounded-xl">
                      <p className="text-xs text-slate-400 mb-1">Avg Rating</p>
                      <p className="text-lg font-bold text-orange-600">{property.rentalAvgRating.toFixed(1)}</p>
                      <div className="flex justify-center mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg key={i} className={`w-3 h-3 ${i < Math.round(property.rentalAvgRating!) ? 'text-orange-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  )}
                  {property.rentalReviewCount != null && (
                    <div className="text-center p-3 bg-orange-50 rounded-xl">
                      <p className="text-xs text-slate-400 mb-1">Reviews</p>
                      <p className="text-lg font-bold text-slate-900">{property.rentalReviewCount}</p>
                    </div>
                  )}
                  {property.rentalMonthlyPaise != null && (
                    <div className="text-center p-3 bg-orange-50 rounded-xl">
                      <p className="text-xs text-slate-400 mb-1">Monthly Rent</p>
                      <p className="text-lg font-bold text-slate-900">₹{Math.round(property.rentalMonthlyPaise / 100).toLocaleString('en-IN')}</p>
                    </div>
                  )}
                  {rentalYield && (
                    <div className="text-center p-3 bg-orange-50 rounded-xl">
                      <p className="text-xs text-slate-400 mb-1">Rental Yield</p>
                      <p className="text-lg font-bold text-green-600">{rentalYield}%</p>
                    </div>
                  )}
                </div>
                <Link
                  href={`/listings/${property.linkedListingId}`}
                  className="inline-flex items-center gap-1 text-orange-500 hover:text-orange-600 text-sm font-medium mt-4"
                >
                  View Rental Listing
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
              </div>
            )}

            {/* ── Location ── */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Location</h2>
              <p className="text-sm text-slate-600 mb-4">
                {property.address || `${property.locality ? property.locality + ', ' : ''}${property.city}${property.state ? ', ' + property.state : ''}${property.pincode ? ' - ' + property.pincode : ''}`}
              </p>
              {property.latitude && property.longitude && (
                <div className="bg-slate-100 rounded-xl h-64 flex items-center justify-center text-slate-400 text-sm">
                  <a
                    href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors"
                  >
                    View on Google Maps
                  </a>
                </div>
              )}
            </div>

            {/* ── Similar Properties ── */}
            {similar.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Similar Properties</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {similar.slice(0, 6).map((sp) => (
                    <Link
                      key={sp.id}
                      href={`/buy/${sp.id}`}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow group"
                    >
                      <div className="relative h-36 bg-slate-100 overflow-hidden">
                        {sp.primaryPhotoUrl ? (
                          <img
                            src={sp.primaryPhotoUrl.startsWith('http') ? sp.primaryPhotoUrl : `${process.env.NEXT_PUBLIC_API_URL || ''}${sp.primaryPhotoUrl}`}
                            alt={sp.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 text-3xl">🏠</div>
                        )}
                        {sp.reraVerified && (
                          <span className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">RERA</span>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-slate-900 text-sm truncate group-hover:text-orange-600 transition-colors">{sp.title}</h3>
                        <p className="text-slate-500 text-xs mt-0.5">{sp.locality ? `${sp.locality}, ` : ''}{sp.city}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          {sp.bedrooms != null && <span>{sp.bedrooms} BHK</span>}
                          {sp.areaSqft != null && <span>{sp.areaSqft.toLocaleString('en-IN')} sqft</span>}
                        </div>
                        <p className="text-base font-bold text-slate-900 mt-2">{formatSalePrice(sp.pricePaise)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right Sidebar — Contact Seller ── */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white border border-slate-200 rounded-xl p-6 sticky top-20 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Contact Seller</h3>
              {property.sellerName && (
                <p className="text-sm text-slate-600">{property.sellerName}</p>
              )}
              {property.sellerType && (
                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                  property.sellerType === 'OWNER' ? 'bg-emerald-100 text-emerald-700'
                  : property.sellerType === 'BUILDER' ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700'
                }`}>
                  {property.sellerType}
                </span>
              )}

              {/* Show Number */}
              <button
                onClick={async () => {
                  if (sellerPhone) { setShowPhone(true); return; }
                  try {
                    const contact = await api.getSellerContact(property.id);
                    setSellerPhone(contact?.phone || 'Not available');
                    setShowPhone(true);
                  } catch {
                    setSellerPhone('Not available');
                    setShowPhone(true);
                  }
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition text-sm"
              >
                {showPhone ? (sellerPhone || 'Not available') : 'Show Number'}
              </button>

              {/* Send Inquiry */}
              <button
                onClick={() => setShowInquiry(true)}
                className="w-full border-2 border-orange-500 text-orange-500 hover:bg-orange-50 font-semibold py-3 rounded-xl transition text-sm"
              >
                Send Inquiry
              </button>

              {/* Schedule Visit */}
              <button
                onClick={() => setShowVisit(true)}
                className="w-full border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold py-3 rounded-xl transition text-sm"
              >
                Schedule Visit
              </button>

              {/* Price summary */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs text-slate-400">Asking Price</span>
                  <span className="text-lg font-extrabold text-slate-900">{formatSalePrice(property.pricePaise)}</span>
                </div>
                {property.pricePerSqftPaise != null && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-400">Price/sqft</span>
                    <span className="text-sm font-semibold text-slate-600">{formatPricePerSqft(property.pricePerSqftPaise)}</span>
                  </div>
                )}
                {emi && (
                  <div className="flex justify-between items-baseline mt-1">
                    <span className="text-xs text-slate-400">Est. EMI</span>
                    <span className="text-sm font-semibold text-orange-600">₹{emi.monthly.toLocaleString('en-IN')}/mo</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Inquiry Modal ── */}
      {showInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowInquiry(false); setInquirySuccess(false); }} />
          <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => { setShowInquiry(false); setInquirySuccess(false); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {inquirySuccess ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✓</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Inquiry Sent!</h3>
                <p className="text-slate-500 text-sm">The seller will get back to you soon.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Send Inquiry</h3>
                <p className="text-xs text-slate-400 mb-4">for {property.title}</p>
                <form onSubmit={handleInquirySubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Phone</label>
                    <input
                      type="tel"
                      required
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={inquiryEmail}
                      onChange={(e) => setInquiryEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Message</label>
                    <textarea
                      rows={3}
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      placeholder="I am interested in this property..."
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Financing Type</label>
                    <select
                      value={inquiryFinancing}
                      onChange={(e) => setInquiryFinancing(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="HOME_LOAN">Home Loan</option>
                      <option value="CASH">Cash / Self-funded</option>
                      <option value="PART_LOAN">Part Loan + Cash</option>
                      <option value="UNDECIDED">Not decided yet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Preferred Visit Date (optional)</label>
                    <input
                      type="date"
                      value={inquiryVisitDate}
                      onChange={(e) => setInquiryVisitDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={inquirySending}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-xl transition text-sm"
                  >
                    {inquirySending ? 'Sending...' : 'Send Inquiry'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Schedule Visit Modal ── */}
      {showVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowVisit(false); setVisitSuccess(false); }} />
          <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <button onClick={() => { setShowVisit(false); setVisitSuccess(false); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {visitSuccess ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">📅</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Visit Scheduled!</h3>
                <p className="text-slate-500 text-sm">You will receive a confirmation shortly.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Schedule Site Visit</h3>
                <p className="text-xs text-slate-400 mb-4">for {property.title}</p>
                <form onSubmit={handleVisitSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={visitName}
                      onChange={(e) => setVisitName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Phone</label>
                    <input
                      type="tel"
                      required
                      value={visitPhone}
                      onChange={(e) => setVisitPhone(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Visit Date</label>
                    <input
                      type="date"
                      required
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Preferred Time</label>
                    <select
                      value={visitTime}
                      onChange={(e) => setVisitTime(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-xl transition text-sm"
                  >
                    {visitSending ? 'Scheduling...' : 'Schedule Visit'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
