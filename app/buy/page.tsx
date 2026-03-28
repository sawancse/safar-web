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
];

const BUDGET_RANGES = [
  { label: '₹5L - 25L', min: 500000, max: 2500000 },
  { label: '₹25L - 50L', min: 2500000, max: 5000000 },
  { label: '₹50L - 1Cr', min: 5000000, max: 10000000 },
  { label: '₹1Cr - 2Cr', min: 10000000, max: 20000000 },
  { label: '₹2Cr - 5Cr', min: 20000000, max: 50000000 },
  { label: '₹5Cr+', min: 50000000, max: 0 },
];

const BHK_OPTIONS = ['1', '2', '3', '4', '5+'];

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'HOUSE', label: 'House' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'PLOT', label: 'Plot' },
];

const POPULAR_CITIES_DATA = [
  { name: 'Mumbai', avgPrice: '₹18,500/sqft', image: '/cities/mumbai.jpg', gradient: 'from-blue-600 to-blue-900' },
  { name: 'Delhi', avgPrice: '₹12,200/sqft', image: '/cities/delhi.jpg', gradient: 'from-amber-600 to-amber-900' },
  { name: 'Bangalore', avgPrice: '₹8,800/sqft', image: '/cities/bangalore.jpg', gradient: 'from-green-600 to-green-900' },
  { name: 'Hyderabad', avgPrice: '₹7,200/sqft', image: '/cities/hyderabad.jpg', gradient: 'from-purple-600 to-purple-900' },
  { name: 'Pune', avgPrice: '₹9,500/sqft', image: '/cities/pune.jpg', gradient: 'from-orange-600 to-orange-900' },
  { name: 'Chennai', avgPrice: '₹7,800/sqft', image: '/cities/chennai.jpg', gradient: 'from-teal-600 to-teal-900' },
  { name: 'Kolkata', avgPrice: '₹5,400/sqft', image: '/cities/kolkata.jpg', gradient: 'from-rose-600 to-rose-900' },
  { name: 'Jaipur', avgPrice: '₹4,900/sqft', image: '/cities/jaipur.jpg', gradient: 'from-pink-600 to-pink-900' },
  { name: 'Ahmedabad', avgPrice: '₹5,200/sqft', image: '/cities/ahmedabad.jpg', gradient: 'from-indigo-600 to-indigo-900' },
  { name: 'Goa', avgPrice: '₹11,000/sqft', image: '/cities/goa.jpg', gradient: 'from-cyan-600 to-cyan-900' },
];

const QUICK_LINKS = [
  { label: 'Buy Apartment', href: '/buy/search?type=APARTMENT' },
  { label: 'New Projects', href: '/projects' },
  { label: 'Plot / Land', href: '/buy/search?type=PLOT' },
  { label: 'Villa', href: '/buy/search?type=VILLA' },
  { label: 'Commercial', href: '/buy/search?type=COMMERCIAL' },
];

const WHY_BUY_FEATURES = [
  {
    icon: '0%',
    title: 'Zero Brokerage',
    desc: 'Buy directly from owners and builders. No middlemen, no hidden fees.',
    accent: 'from-green-500/10 to-emerald-500/5',
    border: 'border-green-200',
  },
  {
    icon: '✓',
    title: 'RERA Verified',
    desc: 'Every listed project is RERA-verified. Buy with confidence knowing your investment is legally protected.',
    accent: 'from-blue-500/10 to-indigo-500/5',
    border: 'border-blue-200',
  },
  {
    icon: '📅',
    title: 'Site Visit Scheduling',
    desc: 'Schedule site visits directly from the listing. Get reminders and route directions automatically.',
    accent: 'from-orange-500/10 to-amber-500/5',
    border: 'border-orange-200',
  },
  {
    icon: '📊',
    title: 'Rental History Data',
    desc: 'See actual rental income data for properties that were listed on Safar. Make informed investment decisions.',
    accent: 'from-purple-500/10 to-violet-500/5',
    border: 'border-purple-200',
  },
  {
    icon: '🧮',
    title: 'EMI Calculator',
    desc: 'Built-in EMI calculator with live bank rates. Know your monthly outflow before you decide.',
    accent: 'from-teal-500/10 to-cyan-500/5',
    border: 'border-teal-200',
  },
  {
    icon: '📈',
    title: 'Locality Trends',
    desc: 'Price trends, infrastructure developments, and upcoming projects for every locality.',
    accent: 'from-rose-500/10 to-pink-500/5',
    border: 'border-rose-200',
  },
];

interface SaleProperty {
  id: string;
  title: string;
  city: string;
  locality?: string;
  pricePaise: number;
  pricePerSqftPaise?: number;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  propertyType: string;
  primaryPhotoUrl?: string;
  possessionStatus?: string;
  reraVerified?: boolean;
  sellerType?: string;
}

export default function BuyHomePage() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [locality, setLocality] = useState('');
  const [budgetIdx, setBudgetIdx] = useState(-1);
  const [bhk, setBhk] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [recentProperties, setRecentProperties] = useState<SaleProperty[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await (api as any).searchSaleProperties({ sort: 'newest', size: 6 });
        setRecentProperties(res?.content || res?.results || res || []);
      } catch {
        setRecentProperties([]);
      } finally {
        setLoadingRecent(false);
      }
    })();
  }, []);

  function handleSearch() {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (locality) params.set('query', locality);
    if (propertyType) params.set('type', propertyType);
    if (bhk) params.set('bedrooms', bhk.replace('+', ''));
    if (budgetIdx >= 0) {
      const range = BUDGET_RANGES[budgetIdx];
      params.set('priceMin', String(range.min * 100));
      if (range.max > 0) params.set('priceMax', String(range.max * 100));
    }
    router.push(`/buy/search?${params.toString()}`);
  }

  return (
    <>
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-orange-950 to-slate-900" />
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[400px] h-[400px] bg-pink-500/15 rounded-full blur-[100px]" />
        <div className="absolute top-[20%] left-[15%] w-[200px] h-[200px] bg-amber-400/10 rounded-full blur-[80px]" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 text-orange-300 text-xs font-semibold px-4 py-1.5 rounded-full tracking-wide uppercase">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Zero brokerage property marketplace
            </span>
          </div>

          <h1 className="text-center text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
            <span className="text-white">Find Your </span>
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-400 bg-clip-text text-transparent">
              Dream Home
            </span>
            <br className="hidden sm:block" />
            <span className="text-white"> on </span>
            <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
              Safar
            </span>
          </h1>

          <p className="text-center text-white/60 text-base sm:text-lg mt-5 mb-10 max-w-xl mx-auto leading-relaxed">
            Apartments, villas, plots, houses — buy verified properties across India.
            <br className="hidden sm:block" />
            <span className="text-orange-300/80">Zero brokerage. RERA verified. Rental history data.</span>
          </p>

          {/* ── Search Bar ── */}
          <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* City */}
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
              >
                <option value="" className="text-slate-900">Select City</option>
                {CITIES.map((c) => (
                  <option key={c} value={c} className="text-slate-900">{c}</option>
                ))}
              </select>

              {/* Locality */}
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="Locality / Area"
                className="bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />

              {/* Budget */}
              <select
                value={budgetIdx}
                onChange={(e) => setBudgetIdx(Number(e.target.value))}
                className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
              >
                <option value={-1} className="text-slate-900">Budget Range</option>
                {BUDGET_RANGES.map((r, i) => (
                  <option key={r.label} value={i} className="text-slate-900">{r.label}</option>
                ))}
              </select>

              {/* BHK */}
              <select
                value={bhk}
                onChange={(e) => setBhk(e.target.value)}
                className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
              >
                <option value="" className="text-slate-900">BHK</option>
                {BHK_OPTIONS.map((b) => (
                  <option key={b} value={b} className="text-slate-900">{b} BHK</option>
                ))}
              </select>

              {/* Property Type */}
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
              >
                <option value="" className="text-slate-900">Property Type</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="text-slate-900">{t.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSearch}
              className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition text-sm shadow-lg shadow-orange-500/30"
            >
              Search Properties
            </button>
          </div>
        </div>
      </section>

      {/* ── Popular Cities ── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="text-orange-500 text-sm font-semibold tracking-wide uppercase mb-2">Explore</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Popular Cities</h2>
          <p className="text-slate-500 mt-3 max-w-lg mx-auto">
            Browse properties in India&apos;s most sought-after cities
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {POPULAR_CITIES_DATA.map((city) => (
            <Link
              key={city.name}
              href={`/buy/search?city=${city.name}`}
              className="group relative overflow-hidden rounded-xl aspect-[4/3] border border-slate-200 hover:shadow-lg transition-shadow"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${city.gradient} opacity-90`} />
              <div className="relative z-10 h-full flex flex-col justify-end p-4">
                <h3 className="text-white font-bold text-lg group-hover:text-orange-300 transition-colors">{city.name}</h3>
                <p className="text-white/70 text-xs mt-0.5">Avg {city.avgPrice}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Quick Links ── */}
      <section className="bg-slate-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">Quick Links</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="bg-white border border-slate-200 hover:border-orange-300 hover:bg-orange-50 text-slate-700 hover:text-orange-600 px-6 py-3 rounded-xl text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Buy on Safar ── */}
      <section className="bg-gradient-to-b from-white to-slate-50 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-orange-500 text-sm font-semibold tracking-wide uppercase mb-2">Advantages</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Why Buy on Safar?
            </h2>
            <p className="text-slate-500 mt-3 max-w-lg mx-auto">
              A smarter way to find and buy your next property
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_BUY_FEATURES.map((item) => (
              <div
                key={item.title}
                className={`relative overflow-hidden rounded-2xl border ${item.border} bg-gradient-to-br ${item.accent} p-8 hover:shadow-lg transition-shadow`}
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl font-bold mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recently Listed Properties ── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="text-orange-500 text-sm font-semibold tracking-wide uppercase mb-2">Fresh listings</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Recently Listed</h2>
          <p className="text-slate-500 mt-3 max-w-lg mx-auto">
            The newest properties added to our marketplace
          </p>
        </div>

        {loadingRecent ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
                <div className="bg-slate-200 h-48" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-5 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : recentProperties.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-10">No properties listed yet. Check back soon!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProperties.map((prop) => (
              <Link
                key={prop.id}
                href={`/buy/${prop.id}`}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow group"
              >
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  {prop.primaryPhotoUrl ? (
                    <img
                      src={prop.primaryPhotoUrl.startsWith('http') ? prop.primaryPhotoUrl : `${process.env.NEXT_PUBLIC_API_URL || ''}${prop.primaryPhotoUrl}`}
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-4xl">
                      🏠
                    </div>
                  )}
                  {prop.reraVerified && (
                    <span className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      RERA
                    </span>
                  )}
                  <span className="absolute top-3 right-3 bg-white/90 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize">
                    {prop.propertyType?.toLowerCase() || 'Property'}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 text-sm truncate group-hover:text-orange-600 transition-colors">
                    {prop.title}
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">
                    {prop.locality ? `${prop.locality}, ` : ''}{prop.city}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    {prop.bedrooms != null && <span>{prop.bedrooms} BHK</span>}
                    {prop.areaSqft != null && <span>{prop.areaSqft.toLocaleString('en-IN')} sqft</span>}
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-slate-900">{formatSalePrice(prop.pricePaise)}</span>
                    {prop.pricePerSqftPaise != null && (
                      <span className="text-xs text-slate-400">
                        {formatSalePrice(prop.pricePerSqftPaise)}/sqft
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Link
            href="/buy/search"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-xl transition text-sm shadow-lg shadow-orange-500/20"
          >
            View All Properties
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
