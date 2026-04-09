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
  { key: 'BIRTHDAY', label: 'Birthday Party', icon: '🎂', bg: 'from-pink-100 to-rose-50', ring: 'hover:ring-pink-300' },
  { key: 'WEDDING', label: 'Wedding', icon: '💍', bg: 'from-purple-100 to-violet-50', ring: 'hover:ring-purple-300' },
  { key: 'HOUSEWARMING', label: 'House-warming', icon: '🏡', bg: 'from-blue-100 to-sky-50', ring: 'hover:ring-blue-300' },
  { key: 'KITTY_PARTY', label: 'Kitty Party', icon: '🎉', bg: 'from-yellow-100 to-amber-50', ring: 'hover:ring-yellow-300' },
  { key: 'CORPORATE', label: 'Corporate Event', icon: '💼', bg: 'from-slate-100 to-gray-50', ring: 'hover:ring-slate-300' },
  { key: 'ANNIVERSARY', label: 'Anniversary', icon: '💝', bg: 'from-red-100 to-rose-50', ring: 'hover:ring-red-300' },
  { key: 'FESTIVAL', label: 'Festival', icon: '🪔', bg: 'from-orange-100 to-amber-50', ring: 'hover:ring-orange-300' },
  { key: 'BABY_SHOWER', label: 'Baby Shower', icon: '👶', bg: 'from-cyan-100 to-teal-50', ring: 'hover:ring-cyan-300' },
  { key: 'POOJA', label: 'Pooja / Puja', icon: '🙏', bg: 'from-amber-100 to-yellow-50', ring: 'hover:ring-amber-300' },
  { key: 'COCKTAIL', label: 'Cocktail Night', icon: '🍹', bg: 'from-indigo-100 to-violet-50', ring: 'hover:ring-indigo-300' },
  { key: 'BBQ', label: 'BBQ Party', icon: '🔥', bg: 'from-orange-100 to-red-50', ring: 'hover:ring-orange-300' },
  { key: 'NAVRATRI', label: 'Navratri', icon: '🕉️', bg: 'from-emerald-100 to-green-50', ring: 'hover:ring-emerald-300' },
];

const CITIES = [
  'Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Pune',
  'Kolkata', 'Ahmedabad', 'Jaipur', 'Goa', 'Lucknow', 'Kochi',
];

const CATEGORY_META: Record<string, { label: string; icon: string; optional?: boolean }> = {
  SOUPS_BEVERAGES: { label: 'Soups & Beverages', icon: '🍜', optional: true },
  APPETIZERS:      { label: 'Appetizers', icon: '🥘' },
  MAIN_COURSE:     { label: 'Main Course', icon: '🍛' },
  BREADS:          { label: 'Breads', icon: '🫓' },
  RICE:            { label: 'Rice', icon: '🍚' },
  RAITA:           { label: 'Raita', icon: '🥣' },
  DESSERTS:        { label: 'Desserts', icon: '🍮', optional: true },
};

const CATEGORY_ORDER = ['SOUPS_BEVERAGES', 'APPETIZERS', 'MAIN_COURSE', 'BREADS', 'RICE', 'RAITA', 'DESSERTS'];

type Dish = {
  id: string; name: string; description?: string; category: string;
  pricePaise: number; photoUrl?: string; isVeg: boolean;
  isRecommended: boolean; noOnionGarlic: boolean; isFried: boolean;
};

type MatchedChef = {
  chefId: string; chefName: string; profilePhotoUrl?: string; city: string;
  rating: number; reviewCount: number; totalBookings: number;
  experienceYears: number; matchedDishCount: number; totalDishCount: number;
  estimatedPricePaise: number; cuisines?: string; verified: boolean; badge?: string;
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

  // ── Dish selection state ──
  const [dishCatalog, setDishCatalog] = useState<Record<string, Dish[]>>({});
  const [dishLoading, setDishLoading] = useState(true);
  const [guestCount, setGuestCount] = useState(8);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [selectedDishes, setSelectedDishes] = useState<Record<string, string[]>>({});
  const [selectDishesNow, setSelectDishesNow] = useState(false);
  const [activeSelectionCat, setActiveSelectionCat] = useState<string | null>(null);
  const [matchedChefs, setMatchedChefs] = useState<MatchedChef[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [showDishFlow, setShowDishFlow] = useState(false);
  // Filters
  const [filterVeg, setFilterVeg] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [filterFried, setFilterFried] = useState(false);
  const [filterRecommended, setFilterRecommended] = useState(false);
  const [filterNoOnionGarlic, setFilterNoOnionGarlic] = useState(false);
  const [dishSearch, setDishSearch] = useState('');

  // Load chefs
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

  // Load dish catalog
  useEffect(() => {
    setDishLoading(true);
    api.getDishCatalog()
      .then((data: any) => setDishCatalog(data || {}))
      .catch(() => setDishCatalog({}))
      .finally(() => setDishLoading(false));
  }, []);

  function adjustCount(cat: string, delta: number) {
    setCategoryCounts(prev => {
      const cur = prev[cat] || 0;
      const next = Math.max(0, cur + delta);
      // Clear selected dishes for this category if count reduced below selection count
      if (next < (selectedDishes[cat]?.length || 0)) {
        setSelectedDishes(sd => ({ ...sd, [cat]: (sd[cat] || []).slice(0, next) }));
      }
      return { ...prev, [cat]: next };
    });
  }

  function toggleDish(cat: string, dishId: string) {
    const max = categoryCounts[cat] || 0;
    setSelectedDishes(prev => {
      const current = prev[cat] || [];
      if (current.includes(dishId)) {
        return { ...prev, [cat]: current.filter(d => d !== dishId) };
      }
      if (current.length >= max) return prev; // can't add more
      return { ...prev, [cat]: [...current, dishId] };
    });
  }

  function totalSelectedDishes(): number {
    return Object.values(selectedDishes).reduce((sum, arr) => sum + arr.length, 0);
  }

  function totalDishCount(): number {
    return Object.values(categoryCounts).reduce((sum, n) => sum + n, 0);
  }

  function allDishIds(): string[] {
    return Object.values(selectedDishes).flat();
  }

  function estimatedTotal(): number {
    const allIds = allDishIds();
    let total = 0;
    for (const dishes of Object.values(dishCatalog)) {
      for (const d of dishes) {
        if (allIds.includes(d.id)) total += d.pricePaise;
      }
    }
    return total * guestCount;
  }

  async function findMatchingCooks() {
    const ids = allDishIds();
    if (ids.length === 0) return;
    setMatchLoading(true);
    try {
      const results = await api.matchChefsForDishes(ids);
      setMatchedChefs(results || []);
    } catch { setMatchedChefs([]); }
    setMatchLoading(false);
  }

  function getFilteredDishes(cat: string): Dish[] {
    const dishes = dishCatalog[cat] || [];
    return dishes.filter(d => {
      if (filterVeg === 'veg' && !d.isVeg) return false;
      if (filterVeg === 'nonveg' && d.isVeg) return false;
      if (filterFried && !d.isFried) return false;
      if (filterRecommended && !d.isRecommended) return false;
      if (filterNoOnionGarlic && !d.noOnionGarlic) return false;
      if (dishSearch && !d.name.toLowerCase().includes(dishSearch.toLowerCase())) return false;
      return true;
    });
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero Section ── */}
      <section className="relative bg-[#003B95] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzem0tMjQgMjRjMS42NTcgMCAzLTEuMzQzIDMtM3MtMS4zNDMtMy0zLTMtMyAxLjM0My0zIDMgMS4zNDMgMyAzIDN6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-14 sm:pt-16 sm:pb-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-[42px] font-bold leading-tight tracking-[-0.02em]">
              Home Cooks & Party
              <br />
              <span className="text-[#FFB700]">Chefs on Demand</span>
            </h1>
            <p className="mt-3 text-base sm:text-lg text-white/80 max-w-lg leading-relaxed">
              Hire verified home cooks for daily meals, professional chefs for special dinners,
              or event caterers for parties & weddings.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <button onClick={() => { setShowDishFlow(true); document.getElementById('dish-selection')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="px-6 py-3 bg-[#FFB700] text-[#003B95] rounded-xl font-semibold hover:bg-[#ffc933] transition shadow-lg">
                Select Menu & Find Cook
              </button>
              <Link href="/cooks/events"
                className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition backdrop-blur-sm border border-white/20">
                Plan an Event
              </Link>
              <Link href="/cooks/my-bookings"
                className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition backdrop-blur-sm border border-white/20">
                My Bookings
              </Link>
            </div>
          </div>
          {/* Trust Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
            <div><p className="text-2xl sm:text-3xl font-bold">500+</p><p className="text-xs text-white/60 mt-0.5">Verified Cooks</p></div>
            <div><p className="text-2xl sm:text-3xl font-bold">20+</p><p className="text-xs text-white/60 mt-0.5">Cities Served</p></div>
            <div><p className="text-2xl sm:text-3xl font-bold">4.8</p><p className="text-xs text-white/60 mt-0.5">Avg. Rating</p></div>
          </div>
        </div>
      </section>

      {/* ── Service Cards ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SERVICE_CARDS.map(s => (
            <button key={s.key}
              onClick={() => { setChefType(s.key); document.getElementById('chefs')?.scrollIntoView({ behavior: 'smooth' }); }}
              className={`bg-white rounded-2xl shadow-lg border p-5 text-left hover:shadow-xl transition group ${chefType === s.key ? 'ring-2 ring-[#003B95]' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="text-3xl">{s.icon}</span>
                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <span className="text-yellow-500">&#9733;</span> {s.rating}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mt-3 group-hover:text-[#003B95] transition">{s.label}</h3>
              <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
              <p className="text-sm font-semibold text-[#003B95] mt-2">Starting at Rs {s.price}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          ── DISH SELECTION FLOW (Coox.in style) ──
          ══════════════════════════════════════════════════════════════════ */}
      <section id="dish-selection" className="max-w-5xl mx-auto px-4 sm:px-6 py-12 scroll-mt-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Select Your Menu</h2>
            <p className="text-sm text-gray-500 mt-1">Choose dishes and we'll find the perfect cook for you</p>
          </div>
          {!showDishFlow && (
            <button onClick={() => setShowDishFlow(true)}
              className="text-sm bg-[#003B95] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#00296b] transition">
              Start Selecting
            </button>
          )}
        </div>

        {showDishFlow && !dishLoading && (
          <div className="mt-6 space-y-6">
            {/* ── Step 1: Guest count ── */}
            <div className="bg-white border rounded-2xl p-5">
              <label className="text-sm font-semibold text-gray-700">No. of People for Lunch <span className="text-gray-400 font-normal">(5+ years of age)</span></label>
              <div className="mt-2 flex items-center gap-3">
                <select value={guestCount} onChange={e => setGuestCount(Number(e.target.value))}
                  className="border rounded-xl px-4 py-2.5 text-sm bg-white w-48 font-medium focus:ring-2 focus:ring-[#003B95]/40 outline-none">
                  {[2,4,6,8,10,12,15,20,25,30,40,50,75,100].map(n =>
                    <option key={n} value={n}>{n} People</option>
                  )}
                </select>
              </div>
            </div>

            {/* ── Step 2: Category dish counts ── */}
            <div className="bg-white border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">No. of Dishes</h3>
              <div className="space-y-4">
                {CATEGORY_ORDER.map(cat => {
                  const meta = CATEGORY_META[cat];
                  const count = categoryCounts[cat] || 0;
                  const dishCount = (dishCatalog[cat] || []).length;
                  return (
                    <div key={cat} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{meta.icon}</span>
                        <span className="text-sm font-medium text-gray-800">{meta.label}</span>
                        {meta.optional && <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">optional</span>}
                        <span className="text-[10px] text-gray-400">({dishCount} items)</span>
                      </div>
                      <div className="flex items-center">
                        <button type="button" onClick={() => adjustCount(cat, -1)}
                          className="w-8 h-8 rounded-l-lg border border-r-0 bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold text-lg flex items-center justify-center">-</button>
                        <div className="w-10 h-8 border flex items-center justify-center text-sm font-bold bg-[#FFB700] text-white">
                          {count}
                        </div>
                        <button type="button" onClick={() => adjustCount(cat, 1)}
                          className="w-8 h-8 rounded-r-lg border border-l-0 bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold text-lg flex items-center justify-center">+</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Select dishes checkbox */}
              {totalDishCount() > 0 && (
                <label className="flex items-center gap-2 mt-6 pt-4 border-t cursor-pointer">
                  <input type="checkbox" checked={selectDishesNow} onChange={e => setSelectDishesNow(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#003B95] focus:ring-[#003B95]" />
                  <span className="text-sm text-gray-700">I want to select dishes right now</span>
                </label>
              )}
            </div>

            {/* ── Step 3: Dish selection (Coox.in style) ── */}
            {selectDishesNow && totalDishCount() > 0 && (
              <div className="bg-white border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700">Select Dishes</h3>
                  {/* Filters */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setFilterVeg(filterVeg === 'veg' ? 'all' : 'veg')}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border transition ${filterVeg === 'veg' ? 'bg-green-500 text-white border-green-500' : 'text-green-600 border-green-300 hover:bg-green-50'}`}>
                      Veg
                    </button>
                    <button onClick={() => setFilterVeg(filterVeg === 'nonveg' ? 'all' : 'nonveg')}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border transition ${filterVeg === 'nonveg' ? 'bg-red-500 text-white border-red-500' : 'text-red-600 border-red-300 hover:bg-red-50'}`}>
                      Non-Veg
                    </button>
                    <button onClick={() => setFilterFried(!filterFried)}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border transition ${filterFried ? 'bg-orange-500 text-white border-orange-500' : 'text-orange-600 border-orange-300 hover:bg-orange-50'}`}>
                      Fried Items
                    </button>
                    <button onClick={() => setFilterRecommended(!filterRecommended)}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border transition ${filterRecommended ? 'bg-[#003B95] text-white border-[#003B95]' : 'text-[#003B95] border-[#003B95]/30 hover:bg-blue-50'}`}>
                      Recommended
                    </button>
                    <button onClick={() => setFilterNoOnionGarlic(!filterNoOnionGarlic)}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border transition ${filterNoOnionGarlic ? 'bg-purple-500 text-white border-purple-500' : 'text-purple-600 border-purple-300 hover:bg-purple-50'}`}>
                      No Onion/Garlic
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="relative mb-5">
                  <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input value={dishSearch} onChange={e => setDishSearch(e.target.value)}
                    placeholder="Search Dish..."
                    className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#003B95]/40 outline-none" />
                </div>

                {/* Category sections */}
                {CATEGORY_ORDER.filter(cat => (categoryCounts[cat] || 0) > 0).map(cat => {
                  const meta = CATEGORY_META[cat];
                  const maxCount = categoryCounts[cat] || 0;
                  const selected = selectedDishes[cat] || [];
                  const filtered = getFilteredDishes(cat);
                  const isExpanded = activeSelectionCat === cat;

                  return (
                    <div key={cat} className="mb-5">
                      <button onClick={() => setActiveSelectionCat(isExpanded ? null : cat)}
                        className="w-full flex items-center justify-between py-3 border-b hover:bg-gray-50 transition px-2 rounded">
                        <div className="flex items-center gap-2">
                          <span>{meta.icon}</span>
                          <span className="text-sm font-semibold text-gray-800">{meta.label}</span>
                          <span className="text-xs text-gray-400">({selected.length}/{maxCount})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {selected.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {selected.map(id => {
                                const d = (dishCatalog[cat] || []).find(x => x.id === id);
                                return d ? (
                                  <span key={id} className="text-[10px] bg-blue-50 text-[#003B95] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                    {d.name} ({formatPaise(d.pricePaise)})
                                    <button onClick={e => { e.stopPropagation(); toggleDish(cat, id); }}
                                      className="text-red-400 hover:text-red-600 ml-0.5">&times;</button>
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                          <svg className={`w-4 h-4 text-gray-400 transition ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-1 max-h-80 overflow-y-auto">
                          {filtered.length === 0 ? (
                            <p className="text-sm text-gray-400 py-4 text-center">No dishes match your filters</p>
                          ) : filtered.map(dish => {
                            const isSelected = selected.includes(dish.id);
                            const canSelect = selected.length < maxCount;
                            return (
                              <button key={dish.id} type="button"
                                onClick={() => toggleDish(cat, dish.id)}
                                disabled={!isSelected && !canSelect}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition text-left
                                  ${isSelected ? 'bg-blue-50 border-[#003B95]/30 ring-1 ring-[#003B95]/20' : 'border-gray-100 hover:bg-gray-50'}
                                  ${!isSelected && !canSelect ? 'opacity-40 cursor-not-allowed' : ''}`}>
                                {/* Dish photo placeholder */}
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center shrink-0 overflow-hidden">
                                  {dish.photoUrl ? (
                                    <img src={dish.photoUrl} alt={dish.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xl opacity-50">{meta.icon}</span>
                                  )}
                                </div>
                                {/* Veg/Non-veg indicator + Name */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 ${dish.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                                    </span>
                                    <span className="text-sm font-medium text-gray-900 truncate">{dish.name}</span>
                                    {dish.isRecommended && <span className="text-[9px] bg-[#003B95] text-white px-1.5 py-0.5 rounded font-bold shrink-0">TOP</span>}
                                    {dish.isFried && <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium shrink-0">Fried</span>}
                                  </div>
                                  {dish.noOnionGarlic && (
                                    <p className="text-[10px] text-purple-500 mt-0.5">Can be made without onion, garlic</p>
                                  )}
                                </div>
                                {/* Price */}
                                <span className="text-sm font-semibold text-gray-700 shrink-0">{formatPaise(dish.pricePaise)}</span>
                                {/* Check */}
                                {isSelected && (
                                  <svg className="w-5 h-5 text-[#003B95] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Deferred selection option */}
                <label className="flex items-center gap-2 mt-4 pt-3 border-t cursor-pointer">
                  <input type="checkbox" onChange={() => setSelectDishesNow(false)}
                    className="w-4 h-4 rounded border-gray-300 text-gray-400" />
                  <span className="text-sm text-gray-500">I will select dishes later</span>
                </label>
              </div>
            )}

            {/* ── Summary & Find Cooks button ── */}
            {totalDishCount() > 0 && (
              <div className="bg-gradient-to-r from-[#003B95] to-[#0057D9] rounded-2xl p-5 text-white">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white/70">Your Selection</p>
                    <p className="text-lg font-bold mt-0.5">
                      {guestCount} guests &middot; {totalDishCount()} dishes
                      {selectDishesNow && totalSelectedDishes() > 0 && (
                        <span className="text-[#FFB700]"> &middot; {totalSelectedDishes()} selected</span>
                      )}
                    </p>
                    {selectDishesNow && totalSelectedDishes() > 0 && (
                      <p className="text-sm text-white/60 mt-1">
                        Est. total: <span className="text-[#FFB700] font-semibold">{formatPaise(estimatedTotal())}</span>
                        <span className="text-white/40"> ({formatPaise(Math.round(estimatedTotal() / guestCount))}/person)</span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={findMatchingCooks}
                    disabled={matchLoading || (selectDishesNow && totalSelectedDishes() === 0)}
                    className="px-8 py-3 bg-[#FFB700] text-[#003B95] rounded-xl font-bold hover:bg-[#ffc933] transition shadow-lg disabled:opacity-50">
                    {matchLoading ? 'Finding Cooks...' : 'Find Matching Cooks'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Matched Chefs Results ── */}
            {matchedChefs.length > 0 && (
              <div className="mt-2">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {matchedChefs.length} Cook{matchedChefs.length !== 1 ? 's' : ''} Found
                  <span className="text-sm font-normal text-gray-500 ml-2">who can prepare your selection</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matchedChefs.map(chef => (
                    <div key={chef.chefId}
                      className="bg-white rounded-2xl border hover:shadow-xl transition overflow-hidden group">
                      <div className="h-36 bg-gradient-to-br from-blue-50 to-slate-50 relative overflow-hidden">
                        {chef.profilePhotoUrl ? (
                          <img src={chef.profilePhotoUrl} alt={chef.chefName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-6xl opacity-50">👨‍🍳</span>
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex gap-1">
                          {chef.verified && <span className="text-[10px] bg-[#003B95] text-white px-2 py-0.5 rounded-full font-semibold">PRO</span>}
                          <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold">
                            {chef.matchedDishCount}/{totalSelectedDishes() || totalDishCount()} dishes
                          </span>
                        </div>
                        {chef.rating > 0 && (
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                            <span className="text-yellow-500 text-xs">&#9733;</span>
                            <span className="text-xs font-bold">{chef.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-gray-900 group-hover:text-[#003B95] transition">{chef.chefName}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{chef.city} {chef.experienceYears ? `· ${chef.experienceYears}yr exp` : ''}</p>
                        {chef.cuisines && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {chef.cuisines.split(',').slice(0, 3).map((c: string) => (
                              <span key={c} className="text-[10px] bg-blue-50 text-[#003B95] px-2 py-0.5 rounded-full font-medium">{c.trim().replace(/_/g, ' ')}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div className="text-xs text-gray-500">
                            {chef.totalBookings > 0 && <span>{chef.totalBookings} bookings</span>}
                            {chef.reviewCount > 0 && <span className="ml-2">{chef.reviewCount} reviews</span>}
                          </div>
                          {chef.estimatedPricePaise > 0 && (
                            <p className="text-sm font-bold text-gray-900">
                              {formatPaise(chef.estimatedPricePaise * guestCount)}
                              <span className="text-[10px] font-normal text-gray-400"> est.</span>
                            </p>
                          )}
                        </div>
                        <Link href={`/cooks/book?chefId=${chef.chefId}&type=DAILY&guests=${guestCount}&dishes=${allDishIds().join(',')}`}
                          className="mt-3 w-full block text-center bg-[#003B95] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#00296b] transition">
                          Book This Cook
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {matchedChefs.length === 0 && !matchLoading && totalSelectedDishes() > 0 && (
              <div id="no-match" />
            )}
          </div>
        )}

        {showDishFlow && dishLoading && (
          <div className="mt-6 animate-pulse space-y-4">
            <div className="h-20 bg-gray-100 rounded-2xl" />
            <div className="h-60 bg-gray-100 rounded-2xl" />
          </div>
        )}
      </section>

      {/* ── Occasions Grid ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Book by Occasion</h2>
        <p className="text-sm text-gray-500 mb-6">Choose your event and we'll match you with the perfect cook</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {(showAllOccasions ? OCCASIONS : OCCASIONS.slice(0, 6)).map(o => (
            <Link key={o.key} href={`/cooks/events?eventType=${o.key}`}
              className={`flex flex-col items-center p-5 rounded-2xl border border-gray-100 bg-white hover:shadow-lg ${o.ring} hover:ring-2 transition-all duration-200 text-center group`}>
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${o.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200 shadow-sm`}>
                <span className="text-2xl">{o.icon}</span>
              </div>
              <span className="text-xs font-semibold text-gray-800 leading-tight">{o.label}</span>
            </Link>
          ))}
        </div>
        {OCCASIONS.length > 6 && (
          <div className="text-center mt-6">
            <button onClick={() => setShowAllOccasions(!showAllOccasions)}
              className="text-sm text-[#003B95] font-semibold hover:text-[#00296b] px-5 py-2 rounded-full border border-[#003B95]/30 hover:border-[#003B95] hover:bg-blue-50 transition-all">
              {showAllOccasions ? 'Show less' : `View all ${OCCASIONS.length} occasions`}
            </button>
          </div>
        )}
      </section>

      {/* ── Cuisine Quick Links ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Popular Cuisines</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCuisine('')}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition
              ${!cuisine ? 'bg-[#003B95] text-white border-[#003B95]' : 'text-gray-600 border-gray-200 hover:border-[#003B95]/50 hover:text-[#003B95]'}`}>
            All
          </button>
          {CUISINES.map(c => (
            <button key={c} onClick={() => { setCuisine(c); document.getElementById('chefs')?.scrollIntoView({ behavior: 'smooth' }); }}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition
                ${cuisine === c ? 'bg-[#003B95] text-white border-[#003B95]' : 'text-gray-600 border-gray-200 hover:border-[#003B95]/50 hover:text-[#003B95]'}`}>
              {c.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </section>

      {/* ── Chef Listings (Browse) ── */}
      <section id="chefs" className="max-w-5xl mx-auto px-4 sm:px-6 py-8 scroll-mt-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {chefType ? SERVICE_CARDS.find(s => s.key === chefType)?.label || 'Cooks' : 'All Cooks'}
              {city && <span className="text-[#003B95]"> in {city}</span>}
            </h2>
            {!loading && <p className="text-sm text-gray-500 mt-0.5">{chefs.length} cook{chefs.length !== 1 ? 's' : ''} found</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            <select value={city} onChange={e => setCity(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#003B95]/40">
              <option value="">All Cities</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={chefType} onChange={e => setChefType(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#003B95]/40">
              <option value="">All Types</option>
              {SERVICE_CARDS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <select value={mealType} onChange={e => setMealType(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#003B95]/40">
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
              className="text-sm text-[#003B95] font-medium hover:text-[#00296b]">Clear all filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {chefs.map(chef => (
              <Link key={chef.id} href={`/cooks/${chef.id}`}
                className="bg-white rounded-2xl border hover:shadow-xl transition group overflow-hidden">
                <div className="h-44 bg-gradient-to-br from-blue-50 to-slate-50 relative overflow-hidden">
                  {chef.profilePhotoUrl ? (
                    <img src={chef.profilePhotoUrl} alt={chef.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-7xl opacity-50">👨‍🍳</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {chef.verified && <span className="text-[10px] bg-[#003B95] text-white px-2 py-0.5 rounded-full font-semibold shadow-sm">PRO</span>}
                    {chef.chefType === 'EVENT_SPECIALIST' && <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full font-semibold shadow-sm">EVENT</span>}
                  </div>
                  {chef.rating > 0 && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                      <span className="text-yellow-500 text-xs">&#9733;</span>
                      <span className="text-xs font-bold text-gray-900">{chef.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-[#003B95] transition">{chef.name}</h3>
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
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {chef.cuisines?.split(',').slice(0, 3).map((c: string) => (
                      <span key={c} className="text-[10px] bg-blue-50 text-[#003B95] px-2 py-0.5 rounded-full font-medium">
                        {c.trim().replace(/_/g, ' ')}
                      </span>
                    ))}
                    {chef.cuisines?.split(',').length > 3 && (
                      <span className="text-[10px] text-gray-400 px-1 py-0.5">+{chef.cuisines.split(',').length - 3} more</span>
                    )}
                  </div>
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Select Dishes', desc: 'Pick your menu from 75+ dishes across 7 categories', icon: '🍽️', href: '#dish-selection' },
              { step: '2', title: 'Find Your Cook', desc: 'We match cooks who can prepare your exact selection', icon: '👨‍🍳', href: '#dish-selection' },
              { step: '3', title: 'Book & Pay', desc: 'Pay just 10% advance, rest at the time of service', icon: '💳', href: '/cooks/events' },
              { step: '4', title: 'Enjoy!', desc: 'Chef arrives, cooks & serves at your place', icon: '🎉', href: '/cooks/my-bookings' },
            ].map(s => (
              <Link key={s.step} href={s.href} className="text-center group">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 group-hover:bg-blue-100 group-hover:scale-110 transition-all">
                  {s.icon}
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-[#003B95] transition">{s.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Register CTA ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-[#003B95] rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-white">
            <h2 className="text-2xl sm:text-3xl font-bold">Are you a cook or chef?</h2>
            <p className="text-white/70 mt-2 max-w-md">
              Join Safar Cooks and connect with thousands of customers. Get bookings for daily meals, parties & events.
            </p>
            <div className="flex gap-4 mt-4 text-sm text-white/50">
              <span>Free registration</span>
              <span>Weekly payouts</span>
              <span>Growth support</span>
            </div>
          </div>
          <Link href="/cooks/register"
            className="shrink-0 bg-[#FFB700] text-[#003B95] font-bold px-8 py-3.5 rounded-xl hover:bg-[#ffc933] transition shadow-lg text-lg">
            Register Now
          </Link>
        </div>
      </section>
    </div>
  );
}
