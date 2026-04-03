'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import Link from 'next/link';

const CUISINES = [
  'SOUTH_INDIAN', 'NORTH_INDIAN', 'BENGALI', 'MAHARASHTRIAN', 'GUJARATI', 'PUNJABI',
  'HYDERABADI', 'KERALA', 'CHINESE', 'CONTINENTAL', 'MUGHLAI', 'ITALIAN',
  'RAJASTHANI', 'STREET_FOOD', 'THAI', 'JAPANESE', 'DESSERTS', 'JAIN',
];

const SERVICE_CARDS = [
  { key: 'DOMESTIC', label: 'Home Cooks', desc: 'Daily meals & tiffin service', icon: '🍳', price: 299, rating: 4.8 },
  { key: 'PROFESSIONAL', label: 'Pro Chefs', desc: 'Restaurant-style dining at home', icon: '👨‍🍳', price: 799, rating: 4.9 },
  { key: 'EVENT_SPECIALIST', label: 'Event Caterers', desc: 'Parties, weddings & gatherings', icon: '🎪', price: 399, rating: 4.7 },
];

const OCCASIONS = [
  { key: 'BIRTHDAY', label: 'Birthday Party', icon: '🎂' },
  { key: 'WEDDING', label: 'Wedding', icon: '💍' },
  { key: 'HOUSEWARMING', label: 'House-warming', icon: '🏠' },
  { key: 'KITTY_PARTY', label: 'Kitty Party', icon: '🎉' },
  { key: 'CORPORATE', label: 'Corporate Event', icon: '💼' },
  { key: 'ANNIVERSARY', label: 'Anniversary', icon: '💝' },
  { key: 'FESTIVAL', label: 'Festival', icon: '🪔' },
  { key: 'BABY_SHOWER', label: 'Baby Shower', icon: '👶' },
  { key: 'POOJA', label: 'Pooja / Puja', icon: '🙏' },
  { key: 'COCKTAIL', label: 'Cocktail Night', icon: '🍹' },
  { key: 'BBQ', label: 'BBQ Party', icon: '🔥' },
  { key: 'NAVRATRI', label: 'Navratri', icon: '🕉️' },
];

const CITIES = [
  'Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Pune',
  'Kolkata', 'Ahmedabad', 'Jaipur', 'Goa', 'Lucknow', 'Kochi',
];

const SERVICE_TAGS: Record<string, string[]> = {
  tandoor: ['Tandoor Specialist'],
  punctual: ['Punctual'],
  speedy: ['Speedy Service'],
  polite: ['Very Polite'],
};

export default function CooksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chefs, setChefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [cuisine, setCuisine] = useState(searchParams.get('cuisine') || '');
  const [chefType, setChefType] = useState(searchParams.get('chefType') || '');
  const [mealType, setMealType] = useState(searchParams.get('mealType') || '');
  const [showAllOccasions, setShowAllOccasions] = useState(false);

  useEffect(() => {
    const params: Record<string, string> = { size: '20' };
    if (city) params.city = city;
    if (cuisine) params.cuisine = cuisine;
    if (chefType) params.chefType = chefType;
    if (mealType) params.mealType = mealType;

    setLoading(true);
    api.searchChefs(params)
      .then((data: any) => setChefs(data.content || data || []))
      .catch(() => setChefs([]))
      .finally(() => setLoading(false));
  }, [city, cuisine, chefType, mealType]);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero Section ── */}
      <section className="relative bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-20 relative">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
              Home Cooks & Party
              <br />
              <span className="text-amber-200">Chefs on Demand</span>
            </h1>
            <p className="mt-4 text-lg text-orange-100 max-w-lg">
              Hire verified home cooks for daily meals, professional chefs for special dinners,
              or event caterers for parties & weddings.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/cooks/events"
                className="px-6 py-3 bg-white text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition shadow-lg">
                Plan an Event
              </Link>
              <Link href="#chefs"
                className="px-6 py-3 bg-orange-700/40 text-white rounded-xl font-semibold hover:bg-orange-700/60 transition backdrop-blur-sm border border-white/20">
                Browse Cooks
              </Link>
              <Link href="/cooks/my-bookings"
                className="px-6 py-3 bg-orange-700/40 text-white rounded-xl font-semibold hover:bg-orange-700/60 transition backdrop-blur-sm border border-white/20">
                My Bookings
              </Link>
            </div>
          </div>
          {/* Trust Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
            <div>
              <p className="text-2xl sm:text-3xl font-bold">500+</p>
              <p className="text-xs text-orange-200 mt-0.5">Verified Cooks</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold">20+</p>
              <p className="text-xs text-orange-200 mt-0.5">Cities Served</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold">4.8</p>
              <p className="text-xs text-orange-200 mt-0.5">Avg. Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Service Cards ── */}
      <section className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SERVICE_CARDS.map(s => (
            <button key={s.key}
              onClick={() => { setChefType(s.key); document.getElementById('chefs')?.scrollIntoView({ behavior: 'smooth' }); }}
              className={`bg-white rounded-2xl shadow-lg border p-5 text-left hover:shadow-xl transition group ${chefType === s.key ? 'ring-2 ring-orange-500' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="text-3xl">{s.icon}</span>
                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <span className="text-yellow-500">&#9733;</span> {s.rating}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mt-3 group-hover:text-orange-600 transition">{s.label}</h3>
              <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
              <p className="text-sm font-semibold text-orange-600 mt-2">Starting at Rs {s.price}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── Occasions Grid ── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Book by Occasion</h2>
        <p className="text-sm text-gray-500 mb-6">Choose your event and we'll match you with the perfect cook</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {(showAllOccasions ? OCCASIONS : OCCASIONS.slice(0, 6)).map(o => (
            <Link key={o.key} href={`/cooks/events?eventType=${o.key}`}
              className="flex flex-col items-center p-4 rounded-xl border hover:border-orange-300 hover:bg-orange-50 transition text-center group">
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{o.icon}</span>
              <span className="text-xs font-medium text-gray-700 leading-tight">{o.label}</span>
            </Link>
          ))}
        </div>
        {OCCASIONS.length > 6 && (
          <button onClick={() => setShowAllOccasions(!showAllOccasions)}
            className="mt-4 text-sm text-orange-600 font-medium hover:text-orange-700">
            {showAllOccasions ? 'Show less' : `View all ${OCCASIONS.length} occasions`}
          </button>
        )}
      </section>

      {/* ── Cuisine Quick Links ── */}
      <section className="max-w-7xl mx-auto px-4 pb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Popular Cuisines</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCuisine('')}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition
              ${!cuisine ? 'bg-orange-500 text-white border-orange-500' : 'text-gray-600 border-gray-200 hover:border-orange-300'}`}>
            All
          </button>
          {CUISINES.map(c => (
            <button key={c} onClick={() => { setCuisine(c); document.getElementById('chefs')?.scrollIntoView({ behavior: 'smooth' }); }}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition
                ${cuisine === c ? 'bg-orange-500 text-white border-orange-500' : 'text-gray-600 border-gray-200 hover:border-orange-300'}`}>
              {c.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </section>

      {/* ── Chef Listings ── */}
      <section id="chefs" className="max-w-7xl mx-auto px-4 py-8 scroll-mt-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {chefType ? SERVICE_CARDS.find(s => s.key === chefType)?.label || 'Cooks' : 'All Cooks'}
              {city && <span className="text-orange-600"> in {city}</span>}
            </h2>
            {!loading && <p className="text-sm text-gray-500 mt-0.5">{chefs.length} cook{chefs.length !== 1 ? 's' : ''} found</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            <select value={city} onChange={e => setCity(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-orange-400">
              <option value="">All Cities</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={chefType} onChange={e => setChefType(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-orange-400">
              <option value="">All Types</option>
              {SERVICE_CARDS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <select value={mealType} onChange={e => setMealType(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-orange-400">
              <option value="">All Meals</option>
              <option value="BREAKFAST">Breakfast</option>
              <option value="LUNCH">Lunch</option>
              <option value="DINNER">Dinner</option>
              <option value="SNACKS">Snacks</option>
              <option value="ALL_DAY">All Day</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : chefs.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl">
            <p className="text-5xl mb-4">👨‍🍳</p>
            <p className="text-lg font-semibold text-gray-700">No cooks found</p>
            <p className="text-sm text-gray-500 mt-1 mb-4">Try a different city or cuisine filter</p>
            <button onClick={() => { setCity(''); setCuisine(''); setChefType(''); setMealType(''); }}
              className="text-sm text-orange-600 font-medium hover:text-orange-700">Clear all filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {chefs.map(chef => (
              <Link key={chef.id} href={`/cooks/${chef.id}`}
                className="bg-white rounded-2xl border hover:shadow-xl transition group overflow-hidden">
                {/* Photo Section */}
                <div className="h-44 bg-gradient-to-br from-orange-50 to-amber-50 relative overflow-hidden">
                  {chef.profilePhotoUrl ? (
                    <img src={chef.profilePhotoUrl} alt={chef.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-7xl opacity-50">👨‍🍳</span>
                    </div>
                  )}
                  {/* Badges overlay */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {chef.verified && (
                      <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold shadow-sm">
                        PRO
                      </span>
                    )}
                    {chef.chefType === 'EVENT_SPECIALIST' && (
                      <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full font-semibold shadow-sm">
                        EVENT
                      </span>
                    )}
                  </div>
                  {chef.rating > 0 && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                      <span className="text-yellow-500 text-xs">&#9733;</span>
                      <span className="text-xs font-bold text-gray-900">{chef.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition">{chef.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {chef.city}{chef.state ? `, ${chef.state}` : ''}
                      </p>
                    </div>
                    {chef.experienceYears > 0 && (
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                        {chef.experienceYears}yr exp
                      </span>
                    )}
                  </div>
                  {/* Cuisines */}
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {chef.cuisines?.split(',').slice(0, 3).map((c: string) => (
                      <span key={c} className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                        {c.trim().replace(/_/g, ' ')}
                      </span>
                    ))}
                    {chef.cuisines?.split(',').length > 3 && (
                      <span className="text-[10px] text-gray-400 px-1 py-0.5">+{chef.cuisines.split(',').length - 3} more</span>
                    )}
                  </div>
                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {chef.totalBookings > 0 && <span>{chef.totalBookings} bookings</span>}
                      {chef.reviewCount > 0 && <span>{chef.reviewCount} reviews</span>}
                    </div>
                    <div className="text-right">
                      {chef.dailyRatePaise > 0 && (
                        <p className="text-sm font-bold text-gray-900">
                          {formatPaise(chef.dailyRatePaise)}
                          <span className="text-[10px] font-normal text-gray-400">/day</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── How It Works ── */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Choose Service', desc: 'Daily cook, chef for a night, or event catering', icon: '📋', href: '#chefs' },
              { step: '2', title: 'Pick Your Cook', desc: 'Browse verified profiles, menus & reviews', icon: '👨‍🍳', href: '#chefs' },
              { step: '3', title: 'Book & Customize', desc: 'Select menu, date, and add-ons', icon: '📅', href: '/cooks/events' },
              { step: '4', title: 'Enjoy!', desc: 'Chef arrives, cooks & serves at your place', icon: '🍽️', href: '/cooks/my-bookings' },
            ].map(s => (
              <Link key={s.step} href={s.href} className="text-center group">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 group-hover:bg-orange-200 group-hover:scale-110 transition-all">
                  {s.icon}
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition">{s.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Register CTA ── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-orange-600 to-amber-500 rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-white">
            <h2 className="text-2xl sm:text-3xl font-bold">Are you a cook or chef?</h2>
            <p className="text-orange-100 mt-2 max-w-md">
              Join Safar Cooks and connect with thousands of customers. Get bookings for daily meals, parties & events.
            </p>
            <div className="flex gap-4 mt-4 text-sm text-orange-200">
              <span>Free registration</span>
              <span>Weekly payouts</span>
              <span>Growth support</span>
            </div>
          </div>
          <Link href="/cooks/register"
            className="shrink-0 bg-white text-orange-600 font-bold px-8 py-3.5 rounded-xl hover:bg-orange-50 transition shadow-lg text-lg">
            Register Now
          </Link>
        </div>
      </section>
    </div>
  );
}
