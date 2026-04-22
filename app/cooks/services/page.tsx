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
  { key: 'chef',      pricingKey: 'per_plate', priceSuffix: ' / plate',  label: 'Cooks & Chefs',             tagline: 'Home-cooked or gourmet meals at your venue',              icon: '👨‍🍳', gradient: 'from-orange-400 via-amber-400 to-red-400',    href: '/cooks' },
  { key: 'bartender', pricingKey: 'bartender', priceSuffix: ' / person', label: 'Bartenders & Mixologists',  tagline: 'Craft cocktails, mocktails and drink service',            icon: '🍸',    gradient: 'from-purple-400 via-fuchsia-400 to-pink-400', href: '/cooks/events?focus=staff-bartender' },
  { key: 'waiter',    pricingKey: 'waiter',    priceSuffix: ' / person', label: 'Waiters & Servers',         tagline: 'Trained staff to serve food, drinks and clear plates',    icon: '🧑‍🍳', gradient: 'from-blue-400 via-sky-400 to-cyan-400',       href: '/cooks/events?focus=staff-waiter' },
  { key: 'cleaner',   pricingKey: 'cleaner',   priceSuffix: ' / person', label: 'Kitchen Cleaners',          tagline: 'Setup, serving and complete cleanup after your event',    icon: '🧹',    gradient: 'from-emerald-400 via-green-400 to-teal-400',  href: '/cooks/events?focus=staff-cleaner' },
];

// Add-on services — order matches coox.in's secondary grid. The first 5 are
// ADDON rows, the rest are PARTNER_SERVICE rows. Each pricingKey maps to an
// item_key in event_pricing_defaults — edit rates at /admin/event-pricing.
const ADDONS = [
  { pricingKey: 'crockery',       label: 'Crockery Rental',   icon: '🍽️', href: '/cooks/events?focus=crockery',        gradient: 'from-slate-100 to-gray-200' },
  { pricingKey: 'appliances',     label: 'Appliance Rental',  icon: '🔌', href: '/cooks/events?focus=appliances',      gradient: 'from-zinc-100 to-slate-200' },
  { pricingKey: 'table_setup',    label: 'Fine Dine Setup',   icon: '🕯️', href: '/cooks/events?focus=table_setup',    gradient: 'from-rose-100 to-pink-200' },
  { pricingKey: 'decoration',     label: 'Event Decoration',  icon: '🎈', href: '/cooks/events?focus=decoration',      gradient: 'from-pink-100 to-rose-200' },
  { pricingKey: 'cake',           label: 'Designer Cake',     icon: '🎂', href: '/cooks/events?focus=cake',            gradient: 'from-teal-100 to-cyan-200' },
  { pricingKey: 'live_music',     label: 'Live Singer / Band',icon: '🎺', href: '/cooks/events?focus=live_music',      gradient: 'from-amber-100 to-orange-200' },
  { pricingKey: 'decoration_pro', label: 'Party Decorator',   icon: '🌸', href: '/cooks/events?focus=decoration_pro',  gradient: 'from-pink-100 to-rose-200' },
  { pricingKey: 'cake_designer',  label: 'Designer (Premium)',icon: '🧁', href: '/cooks/events?focus=cake_designer',   gradient: 'from-teal-100 to-cyan-200' },
  { pricingKey: 'entertainer',    label: 'Live Entertainer',  icon: '🎩', href: '/cooks/events?focus=entertainer',     gradient: 'from-indigo-100 to-purple-200' },
  { pricingKey: 'photography',    label: 'Photographer',      icon: '📷', href: '/cooks/events?focus=photography',     gradient: 'from-fuchsia-100 to-pink-200' },
  { pricingKey: 'dj',             label: 'DJ & Sound',        icon: '🎧', href: '/cooks/events?focus=dj',              gradient: 'from-sky-100 to-blue-200' },
  { pricingKey: 'pandit',         label: 'Pandit / Puja',     icon: '🪔', href: '/cooks/events?focus=pandit',          gradient: 'from-orange-100 to-yellow-200' },
  { pricingKey: 'makeup',         label: 'Makeup Artist',     icon: '💄', href: '/cooks/events?focus=makeup',          gradient: 'from-rose-100 to-fuchsia-200' },
  { pricingKey: 'mehndi',         label: 'Mehndi Artist',     icon: '🎨', href: '/cooks/events?focus=mehndi',          gradient: 'from-lime-100 to-emerald-200' },
  { pricingKey: 'bouquet',        label: 'Bouquet & Gifts',   icon: '💐', href: '/cooks/events?focus=bouquet',         gradient: 'from-red-100 to-rose-200' },
  { pricingKey: 'valet',          label: 'Valet / Parking',   icon: '🚗', href: '/cooks/events?focus=valet',           gradient: 'from-slate-100 to-gray-200' },
];

const SPECIAL_OCCASIONS = [
  { key: 'BIRTHDAY',    label: 'Birthday',    icon: '🎂' },
  { key: 'ANNIVERSARY', label: 'Anniversary', icon: '💝' },
  { key: 'POOJA',       label: 'Pooja',       icon: '🪔' },
  { key: 'HOUSEWARMING',label: 'Housewarming',icon: '🏠' },
  { key: 'KITTY_PARTY', label: 'Kitty Party', icon: '🎉' },
  { key: 'COCKTAIL',    label: 'Cocktail',    icon: '🍹' },
  { key: 'CORPORATE',   label: 'Corporate',   icon: '💼' },
  { key: 'BABY_SHOWER', label: 'Baby Shower', icon: '👶' },
  { key: 'BBQ',         label: 'BBQ Party',   icon: '🔥' },
  { key: 'NAVRATRI',    label: 'Navratri',    icon: '🕉️' },
  { key: 'FESTIVAL',    label: 'Festival',    icon: '🪔' },
  { key: 'FAREWELL',    label: 'Farewell',    icon: '👋' },
];

const WEDDING_EVENTS = [
  { key: 'WEDDING',    label: 'Wedding',         icon: '💍' },
  { key: 'ENGAGEMENT', label: 'Engagement',      icon: '💎' },
  { key: 'RECEPTION',  label: 'Reception',       icon: '🥂' },
  { key: 'COCKTAIL',   label: 'Bachelor / Bachelorette', icon: '🍾' },
];

const CUISINES = [
  { label: 'North Indian',      icon: '🍛', gradient: 'from-orange-100 to-red-200' },
  { label: 'Chinese',           icon: '🥡', gradient: 'from-red-100 to-orange-200' },
  { label: 'South Indian',      icon: '🥞', gradient: 'from-amber-100 to-yellow-200' },
  { label: 'Italian',           icon: '🍝', gradient: 'from-red-100 to-rose-200' },
  { label: 'Continental',       icon: '🥗', gradient: 'from-lime-100 to-green-200' },
  { label: 'Thai & Mexican',    icon: '🌮', gradient: 'from-yellow-100 to-amber-200' },
  { label: 'Live Barbecue',     icon: '🔥', gradient: 'from-orange-200 to-red-300' },
  { label: 'Vrat ka Khana',     icon: '🍚', gradient: 'from-yellow-50 to-amber-100' },
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
                <div className={`bg-gradient-to-br ${s.gradient} aspect-[5/4] relative flex items-center justify-center`}>
                  <span className="text-7xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">{s.icon}</span>
                  {r && r.count > 0 && (
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur text-[11px] font-bold text-gray-800 rounded-full px-2 py-0.5">
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
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
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
                  className="group bg-white border border-gray-100 rounded-xl p-3 sm:p-4 hover:shadow-md hover:border-orange-200 transition text-center"
                >
                  <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center text-3xl mb-2 group-hover:scale-105 transition-transform`}>
                    {icon}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 leading-tight">{label}</p>
                  {from && <p className="text-[10px] text-gray-500 mt-1">from <span className="font-semibold text-gray-800">{from}</span></p>}
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
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {SPECIAL_OCCASIONS.map(o => (
            <button
              key={o.key}
              onClick={() => router.push(`/cooks/events?eventType=${o.key}`)}
              className="group bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-orange-200 transition text-center"
            >
              <span className="text-3xl block mb-1 group-hover:scale-110 transition-transform">{o.icon}</span>
              <p className="text-xs sm:text-sm font-medium text-gray-700">{o.label}</p>
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
                className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:border-rose-200 transition text-center"
              >
                <span className="text-4xl block mb-2 group-hover:scale-110 transition-transform">{w.icon}</span>
                <p className="text-sm font-semibold text-gray-800">{w.label}</p>
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
              <div className={`bg-gradient-to-br ${c.gradient} aspect-[4/3] flex items-center justify-center`}>
                <span className="text-6xl drop-shadow-sm group-hover:scale-110 transition-transform duration-300">{c.icon}</span>
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
