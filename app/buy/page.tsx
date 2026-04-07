'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import CityAutocomplete from '@/components/CityAutocomplete';

/* ── Price formatter (paise to Lakh/Cr) ── */
function formatSalePrice(paise: number): string {
  if (!paise) return 'Price on Request';
  const inr = paise / 100;
  if (inr >= 10000000) {
    const cr = inr / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  const lakh = inr / 100000;
  return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)} L`;
}

/* 1 Lakh INR = 1,00,000 INR = 10,000,000 paise */
const LAKH_IN_PAISE = 10000000;
const CR_IN_PAISE = 1000000000;

const PRICE_OPTIONS = [
  { label: 'No min', value: '' },
  { label: '10 L', value: String(10 * LAKH_IN_PAISE) },
  { label: '20 L', value: String(20 * LAKH_IN_PAISE) },
  { label: '30 L', value: String(30 * LAKH_IN_PAISE) },
  { label: '50 L', value: String(50 * LAKH_IN_PAISE) },
  { label: '75 L', value: String(75 * LAKH_IN_PAISE) },
  { label: '1 Cr', value: String(1 * CR_IN_PAISE) },
  { label: '1.5 Cr', value: String(1.5 * CR_IN_PAISE) },
  { label: '2 Cr', value: String(2 * CR_IN_PAISE) },
  { label: '3 Cr', value: String(3 * CR_IN_PAISE) },
  { label: '5 Cr', value: String(5 * CR_IN_PAISE) },
];

const PRICE_MAX_OPTIONS = [
  { label: 'No max', value: '' },
  ...PRICE_OPTIONS.slice(1),
];

const TAB_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'projects', label: 'New Projects' },
  { key: 'resale', label: 'Resale' },
  { key: 'plots', label: 'Plots' },
] as const;

type TabKey = typeof TAB_OPTIONS[number]['key'];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'UNDER_CONSTRUCTION', label: 'Under Construction' },
  { value: 'READY_TO_MOVE', label: 'Ready to Move' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
];

const QUICK_SERVICES = [
  {
    label: 'Builder Projects',
    desc: 'RERA-verified new launches from top builders',
    href: '/buy?tab=projects',
    emoji: '🏗️',
    gradient: 'from-blue-500 to-blue-700',
    tag: 'Popular',
    tagColor: 'bg-blue-500',
  },
  {
    label: 'Buy Properties',
    desc: 'Resale apartments, villas & independent houses',
    href: '/buy?tab=resale',
    emoji: '🏡',
    gradient: 'from-green-500 to-emerald-700',
    tag: null,
    tagColor: '',
  },
  {
    label: 'Sale Agreement',
    desc: 'E-stamp, e-sign & registration in 48 hours',
    href: '/services/agreement',
    emoji: '📝',
    gradient: 'from-orange-500 to-orange-700',
    tag: 'Fast',
    tagColor: 'bg-orange-500',
  },
  {
    label: 'Home Loan',
    desc: 'Compare rates from 15+ banks. Free eligibility check',
    href: '/services/homeloan',
    emoji: '🏦',
    gradient: 'from-purple-500 to-purple-700',
    tag: 'Free',
    tagColor: 'bg-green-500',
  },
  {
    label: 'Legal Services',
    desc: 'Title search, due diligence & risk assessment',
    href: '/services/legal',
    emoji: '🛡️',
    gradient: 'from-teal-500 to-teal-700',
    tag: null,
    tagColor: '',
  },
  {
    label: 'Home Interiors',
    desc: '3D design, materials & project management',
    href: '/services/interiors',
    emoji: '🎨',
    gradient: 'from-pink-500 to-rose-700',
    tag: 'New',
    tagColor: 'bg-pink-500',
  },
];

const POPULAR_CITIES = [
  { name: 'Mumbai', count: '2,400+', gradient: 'from-blue-600 to-blue-800' },
  { name: 'Bangalore', count: '3,100+', gradient: 'from-green-600 to-green-800' },
  { name: 'Hyderabad', count: '1,800+', gradient: 'from-purple-600 to-purple-800' },
  { name: 'Pune', count: '1,500+', gradient: 'from-orange-600 to-orange-800' },
  { name: 'Chennai', count: '1,200+', gradient: 'from-teal-600 to-teal-800' },
  { name: 'Delhi', count: '2,000+', gradient: 'from-amber-600 to-amber-800' },
  { name: 'Kolkata', count: '900+', gradient: 'from-rose-600 to-rose-800' },
  { name: 'Jaipur', count: '600+', gradient: 'from-pink-600 to-pink-800' },
];

const WHY_SAFAR = [
  {
    title: 'RERA Verified',
    desc: 'All projects are RERA-registered and verified for your safety and peace of mind.',
    icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    color: 'text-green-600 bg-green-50 border-green-200',
  },
  {
    title: 'Direct from Builders',
    desc: 'Connect directly with builders and property owners. No middlemen, no brokerage.',
    icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  {
    title: 'Price Transparency',
    desc: 'Real-time pricing with floor rise, facing premium, and GST breakdowns included.',
    icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
  },
  {
    title: 'Construction Tracking',
    desc: 'Live construction progress updates with photos and possession timelines.',
    icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
];

/* ── Types ── */
interface BuilderProject {
  id: string;
  projectName: string;
  builderName: string;
  builderLogoUrl?: string;
  city: string;
  locality?: string;
  minPricePaise: number;
  maxPricePaise: number;
  minBhk: number;
  maxBhk: number;
  possessionDate?: string;
  constructionProgressPercent: number;
  projectStatus: string;
  reraId?: string;
  reraVerified?: boolean;
  totalUnits?: number;
  availableUnits?: number;
  primaryPhotoUrl?: string;
  amenities?: string[];
}

interface SaleProperty {
  id: string;
  title: string;
  city: string;
  locality?: string;
  askingPricePaise: number;
  pricePaise?: number; // alias for backward compat
  pricePerSqftPaise?: number;
  bedrooms?: number;
  bathrooms?: number;
  carpetAreaSqft?: number;
  builtUpAreaSqft?: number;
  areaSqft?: number; // alias
  salePropertyType?: string;
  propertyType?: string; // alias
  transactionType?: string;
  primaryPhotoUrl?: string;
  possessionStatus?: string;
  reraVerified?: boolean;
  furnishing?: string;
  sellerType?: string;
}

type MixedResult =
  | { type: 'builder'; data: BuilderProject }
  | { type: 'sale'; data: SaleProperty };

interface AutocompleteSuggestion {
  id: string;
  label: string;
  sublabel: string;
  source: 'builder' | 'sale';
}

/* ── Component ── */
export default function BuyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* Tab from URL */
  const urlTab = searchParams.get('tab') as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(
    urlTab && TAB_OPTIONS.some(t => t.key === urlTab) ? urlTab : 'all'
  );

  /* Filters */
  const [searchQuery, setSearchQuery] = useState('');
  const [city, setCity] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [minBhk, setMinBhk] = useState('');
  const [maxBhk, setMaxBhk] = useState('');
  const [status, setStatus] = useState('');
  const [reraOnly, setReraOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [quickBhk, setQuickBhk] = useState<number | null>(null);

  /* Results */
  const [results, setResults] = useState<MixedResult[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  /* Autocomplete */
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 12;
  const totalPages = Math.ceil(totalHits / PAGE_SIZE);

  /* ── Build params shared between builders and sale ── */
  function buildBuilderParams(pageNum: number): Record<string, string> {
    const params: Record<string, string> = { page: String(pageNum), size: String(PAGE_SIZE), sort: sortBy };
    if (city) params.city = city;
    if (searchQuery) params.query = searchQuery;
    if (priceMin) params.priceMin = priceMin;
    if (priceMax) params.priceMax = priceMax;
    if (status) params.projectStatus = status;
    if (reraOnly) params.reraVerified = 'true';
    const bhkVal = quickBhk || (minBhk ? parseInt(minBhk) : 0);
    const bhkMax = quickBhk || (maxBhk ? parseInt(maxBhk) : 0);
    if (bhkVal || bhkMax) {
      const list: string[] = [];
      for (let i = (bhkVal || 1); i <= (bhkMax || 5); i++) list.push(String(i));
      if (list.length) params.bhk = list.join(',');
    }
    return params;
  }

  function buildSaleParams(pageNum: number): Record<string, string> {
    const params: Record<string, string> = { page: String(pageNum), size: String(PAGE_SIZE), sort: sortBy };
    if (city) params.city = city;
    if (searchQuery) params.query = searchQuery;
    if (priceMin) params.priceMin = priceMin;
    if (priceMax) params.priceMax = priceMax;
    if (reraOnly) params.reraVerified = 'true';
    if (status === 'READY_TO_MOVE') params.possessionStatus = 'READY_TO_MOVE';
    if (status === 'UNDER_CONSTRUCTION') params.possessionStatus = 'UNDER_CONSTRUCTION';
    const bhkVal = quickBhk || (minBhk ? parseInt(minBhk) : 0);
    if (bhkVal) params.bedrooms = String(bhkVal);

    if (activeTab === 'resale') params.transactionType = 'RESALE';
    if (activeTab === 'plots') params.type = 'PLOT';

    return params;
  }

  /* ── Fetch results ── */
  const fetchResults = useCallback(async (pageNum = 0) => {
    setLoading(true);
    try {
      const mixed: MixedResult[] = [];
      let total = 0;

      if (activeTab === 'all') {
        const [builderRes, saleRes] = await Promise.all([
          api.searchBuilderProjects(buildBuilderParams(pageNum)).catch(() => null),
          api.searchSaleProperties(buildSaleParams(pageNum)).catch(() => null),
        ]);
        const builders = (builderRes?.content || []).map((d: BuilderProject) => ({ type: 'builder' as const, data: d }));
        const sales = (saleRes?.content || []).map((d: SaleProperty) => ({ type: 'sale' as const, data: d }));
        // Interleave: alternate builder and sale
        const maxLen = Math.max(builders.length, sales.length);
        for (let i = 0; i < maxLen; i++) {
          if (i < builders.length) mixed.push(builders[i]);
          if (i < sales.length) mixed.push(sales[i]);
        }
        total = (builderRes?.totalHits || builderRes?.totalElements || 0) + (saleRes?.totalHits || saleRes?.totalElements || 0);
      } else if (activeTab === 'projects') {
        const res = await api.searchBuilderProjects(buildBuilderParams(pageNum));
        (res?.content || []).forEach((d: BuilderProject) => mixed.push({ type: 'builder', data: d }));
        total = res?.totalHits || res?.totalElements || 0;
      } else {
        // resale or plots
        const res = await api.searchSaleProperties(buildSaleParams(pageNum));
        (res?.content || []).forEach((d: SaleProperty) => mixed.push({ type: 'sale', data: d }));
        total = res?.totalHits || res?.totalElements || 0;
      }

      setResults(mixed);
      setTotalHits(total);
      setPage(pageNum);
      setSearched(true);
    } catch {
      setResults([]);
      setTotalHits(0);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, city, searchQuery, priceMin, priceMax, minBhk, maxBhk, status, reraOnly, sortBy, quickBhk]);

  /* Initial load */
  useEffect(() => { fetchResults(0); }, [fetchResults]);

  /* ── Autocomplete ── */
  useEffect(() => {
    if (searchQuery.length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const results: AutocompleteSuggestion[] = [];
        if (activeTab === 'all' || activeTab === 'projects') {
          const builderSugs = await api.autocompleteBuilderProjects(searchQuery).catch(() => []);
          (builderSugs || []).forEach((s: any) => {
            results.push({
              id: s.id,
              label: s.projectName || s.builderName || 'Project',
              sublabel: [s.builderName, s.locality, s.city].filter(Boolean).join(', '),
              source: 'builder',
            });
          });
        }
        if (activeTab === 'all' || activeTab === 'resale' || activeTab === 'plots') {
          const saleSugs = await api.autocompleteSaleProperties(searchQuery).catch(() => []);
          (saleSugs || []).forEach((s: any) => {
            results.push({
              id: s.id,
              label: s.title || s.propertyType || 'Property',
              sublabel: [s.locality, s.city].filter(Boolean).join(', '),
              source: 'sale',
            });
          });
        }
        setSuggestions(results.slice(0, 10));
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  /* Close suggestions on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSearch() {
    setShowSuggestions(false);
    fetchResults(0);
  }

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    router.replace(`/buy?tab=${tab}`, { scroll: false });
  }

  function handleCityQuick(c: string) {
    setCity(c);
  }

  function handleQuickBhk(n: number) {
    if (quickBhk === n) {
      setQuickBhk(null);
      setMinBhk('');
      setMaxBhk('');
    } else {
      setQuickBhk(n);
      setMinBhk(String(n));
      setMaxBhk(String(n));
    }
  }

  function resetFilters() {
    setSearchQuery('');
    setCity('');
    setPriceMin('');
    setPriceMax('');
    setMinBhk('');
    setMaxBhk('');
    setStatus('');
    setReraOnly(false);
    setSortBy('relevance');
    setQuickBhk(null);
  }

  function statusLabel(s: string): string {
    switch (s) {
      case 'UPCOMING': return 'Upcoming';
      case 'UNDER_CONSTRUCTION': return 'Under Construction';
      case 'READY_TO_MOVE': return 'Ready to Move';
      case 'COMPLETED': return 'Completed';
      default: return s;
    }
  }

  function possessionLabel(d?: string): string {
    if (!d) return '';
    try {
      const date = new Date(d);
      return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
  function imgSrc(url?: string): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `${API_URL}${url}`;
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ================================================================ */}
      {/*  HERO — Booking.com style                                        */}
      {/* ================================================================ */}
      <section className="relative z-30 bg-[#003B95] text-white overflow-visible">
        <div className="relative max-w-7xl mx-auto px-4 pt-8 pb-10 sm:pt-12 sm:pb-14">
          {/* Header text */}
          <div className="max-w-2xl mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 leading-tight">
              Find your dream property
            </h1>
            <p className="text-white/70 text-sm sm:text-base">
              New launches, resale apartments, villas & plots — RERA verified, zero brokerage.
            </p>
          </div>

          {/* Trust pills */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="bg-white/10 text-white/90 text-xs font-semibold px-3 py-1 rounded-full border border-white/20">
              RERA Verified
            </span>
            <span className="bg-white/10 text-white/90 text-xs font-semibold px-3 py-1 rounded-full border border-white/20">
              Zero Brokerage
            </span>
            <span className="bg-white/10 text-white/90 text-xs font-semibold px-3 py-1 rounded-full border border-white/20">
              Direct from Builders
            </span>
          </div>

          {/* ── Search Card — white card matching homepage ── */}
          <div className="bg-white rounded-2xl shadow-xl p-2 max-w-5xl">
            {/* Tabs */}
            <div className="flex gap-1 mb-2 overflow-x-auto px-1 pt-1">
              {TAB_OPTIONS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-[#003B95] text-white'
                      : 'text-gray-500 hover:text-[#003B95] hover:bg-blue-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search input row */}
            <div className="flex flex-col sm:flex-row gap-1">
            <div ref={searchRef} className="relative flex-1">
              <div className="relative flex items-center bg-white border border-gray-200 rounded-lg">
                <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Search by project, builder, city or locality..."
                  className="w-full pl-11 pr-4 py-2.5 text-gray-800 text-sm outline-none bg-transparent rounded-lg"
                />

                {/* Autocomplete dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-72 overflow-y-auto z-50">
                    {suggestions.map((s, i) => (
                      <button
                        key={`${s.source}-${s.id}-${i}`}
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          if (s.source === 'builder') {
                            router.push(`/projects/${s.id}`);
                          } else {
                            router.push(`/buy/${s.id}`);
                          }
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-orange-50 transition flex items-center gap-3 border-b border-gray-50 last:border-0"
                      >
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          s.source === 'builder'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {s.source === 'builder' ? 'PROJECT' : 'PROPERTY'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{s.label}</p>
                          <p className="text-xs text-gray-400 truncate">{s.sublabel}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Search button */}
            <button
              type="button"
              onClick={handleSearch}
              className="bg-[#003B95] hover:bg-[#00296b] text-white font-semibold rounded-lg px-6 py-2.5 text-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
            </div>

            {/* Filter row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 mt-1 px-1 pb-1">
              <div>
                <CityAutocomplete
                  value={city}
                  onChange={setCity}
                  placeholder="Any city"
                  label="City"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Price Min</label>
                <select
                  value={priceMin}
                  onChange={e => setPriceMin(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white outline-none focus:ring-2 focus:ring-[#003B95]/30"
                >
                  {PRICE_OPTIONS.map(o => (
                    <option key={`min-${o.value}`} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Price Max</label>
                <select
                  value={priceMax}
                  onChange={e => setPriceMax(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white outline-none focus:ring-2 focus:ring-[#003B95]/30"
                >
                  {PRICE_MAX_OPTIONS.map(o => (
                    <option key={`max-${o.value}`} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Min BHK</label>
                <select
                  value={minBhk}
                  onChange={e => { setMinBhk(e.target.value); setQuickBhk(null); }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white outline-none focus:ring-2 focus:ring-[#003B95]/30"
                >
                  <option value="">Any</option>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} BHK</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Max BHK</label>
                <select
                  value={maxBhk}
                  onChange={e => { setMaxBhk(e.target.value); setQuickBhk(null); }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white outline-none focus:ring-2 focus:ring-[#003B95]/30"
                >
                  <option value="">Any</option>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} BHK</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white outline-none focus:ring-2 focus:ring-[#003B95]/30"
                >
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

          </div>

          {/* Quick filters below search card */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={reraOnly}
                onChange={e => setReraOnly(e.target.checked)}
                className="w-4 h-4 text-white border-white/40 rounded focus:ring-white bg-white/20"
              />
              <span className="text-sm text-white/90 font-medium">RERA Verified Only</span>
            </label>
            <div className="h-5 w-px bg-white/30" />
            <div className="flex items-center gap-1.5">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onClick={() => handleQuickBhk(n)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    quickBhk === n
                      ? 'bg-white text-[#003B95]'
                      : 'bg-white/15 text-white/80 hover:bg-white/25 border border-white/20'
                  }`}
                >
                  {n} BHK
                </button>
              ))}
            </div>
            <div className="ml-auto">
              <button
                onClick={resetFilters}
                className="text-sm text-white/70 hover:text-white transition font-medium"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  QUICK SERVICES                                                  */}
      {/* ================================================================ */}
      {/* ── Services Grid — MagicBricks/Housing.com inspired ── */}
      <section className="max-w-7xl mx-auto px-4 py-8 relative z-10 mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Property Services</h2>
        <p className="text-sm text-gray-500 mb-5">Everything you need to buy, finance & design your dream home</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_SERVICES.map(svc => (
            <Link
              key={svc.label}
              href={svc.href}
              className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group"
            >
              {/* Tag badge */}
              {svc.tag && (
                <span className={`absolute top-2.5 right-2.5 ${svc.tagColor} text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider z-10`}>
                  {svc.tag}
                </span>
              )}

              {/* Gradient header with emoji */}
              <div className={`bg-gradient-to-br ${svc.gradient} p-4 pb-5 flex items-center justify-center`}>
                <span className="text-4xl drop-shadow-lg group-hover:scale-110 transition-transform duration-200">{svc.emoji}</span>
              </div>

              {/* Content */}
              <div className="p-3 pb-4">
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#003B95] transition leading-tight">{svc.label}</h3>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-2">{svc.desc}</p>
                <div className="mt-2.5 flex items-center gap-1 text-[#003B95] text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/*  EXPLORE BY CITY                                                 */}
      {/* ================================================================ */}
      <section className="max-w-7xl mx-auto px-4 mb-12">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Explore by City</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {POPULAR_CITIES.map(c => (
            <button
              key={c.name}
              onClick={() => handleCityQuick(c.name)}
              className={`shrink-0 rounded-xl px-5 py-3 border transition-all ${
                city === c.name
                  ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:shadow-sm'
              }`}
            >
              <span className="text-sm font-semibold block">{c.name}</span>
              <span className={`text-[11px] ${city === c.name ? 'text-orange-100' : 'text-gray-400'}`}>{c.count} properties</span>
            </button>
          ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/*  RESULTS                                                         */}
      {/* ================================================================ */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        {/* Results header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {searched ? `${totalHits.toLocaleString('en-IN')} Properties Found` : 'Properties'}
            </h2>
            {city && <p className="text-sm text-gray-500">in {city}</p>}
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-500">Sort:</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-orange-300 focus:border-orange-400 outline-none bg-white"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
                <div className="bg-gray-200 h-52" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && searched && results.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No properties found</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
              Try adjusting your filters or searching in a different city.
            </p>
            <button
              onClick={resetFilters}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Results grid */}
        {!loading && results.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((item, idx) => {
                if (item.type === 'builder') {
                  const p = item.data as BuilderProject;
                  return (
                    <Link
                      key={`builder-${p.id}-${idx}`}
                      href={`/projects/${p.id}`}
                      className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow group"
                    >
                      <div className="relative h-52 bg-gray-100 overflow-hidden">
                        {p.primaryPhotoUrl ? (
                          <img src={imgSrc(p.primaryPhotoUrl)} alt={p.projectName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                            <svg className="w-16 h-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          </div>
                        )}
                        {/* Badge */}
                        <span className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide shadow-sm">
                          NEW PROJECT
                        </span>
                        {p.reraVerified && (
                          <span className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            RERA
                          </span>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-orange-600 transition-colors">
                          {p.projectName}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          by {p.builderName} {p.locality ? `| ${p.locality}` : ''}, {p.city}
                        </p>
                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                          {p.minBhk && p.maxBhk && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                              {p.minBhk === p.maxBhk ? `${p.minBhk} BHK` : `${p.minBhk}-${p.maxBhk} BHK`}
                            </span>
                          )}
                          <span className="bg-gray-100 px-2 py-0.5 rounded-full font-medium capitalize">
                            {statusLabel(p.projectStatus)}
                          </span>
                        </div>
                        {/* Construction progress */}
                        {p.constructionProgressPercent > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                              <span>Construction Progress</span>
                              <span className="font-semibold text-gray-700">{p.constructionProgressPercent}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div
                                className="bg-gradient-to-r from-orange-400 to-orange-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.min(p.constructionProgressPercent, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                        <div className="mt-3 flex items-baseline justify-between">
                          <span className="text-lg font-bold text-gray-900">
                            {formatSalePrice(p.minPricePaise)}
                            {p.maxPricePaise && p.maxPricePaise !== p.minPricePaise && (
                              <span className="text-sm font-medium text-gray-500"> - {formatSalePrice(p.maxPricePaise)}</span>
                            )}
                          </span>
                          {p.possessionDate && (
                            <span className="text-[11px] text-gray-400">
                              Possession: {possessionLabel(p.possessionDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                } else {
                  const p = item.data as SaleProperty;
                  const propType = p.salePropertyType || p.propertyType || '';
                  const badgeColor = p.transactionType === 'RESALE'
                    ? 'bg-green-600'
                    : propType === 'PLOT'
                    ? 'bg-amber-600'
                    : 'bg-purple-600';
                  const badgeText = p.transactionType === 'RESALE'
                    ? 'RESALE'
                    : propType === 'PLOT'
                    ? 'PLOT'
                    : 'NEW BOOKING';
                  return (
                    <Link
                      key={`sale-${p.id}-${idx}`}
                      href={`/buy/${p.id}`}
                      className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow group"
                    >
                      <div className="relative h-52 bg-gray-100 overflow-hidden">
                        {p.primaryPhotoUrl ? (
                          <img src={imgSrc(p.primaryPhotoUrl)} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                            <svg className="w-16 h-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                          </div>
                        )}
                        <span className={`absolute top-3 left-3 ${badgeColor} text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide shadow-sm`}>
                          {badgeText}
                        </span>
                        {p.reraVerified && (
                          <span className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            RERA
                          </span>
                        )}
                        <span className="absolute bottom-3 right-3 bg-white/90 text-gray-700 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize">
                          {(propType || 'Property').toLowerCase().replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-orange-600 transition-colors">
                          {p.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {p.locality ? `${p.locality}, ` : ''}{p.city}
                        </p>
                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                          {p.bedrooms != null && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded-full font-medium">{p.bedrooms} BHK</span>
                          )}
                          {p.bathrooms != null && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded-full font-medium">{p.bathrooms} Bath</span>
                          )}
                          {(p.carpetAreaSqft || p.builtUpAreaSqft || p.areaSqft) != null && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded-full font-medium">{(p.carpetAreaSqft || p.builtUpAreaSqft || p.areaSqft || 0).toLocaleString('en-IN')} sqft</span>
                          )}
                          {p.furnishing && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded-full font-medium capitalize">{p.furnishing.toLowerCase()}</span>
                          )}
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                          <span className="text-lg font-bold text-gray-900">
                            {formatSalePrice(p.askingPricePaise || p.pricePaise || 0)}
                          </span>
                          {p.pricePerSqftPaise != null && p.pricePerSqftPaise > 0 && (
                            <span className="text-[11px] text-gray-400">
                              {formatSalePrice(p.pricePerSqftPaise)}/sqft
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                }
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => fetchResults(page - 1)}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum = i;
                  if (totalPages > 7) {
                    if (page < 4) pageNum = i;
                    else if (page >= totalPages - 3) pageNum = totalPages - 7 + i;
                    else pageNum = page - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchResults(pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                        page === pageNum
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => fetchResults(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ================================================================ */}
      {/*  WHY SAFAR                                                       */}
      {/* ================================================================ */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-orange-500 text-sm font-semibold tracking-wide uppercase mb-2">Advantages</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Why Buy on Safar?</h2>
            <p className="text-gray-500 mt-3 max-w-md mx-auto text-sm">
              A smarter way to find and buy your next property
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_SAFAR.map(item => (
              <div key={item.title} className={`rounded-2xl border p-6 ${item.color} transition hover:shadow-lg`}>
                <div className="mb-4">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  CTA BANNER — 3 listing options                                  */}
      {/* ================================================================ */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 px-4">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">List on Safar</h2>
          <p className="text-slate-400 text-sm">Reach thousands of verified buyers and tenants across India</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Sell Property */}
          <Link href="/sell" className="group bg-slate-800/60 border border-slate-700 rounded-2xl p-6 hover:border-orange-500/50 hover:bg-slate-800 transition-all">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-orange-400 transition">Sell Your Property</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">List apartments, villas, plots or independent houses for resale</p>
            <span className="text-orange-400 text-sm font-semibold flex items-center gap-1">
              List Now
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>

          {/* Builder Project */}
          <Link href="/builder/new-project" className="group bg-slate-800/60 border border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 hover:bg-slate-800 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition">Builder Project</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">List new launches, under-construction or ready-to-move projects</p>
            <span className="text-blue-400 text-sm font-semibold flex items-center gap-1">
              Add Project
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>

          {/* List for Rent */}
          <Link href="/host/new" className="group bg-slate-800/60 border border-slate-700 rounded-2xl p-6 hover:border-green-500/50 hover:bg-slate-800 transition-all">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-green-400 transition">List for Rent</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">List homes, PGs, hotels or commercial spaces for short or long-term rent</p>
            <span className="text-green-400 text-sm font-semibold flex items-center gap-1">
              Start Hosting
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>

          {/* Broker / Agent */}
          <Link href="/broker" className="group bg-slate-800/60 border border-slate-700 rounded-2xl p-6 hover:border-purple-500/50 hover:bg-slate-800 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-400 transition">Broker / Agent</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">List multiple properties, manage clients and earn commission on deals</p>
            <span className="text-purple-400 text-sm font-semibold flex items-center gap-1">
              Register as Broker
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
