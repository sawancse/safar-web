'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import CityAutocomplete from '@/components/CityAutocomplete';
import LocalityAutocomplete from '@/components/LocalityAutocomplete';
import DateField from '@/components/DateField';

const EVENT_TYPES = [
  { value: 'BIRTHDAY',     label: 'Birthday Party', icon: '🎂',  img: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=240&auto=format&fit=crop&q=70' },
  { value: 'WEDDING',      label: 'Wedding',        icon: '💍',  img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=240&auto=format&fit=crop&q=70' },
  { value: 'ANNIVERSARY',  label: 'Anniversary',    icon: '💝',  img: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=240&auto=format&fit=crop&q=70' },
  { value: 'HOUSEWARMING', label: 'House-warming',  icon: '🏠',  img: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=240&auto=format&fit=crop&q=70' },
  { value: 'KITTY_PARTY',  label: 'Kitty Party',    icon: '🎉',  img: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=240&auto=format&fit=crop&q=70' },
  { value: 'CORPORATE',    label: 'Corporate',      icon: '💼',  img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=240&auto=format&fit=crop&q=70' },
  { value: 'BABY_SHOWER',  label: 'Baby Shower',    icon: '👶',  img: 'https://images.unsplash.com/photo-1515816052601-210d5501d471?w=240&auto=format&fit=crop&q=70' },
  { value: 'COCKTAIL',     label: 'Cocktail Night', icon: '🍹',  img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=240&auto=format&fit=crop&q=70' },
  { value: 'POOJA',        label: 'Pooja / Puja',   icon: '🙏',  img: 'https://images.unsplash.com/photo-1605979257913-1704eb7b6246?w=240&auto=format&fit=crop&q=70' },
  { value: 'BBQ',          label: 'BBQ Party',      icon: '🔥',  img: 'https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?w=240&auto=format&fit=crop&q=70' },
  { value: 'NAVRATRI',     label: 'Navratri',       icon: '🕉️', img: 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=240&auto=format&fit=crop&q=70' },
  { value: 'FESTIVAL',     label: 'Festival',       icon: '🪔',  img: 'https://images.unsplash.com/photo-1606830733744-0ad778449672?w=240&auto=format&fit=crop&q=70' },
  { value: 'RECEPTION',    label: 'Reception',      icon: '🥂',  img: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=240&auto=format&fit=crop&q=70' },
  { value: 'ENGAGEMENT',   label: 'Engagement',     icon: '💎',  img: 'https://images.unsplash.com/photo-1503104834685-7205e8607eb9?w=240&auto=format&fit=crop&q=70' },
  { value: 'FAREWELL',     label: 'Farewell',       icon: '👋',  img: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=240&auto=format&fit=crop&q=70' },
  { value: 'OTHER',        label: 'Other Event',    icon: '🎊',  img: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=240&auto=format&fit=crop&q=70' },
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

// Fallback list of partner services — used when /chef-events/pricing has no
// PARTNER_SERVICE rows yet (old seed, API down, etc). After V20 runs the
// page reads rates + labels from pricingItems.category === 'PARTNER_SERVICE'
// and this array only backs up the UI.
const FALLBACK_EVENT_SERVICES: { key: string; label: string; icon: string; range: string; desc: string; lowPaise: number; highPaise: number }[] = [
  { key: 'photography',   label: 'Photographer',        icon: '📷', range: '₹5k–₹25k',  desc: 'Candid + posed photos for the event',     lowPaise:  500000, highPaise: 2500000 },
  { key: 'videography',   label: 'Videographer',        icon: '🎥', range: '₹8k–₹40k',  desc: 'Highlight reel / full event video',       lowPaise:  800000, highPaise: 4000000 },
  { key: 'decoration_pro',label: 'Premium Decor',       icon: '🌸', range: '₹10k–₹60k', desc: 'Flowers, stage, backdrop, lighting',      lowPaise: 1000000, highPaise: 6000000 },
  { key: 'dj',            label: 'DJ',                  icon: '🎧', range: '₹8k–₹30k',  desc: 'Music + sound system + lights',           lowPaise:  800000, highPaise: 3000000 },
  { key: 'live_music',    label: 'Live music / band',   icon: '🎺', range: '₹10k–₹60k', desc: 'Sitar, flute, ghazal, or small band',     lowPaise: 1000000, highPaise: 6000000 },
  { key: 'mc',            label: 'MC / Host',           icon: '🎤', range: '₹5k–₹20k',  desc: 'Anchor for the evening',                  lowPaise:  500000, highPaise: 2000000 },
  { key: 'makeup',        label: 'Makeup artist',       icon: '💄', range: '₹3k–₹15k',  desc: 'For the couple / guest of honour',        lowPaise:  300000, highPaise: 1500000 },
  { key: 'mehndi',        label: 'Mehndi artist',       icon: '🎨', range: '₹2k–₹10k',  desc: 'Especially for anniversaries, birthdays', lowPaise:  200000, highPaise: 1000000 },
  { key: 'pandit',        label: 'Pandit / Puja',       icon: '🪔', range: '₹3k–₹12k',  desc: 'Silver/gold/diamond jubilee puja',        lowPaise:  300000, highPaise: 1200000 },
  { key: 'bouquet',       label: 'Bouquet / gifts',     icon: '💐', range: '₹1k–₹5k',   desc: 'Anniversary flowers, curated gift',       lowPaise:  100000, highPaise:  500000 },
  { key: 'cake_designer', label: 'Designer cake+',      icon: '🎂', range: '₹2k–₹10k',  desc: 'Tiered / photo-print / sugar-free',       lowPaise:  200000, highPaise: 1000000 },
  { key: 'entertainer',   label: 'Magician / Games',    icon: '🎩', range: '₹5k–₹20k',  desc: 'For kids-friendly anniversaries',         lowPaise:  500000, highPaise: 2000000 },
  { key: 'valet',         label: 'Valet / Parking',     icon: '🚗', range: '₹3k–₹10k',  desc: 'Valet + marshals for guests',             lowPaise:  300000, highPaise: 1000000 },
];

interface PricingItem {
  category: string;
  itemKey: string;
  label: string;
  description?: string;
  icon?: string;
  pricePaise: number;
  priceType: string;
  minPricePaise?: number;
  maxPricePaise?: number;
  sortOrder?: number;
  available?: boolean;
}

export default function EventBookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const chefId = searchParams.get('chefId') ?? '';
  const chefName = searchParams.get('chefName') ?? '';
  const preselectedEvent = searchParams.get('eventType') ?? '';
  // ?focus=<key> from /services tiles: auto-toggles a service or staff role
  // so the customer lands in step-2 with the right box ticked.
  const focusParam = searchParams.get('focus') ?? '';
  // Customer came from a partner-service L2 page (photographer/dj/etc.) or
  // staff-role tile. Hide chef/food/cuisine fields that are irrelevant for
  // "book a photographer for my event" — keep the flow lean.
  const serviceOnlyMode = !!focusParam;

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
  // Per-role staff: { waiter: 2, cleaner: 1, bartender: 1 }. Roles are
  // fetched from pricingItems where category === 'STAFF_ROLE'.
  const [staffRoleCounts, setStaffRoleCounts] = useState<Record<string, number>>({});

  // Extra non-cooking services (photography, DJ, puja, etc.)
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [serviceNotes, setServiceNotes] = useState<Record<string, string>>({});

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
  const [dishLoadError, setDishLoadError] = useState<string | null>(null);
  useEffect(() => {
    setDishLoading(true);
    setDishLoadError(null);
    api.getDishCatalog()
      .then((data: any) => {
        // Backend returns Map<DishCategory, List<DishCatalogResponse>> — may arrive as an object
        // keyed by enum name. Some older servers returned a flat List<DishCatalogResponse>, so
        // group it by category if that happens.
        if (Array.isArray(data)) {
          const grouped: Record<string, Dish[]> = {};
          for (const d of data) {
            const cat = d.category || 'UNCATEGORIZED';
            (grouped[cat] = grouped[cat] || []).push(d);
          }
          setDishCatalog(grouped);
        } else {
          setDishCatalog(data || {});
        }
        const total = Object.values(data || {}).reduce((n: number, arr: any) => n + (Array.isArray(arr) ? arr.length : 0), 0);
        console.log('[dishCatalog] loaded', total, 'dishes across', Object.keys(data || {}).length, 'categories');
      })
      .catch((e: any) => {
        console.error('[dishCatalog] load failed:', e);
        setDishCatalog({});
        setDishLoadError(e?.message || 'Failed to load dish catalog');
      })
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
    if (delta > 0) {
      setSelectDishesNow(true);
      setActiveSelectionCat(cat);
    }
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

  // Billing is flat per-plate (Option A) — dish selections are menu planning
  // only, not line items. Retained as a helper in case admins switch back
  // to per-dish billing later; returns 0 today.
  function dishMenuTotal(): number { return 0; }

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
  // Per-role staff rates from STAFF_ROLE pricing rows (V17 seeds waiter/cleaner/bartender).
  // If the API hasn't returned them yet, fall back to a minimal trio so the UI still renders.
  const STAFF_ROLES = pricingLoaded && pricingItems.some(i => i.category === 'STAFF_ROLE')
    ? pricingItems.filter(i => i.category === 'STAFF_ROLE' && i.available !== false).map(i => ({ key: i.itemKey, label: i.label, desc: i.description || '', icon: i.icon || '🧑‍🍳', paise: i.pricePaise }))
    : [
        { key: 'waiter',    label: 'Waiter',    desc: 'Serves food & drinks, clears plates',   icon: '🧑‍🍳', paise:  99900 },
        { key: 'cleaner',   label: 'Cleaner',   desc: 'Setup & cleanup before, during, after', icon: '🧹',    paise:  99900 },
        { key: 'bartender', label: 'Bartender', desc: 'Cocktails, mocktails, serves drinks',    icon: '🍸',   paise: 256900 },
      ];

  // Partner services (photographer, DJ, pandit etc.) — driven by V20's
  // PARTNER_SERVICE rows in event_pricing_defaults. Range string rebuilt
  // from min/max paise so admin edits flow through without code changes.
  // Falls back to FALLBACK_EVENT_SERVICES if the API hasn't returned any.
  const EVENT_SERVICES = pricingLoaded && pricingItems.some(i => i.category === 'PARTNER_SERVICE')
    ? pricingItems
        .filter(i => i.category === 'PARTNER_SERVICE' && i.available !== false)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map(i => {
          const low  = i.minPricePaise ?? i.pricePaise;
          const high = i.maxPricePaise ?? i.pricePaise;
          const toK = (p: number) => `₹${Math.round(p / 1000 / 100)}k`;
          return {
            key: i.itemKey,
            label: i.label,
            icon: i.icon || '✨',
            range: `${toK(low)}–${toK(high)}`,
            desc: i.description || '',
            lowPaise:  low,
            highPaise: high,
          };
        })
    : FALLBACK_EVENT_SERVICES;

  const perPlatePaise = pricingItems.find(i => i.itemKey === 'per_plate')?.pricePaise ?? 30000;
  const platformFeePct = (pricingItems.find(i => i.itemKey === 'platform_fee_pct')?.pricePaise ?? 1000) / 10000; // basis points → fraction

  // Price estimate — Option A: flat per-plate billing.
  // Dish selections are menu planning (chef uses them to decide what to cook)
  // and do not affect the bill.
  // In service-only mode (came from /services/<partner>), there's no
  // chef or food component — the customer is booking a single service.
  const foodPaise = serviceOnlyMode ? 0 : guestCount * perPlatePaise;
  const countersPaise = [...selectedCounters].reduce((sum, k) => sum + (LIVE_COUNTERS.find(c => c.key === k)?.paise ?? 0), 0);
  const addonsPaise = [...selectedAddons].reduce((sum, k) => sum + (ADDONS.find(a => a.key === k)?.paise ?? 0), 0);
  const staffPaise = STAFF_ROLES.reduce((sum, r) => sum + (staffRoleCounts[r.key] || 0) * r.paise, 0);
  const totalStaffCount = STAFF_ROLES.reduce((sum, r) => sum + (staffRoleCounts[r.key] || 0), 0);
  // Partner services — indicative midpoint used as estimate. Chef will
  // confirm the actual vendor quote before collecting balance.
  const servicesLowPaise  = [...selectedServices].reduce((s, k) => s + (EVENT_SERVICES.find(x => x.key === k)?.lowPaise  ?? 0), 0);
  const servicesHighPaise = [...selectedServices].reduce((s, k) => s + (EVENT_SERVICES.find(x => x.key === k)?.highPaise ?? 0), 0);
  const servicesEstPaise  = Math.round((servicesLowPaise + servicesHighPaise) / 2);
  const subtotalPaise = foodPaise + countersPaise + addonsPaise + staffPaise + servicesEstPaise;
  const platformFeePaise = Math.round(subtotalPaise * platformFeePct);
  const totalPaise = subtotalPaise + platformFeePaise;

  const toggleAddon = (key: string) => {
    setSelectedAddons(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };
  const toggleCounter = (key: string) => {
    setSelectedCounters(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };

  // If the customer arrived from a /services tile with ?focus=<key>,
  // pre-select that service (or staff role). We leave them on step 1 so they
  // still fill date/venue/guests — those are required for a valid quote.
  useEffect(() => {
    if (!focusParam) return;
    if (focusParam.startsWith('staff-')) {
      const role = focusParam.slice('staff-'.length);
      setStaffRoleCounts(prev => ({ ...prev, [role]: (prev[role] || 0) || 1 }));
    } else {
      setSelectedServices(prev => {
        if (prev.has(focusParam)) return prev;
        const n = new Set(prev);
        n.add(focusParam);
        return n;
      });
    }
  }, [focusParam]);

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
      // Prune zero-count roles so the stored JSON stays compact.
      const activeStaffRoles: Record<string, number> = {};
      for (const r of STAFF_ROLES) {
        const n = staffRoleCounts[r.key] || 0;
        if (n > 0) activeStaffRoles[r.key] = n;
      }
      const hasStaff = Object.keys(activeStaffRoles).length > 0;
      const staffRolesJson = hasStaff ? JSON.stringify(activeStaffRoles) : undefined;
      const addOnsJson = JSON.stringify({
        decoration: selectedAddons.has('decoration'),
        cake: selectedAddons.has('cake'),
        crockery: selectedAddons.has('crockery'),
        appliances: selectedAddons.has('appliances'),
        tableSetup: selectedAddons.has('table_setup'),
        liveCounters: [...selectedCounters],
        extraStaff: hasStaff, staffCount: totalStaffCount,
        staffRoles: hasStaff ? activeStaffRoles : undefined,
        vegNonVeg,
        selectedDishIds: allSelectedDishIds.length > 0 ? allSelectedDishIds : undefined,
        categoryCounts: totalDishCount() > 0 ? categoryCounts : undefined,
      });
      const servicesJson = selectedServices.size > 0
        ? JSON.stringify([...selectedServices].map(key => {
            const svc = EVENT_SERVICES.find(s => s.key === key);
            const low  = svc?.lowPaise  ?? 0;
            const high = svc?.highPaise ?? 0;
            return {
              key,
              label: svc?.label ?? key,
              range: svc?.range ?? '',
              notes: serviceNotes[key] || '',
              lowPaise:  low,
              highPaise: high,
              estPaise:  Math.round((low + high) / 2),
            };
          }))
        : undefined;
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
        cuisinePreferences: serviceOnlyMode ? undefined : cuisineType,
        decorationRequired: selectedAddons.has('decoration'),
        cakeRequired: selectedAddons.has('cake'),
        staffRequired: hasStaff,
        staffCount: totalStaffCount,
        specialRequests,
        customerName,
        customerPhone,
        menuDescription: addOnsJson,
        servicesJson,
        staffRolesJson,
      }, token || undefined);
      router.push('/cooks/my-bookings');
    } catch (err: any) {
      setError(err?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const eventLabel = EVENT_TYPES.find(e => e.value === eventType)?.label || 'Event';

  // Friendly label for the ?focus= banner on step 1.
  const focusLabel = focusParam
    ? focusParam.startsWith('staff-')
      ? ({ waiter: 'Waiters', cleaner: 'Cleaners', bartender: 'Bartenders' } as Record<string, string>)[focusParam.slice('staff-'.length)] || focusParam
      : EVENT_SERVICES.find(s => s.key === focusParam)?.label
    : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <button onClick={() => router.push('/cooks')} className="hover:text-orange-500">Safar Cooks</button>
          <span>/</span>
          <button onClick={() => router.push('/services')} className="hover:text-orange-500">Services</button>
          <span>/</span>
          <span className="text-gray-900 font-medium">Event Catering</span>
        </nav>

        {focusLabel && step === 1 && (
          <div className="mb-5 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm shrink-0">✨</div>
            <p className="text-sm text-orange-800">
              <span className="font-semibold">{focusLabel}</span> is pre-selected. Fill in the event details below and we'll carry it through to your quote.
            </p>
          </div>
        )}

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
                        className={`p-2 rounded-xl border text-center text-sm transition overflow-hidden
                          ${eventType === et.value ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-200 hover:border-orange-300 text-gray-600'}`}>
                        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 mb-1.5 flex items-center justify-center">
                          <span className="absolute text-2xl opacity-40 select-none">{et.icon}</span>
                          <img
                            src={et.img}
                            alt={et.label}
                            loading="lazy"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs font-medium">{et.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Date, Time, Duration, Guests */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Event Date</label>
                      <DateField required value={eventDate} onChange={e => setEventDate(e.target.value)}
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

                  {/* Gas Burners — only relevant when a chef is cooking */}
                  {!serviceOnlyMode && (
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
                  )}

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
                  {/* Menu Preferences — Coox.in-style dish selection. Hidden
                      entirely in service-only mode (customer came from a
                      partner-service tile, not the full event booking). */}
                  {!serviceOnlyMode && (
                  <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Menu Preferences</h2>
                      <p className="text-sm text-gray-500">Help your chef plan — pick the dishes you'd like for your {eventLabel} ({guestCount} guests). Billed at a flat {formatPaise(perPlatePaise)}/plate regardless of dish count.</p>
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
                  )}

                  {/* ── Dish selection (expandable per category) ── */}
                  {!serviceOnlyMode && selectDishesNow && totalDishCount() > 0 && (
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
                                <span className="text-[10px] text-blue-500 font-mono">[raw={(dishCatalog[cat] || []).length} filtered={filtered.length}]</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {selected.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {selected.map(id => {
                                      const d = (dishCatalog[cat] || []).find(x => x.id === id);
                                      return d ? (
                                        <span key={id} className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                          {d.name}
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
                                  (dishCatalog[cat] || []).length === 0 ? (
                                    dishLoadError ? (
                                      <p className="text-sm text-red-500 py-3 text-center">Couldn't load dishes — {dishLoadError}</p>
                                    ) : dishLoading ? (
                                      <p className="text-sm text-gray-400 py-3 text-center">Loading dishes...</p>
                                    ) : (
                                      <p className="text-sm text-gray-400 py-3 text-center">No dishes in this category yet.</p>
                                    )
                                  ) : (
                                    <p className="text-sm text-gray-400 py-3 text-center">No dishes match your filters</p>
                                  )
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
                                      {/* Dish prices are hidden — billing is flat per-plate (Option A). Dishes are menu planning. */}
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
                          <p className="text-xs text-orange-600 mt-0.5">Included in the ₹{Math.round(perPlatePaise / 100).toLocaleString('en-IN')}/plate price — dishes help the chef plan.</p>
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

                    </div>
                  </div>

                  {/* Service Staff — per role */}
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="font-semibold text-gray-900 mb-1">Service Staff</h3>
                    <p className="text-xs text-gray-500 mb-4">
                      Add how many of each role you need. Rates are per person for the event.
                    </p>
                    <div className="space-y-2">
                      {STAFF_ROLES.map(role => {
                        const count = staffRoleCounts[role.key] || 0;
                        const on = count > 0;
                        return (
                          <div key={role.key}
                               className={`flex items-center gap-3 p-3 rounded-lg border transition ${on ? 'border-orange-500 bg-orange-50' : ''}`}>
                            <span className="text-xl">{role.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium text-gray-900">{role.label}</span>
                                <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">+{formatPaise(role.paise)} per {role.label.toLowerCase()}</span>
                              </div>
                              <p className="text-xs text-gray-500">{role.desc}</p>
                            </div>
                            <div className="flex items-center">
                              <button type="button"
                                onClick={() => setStaffRoleCounts(prev => ({ ...prev, [role.key]: Math.max(0, (prev[role.key] || 0) - 1) }))}
                                className="w-8 h-8 rounded-l-lg border border-r-0 bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold text-lg flex items-center justify-center"
                                disabled={count === 0}>-</button>
                              <div className={`w-10 h-8 border flex items-center justify-center text-sm font-bold ${on ? 'bg-orange-500 text-white' : 'bg-white text-gray-700'}`}>
                                {count}
                              </div>
                              <button type="button"
                                onClick={() => setStaffRoleCounts(prev => ({ ...prev, [role.key]: Math.min(20, (prev[role.key] || 0) + 1) }))}
                                className="w-8 h-8 rounded-r-lg border border-l-0 bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold text-lg flex items-center justify-center">+</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {totalStaffCount > 0 && (
                      <div className="mt-3 text-xs text-gray-500 flex justify-between">
                        <span>{totalStaffCount} staff total</span>
                        <span className="font-semibold text-gray-700">{formatPaise(staffPaise)}</span>
                      </div>
                    )}
                  </div>

                  {/* Non-cooking services (photographer, DJ, puja, etc.) */}
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="font-semibold text-gray-900 mb-1">Additional Services</h3>
                    <p className="text-xs text-gray-500 mb-4">
                      Non-cooking services we can arrange through trusted partners. Tell us what you need — our chef will coordinate and send a combined quote.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {EVENT_SERVICES.map(svc => {
                        const on = selectedServices.has(svc.key);
                        return (
                          <div key={svc.key}
                               className={`rounded-lg border transition ${on ? 'border-orange-500 bg-orange-50' : 'hover:bg-gray-50'}`}>
                            <label className="flex items-start gap-3 p-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={on}
                                onChange={() => setSelectedServices(prev => {
                                  const n = new Set(prev);
                                  if (n.has(svc.key)) { n.delete(svc.key); } else { n.add(svc.key); }
                                  return n;
                                })}
                                className="mt-0.5 w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                              />
                              <span className="text-xl">{svc.icon}</span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900">{svc.label}</span>
                                  <span className="text-[11px] text-gray-500 font-semibold">{svc.range}</span>
                                </div>
                                <p className="text-[11px] text-gray-500 leading-snug">{svc.desc}</p>
                              </div>
                            </label>
                            {on && (
                              <div className="px-3 pb-3 pl-12">
                                <input
                                  type="text"
                                  placeholder="Any specifics? (e.g. candid only · 4 hrs · bridal look)"
                                  value={serviceNotes[svc.key] || ''}
                                  onChange={e => setServiceNotes(prev => ({ ...prev, [svc.key]: e.target.value }))}
                                  className="w-full border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-orange-300 outline-none"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {selectedServices.size > 0 && (
                      <p className="text-[11px] text-gray-500 mt-3">
                        We'll share a quote covering food + these services. You can accept, adjust, or skip any of them before paying the advance.
                      </p>
                    )}
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
                    {!serviceOnlyMode && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-0.5">Cuisine</p>
                        <p className="font-semibold">{cuisineType} ({vegNonVeg === 'BOTH' ? 'Veg + Non-veg' : vegNonVeg === 'VEG' ? 'Pure Veg' : 'Non-Veg'})</p>
                      </div>
                    )}
                    {chefName && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-0.5">Chef</p>
                        <p className="font-semibold">{chefName}</p>
                      </div>
                    )}
                  </div>

                  {(selectedCounters.size > 0 || selectedAddons.size > 0 || totalStaffCount > 0 || selectedServices.size > 0) && (
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
                        {STAFF_ROLES.filter(r => (staffRoleCounts[r.key] || 0) > 0).map(r => (
                          <span key={r.key} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                            {r.icon} {staffRoleCounts[r.key]} {r.label.toLowerCase()}{(staffRoleCounts[r.key] || 0) > 1 ? 's' : ''}
                          </span>
                        ))}
                        {[...selectedServices].map(k => {
                          const svc = EVENT_SERVICES.find(x => x.key === k);
                          return svc && <span key={k} className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">{svc.icon} {svc.label} <span className="text-emerald-500/70">· {svc.range}</span></span>;
                        })}
                      </div>
                      {selectedServices.size > 0 && (
                        <p className="text-[11px] text-gray-400 mt-2">Partner services are estimates — chef will confirm the final vendor quote before you pay the balance.</p>
                      )}
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
                {!serviceOnlyMode && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Food ({guestCount} × {formatPaise(perPlatePaise)}/plate)</span>
                    <span className="font-medium">{formatPaise(foodPaise)}</span>
                  </div>
                )}
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
                {STAFF_ROLES.filter(r => (staffRoleCounts[r.key] || 0) > 0).map(r => (
                  <div key={r.key} className="flex justify-between">
                    <span className="text-gray-600">{r.label} ({staffRoleCounts[r.key]}x {formatPaise(r.paise)})</span>
                    <span className="font-medium">{formatPaise(staffRoleCounts[r.key] * r.paise)}</span>
                  </div>
                ))}
                {selectedServices.size > 0 && (
                  <>
                    <div className="pt-2 mt-1 border-t border-dashed border-gray-200">
                      <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Partner services (estimate)</p>
                      {[...selectedServices].map(k => {
                        const svc = EVENT_SERVICES.find(s => s.key === k);
                        if (!svc) return null;
                        return (
                          <div key={k} className="flex justify-between text-xs">
                            <span className="text-gray-600">{svc.icon} {svc.label}</span>
                            <span className="text-gray-500">{svc.range}</span>
                          </div>
                        );
                      })}
                      <div className="flex justify-between mt-1.5 text-xs font-medium">
                        <span className="text-gray-600">Est. services total</span>
                        <span className="text-gray-800">~{formatPaise(servicesEstPaise)}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">Chef will confirm the final vendor quote before you pay the balance.</p>
                    </div>
                  </>
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
