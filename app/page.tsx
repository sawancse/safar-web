import SearchBar from '@/components/SearchBar';
import RecentSearches from '@/components/RecentSearches';
import StillInterested from '@/components/StillInterested';
import Recommendations from '@/components/Recommendations';
import TrendingListings from '@/components/TrendingListings';
import { OrganizationJsonLd, WebsiteJsonLd } from '@/components/JsonLd';
import Link from 'next/link';

const PROPERTY_TYPES = [
  { key: 'HOME',       label: 'Homes',         icon: '🏡' },
  { key: 'ROOM',       label: 'Rooms',         icon: '🛏️' },
  { key: 'VILLA',      label: 'Villas',        icon: '🏰' },
  { key: 'HOTEL',      label: 'Hotels',        icon: '🏨' },
  { key: 'RESORT',     label: 'Resorts',       icon: '🌴' },
  { key: 'HOMESTAY',   label: 'Homestays',     icon: '🏘️' },
  { key: 'PG',         label: 'PG',            icon: '🛌' },
  { key: 'COLIVING',   label: 'Co-living',     icon: '👥' },
  { key: 'FARMSTAY',   label: 'Farm Stays',    icon: '🌾' },
  { key: 'HOSTEL',     label: 'Hostels',       icon: '🎒' },
  { key: 'UNIQUE',     label: 'Unique Stays',  icon: '✨' },
  { key: 'COMMERCIAL', label: 'Commercial',    icon: '🏢' },
];

export default async function HomePage() {

  return (
    <>
      <OrganizationJsonLd />
      <WebsiteJsonLd />
      {/* ── Hero Section (Booking.com style) ── */}
      <section className="relative z-50 overflow-visible bg-[#003B95]">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzem0tMjQgMjRjMS42NTcgMCAzLTEuMzQzIDMtM3MtMS4zNDMtMy0zLTMtMyAxLjM0My0zIDMgMS4zNDMgMyAzIDN6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-14 sm:pt-16 sm:pb-16">
          {/* Headline — left aligned like Booking.com */}
          <div className="max-w-2xl">
            <h1 className="text-white text-3xl sm:text-[42px] font-bold leading-tight tracking-[-0.02em]">
              Find your next stay
            </h1>
            <p className="text-white/80 text-base sm:text-lg mt-2 leading-relaxed">
              Search deals on homes, hotels, PGs & much more...
            </p>
          </div>

          {/* Search Bar — full width */}
          <div className="mt-8">
            <SearchBar />
          </div>

          {/* Property types — grid that wraps to fit all */}
          <div className="flex flex-wrap gap-2 mt-8">
            {PROPERTY_TYPES.map(({ key, label, icon }) => (
              <Link key={key} href={`/search?type=${key}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium bg-white/95 text-[#003B95] hover:bg-white hover:shadow-md hover:scale-105 transition-all duration-150 shadow-sm">
                <span className="text-base leading-none">{icon}</span>
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Zero Commission Banner (below hero, like Genius strip) ── */}
      <section className="bg-gradient-to-r from-orange-500 to-amber-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white font-extrabold text-sm">0%</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm sm:text-base">Zero Commission Platform</p>
              <p className="text-white/80 text-xs sm:text-sm">Hosts keep 100% of earnings. Verified listings across 50+ Indian cities.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <div className="text-center">
              <p className="text-white font-extrabold text-lg">10K+</p>
              <p className="text-white/70 text-[10px] uppercase tracking-wide">Listings</p>
            </div>
            <div className="w-px h-8 bg-white/30" />
            <div className="text-center">
              <p className="text-white font-extrabold text-lg">4.8</p>
              <p className="text-white/70 text-[10px] uppercase tracking-wide">Avg Rating</p>
            </div>
            <div className="w-px h-8 bg-white/30" />
            <div className="text-center">
              <p className="text-white font-extrabold text-lg">50+</p>
              <p className="text-white/70 text-[10px] uppercase tracking-wide">Cities</p>
            </div>
          </div>
        </div>
      </section>


      {/* Recent Searches */}
      <RecentSearches />

      {/* Still Interested */}
      <StillInterested />

      {/* Property type tabs + Trending listings */}
      <TrendingListings />

      {/* Recommendations */}
      <div className="bg-gray-50 py-4">
        <Recommendations />
      </div>

      {/* ── Why Safar Section ── */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-orange-500 text-sm font-semibold tracking-wide uppercase mb-2">For hosts</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Why hosts choose Safar
            </h2>
            <p className="text-slate-500 mt-3 max-w-lg mx-auto">
              Zero commission. AI-powered tools. Full control over your property.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '💰',
                title: '0% commission',
                desc: 'Keep 100% of every booking. Pay a flat monthly subscription — ₹999/month.',
                accent: 'from-green-500/10 to-emerald-500/5',
                border: 'border-green-200',
              },
              {
                icon: '🤖',
                title: 'AI autopilot',
                desc: "Smart pricing, guest messaging, calendar optimization — AI runs your listing while you sleep.",
                accent: 'from-blue-500/10 to-indigo-500/5',
                border: 'border-blue-200',
              },
              {
                icon: '🛡️',
                title: 'Verified & insured',
                desc: 'Every listing is verified by our team. Zero deposit micro-insurance protects every booking.',
                accent: 'from-orange-500/10 to-amber-500/5',
                border: 'border-orange-200',
              },
            ].map((item) => (
              <div key={item.title}
                className={`relative overflow-hidden rounded-2xl border ${item.border} bg-gradient-to-br ${item.accent} p-8 hover:shadow-lg transition-shadow`}>
                <div className="text-4xl mb-5">{item.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <a href="/host"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-slate-800 transition shadow-lg shadow-slate-900/20">
              Start your 90-day free trial
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
