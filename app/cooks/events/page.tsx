'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import CityAutocomplete from '@/components/CityAutocomplete';
import LocalityAutocomplete from '@/components/LocalityAutocomplete';

const EVENT_TYPES = [
  { value: 'BIRTHDAY', label: 'Birthday Party', icon: '🎂' },
  { value: 'WEDDING', label: 'Wedding', icon: '💍' },
  { value: 'ANNIVERSARY', label: 'Anniversary', icon: '💝' },
  { value: 'HOUSEWARMING', label: 'House-warming', icon: '🏠' },
  { value: 'KITTY_PARTY', label: 'Kitty Party', icon: '🎉' },
  { value: 'CORPORATE', label: 'Corporate', icon: '💼' },
  { value: 'BABY_SHOWER', label: 'Baby Shower', icon: '👶' },
  { value: 'COCKTAIL', label: 'Cocktail Night', icon: '🍹' },
  { value: 'POOJA', label: 'Pooja / Puja', icon: '🙏' },
  { value: 'BBQ', label: 'BBQ Party', icon: '🔥' },
  { value: 'NAVRATRI', label: 'Navratri', icon: '🕉️' },
  { value: 'FESTIVAL', label: 'Festival', icon: '🪔' },
  { value: 'RECEPTION', label: 'Reception', icon: '🥂' },
  { value: 'ENGAGEMENT', label: 'Engagement', icon: '💎' },
  { value: 'FAREWELL', label: 'Farewell', icon: '👋' },
  { value: 'OTHER', label: 'Other Event', icon: '🎊' },
];

const CUISINE_OPTIONS = [
  'North Indian', 'South Indian', 'Chinese', 'Continental', 'Mughlai',
  'Multi-cuisine', 'Rajasthani', 'Bengali', 'Maharashtrian', 'Italian',
  'Thai', 'Mexican', 'Ghar ka Khaana', 'Street Food', 'Jain', 'Navratri Special',
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

// Fallbacks used while API loads or if it fails
const FALLBACK_COUNTERS = [
  { key: 'dosa', label: 'Live Dosa Counter', icon: '🥞', paise: 300000 },
  { key: 'pasta', label: 'Live Pasta Counter', icon: '🍝', paise: 350000 },
  { key: 'bbq', label: 'Live BBQ Counter', icon: '🔥', paise: 500000 },
  { key: 'chaat', label: 'Live Chaat Counter', icon: '🥗', paise: 250000 },
  { key: 'tandoor', label: 'Live Tandoor Counter', icon: '🫓', paise: 400000 },
];

const FALLBACK_ADDONS = [
  { key: 'decoration', label: 'Event Decoration', desc: 'Balloons, banners, table setting & theme decor', icon: '🎈', paise: 500000 },
  { key: 'cake', label: 'Designer Cake', desc: 'Custom theme cake (1-2 kg)', icon: '🎂', paise: 200000 },
  { key: 'crockery', label: 'Crockery Rental', desc: 'Plates, glasses, cutlery, serving bowls', icon: '🍽️', paise: 80000 },
  { key: 'appliances', label: 'Appliance Rental', desc: 'Chafing dishes, gas stoves, induction', icon: '🔌', paise: 50000 },
  { key: 'table_setup', label: 'Fine Dine Table Setup', desc: 'Premium tablecloth, candles, flowers', icon: '🕯️', paise: 80000 },
];

interface PricingItem {
  category: string;
  itemKey: string;
  label: string;
  description?: string;
  icon?: string;
  pricePaise: number;
  priceType: string;
  available?: boolean;
}

export default function EventBookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const chefId = searchParams.get('chefId') ?? '';
  const chefName = searchParams.get('chefName') ?? '';
  const preselectedEvent = searchParams.get('eventType') ?? '';

  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  // Form state
  const [eventType, setEventType] = useState(preselectedEvent || 'BIRTHDAY');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('12:00');
  const [durationHours, setDurationHours] = useState(4);
  const [guestCount, setGuestCount] = useState(25);
  const [venueAddress, setVenueAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [cuisineType, setCuisineType] = useState('Multi-cuisine');
  const [vegNonVeg, setVegNonVeg] = useState<'VEG' | 'NON_VEG' | 'BOTH'>('BOTH');
  const [specialRequests, setSpecialRequests] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [gasBurners, setGasBurners] = useState(2);

  // Add-ons
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [selectedCounters, setSelectedCounters] = useState<Set<string>>(new Set());
  const [extraStaff, setExtraStaff] = useState(false);
  const [staffCount, setStaffCount] = useState(2);

  // Dynamic pricing from API
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([]);
  const [pricingLoaded, setPricingLoaded] = useState(false);

  // ── Dish catalog state ──
  const [dishCatalog, setDishCatalog] = useState<Record<string, Dish[]>>({});
  const [dishLoading, setDishLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [selectedDishes, setSelectedDishes] = useState<Record<string, string[]>>({});
  const [selectDishesNow, setSelectDishesNow] = useState(false);
  const [activeSelectionCat, setActiveSelectionCat] = useState<string | null>(null);
  const [filterVeg, setFilterVeg] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [filterFried, setFilterFried] = useState(false);
  const [filterRecommended, setFilterRecommended] = useState(false);
  const [filterNoOnionGarlic, setFilterNoOnionGarlic] = useState(false);
  const [dishSearch, setDishSearch] = useState('');

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
      if (current.includes(dishId)) return { ...prev, [cat]: current.filter(d => d !== dishId) };
      if (current.length >= max) return prev;
      return { ...prev, [cat]: [...current, dishId] };
    });
  }

  function totalDishCount(): number {
    return Object.values(categoryCounts).reduce((sum, n) => sum + n, 0);
  }

  function totalSelectedDishes(): number {
    return Object.values(selectedDishes).reduce((sum, arr) => sum + arr.length, 0);
  }

  function getFilteredDishes(cat: string): Dish[] {
    return (dishCatalog[cat] || []).filter(d => {
      if (filterVeg === 'veg' && !d.isVeg) return false;
      if (filterVeg === 'nonveg' && d.isVeg) return false;
      if (filterFried && !d.isFried) return false;
      if (filterRecommended && !d.isRecommended) return false;
      if (filterNoOnionGarlic && !d.noOnionGarlic) return false;
      if (dishSearch && !d.name.toLowerCase().includes(dishSearch.toLowerCase())) return false;
      return true;
    });
  }

  function dishMenuTotal(): number {
    const allIds = Object.values(selectedDishes).flat();
    let total = 0;
    for (const dishes of Object.values(dishCatalog)) {
      for (const d of dishes) {
        if (allIds.includes(d.id)) total += d.pricePaise;
      }
    }
    return total * guestCount;
  }

  useEffect(() => {
    api.getEventPricing(chefId || undefined)
      .then((items: any[]) => {
        setPricingItems(items);
        setPricingLoaded(true);
      })
      .catch(() => setPricingLoaded(false));
  }, [chefId]);

  // Derive pricing arrays from API or fallbacks
  const LIVE_COUNTERS = pricingLoaded
    ? pricingItems.filter(i => i.category === 'LIVE_COUNTER' && i.available !== false).map(i => ({ key: i.itemKey, label: i.label, icon: i.icon || '', paise: i.pricePaise }))
    : FALLBACK_COUNTERS;
  const ADDONS = pricingLoaded
    ? pricingItems.filter(i => i.category === 'ADDON' && i.available !== false).map(i => ({ key: i.itemKey, label: i.label, desc: i.description || '', icon: i.icon || '', paise: i.pricePaise }))
    : FALLBACK_ADDONS;

  const perPlatePaise = pricingItems.find(i => i.itemKey === 'per_plate')?.pricePaise ?? 30000;
  const staffRatePaise = pricingItems.find(i => i.itemKey === 'staff')?.pricePaise ?? 150000;
  const platformFeePct = (pricingItems.find(i => i.itemKey === 'platform_fee_pct')?.pricePaise ?? 1000) / 10000; // basis points → fraction

  // Price estimate
  const menuPaise = selectDishesNow && totalSelectedDishes() > 0 ? dishMenuTotal() : 0;
  const foodPaise = menuPaise > 0 ? menuPaise : guestCount * perPlatePaise;
  const countersPaise = [...selectedCounters].reduce((sum, k) => sum + (LIVE_COUNTERS.find(c => c.key === k)?.paise ?? 0), 0);
  const addonsPaise = [...selectedAddons].reduce((sum, k) => sum + (ADDONS.find(a => a.key === k)?.paise ?? 0), 0);
  const staffPaise = extraStaff ? staffCount * staffRatePaise : 0;
  const subtotalPaise = foodPaise + countersPaise + addonsPaise + staffPaise;
  const platformFeePaise = Math.round(subtotalPaise * platformFeePct);
  const totalPaise = subtotalPaise + platformFeePaise;

  const toggleAddon = (key: string) => {
    setSelectedAddons(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };
  const toggleCounter = (key: string) => {
    setSelectedCounters(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const t = localStorage.getItem('access_token');
      if (t) {
        setToken(t);
        // Pre-fill Your Details from the logged-in user's profile so they don't retype
        // name/phone on every booking. Silent-fail: if the call blows up (expired token,
        // network), the fields just stay empty and the user fills them manually.
        api.getMyProfile(t)
          .then(p => {
            // Local consts narrow `string | undefined` to `string` inside the closure,
            // keeping TS happy about the setState callback return type.
            const name = p?.name;
            const phone = p?.phone;
            if (name) setCustomerName(prev => prev || name);
            if (phone) setCustomerPhone(prev => prev || phone);
          })
          .catch(() => { /* noop */ });
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const allSelectedDishIds = Object.values(selectedDishes).flat();
      const addOnsJson = JSON.stringify({
        decoration: selectedAddons.has('decoration'),
        cake: selectedAddons.has('cake'),
        crockery: selectedAddons.has('crockery'),
        appliances: selectedAddons.has('appliances'),
        tableSetup: selectedAddons.has('table_setup'),
        liveCounters: [...selectedCounters],
        extraStaff, staffCount: extraStaff ? staffCount : 0,
        vegNonVeg,
        selectedDishIds: allSelectedDishIds.length > 0 ? allSelectedDishIds : undefined,
        categoryCounts: totalDishCount() > 0 ? categoryCounts : undefined,
      });
      await api.createEventBooking({
        chefId: chefId || undefined,
        eventType,
        eventDate,
        eventTime,
        durationHours,
        guestCount,
        venueAddress,
        city,
        pincode,
        cuisinePreferences: cuisineType,
        decorationRequired: selectedAddons.has('decoration'),
        cakeRequired: selectedAddons.has('cake'),
        staffRequired: extraStaff,
        staffCount: extraStaff ? staffCount : 0,
        specialRequests,
        customerName,
        customerPhone,
        menuDescription: addOnsJson,
      }, token || undefined);
      router.push('/cooks/my-bookings');
    } catch (err: any) {
      setError(err?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const eventLabel = EVENT_TYPES.find(e => e.value === eventType)?.label || 'Event';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <button onClick={() => router.push('/cooks')} className="hover:text-orange-500">Safar Cooks</button>
          <span>/</span>
          <span className="text-gray-900 font-medium">Event Catering</span>
        </nav>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${step >= s ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{s}</div>
              <span className={`text-sm hidden sm:inline ${step >= s ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {s === 1 ? 'Event Details' : s === 2 ? 'Menu & Add-ons' : 'Confirm'}
              </span>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-orange-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
              )}

              {/* Step 1: Event Details */}
              {step === 1 && (
                <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">What's the occasion?</h2>
                    <p className="text-sm text-gray-500">Choose your event type and tell us the details</p>
                  </div>

                  {/* Event Type Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {EVENT_TYPES.map(et => (
                      <button key={et.value} type="button" onClick={() => setEventType(et.value)}
                        className={`p-3 rounded-xl border text-center text-sm transition
                          ${eventType === et.value ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-200 hover:border-orange-300 text-gray-600'}`}>
                        <div className="text-2xl mb-1">{et.icon}</div>
                        <span className="text-xs font-medium">{et.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Date, Time, Duration, Guests */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Event Date</label>
                      <input type="date" required value={eventDate} onChange={e => setEventDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                      <input type="time" required value={eventTime} onChange={e => setEventTime(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Duration (hrs)</label>
                      <input type="number" min={1} max={24} value={durationHours} onChange={e => setDurationHours(Number(e.target.value))}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Guests</label>
                      <input type="number" min={5} max={1000} value={guestCount} onChange={e => setGuestCount(Number(e.target.value))}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm" />
                    </div>
                  </div>

                  {/* Venue */}
                  <div className="border-t pt-5 space-y-4">
                    <h3 className="font-semibold text-gray-900">Venue Details</h3>
                    <input type="text" required value={venueAddress} onChange={e => setVenueAddress(e.target.value)}
                      placeholder="Full venue address" className="w-full border rounded-lg px-4 py-2.5 text-sm" />
                    <div className="grid grid-cols-2 gap-4">
                      <CityAutocomplete value={city} onChange={setCity} className="px-4 py-2.5" />
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Pincode</label>
                        <input type="text" required value={pincode} onChange={e => setPincode(e.target.value)}
                          placeholder="Pincode" maxLength={6} className="w-full border rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-orange-300 outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Gas Burners */}
                  <div className="border-t pt-5">
                    <label className="block text-xs font-medium text-gray-600 mb-2">No. of Gas Burners in your kitchen</label>
                    <div className="flex flex-wrap gap-2">
                      {[1,2,3,4,5,6].map(n => (
                        <button key={n} type="button" onClick={() => setGasBurners(n)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition
                            ${gasBurners === n ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:border-orange-300'}`}>
                          {n} burner{n > 1 ? 's' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="border-t pt-5 space-y-4">
                    <h3 className="font-semibold text-gray-900">Your Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                        placeholder="Your name" className="border rounded-lg px-4 py-2.5 text-sm" />
                      <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                        placeholder="Phone number" maxLength={10} className="border rounded-lg px-4 py-2.5 text-sm" />
                    </div>
                  </div>

                  <button type="button" onClick={() => {
                      if (!eventDate) { setError('Please select an event date'); return; }
                      if (!venueAddress.trim()) { setError('Please enter the venue address'); return; }
                      if (!city.trim()) { setError('Please select a city'); return; }
                      setError('');
                      setStep(2);
                    }}
                    className="w-full py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition">
                    Next: Menu & Add-ons
                  </button>
                </div>
              )}

              {/* Step 2: Menu & Add-ons */}
              {step === 2 && (
                <div className="space-y-6">
                  {/* Menu Preferences — Coox.in-style dish selection */}
                  <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Menu Preferences</h2>
                      <p className="text-sm text-gray-500">Select dishes for your {eventLabel} ({guestCount} guests)</p>
                    </div>

                    {/* Cuisine quick-pick */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Cuisine Style</label>
                      <div className="flex flex-wrap gap-2">
                        {CUISINE_OPTIONS.map(c => (
                          <button key={c} type="button" onClick={() => setCuisineType(c)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition
                              ${cuisineType === c ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:border-orange-300'}`}>
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Food Preference */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Food Preference</label>
                      <div className="flex gap-3">
                        {([
                          { value: 'VEG', label: 'Veg Only', color: '#22c55e', bg: '#f0fdf4' },
                          { value: 'NON_VEG', label: 'Non-Veg', color: '#ef4444', bg: '#fef2f2' },
                          { value: 'BOTH', label: 'Both', color: '#f97316', bg: '#fff7ed' },
                        ] as const).map(opt => (
                          <button key={opt.value} type="button" onClick={() => setVegNonVeg(opt.value)}
                            className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition"
                            style={vegNonVeg === opt.value
                              ? { borderColor: opt.color, backgroundColor: opt.bg, color: opt.color }
                              : {}}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* No. of Dishes per category */}
                    {!dishLoading && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-3">No. of Dishes</label>
                        <div className="space-y-3">
                          {CATEGORY_ORDER.map(cat => {
                            const meta = CATEGORY_META[cat];
                            const count = categoryCounts[cat] || 0;
                            const dishCount = (dishCatalog[cat] || []).length;
                            return (
                              <div key={cat} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{meta.icon}</span>
                                  <span className="text-sm font-medium text-gray-800">{meta.label}</span>
                                  {meta.optional && <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">optional</span>}
                                  <span className="text-[10px] text-gray-400">({dishCount})</span>
                                </div>
                                <div className="flex items-center">
                                  <button type="button" onClick={() => adjustCount(cat, -1)}
                                    className="w-8 h-8 rounded-l-lg border border-r-0 bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold text-lg flex items-center justify-center">-</button>
                                  <div className="w-10 h-8 border flex items-center justify-center text-sm font-bold bg-orange-500 text-white">
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
                          <label className="flex items-center gap-2 mt-5 pt-4 border-t cursor-pointer">
                            <input type="checkbox" checked={selectDishesNow} onChange={e => setSelectDishesNow(e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                            <span className="text-sm text-gray-700">I want to select dishes right now</span>
                          </label>
                        )}
                      </div>
                    )}

                    {dishLoading && (
                      <div className="animate-pulse space-y-3">
                        {[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}
                      </div>
                    )}
                  </div>

                  {/* ── Dish selection (expandable per category) ── */}
                  {selectDishesNow && totalDishCount() > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Select Dishes</h3>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button type="button" onClick={() => setFilterVeg(filterVeg === 'veg' ? 'all' : 'veg')}
                            className={`text-[10px] px-2 py-1 rounded-full font-semibold border transition ${filterVeg === 'veg' ? 'bg-green-500 text-white border-green-500' : 'text-green-600 border-green-300'}`}>Veg</button>
                          <button type="button" onClick={() => setFilterVeg(filterVeg === 'nonveg' ? 'all' : 'nonveg')}
                            className={`text-[10px] px-2 py-1 rounded-full font-semibold border transition ${filterVeg === 'nonveg' ? 'bg-red-500 text-white border-red-500' : 'text-red-600 border-red-300'}`}>Non-Veg</button>
                          <button type="button" onClick={() => setFilterFried(!filterFried)}
                            className={`text-[10px] px-2 py-1 rounded-full font-semibold border transition ${filterFried ? 'bg-orange-500 text-white border-orange-500' : 'text-orange-600 border-orange-300'}`}>Fried</button>
                          <button type="button" onClick={() => setFilterRecommended(!filterRecommended)}
                            className={`text-[10px] px-2 py-1 rounded-full font-semibold border transition ${filterRecommended ? 'bg-blue-600 text-white border-blue-600' : 'text-blue-600 border-blue-300'}`}>Recommended</button>
                          <button type="button" onClick={() => setFilterNoOnionGarlic(!filterNoOnionGarlic)}
                            className={`text-[10px] px-2 py-1 rounded-full font-semibold border transition ${filterNoOnionGarlic ? 'bg-purple-500 text-white border-purple-500' : 'text-purple-600 border-purple-300'}`}>No Onion/Garlic</button>
                        </div>
                      </div>

                      {/* Search */}
                      <div className="relative mb-4">
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input value={dishSearch} onChange={e => setDishSearch(e.target.value)}
                          placeholder="Search Dish..." className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-orange-300 outline-none" />
                      </div>

                      {/* Category sections */}
                      {CATEGORY_ORDER.filter(cat => (categoryCounts[cat] || 0) > 0).map(cat => {
                        const meta = CATEGORY_META[cat];
                        const maxCount = categoryCounts[cat] || 0;
                        const selected = selectedDishes[cat] || [];
                        const filtered = getFilteredDishes(cat);
                        const isExpanded = activeSelectionCat === cat;

                        return (
                          <div key={cat} className="mb-4">
                            <button type="button" onClick={() => setActiveSelectionCat(isExpanded ? null : cat)}
                              className="w-full flex items-center justify-between py-2.5 border-b hover:bg-gray-50 transition px-2 rounded">
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
                                        <span key={id} className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                          {d.name} ({formatPaise(d.pricePaise)})
                                          <button type="button" onClick={e => { e.stopPropagation(); toggleDish(cat, id); }}
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
                              <div className="mt-2 space-y-1 max-h-72 overflow-y-auto">
                                {filtered.length === 0 ? (
                                  <p className="text-sm text-gray-400 py-3 text-center">No dishes match your filters</p>
                                ) : filtered.map(dish => {
                                  const isSelected = selected.includes(dish.id);
                                  const canSelect = selected.length < maxCount;
                                  return (
                                    <button key={dish.id} type="button" onClick={() => toggleDish(cat, dish.id)}
                                      disabled={!isSelected && !canSelect}
                                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition text-left
                                        ${isSelected ? 'bg-orange-50 border-orange-300 ring-1 ring-orange-200' : 'border-gray-100 hover:bg-gray-50'}
                                        ${!isSelected && !canSelect ? 'opacity-40 cursor-not-allowed' : ''}`}>
                                      <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center shrink-0 overflow-hidden">
                                        {dish.photoUrl ? (
                                          <img src={dish.photoUrl} alt={dish.name} className="w-full h-full object-cover" />
                                        ) : (
                                          <span className="text-lg opacity-50">{meta.icon}</span>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 ${dish.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                                          </span>
                                          <span className="text-sm font-medium text-gray-900 truncate">{dish.name}</span>
                                          {dish.isRecommended && <span className="text-[9px] bg-orange-500 text-white px-1.5 py-0.5 rounded font-bold shrink-0">TOP</span>}
                                          {dish.isFried && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium shrink-0">Fried</span>}
                                        </div>
                                        {dish.noOnionGarlic && <p className="text-[10px] text-purple-500 mt-0.5">Can be made without onion, garlic</p>}
                                      </div>
                                      <span className="text-sm font-semibold text-gray-700 shrink-0">{formatPaise(dish.pricePaise)}</span>
                                      {isSelected && (
                                        <svg className="w-5 h-5 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
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

                      <label className="flex items-center gap-2 mt-3 pt-3 border-t cursor-pointer">
                        <input type="checkbox" onChange={() => setSelectDishesNow(false)}
                          className="w-4 h-4 rounded border-gray-300 text-gray-400" />
                        <span className="text-sm text-gray-500">I will select dishes later</span>
                      </label>
                    </div>
                  )}

                  {/* Dish selection summary */}
                  {totalDishCount() > 0 && selectDishesNow && totalSelectedDishes() > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-orange-800">{totalSelectedDishes()} dishes selected for {guestCount} guests</p>
                          <p className="text-xs text-orange-600 mt-0.5">Menu cost: {formatPaise(dishMenuTotal())} ({formatPaise(Math.round(dishMenuTotal() / guestCount))}/person)</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Special requests */}
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Special Requests</label>
                    <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)}
                      placeholder="Specific dishes, dietary restrictions, allergies..."
                      rows={3} className="w-full border rounded-lg px-4 py-2.5 text-sm resize-none" />
                  </div>

                  {/* Live Counters */}
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="font-semibold text-gray-900 mb-1">Live Counters</h3>
                    <p className="text-xs text-gray-500 mb-4">Add interactive food stations to your event</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {LIVE_COUNTERS.map(counter => (
                        <label key={counter.key}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition
                            ${selectedCounters.has(counter.key) ? 'border-orange-500 bg-orange-50' : 'hover:bg-gray-50'}`}>
                          <input type="checkbox" checked={selectedCounters.has(counter.key)}
                            onChange={() => toggleCounter(counter.key)}
                            className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500" />
                          <span className="text-xl">{counter.icon}</span>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">{counter.label}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-600">{formatPaise(counter.paise)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Add-ons */}
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="font-semibold text-gray-900 mb-1">Add-on Services</h3>
                    <p className="text-xs text-gray-500 mb-4">Make your event extra special</p>
                    <div className="space-y-3">
                      {ADDONS.map(addon => (
                        <label key={addon.key}
                          className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition
                            ${selectedAddons.has(addon.key) ? 'border-orange-500 bg-orange-50' : 'hover:bg-gray-50'}`}>
                          <input type="checkbox" checked={selectedAddons.has(addon.key)}
                            onChange={() => toggleAddon(addon.key)}
                            className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500" />
                          <span className="text-xl">{addon.icon}</span>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">{addon.label}</span>
                            <p className="text-xs text-gray-500">{addon.desc}</p>
                          </div>
                          <span className="text-sm font-semibold text-gray-600">+{formatPaise(addon.paise)}</span>
                        </label>
                      ))}

                      {/* Extra Staff */}
                      <div className={`p-4 rounded-lg border ${extraStaff ? 'border-orange-500 bg-orange-50' : ''}`}>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={extraStaff} onChange={e => setExtraStaff(e.target.checked)}
                            className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500" />
                          <span className="text-xl">🧑‍🍳</span>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">Extra Serving Staff</span>
                            <p className="text-xs text-gray-500">Waiters for serving & cleanup</p>
                          </div>
                          <span className="text-sm font-semibold text-gray-600">+{formatPaise(staffRatePaise)}/person</span>
                        </label>
                        {extraStaff && (
                          <div className="mt-3 ml-11 flex items-center gap-3">
                            <label className="text-xs text-gray-600">Number of staff:</label>
                            <input type="number" min={1} max={20} value={staffCount}
                              onChange={e => setStaffCount(Number(e.target.value))}
                              className="w-20 border rounded px-2 py-1 text-sm" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)}
                      className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition">
                      Back
                    </button>
                    <button type="button" onClick={() => setStep(3)}
                      className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition">
                      Review & Confirm
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirm */}
              {step === 3 && (
                <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Review Your Booking</h2>
                    <p className="text-sm text-gray-500">Confirm the details before submitting</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-0.5">Event</p>
                      <p className="font-semibold">{eventLabel}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-0.5">Date & Time</p>
                      <p className="font-semibold">{eventDate} at {eventTime}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-0.5">Guests</p>
                      <p className="font-semibold">{guestCount} people</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-0.5">Duration</p>
                      <p className="font-semibold">{durationHours} hours</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                      <p className="text-xs text-gray-500 mb-0.5">Venue</p>
                      <p className="font-semibold">{venueAddress}, {city} {pincode}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-0.5">Cuisine</p>
                      <p className="font-semibold">{cuisineType} ({vegNonVeg === 'BOTH' ? 'Veg + Non-veg' : vegNonVeg === 'VEG' ? 'Pure Veg' : 'Non-Veg'})</p>
                    </div>
                    {chefName && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-0.5">Chef</p>
                        <p className="font-semibold">{chefName}</p>
                      </div>
                    )}
                  </div>

                  {(selectedCounters.size > 0 || selectedAddons.size > 0 || extraStaff) && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Selected Add-ons</h3>
                      <div className="flex flex-wrap gap-2">
                        {[...selectedCounters].map(k => {
                          const c = LIVE_COUNTERS.find(x => x.key === k);
                          return c && <span key={k} className="text-xs bg-orange-50 text-orange-700 px-3 py-1 rounded-full">{c.icon} {c.label}</span>;
                        })}
                        {[...selectedAddons].map(k => {
                          const a = ADDONS.find(x => x.key === k);
                          return a && <span key={k} className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full">{a.icon} {a.label}</span>;
                        })}
                        {extraStaff && <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">🧑‍🍳 {staffCount} staff</span>}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(2)}
                      className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition">
                      Back
                    </button>
                    <button type="submit" disabled={submitting}
                      className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50">
                      {submitting ? 'Submitting...' : 'Request Quote'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Price Sidebar */}
          <div className="mt-6 lg:mt-0">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Price Estimate</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{menuPaise > 0 ? `Menu (${totalSelectedDishes()} dishes x ${guestCount})` : `Food (${guestCount} x ${formatPaise(perPlatePaise)})`}</span>
                  <span className="font-medium">{formatPaise(foodPaise)}</span>
                </div>
                {[...selectedCounters].map(k => {
                  const c = LIVE_COUNTERS.find(x => x.key === k);
                  return c && (
                    <div key={k} className="flex justify-between">
                      <span className="text-gray-600">{c.label}</span>
                      <span className="font-medium">{formatPaise(c.paise)}</span>
                    </div>
                  );
                })}
                {[...selectedAddons].map(k => {
                  const a = ADDONS.find(x => x.key === k);
                  return a && (
                    <div key={k} className="flex justify-between">
                      <span className="text-gray-600">{a.label}</span>
                      <span className="font-medium">{formatPaise(a.paise)}</span>
                    </div>
                  );
                })}
                {extraStaff && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Staff ({staffCount}x {formatPaise(staffRatePaise)})</span>
                    <span className="font-medium">{formatPaise(staffPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>Platform fee (10%)</span>
                  <span>{formatPaise(platformFeePaise)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t font-bold text-base">
                  <span>Estimated Total</span>
                  <span className="text-orange-600">{formatPaise(totalPaise)}</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-3">
                Final price will be confirmed by the chef based on your requirements.
              </p>

              {chefName && (
                <div className="mt-4 pt-4 border-t flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg">👨‍🍳</div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{chefName}</p>
                    <p className="text-xs text-gray-500">Event caterer</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
