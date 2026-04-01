'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune',
  'Chennai', 'Kolkata', 'Jaipur', 'Ahmedabad', 'Goa',
  'Noida', 'Gurgaon', 'Lucknow', 'Chandigarh', 'Kochi',
];

const BUDGET_RANGES = [
  { label: 'Any Budget', min: 0, max: 0 },
  { label: '₹20L - 50L', min: 2000000, max: 5000000 },
  { label: '₹50L - 1Cr', min: 5000000, max: 10000000 },
  { label: '₹1Cr - 2Cr', min: 10000000, max: 20000000 },
  { label: '₹2Cr - 5Cr', min: 20000000, max: 50000000 },
  { label: '₹5Cr+', min: 50000000, max: 0 },
];

const BHK_OPTIONS = ['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK'];

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
  { value: 'possession', label: 'Possession Date' },
  { value: 'newest', label: 'Newest First' },
];

const AMENITY_ICONS: Record<string, string> = {
  'Swimming Pool': '🏊',
  'Gym': '🏋️',
  'Club House': '🏠',
  'Children\'s Play Area': '🧒',
  'Landscaped Gardens': '🌿',
  'Jogging Track': '🏃',
  'Power Backup': '⚡',
  'CCTV': '📹',
  'EV Charging': '🔌',
  'Smart Home': '🏡',
  'Parking': '🅿️',
  'Sports Court': '🏸',
};

interface BuilderProject {
  id: string;
  projectName: string;
  builderName: string;
  builderLogoUrl?: string;
  city: string;
  state?: string;
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
  totalTowers?: number;
  totalUnits?: number;
  availableUnits?: number;
  primaryPhotoUrl?: string;
  amenities?: string[];
  verified?: boolean;
  createdAt?: string;
}

export default function ProjectsListingPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<BuilderProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);

  /* Search filters */
  const [city, setCity] = useState('');
  const [locality, setLocality] = useState('');
  const [budgetIdx, setBudgetIdx] = useState(0);
  const [selectedBhk, setSelectedBhk] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('relevance');

  async function fetchProjects(pageNum = 0) {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(pageNum),
        size: '12',
        sort: sortBy,
      };
      if (city) params.city = city;
      if (locality) params.locality = locality;
      if (BUDGET_RANGES[budgetIdx].min > 0) params.minPrice = String(BUDGET_RANGES[budgetIdx].min);
      if (BUDGET_RANGES[budgetIdx].max > 0) params.maxPrice = String(BUDGET_RANGES[budgetIdx].max);
      if (selectedBhk.length > 0) params.bhk = selectedBhk.map(b => b.replace(/[^0-9+]/g, '')).join(',');
      if (status) params.status = status;

      const res = await api.searchBuilderProjects(params);
      setProjects(res?.content || res || []);
      setTotalElements(res?.totalElements || 0);
      setPage(pageNum);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects(0);
  }, [city, budgetIdx, selectedBhk, status, sortBy]);

  function toggleBhk(bhk: string) {
    setSelectedBhk(prev =>
      prev.includes(bhk) ? prev.filter(b => b !== bhk) : [...prev, bhk]
    );
  }

  function handleSearch() {
    fetchProjects(0);
  }

  const totalPages = Math.ceil(totalElements / 12);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero Section ── */}
      <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-20">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
            New Projects &amp; Under Construction
          </h1>
          <p className="text-orange-100 text-lg mb-8 max-w-2xl">
            Discover RERA-verified new launches, under-construction, and ready-to-move projects from top builders across India.
          </p>

          {/* ── Search Bar ── */}
          <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* City */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">All Cities</option>
                  {CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Locality */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Locality</label>
                <input
                  type="text"
                  value={locality}
                  onChange={e => setLocality(e.target.value)}
                  placeholder="e.g. Whitefield, Bandra"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>

              {/* Budget */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Budget</label>
                <select
                  value={budgetIdx}
                  onChange={e => setBudgetIdx(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {BUDGET_RANGES.map((r, i) => (
                    <option key={i} value={i}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Search button */}
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg py-2.5 transition-colors"
                >
                  Search Projects
                </button>
              </div>
            </div>

            {/* BHK Selector */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 self-center mr-2">BHK:</span>
              {BHK_OPTIONS.map(bhk => (
                <button
                  key={bhk}
                  onClick={() => toggleBhk(bhk)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedBhk.includes(bhk)
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                  }`}
                >
                  {bhk}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Results Area ── */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Sort + Count Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <p className="text-gray-600 text-sm">
            {loading ? 'Searching...' : `${totalElements} project${totalElements !== 1 ? 's' : ''} found`}
          </p>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Sort by:</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {SORT_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-2 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && projects.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏗️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No projects found</h3>
            <p className="text-gray-500">Try adjusting your search filters to find more projects.</p>
          </div>
        )}

        {/* Project Cards Grid */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group"
              >
                {/* Photo */}
                <div className="relative h-48 bg-gray-100">
                  {project.primaryPhotoUrl ? (
                    <img
                      src={project.primaryPhotoUrl}
                      alt={project.projectName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}

                  {/* Status Badge */}
                  <span className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-full ${
                    project.projectStatus === 'READY_TO_MOVE' ? 'bg-green-500 text-white' :
                    project.projectStatus === 'UNDER_CONSTRUCTION' ? 'bg-blue-500 text-white' :
                    project.projectStatus === 'UPCOMING' ? 'bg-purple-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {project.projectStatus?.replace(/_/g, ' ')}
                  </span>

                  {/* RERA Badge */}
                  {project.reraVerified && (
                    <span className="absolute top-3 right-3 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      RERA
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4">
                  {/* Builder */}
                  <div className="flex items-center gap-2 mb-2">
                    {project.builderLogoUrl ? (
                      <img src={project.builderLogoUrl} alt={project.builderName} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                        {project.builderName?.[0]}
                      </div>
                    )}
                    <span className="text-xs text-gray-500 font-medium truncate">{project.builderName}</span>
                  </div>

                  {/* Project Name */}
                  <h3 className="font-semibold text-gray-900 text-base mb-1 group-hover:text-orange-600 transition-colors truncate">
                    {project.projectName}
                  </h3>

                  {/* Location */}
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {[project.locality, project.city].filter(Boolean).join(', ')}
                  </p>

                  {/* BHK + Price Range */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      {project.minBhk === project.maxBhk
                        ? `${project.minBhk} BHK`
                        : `${project.minBhk}-${project.maxBhk} BHK`}
                    </span>
                    <span className="text-sm font-bold text-orange-600">
                      {formatSalePrice(project.minPricePaise)} - {formatSalePrice(project.maxPricePaise)}
                    </span>
                  </div>

                  {/* Construction Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Construction Progress</span>
                      <span className="text-xs font-semibold text-orange-600">{project.constructionProgressPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${project.constructionProgressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Possession Date */}
                  {project.possessionDate && (
                    <p className="text-xs text-gray-500 mb-3">
                      Possession: <span className="font-medium text-gray-700">
                        {new Date(project.possessionDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </span>
                    </p>
                  )}

                  {/* Towers / Units */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    {project.totalTowers && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                        </svg>
                        {project.totalTowers} Tower{project.totalTowers > 1 ? 's' : ''}
                      </span>
                    )}
                    {project.totalUnits && (
                      <span>{project.totalUnits} Units</span>
                    )}
                    {project.availableUnits !== undefined && project.availableUnits !== null && (
                      <span className="text-green-600 font-medium">{project.availableUnits} Available</span>
                    )}
                  </div>

                  {/* Amenity Preview */}
                  {project.amenities && project.amenities.length > 0 && (
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      {project.amenities.slice(0, 4).map(a => (
                        <span key={a} className="text-sm" title={a}>
                          {AMENITY_ICONS[a] || '✨'}
                        </span>
                      ))}
                      {project.amenities.length > 4 && (
                        <span className="text-xs text-gray-400">+{project.amenities.length - 4} more</span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button
              onClick={() => fetchProjects(page - 1)}
              disabled={page === 0}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pageNum = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => fetchProjects(pageNum)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    pageNum === page
                      ? 'bg-orange-500 text-white'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => fetchProjects(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
