'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import CityAutocomplete from '@/components/CityAutocomplete';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry', 'Jammu and Kashmir', 'Ladakh',
];

const BHK_OPTIONS = [1, 2, 3, 4, 5];
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'possession', label: 'Earliest Possession' },
];

const STATUS_BADGE: Record<string, string> = {
  UNDER_CONSTRUCTION: 'bg-yellow-100 text-yellow-700',
  READY_TO_MOVE: 'bg-green-100 text-green-700',
  UPCOMING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
};

export default function BuilderSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<any[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [state, setState] = useState(searchParams.get('state') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [bhk, setBhk] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState('');
  const [reraOnly, setReraOnly] = useState(false);
  const [sort, setSort] = useState('relevance');
  const [page, setPage] = useState(0);

  useEffect(() => {
    search();
  }, [state, city, bhk, priceRange, reraOnly, sort, page]);

  async function search() {
    setLoading(true);
    try {
      const params: any = { page, size: 12, sort };
      if (query) params.query = query;
      if (state) params.state = state;
      if (city) params.city = city;
      if (bhk.length) params.bhk = bhk;
      if (reraOnly) params.reraVerified = true;

      if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        if (min) params.priceMin = min * 100; // convert to paise
        if (max) params.priceMax = max * 100;
      }

      const qs = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => Array.isArray(v) ? v.map(i => `${k}=${i}`).join('&') : `${k}=${v}`)
        .join('&');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/search/builder-projects?${qs}`);
      const data = await res.json();
      setProjects(data.content || []);
      setTotalHits(data.totalHits || 0);
    } catch {
      setProjects([]);
    }
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    search();
  }

  function toggleBhk(b: number) {
    setBhk(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#003B95] to-[#0057D9] text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Find Your Dream Home</h1>
          <p className="text-blue-200 mb-6">Browse builder projects across all states and cities in India</p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by project name, builder, city, locality..."
              className="flex-1 px-5 py-3.5 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button type="submit" className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className="w-64 shrink-0 hidden lg:block">
            <div className="bg-white rounded-xl border p-5 sticky top-20 space-y-5">
              <h3 className="font-semibold text-gray-900 text-sm">Filters</h3>

              {/* State */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">State</label>
                <select value={state} onChange={e => { setState(e.target.value); setCity(''); setPage(0); }}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">All States</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">City</label>
                <CityAutocomplete value={city} onChange={(v: string) => { setCity(v); setPage(0); }} />
              </div>

              {/* BHK */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">BHK</label>
                <div className="flex flex-wrap gap-1.5">
                  {BHK_OPTIONS.map(b => (
                    <button key={b} onClick={() => { toggleBhk(b); setPage(0); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition
                        ${bhk.includes(b) ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {b} BHK
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Budget</label>
                <select value={priceRange} onChange={e => { setPriceRange(e.target.value); setPage(0); }}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">Any Budget</option>
                  <option value="0-2500000">Under 25 Lakh</option>
                  <option value="2500000-5000000">25-50 Lakh</option>
                  <option value="5000000-10000000">50 Lakh - 1 Cr</option>
                  <option value="10000000-20000000">1-2 Cr</option>
                  <option value="20000000-50000000">2-5 Cr</option>
                  <option value="50000000-0">5 Cr+</option>
                </select>
              </div>

              {/* RERA */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={reraOnly} onChange={e => { setReraOnly(e.target.checked); setPage(0); }}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500" />
                <span className="text-sm text-gray-700">RERA Verified Only</span>
              </label>

              {/* Sort */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Sort By</label>
                <select value={sort} onChange={e => { setSort(e.target.value); setPage(0); }}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                  {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {/* Clear */}
              <button onClick={() => { setQuery(''); setState(''); setCity(''); setBhk([]); setPriceRange(''); setReraOnly(false); setSort('relevance'); setPage(0); }}
                className="w-full text-sm text-orange-500 hover:underline font-medium">
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {totalHits} project{totalHits !== 1 ? 's' : ''} found
                {state && <span className="text-gray-700 font-medium"> in {state}</span>}
                {city && <span className="text-gray-700 font-medium">, {city}</span>}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border">
                <span className="text-5xl block mb-3">🏗️</span>
                <p className="text-gray-700 font-medium">No projects found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search in a different city.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((p: any) => (
                    <Link key={p.id} href={`/builder/${p.id}`}
                      className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition group">
                      {/* Project Image */}
                      <div className="relative h-44 bg-gradient-to-br from-blue-50 to-orange-50">
                        {p.primaryPhotoUrl ? (
                          <img src={p.primaryPhotoUrl} alt={p.projectName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">🏗️</div>
                        )}
                        <div className="absolute top-3 left-3 flex gap-1.5">
                          {p.projectStatus && (
                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${STATUS_BADGE[p.projectStatus] || 'bg-gray-100 text-gray-600'}`}>
                              {p.projectStatus?.replace(/_/g, ' ')}
                            </span>
                          )}
                          {p.reraVerified && (
                            <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold bg-green-500 text-white">RERA</span>
                          )}
                        </div>
                      </div>
                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition truncate">{p.projectName}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">by {p.builderName}</p>
                        <p className="text-xs text-gray-400 mt-1">{p.locality ? `${p.locality}, ` : ''}{p.city}, {p.state}</p>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div>
                            <p className="text-lg font-bold text-[#003B95]">
                              {p.minPricePaise ? formatPaise(p.minPricePaise) : 'Price on Request'}
                              {p.maxPricePaise && p.maxPricePaise !== p.minPricePaise && (
                                <span className="text-sm font-normal text-gray-400"> - {formatPaise(p.maxPricePaise)}</span>
                              )}
                            </p>
                          </div>
                          {(p.minBhk || p.maxBhk) && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                              {p.minBhk === p.maxBhk ? `${p.minBhk} BHK` : `${p.minBhk}-${p.maxBhk} BHK`}
                            </span>
                          )}
                        </div>
                        {p.possessionDate && (
                          <p className="text-[11px] text-gray-400 mt-2">
                            Possession: {new Date(p.possessionDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalHits > 12 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                      className="px-4 py-2 border rounded-lg text-sm disabled:opacity-30 hover:bg-gray-50 transition">Previous</button>
                    <span className="text-sm text-gray-500">Page {page + 1} of {Math.ceil(totalHits / 12)}</span>
                    <button onClick={() => setPage(page + 1)} disabled={(page + 1) * 12 >= totalHits}
                      className="px-4 py-2 border rounded-lg text-sm disabled:opacity-30 hover:bg-gray-50 transition">Next</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
