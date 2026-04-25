'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

// Pricing items come from /api/v1/chef-events/pricing (public endpoint).
// The landing resolves each tile's "from ₹X" label from the DB so admin
// edits are the single source of truth.
type PricingItem = {
  category: string;
  itemKey: string;
  label: string;
  description?: string;
  icon?: string;
  pricePaise: number;
  priceType: string;
  minPricePaise?: number;
  maxPricePaise?: number;
  available?: boolean;
};

// Flagship service categories — top of the page, big cards (coox.in style).
// `pricingKey` maps into a pricing item so the "from ₹X" label is DB-driven.
// `rating` is static for now (would need aggregate rating service later).
const FLAGSHIP = [
  { key: 'chef',      pricingKey: 'per_plate', priceSuffix: ' / plate',  label: 'Cooks & Chefs',             tagline: 'Home-cooked or gourmet meals at your venue',              icon: '👨‍🍳', photoUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop', href: '/cooks' },
  { key: 'bartender', pricingKey: 'bartender', priceSuffix: ' / person', label: 'Bartenders & Mixologists',  tagline: 'Craft cocktails, mocktails and drink service',            icon: '🍸',    photoUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&auto=format&fit=crop', href: '/services/staff-hire?role=bartender' },
  { key: 'waiter',    pricingKey: 'waiter',    priceSuffix: ' / person', label: 'Waiters & Servers',         tagline: 'Trained staff to serve food, drinks and clear plates',    icon: '🧑‍🍳', photoUrl: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&auto=format&fit=crop', href: '/services/staff-hire?role=waiter' },
  { key: 'cleaner',   pricingKey: 'cleaner',   priceSuffix: ' / person', label: 'Kitchen Cleaners',          tagline: 'Setup, serving and complete cleanup after your event',    icon: '🧹',    photoUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop', href: '/services/staff-hire?role=cleaner' },
];

// Add-on services — order matches coox.in's secondary grid. The first 5 are
// ADDON rows, the rest are PARTNER_SERVICE rows. Each pricingKey maps to an
// item_key in event_pricing_defaults — edit rates at /admin/event-pricing.
const ADDONS = [
  { pricingKey: 'crockery',       label: 'Crockery Rental',   icon: '🍽️', photoUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&auto=format&fit=crop',  href: '/services/crockery' },
  { pricingKey: 'appliances',     label: 'Appliance Rental',  icon: '🔌', photoUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&auto=format&fit=crop',   href: '/services/appliances' },
  { pricingKey: 'table_setup',    label: 'Fine Dine Setup',   icon: '🕯️', photoUrl: 'https://images.unsplash.com/photo-1530062845289-9109b2c9c868?w=600&auto=format&fit=crop', href: '/services/fine-dine' },
  { pricingKey: 'decoration',     label: 'Event Decoration',  icon: '🎈', photoUrl: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&auto=format&fit=crop',  href: '/services/decor' },
  { pricingKey: 'cake',           label: 'Designer Cake',     icon: '🎂', photoUrl: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=600&auto=format&fit=crop',  href: '/services/cake' },
  { pricingKey: 'live_music',     label: 'Live Singer / Band',icon: '🎺', photoUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop',  href: '/services/live-music' },
  { pricingKey: 'decoration_pro', label: 'Party Decorator',   icon: '🌸', photoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop',  href: '/services/decor' },
  { pricingKey: 'cake_designer',  label: 'Designer (Premium)',icon: '🧁', photoUrl: 'https://images.unsplash.com/photo-1562777717-dc6984f65a63?w=600&auto=format&fit=crop',   href: '/services/cake' },
  { pricingKey: 'entertainer',    label: 'Live Entertainer',  icon: '🎩', photoUrl: 'https://images.unsplash.com/photo-1549451371-64aa98a6f660?w=600&auto=format&fit=crop',   href: '/services/entertainer' },
  { pricingKey: 'photography',    label: 'Photographer',      icon: '📷', photoUrl: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&auto=format&fit=crop',  href: '/services/photographer' },
  { pricingKey: 'dj',             label: 'DJ & Sound',        icon: '🎧', photoUrl: 'https://images.unsplash.com/photo-1571266028243-d220c6a3a6b2?w=600&auto=format&fit=crop',  href: '/services/dj' },
  { pricingKey: 'pandit',         label: 'Pandit / Puja',     icon: '🪔', photoUrl: 'https://images.unsplash.com/photo-1609152867693-e7fd58b18b93?w=600&auto=format&fit=crop',  href: '/services/pandit' },
  { pricingKey: 'makeup',         label: 'Makeup Artist',     icon: '💄', photoUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&auto=format&fit=crop',  href: '/services/makeup' },
  { pricingKey: 'mehndi',         label: 'Mehndi Artist',     icon: '🎨', photoUrl: 'https://images.unsplash.com/photo-1615716174835-7ba6bf7a0562?w=600&auto=format&fit=crop',  href: '/services/mehndi' },
  { pricingKey: 'bouquet',        label: 'Bouquet & Gifts',   icon: '💐', photoUrl: 'https://images.unsplash.com/photo-1487070183336-b863922373d4?w=600&auto=format&fit=crop',  href: '/services/bouquet' },
  { pricingKey: 'valet',          label: 'Valet / Parking',   icon: '🚗', photoUrl: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=600&auto=format&fit=crop',    href: '/services/valet' },
];

const SPECIAL_OCCASIONS = [
  { key: 'BIRTHDAY',    label: 'Birthday',    icon: '🎂', photoUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&auto=format&fit=crop' },
  { key: 'ANNIVERSARY', label: 'Anniversary', icon: '💝', photoUrl: 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=600&auto=format&fit=crop' },
  { key: 'POOJA',       label: 'Pooja',       icon: '🪔', photoUrl: 'https://images.unsplash.com/photo-1605979257913-1704eb7b6246?w=600&auto=format&fit=crop' },
  { key: 'HOUSEWARMING',label: 'Housewarming',icon: '🏠', photoUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&auto=format&fit=crop' },
  { key: 'KITTY_PARTY', label: 'Kitty Party', icon: '🎉', photoUrl: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=600&auto=format&fit=crop' },
  { key: 'COCKTAIL',    label: 'Cocktail',    icon: '🍹', photoUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop' },
  { key: 'CORPORATE',   label: 'Corporate',   icon: '💼', photoUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop' },
  { key: 'BABY_SHOWER', label: 'Baby Shower', icon: '👶', photoUrl: 'https://images.unsplash.com/photo-1515816052601-210d5501d471?w=600&auto=format&fit=crop' },
  { key: 'BBQ',         label: 'BBQ Party',   icon: '🔥', photoUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&auto=format&fit=crop' },
  { key: 'NAVRATRI',    label: 'Navratri',    icon: '🕉️', photoUrl: 'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?w=600&auto=format&fit=crop' },
  { key: 'FESTIVAL',    label: 'Festival',    icon: '🪔', photoUrl: 'https://images.unsplash.com/photo-1603457461170-3f70e6a0b1e6?w=600&auto=format&fit=crop' },
  { key: 'FAREWELL',    label: 'Farewell',    icon: '👋', photoUrl: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&auto=format&fit=crop' },
];

const WEDDING_EVENTS = [
  { key: 'WEDDING',    label: 'Wedding',                 icon: '💍', photoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop' },
  { key: 'ENGAGEMENT', label: 'Engagement',              icon: '💎', photoUrl: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&auto=format&fit=crop' },
  { key: 'RECEPTION',  label: 'Reception',               icon: '🥂', photoUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&auto=format&fit=crop' },
  { key: 'COCKTAIL',   label: 'Bachelor / Bachelorette', icon: '🍾', photoUrl: 'https://images.unsplash.com/photo-1567593810070-7a3d471af022?w=600&auto=format&fit=crop' },
];

const CUISINES = [
  { label: 'North Indian',   icon: '🍛', photoUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&auto=format&fit=crop' },
  { label: 'Chinese',        icon: '🥡', photoUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop' },
  { label: 'South Indian',   icon: '🥞', photoUrl: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&auto=format&fit=crop' },
  { label: 'Italian',        icon: '🍝', photoUrl: 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=600&auto=format&fit=crop' },
  { label: 'Continental',    icon: '🥗', photoUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&auto=format&fit=crop' },
  { label: 'Thai & Mexican', icon: '🌮', photoUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop' },
  { label: 'Live Barbecue',  icon: '🔥', photoUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&auto=format&fit=crop' },
  { label: 'Vrat ka Khana',  icon: '🍚', photoUrl: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=600&auto=format&fit=crop' },
];

const TESTIMONIALS = [
  { name: 'Anjali M.', city: 'Bengaluru', text: 'Booked a chef + photographer for my son\'s 1st birthday. Food was amazing and the photographer captured every moment. Worth every rupee!', stars: 5 },
  { name: 'Rahul S.',  city: 'Hyderabad', text: 'Hired 2 waiters + a bartender for our housewarming. Everyone was on time, professional, and guests keep talking about the cocktails!', stars: 5 },
  { name: 'Meera P.',  city: 'Mumbai',    text: 'Chef made Hyderabadi biryani for 40 guests at my anniversary. Nobody left a plate. Will book again for Diwali.', stars: 5 },
  { name: 'Vikram K.', city: 'Chennai',   text: 'Last-minute pandit booking for a housewarming puja. Arrived on time, conducted the ceremony beautifully. Saved the day.', stars: 5 },
];

const CITIES = [
  'Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad',
  'Jaipur', 'Gurugram', 'Noida', 'Chandigarh', 'Kochi', 'Indore', 'Lucknow', 'Goa',
  'Nagpur', 'Surat', 'Bhopal', 'Coimbatore',
];

export default function CooksServicesLandingPage() {
  const router = useRouter();
  const [topChefs, setTopChefs] = useState<any[]>([]);
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  // Aggregate ratings keyed by pricingKey (chef / waiter / cleaner / bartender).
  // Missing entries fall back to a neutral 4.7 — better than nothing while the
  // platform is still building review volume.
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number }>>({});

  // Pull top chefs for the social-proof carousel. Silent-fail — the section
  // just renders empty if the API is down, the page is still usable.
  useEffect(() => {
    api.searchChefs({ sort: 'rating', size: '10' })
      .then((res: any) => {
        const list = Array.isArray(res) ? res : (res?.content || []);
        setTopChefs(list.slice(0, 10));
      })
      .catch(() => { /* ignore — section just hides */ });
  }, []);

  // Pricing from event_pricing_defaults. Used to resolve each tile's
  // "from ₹X" label so /admin/event-pricing is the single source of truth.
  useEffect(() => {
    api.getEventPricing()
      .then((items: any[]) => setPricing(items || []))
      .catch(() => { /* tiles fall back to label without price */ });
  }, []);

  // Aggregate ratings for flagship cards. Silent-fail — cards fall back to
  // hiding the star badge when data isn't available.
  useEffect(() => {
    api.getAggregateRatings()
      .then(data => setRatings(data || {}))
      .catch(() => { /* star badges simply hide */ });
  }, []);

  // Map item_key → pricing row for O(1) lookup in the JSX below.
  const pricingByKey = useMemo(() => {
    const m: Record<string, PricingItem> = {};
    for (const p of pricing) m[p.itemKey] = p;
    return m;
  }, [pricing]);

  // "from ₹X" formatter. Uses min when available, else the default price.
  // Short-scale (₹5k / ₹1.2L) for numbers big enough to be cluttered.
  function priceFromLabel(key: string): string | null {
    const p = pricingByKey[key];
    if (!p) return null;
    const paise = p.minPricePaise ?? p.pricePaise ?? 0;
    if (paise <= 0) return null;
    const rupees = paise / 100;
    if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(rupees >= 1000000 ? 0 : 1)}L`;
    if (rupees >= 1000)   return `₹${Math.round(rupees / 1000)}k`;
    return `₹${Math.round(rupees).toLocaleString('en-IN')}`;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-red-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-100/40 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto px-4 pt-14 pb-14 sm:pt-20 sm:pb-20 relative text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-orange-600 uppercase mb-3">Safar Cooks · House-Party Services</p>
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-[1.05]">
            India's home for<br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent"> house&nbsp;parties.</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
            Chefs, bartenders, waiters, cleaners, photographers, decor, pandit — book every service you need for your event in one place.
          </p>

          {/* Trust stats */}
          <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-4">
            {[
              { n: '50,000+', label: 'Guests served' },
              { n: '20',      label: 'Cities' },
              { n: '4.8 ★',   label: 'Service rating' },
              { n: '500+',    label: 'Vetted partners' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{s.n}</p>
                <p className="text-xs text-gray-500 tracking-wide uppercase mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Primary CTA */}
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/cooks/events" className="bg-gray-900 hover:bg-black text-white rounded-full px-6 py-3 text-sm font-semibold transition shadow-lg shadow-gray-900/20">
              Plan my event →
            </Link>
            <Link href="/cooks" className="bg-white hover:bg-orange-50 border border-gray-200 text-gray-800 rounded-full px-6 py-3 text-sm font-semibold transition">
              Browse chefs
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4 Flagship Services ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-14 sm:py-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Everything your event needs</h2>
          <p className="text-sm text-gray-500 mt-2">Four core services, all vetted, all booked in one checkout.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FLAGSHIP.map(s => {
            const from = priceFromLabel(s.pricingKey);
            // `s.pricingKey` doubles as the rating key: per_plate → chef,
            // waiter/bartender/cleaner map directly. Fall back to `s.key`
            // for the "chef" flagship which uses "per_plate" as pricingKey.
            const ratingKey = s.key === 'chef' ? 'chef' : s.pricingKey;
            const r = ratings[ratingKey];
            return (
              <Link
                key={s.key}
                href={s.href}
                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all"
              >
                <div className="aspect-[5/4] relative bg-gradient-to-br from-orange-100 via-amber-100 to-red-100 overflow-hidden flex items-center justify-center">
                  {/* Emoji fallback underneath — visible if the photo fails */}
                  <span className="text-7xl opacity-30">{s.icon}</span>
                  <img src={s.photoUrl} alt={s.label} loading="lazy"
                       onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                       className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {/* Gradient overlay keeps top-right badges readable over busy photos */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/10" />
                  <span className="absolute top-3 left-3 bg-white/95 backdrop-blur w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm">
                    {s.icon}
                  </span>
                  {r && r.count > 0 && (
                    <span className="absolute top-3 right-3 bg-white/95 backdrop-blur text-[11px] font-bold text-gray-800 rounded-full px-2 py-0.5">
                      ⭐ {r.avg.toFixed(1)}
                      <span className="text-gray-400 font-normal ml-1">({r.count})</span>
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-base">{s.label}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-snug">{s.tagline}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm">
                      {from ? (
                        <>
                          <span className="text-gray-400">from </span>
                          <span className="font-bold text-gray-900">{from}</span>
                          <span className="text-gray-400 text-xs">{s.priceSuffix}</span>
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs">On request</span>
                      )}
                    </span>
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 rounded-full px-3 py-1 group-hover:bg-orange-500 group-hover:text-white transition">
                      Book
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Add-Ons ──────────────────────────────────────────────────── */}
      <section className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-14 sm:py-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Add-on services</h2>
            <p className="text-sm text-gray-500 mt-2">Mix and match anything extra for your event.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {ADDONS.map(a => {
              const from = priceFromLabel(a.pricingKey);
              // Prefer DB icon/label when pricing row exists so admins can
              // rename "Designer Cake" → "Premium Cake" without a redeploy.
              const row = pricingByKey[a.pricingKey];
              const icon = row?.icon || a.icon;
              const label = row?.label || a.label;
              return (
                <Link
                  key={a.pricingKey}
                  href={a.href}
                  className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-orange-50 to-amber-100 overflow-hidden relative flex items-center justify-center">
                    <span className="text-5xl opacity-30">{icon}</span>
                    <img src={a.photoUrl} alt={label} loading="lazy"
                         onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                         className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <span className="absolute top-2 left-2 bg-white/95 backdrop-blur w-8 h-8 rounded-full flex items-center justify-center text-base shadow-sm">
                      {icon}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{label}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      {from ? (
                        <span className="text-xs">
                          <span className="text-gray-400">from </span>
                          <span className="font-bold text-gray-900">{from}</span>
                        </span>
                      ) : <span className="text-[11px] text-gray-400">On request</span>}
                      <span className="text-[11px] text-orange-600 font-bold opacity-0 group-hover:opacity-100 transition">Book →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Special Occasions ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-14 sm:py-16">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Special occasions</h2>
          <p className="text-sm text-gray-500 mt-2">Pick an occasion — we'll suggest the right mix of services.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {SPECIAL_OCCASIONS.map(o => (
            <button
              key={o.key}
              onClick={() => router.push(`/cooks/events?eventType=${o.key}`)}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-orange-200 transition text-left"
            >
              <div className="aspect-[4/3] relative bg-gradient-to-br from-orange-100 to-amber-100 overflow-hidden flex items-center justify-center">
                <span className="text-6xl opacity-40">{o.icon}</span>
                <img src={o.photoUrl} alt={o.label} loading="lazy"
                     onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                     className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <span className="absolute top-2 left-2 bg-white/95 backdrop-blur w-8 h-8 rounded-full flex items-center justify-center text-base shadow-sm">
                  {o.icon}
                </span>
                <p className="absolute bottom-2 left-2 right-2 text-white font-semibold text-sm drop-shadow-lg">{o.label}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Wedding Events ───────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50">
        <div className="max-w-6xl mx-auto px-4 py-14 sm:py-16">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold tracking-[0.25em] text-rose-600 uppercase mb-2">Shaadi season</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Wedding & celebrations</h2>
            <p className="text-sm text-gray-500 mt-2">Full-service packages for every function.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {WEDDING_EVENTS.map(w => (
              <button
                key={w.key}
                onClick={() => router.push(`/cooks/events?eventType=${w.key}`)}
                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-rose-200 transition text-left"
              >
                <div className="aspect-[4/3] relative bg-gradient-to-br from-rose-100 to-pink-200 overflow-hidden flex items-center justify-center">
                  <span className="text-6xl opacity-40">{w.icon}</span>
                  <img src={w.photoUrl} alt={w.label} loading="lazy"
                       onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                       className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <span className="absolute top-2 left-2 bg-white/95 backdrop-blur w-9 h-9 rounded-full flex items-center justify-center text-base shadow-sm">
                    {w.icon}
                  </span>
                  <p className="absolute bottom-2 left-2 right-2 text-white font-semibold text-sm drop-shadow-lg">{w.label}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cuisines ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-14 sm:py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Worldwide cuisines</h2>
          <p className="text-sm text-gray-500 mt-2">From ghar ka khaana to gourmet — our chefs cook it all.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CUISINES.map(c => (
            <Link
              key={c.label}
              href={`/cooks?cuisine=${encodeURIComponent(c.label)}`}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-orange-200 transition"
            >
              <div className="aspect-[4/3] relative bg-gradient-to-br from-orange-100 to-red-200 overflow-hidden flex items-center justify-center">
                {/* Emoji fallback underneath — visible if the photo fails */}
                <span className="text-6xl opacity-40">{c.icon}</span>
                <img src={c.photoUrl} alt={c.label} loading="lazy"
                     onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                     className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-2 bg-white/95 backdrop-blur w-8 h-8 rounded-full flex items-center justify-center text-base shadow-sm">
                  {c.icon}
                </span>
              </div>
              <div className="p-3 text-center">
                <p className="text-sm font-semibold text-gray-800">{c.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Top Rated Chefs carousel ─────────────────────────────────── */}
      {topChefs.length > 0 && (
        <section className="bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-6xl mx-auto px-4 py-14 sm:py-16">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold tracking-[0.25em] text-orange-600 uppercase mb-1">Hand-picked</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Top-rated cooks</h2>
              </div>
              <Link href="/cooks" className="text-sm text-orange-600 hover:text-orange-700 font-semibold">View all →</Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-px-4 -mx-4 px-4">
              {topChefs.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/cooks/${c.id}`}
                  className="snap-start shrink-0 w-56 bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-orange-200 transition group"
                >
                  <div className="aspect-square bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center overflow-hidden">
                    {c.profilePhotoUrl ? (
                      <img src={c.profilePhotoUrl} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <span className="text-6xl">👨‍🍳</span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-900 truncate">{c.name}</p>
                      {c.averageRating && (
                        <span className="text-[11px] bg-amber-50 text-amber-800 rounded-full px-1.5 py-0.5 font-bold shrink-0 ml-2">⭐ {Number(c.averageRating).toFixed(1)}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{c.cuisines || 'Multi-cuisine'}</p>
                    {c.city && <p className="text-[11px] text-gray-400 mt-0.5">{c.city}</p>}
                    {c.eventMinPlatePaise && (
                      <p className="text-xs text-gray-800 mt-2"><span className="text-gray-400">from</span> <span className="font-bold">₹{Math.round(c.eventMinPlatePaise / 100)}</span> / plate</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-14 sm:py-16">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-orange-600 uppercase mb-2">Loved in 20 cities</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">What our guests say</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition">
              <div className="flex gap-0.5 mb-2 text-amber-500 text-sm">{'★'.repeat(t.stars)}</div>
              <p className="text-sm text-gray-700 leading-relaxed">"{t.text}"</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-900">{t.name}</p>
                <p className="text-[11px] text-gray-500">{t.city}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-14 sm:py-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">Plan, pay, enjoy.</h2>
            <p className="text-white/80 mt-2">Three steps from a blank calendar to a house party guests won't forget.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { n: '1', title: 'Pick what you need',     body: 'Chef, staff, photographer, decor, pandit — any combination. We show you an indicative quote upfront.', icon: '🧾' },
              { n: '2', title: 'Confirm with 50% advance',body: 'Pay a secure advance to lock in the date. Balance is settled on event day.',                        icon: '🔒' },
              { n: '3', title: 'Day-of, we coordinate',  body: 'Each partner arrives with a unique check-in code. Tap Arrived and your chef handles the rest.',       icon: '🎉' },
            ].map(s => (
              <div key={s.n} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-white/15 flex items-center justify-center text-3xl mb-3">{s.icon}</div>
                <p className="text-xs font-bold tracking-[0.25em] opacity-80">STEP {s.n}</p>
                <h3 className="font-bold mt-1 text-lg">{s.title}</h3>
                <p className="text-sm opacity-85 mt-1.5 leading-snug">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/cooks/events" className="bg-white text-orange-600 rounded-full px-7 py-3 text-sm font-bold hover:bg-orange-50 transition shadow-xl">
              Start planning →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Cities ────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-14 sm:py-16">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-orange-600 uppercase mb-2">Serving in</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">20 cities and growing</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {CITIES.map(city => (
            <Link
              key={city}
              href={`/cooks?city=${encodeURIComponent(city)}`}
              className="text-sm bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-300 rounded-full px-4 py-2 text-gray-700 hover:text-orange-700 font-medium transition"
            >
              {city}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────────────────── */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { icon: '✅', title: 'KYC-verified partners', sub: 'Every staff member is background-checked' },
            { icon: '💰', title: 'Transparent pricing',   sub: 'Itemised bill, no surprises on event day' },
            { icon: '🔄', title: 'Full refund',           sub: 'If a partner no-shows, we refund that line' },
            { icon: '📞', title: '7-day support',         sub: 'WhatsApp us any day for help' },
          ].map(t => (
            <div key={t.title}>
              <span className="text-3xl block">{t.icon}</span>
              <p className="text-sm font-bold text-gray-900 mt-2">{t.title}</p>
              <p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto leading-snug">{t.sub}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
