'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
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
  city: string;
  locality?: string;
  address?: string;
  pricePaise: number;
  pricePerSqftPaise?: number;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  carpetAreaSqft?: number;
  floor?: number;
  totalFloors?: number;
  propertyType: string;
  primaryPhotoUrl?: string;
  photos?: string[];
  possessionStatus?: string;
  reraVerified?: boolean;
  verified?: boolean;
  sellerType?: string;
  furnishing?: string;
  facing?: string;
  age?: string;
  negotiable?: boolean;
  gatedCommunity?: boolean;
  vastuCompliant?: boolean;
  createdAt?: string;
}

interface SearchResult {
  content: SaleProperty[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/* ── Constants ── */
const SORT_OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'area_desc', label: 'Area: Largest First' },
];

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'HOUSE', label: 'House' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'PLOT', label: 'Plot' },
  { value: 'COMMERCIAL', label: 'Commercial' },
];

const BHK_OPTIONS = [
  { value: '1', label: '1 BHK' },
  { value: '2', label: '2 BHK' },
  { value: '3', label: '3 BHK' },
  { value: '4', label: '4 BHK' },
  { value: '5', label: '5+ BHK' },
];

const POSTED_BY_OPTIONS = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'AGENT', label: 'Agent' },
  { value: 'BUILDER', label: 'Builder' },
];

const STATUS_OPTIONS = [
  { value: 'READY_TO_MOVE', label: 'Ready to Move' },
  { value: 'UNDER_CONSTRUCTION', label: 'Under Construction' },
  { value: 'NEW_LAUNCH', label: 'New Launch' },
];

const FURNISHING_OPTIONS = [
  { value: 'FURNISHED', label: 'Furnished' },
  { value: 'SEMI_FURNISHED', label: 'Semi-Furnished' },
  { value: 'UNFURNISHED', label: 'Unfurnished' },
];

const FACING_OPTIONS = [
  { value: 'NORTH', label: 'North' },
  { value: 'SOUTH', label: 'South' },
  { value: 'EAST', label: 'East' },
  { value: 'WEST', label: 'West' },
  { value: 'NORTH_EAST', label: 'North-East' },
  { value: 'NORTH_WEST', label: 'North-West' },
  { value: 'SOUTH_EAST', label: 'South-East' },
  { value: 'SOUTH_WEST', label: 'South-West' },
];

const AGE_OPTIONS = [
  { value: '0-1', label: '< 1 Year' },
  { value: '1-3', label: '1-3 Years' },
  { value: '3-5', label: '3-5 Years' },
  { value: '5-10', label: '5-10 Years' },
  { value: '10+', label: '10+ Years' },
];

const BUDGET_PRESETS = [
  { label: 'Under 25L', min: 0, max: 2500000 },
  { label: '25L - 50L', min: 2500000, max: 5000000 },
  { label: '50L - 1Cr', min: 5000000, max: 10000000 },
  { label: '1Cr - 2Cr', min: 10000000, max: 20000000 },
  { label: '2Cr - 5Cr', min: 20000000, max: 50000000 },
  { label: '5Cr+', min: 50000000, max: 0 },
];

/* ── Collapsible Filter Section ── */
function FilterSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 pb-4 mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-sm font-semibold text-slate-900">{title}</span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

/* ── Checkbox Filter Group ── */
function CheckboxGroup({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (vals: string[]) => void;
}) {
  function toggle(val: string) {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);
  }
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={selected.includes(opt.value)}
            onChange={() => toggle(opt.value)}
            className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
          />
          <span className="text-sm text-slate-600 group-hover:text-slate-900">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

export default function BuySearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  /* ── Filter state ── */
  const [budgetMin, setBudgetMin] = useState(searchParams.get('priceMin') || '');
  const [budgetMax, setBudgetMax] = useState(searchParams.get('priceMax') || '');
  const [selectedBhk, setSelectedBhk] = useState<string[]>(searchParams.get('bedrooms')?.split(',') || []);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(searchParams.get('type')?.split(',') || []);
  const [selectedPostedBy, setSelectedPostedBy] = useState<string[]>(searchParams.get('postedBy')?.split(',') || []);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(searchParams.get('status')?.split(',') || []);
  const [selectedFurnishing, setSelectedFurnishing] = useState<string[]>(searchParams.get('furnishing')?.split(',') || []);
  const [selectedFacing, setSelectedFacing] = useState<string[]>(searchParams.get('facing')?.split(',') || []);
  const [selectedAge, setSelectedAge] = useState<string[]>(searchParams.get('age')?.split(',') || []);
  const [floorMin, setFloorMin] = useState(searchParams.get('floorMin') || '');
  const [floorMax, setFloorMax] = useState(searchParams.get('floorMax') || '');
  const [reraOnly, setReraOnly] = useState(searchParams.get('rera') === 'true');
  const [vastuOnly, setVastuOnly] = useState(searchParams.get('vastu') === 'true');
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verified') === 'true');
  const [gatedOnly, setGatedOnly] = useState(searchParams.get('gated') === 'true');
  const [sort, setSort] = useState(searchParams.get('sort') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 0);

  /* ── Results state ── */
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const city = searchParams.get('city') || '';
  const query = searchParams.get('query') || '';

  const buildParams = useCallback(() => {
    const params: Record<string, any> = { page, size: 20 };
    if (city) params.city = city;
    if (query) params.query = query;
    if (sort) params.sort = sort;
    if (budgetMin) params.priceMin = budgetMin;
    if (budgetMax) params.priceMax = budgetMax;
    if (selectedBhk.length && selectedBhk[0]) params.bedrooms = selectedBhk.join(',');
    if (selectedTypes.length && selectedTypes[0]) params.type = selectedTypes.join(',');
    if (selectedPostedBy.length && selectedPostedBy[0]) params.postedBy = selectedPostedBy.join(',');
    if (selectedStatus.length && selectedStatus[0]) params.status = selectedStatus.join(',');
    if (selectedFurnishing.length && selectedFurnishing[0]) params.furnishing = selectedFurnishing.join(',');
    if (selectedFacing.length && selectedFacing[0]) params.facing = selectedFacing.join(',');
    if (selectedAge.length && selectedAge[0]) params.age = selectedAge.join(',');
    if (floorMin) params.floorMin = floorMin;
    if (floorMax) params.floorMax = floorMax;
    if (reraOnly) params.rera = 'true';
    if (vastuOnly) params.vastu = 'true';
    if (verifiedOnly) params.verified = 'true';
    if (gatedOnly) params.gated = 'true';
    return params;
  }, [city, query, sort, page, budgetMin, budgetMax, selectedBhk, selectedTypes, selectedPostedBy, selectedStatus, selectedFurnishing, selectedFacing, selectedAge, floorMin, floorMax, reraOnly, vastuOnly, verifiedOnly, gatedOnly]);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams();
      const res = await (api as any).searchSaleProperties(params);
      setResults(res?.content ? res : { content: res?.results || res || [], totalElements: 0, totalPages: 1, number: 0, size: 20 });
    } catch {
      setResults({ content: [], totalElements: 0, totalPages: 1, number: 0, size: 20 });
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  function applyFilters() {
    setPage(0);
    setMobileFiltersOpen(false);
    fetchResults();
  }

  function clearFilters() {
    setBudgetMin('');
    setBudgetMax('');
    setSelectedBhk([]);
    setSelectedTypes([]);
    setSelectedPostedBy([]);
    setSelectedStatus([]);
    setSelectedFurnishing([]);
    setSelectedFacing([]);
    setSelectedAge([]);
    setFloorMin('');
    setFloorMax('');
    setReraOnly(false);
    setVastuOnly(false);
    setVerifiedOnly(false);
    setGatedOnly(false);
    setSort('');
    setPage(0);
  }

  function handleSaveProperty(e: React.MouseEvent, propertyId: string) {
    e.preventDefault();
    e.stopPropagation();
    // save logic would go here
  }

  /* ── Sidebar filters JSX ── */
  const filtersContent = (
    <div className="space-y-0">
      {/* Budget */}
      <FilterSection title="Budget">
        <div className="flex flex-wrap gap-2 mb-3">
          {BUDGET_PRESETS.map((preset) => {
            const isActive = budgetMin === String(preset.min * 100) && (preset.max === 0 ? !budgetMax : budgetMax === String(preset.max * 100));
            return (
              <button
                key={preset.label}
                onClick={() => {
                  setBudgetMin(String(preset.min * 100));
                  setBudgetMax(preset.max > 0 ? String(preset.max * 100) : '');
                }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  isActive
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min (paise)"
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            type="number"
            placeholder="Max (paise)"
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </FilterSection>

      {/* BHK */}
      <FilterSection title="BHK">
        <CheckboxGroup options={BHK_OPTIONS} selected={selectedBhk} onChange={setSelectedBhk} />
      </FilterSection>

      {/* Property Type */}
      <FilterSection title="Property Type">
        <CheckboxGroup options={PROPERTY_TYPES} selected={selectedTypes} onChange={setSelectedTypes} />
      </FilterSection>

      {/* Posted By */}
      <FilterSection title="Posted By">
        <CheckboxGroup options={POSTED_BY_OPTIONS} selected={selectedPostedBy} onChange={setSelectedPostedBy} />
      </FilterSection>

      {/* Status */}
      <FilterSection title="Status">
        <CheckboxGroup options={STATUS_OPTIONS} selected={selectedStatus} onChange={setSelectedStatus} />
      </FilterSection>

      {/* Furnishing */}
      <FilterSection title="Furnishing" defaultOpen={false}>
        <CheckboxGroup options={FURNISHING_OPTIONS} selected={selectedFurnishing} onChange={setSelectedFurnishing} />
      </FilterSection>

      {/* Floor Range */}
      <FilterSection title="Floor" defaultOpen={false}>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={floorMin}
            onChange={(e) => setFloorMin(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            type="number"
            placeholder="Max"
            value={floorMax}
            onChange={(e) => setFloorMax(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </FilterSection>

      {/* Facing */}
      <FilterSection title="Facing" defaultOpen={false}>
        <CheckboxGroup options={FACING_OPTIONS} selected={selectedFacing} onChange={setSelectedFacing} />
      </FilterSection>

      {/* Age */}
      <FilterSection title="Property Age" defaultOpen={false}>
        <CheckboxGroup options={AGE_OPTIONS} selected={selectedAge} onChange={setSelectedAge} />
      </FilterSection>

      {/* Boolean Filters */}
      <FilterSection title="More Filters" defaultOpen={false}>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={reraOnly} onChange={(e) => setReraOnly(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
            <span className="text-sm text-slate-600">RERA Registered Only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={vastuOnly} onChange={(e) => setVastuOnly(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
            <span className="text-sm text-slate-600">Vastu Compliant</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
            <span className="text-sm text-slate-600">Verified Only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={gatedOnly} onChange={(e) => setGatedOnly(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
            <span className="text-sm text-slate-600">Gated Community</span>
          </label>
        </div>
      </FilterSection>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={applyFilters}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl transition text-sm"
        >
          Apply Filters
        </button>
        <button
          onClick={clearFilters}
          className="px-4 border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 rounded-xl transition text-sm"
        >
          Clear
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header Bar ── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/buy" className="text-orange-500 hover:text-orange-600 text-sm font-medium">
              &larr; Buy Home
            </Link>
            <span className="text-slate-300">|</span>
            <h1 className="text-sm font-semibold text-slate-900">
              {city ? `Properties in ${city}` : query ? `Results for "${query}"` : 'All Properties for Sale'}
              {results && !loading && (
                <span className="text-slate-400 font-normal ml-2">({results.totalElements} found)</span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(0); }}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {/* Mobile filter toggle */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden border border-slate-200 rounded-xl px-3 py-2 text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* ── Left Sidebar (Desktop) ── */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-20">
            <h2 className="text-base font-bold text-slate-900 mb-4">Filters</h2>
            {filtersContent}
          </div>
        </aside>

        {/* ── Mobile Filters Drawer ── */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900">Filters</h2>
                <button onClick={() => setMobileFiltersOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">{filtersContent}</div>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse flex gap-4">
                  <div className="w-64 h-44 bg-slate-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-3 py-2">
                    <div className="h-5 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-6 bg-slate-200 rounded w-1/4 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : results && results.content.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center">
              <div className="text-5xl mb-4">🏠</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No properties found</h3>
              <p className="text-slate-500 text-sm mb-6">Try adjusting your filters or search in a different area.</p>
              <button onClick={clearFilters} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm">
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {results?.content.map((prop) => (
                  <Link
                    key={prop.id}
                    href={`/buy/${prop.id}`}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col sm:flex-row group"
                  >
                    {/* Photo */}
                    <div className="relative w-full sm:w-64 h-48 sm:h-auto flex-shrink-0 bg-slate-100 overflow-hidden">
                      {prop.primaryPhotoUrl ? (
                        <img
                          src={prop.primaryPhotoUrl.startsWith('http') ? prop.primaryPhotoUrl : `${process.env.NEXT_PUBLIC_API_URL || ''}${prop.primaryPhotoUrl}`}
                          alt={prop.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-5xl">🏠</div>
                      )}
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        {prop.reraVerified && (
                          <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">RERA</span>
                        )}
                        {prop.verified && (
                          <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Verified</span>
                        )}
                      </div>
                      {prop.possessionStatus && (
                        <span className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full capitalize">
                          {prop.possessionStatus.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 text-base truncate group-hover:text-orange-600 transition-colors">
                              {prop.title}
                            </h3>
                            <p className="text-slate-500 text-xs mt-1">
                              {prop.locality ? `${prop.locality}, ` : ''}{prop.city}
                            </p>
                          </div>
                          {prop.sellerType && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                              prop.sellerType === 'OWNER'
                                ? 'bg-emerald-100 text-emerald-700'
                                : prop.sellerType === 'BUILDER'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {prop.sellerType}
                            </span>
                          )}
                        </div>

                        {/* Property details row */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-slate-600">
                          {prop.bedrooms != null && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                              {prop.bedrooms} BHK
                            </span>
                          )}
                          {prop.areaSqft != null && (
                            <span>{prop.areaSqft.toLocaleString('en-IN')} sqft</span>
                          )}
                          {prop.floor != null && (
                            <span>Floor {prop.floor}{prop.totalFloors ? ` of ${prop.totalFloors}` : ''}</span>
                          )}
                          {prop.furnishing && (
                            <span className="capitalize">{prop.furnishing.replace(/_/g, ' ').toLowerCase()}</span>
                          )}
                          {prop.facing && (
                            <span>{prop.facing.replace(/_/g, '-')} facing</span>
                          )}
                        </div>
                      </div>

                      {/* Price row */}
                      <div className="flex items-end justify-between mt-4">
                        <div>
                          <span className="text-xl font-bold text-slate-900">{formatSalePrice(prop.pricePaise)}</span>
                          {prop.pricePerSqftPaise != null && (
                            <span className="text-xs text-slate-400 ml-2">{formatPricePerSqft(prop.pricePerSqftPaise)}</span>
                          )}
                          {prop.negotiable && (
                            <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded">Negotiable</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => handleSaveProperty(e, prop.id)}
                            className="border border-slate-200 hover:border-orange-300 text-slate-500 hover:text-orange-500 p-2 rounded-xl transition-colors"
                            title="Save"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                          <span className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">
                            Contact
                          </span>
                          <span className="border border-orange-500 text-orange-500 hover:bg-orange-50 text-xs font-semibold px-4 py-2 rounded-xl transition-colors">
                            Visit
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* ── Pagination ── */}
              {results && results.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(results.totalPages, 7) }).map((_, i) => {
                    let pageNum: number;
                    if (results.totalPages <= 7) {
                      pageNum = i;
                    } else if (page < 3) {
                      pageNum = i;
                    } else if (page > results.totalPages - 4) {
                      pageNum = results.totalPages - 7 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-xl text-sm font-medium transition ${
                          page === pageNum
                            ? 'bg-orange-500 text-white'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                  <button
                    disabled={page >= results.totalPages - 1}
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
