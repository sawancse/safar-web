'use client';

import { useState } from 'react';
import Link from 'next/link';
import { APPLIANCES, CATEGORIES, appliancesForCategory, ApplianceCategory } from './catalog';

const INR = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;

const TESTIMONIALS = [
  { name: 'Meera K.',  city: 'Bengaluru', text: 'Rented 8 chafers and a 4-burner stove for my daughter\'s engagement. Delivered on time, came back for pickup next day. Zero hassle.',  stars: 5 },
  { name: 'Karthik R.',city: 'Hyderabad', text: 'The tandoor rental saved our BBQ night. Setup was explained clearly, and the charcoal was included. Guests loved the live grill.',           stars: 5 },
  { name: 'Anita S.',  city: 'Mumbai',    text: 'Needed a wet grinder for 50 idlis — delivered in 4 hours for my pooja. Much cheaper than buying one. Will rent again.',                    stars: 5 },
];

const FAQ = [
  { q: 'How long can I rent?',            a: 'Minimum 1 day. Daily rate applies for every additional day. For 7+ day rentals, we offer a 15% discount — mention it in the notes when booking.' },
  { q: 'Is delivery free?',               a: 'A flat ₹300 delivery + pickup fee is added at checkout for most cities. Cities more than 25 km from our hub may have a small extra charge — we\'ll confirm before payment.' },
  { q: 'Do you deliver LPG cylinders?',   a: 'LPG cylinders are not included. We deliver stoves with regulators + hoses. Gas refills can be arranged separately at ₹1,100/cylinder — call 7367034295.' },
  { q: 'What if something gets damaged?', a: 'Normal wear is fine. Accidental damage is charged at actual repair cost (transparent, shared upfront). A security deposit may be asked for premium items (tandoor, commercial stoves).' },
  { q: 'Can I extend the rental?',        a: 'Absolutely — WhatsApp us on 7367034295 at least 4 hours before pickup and we\'ll extend. Additional days are billed at the daily rate.' },
];

export default function ApplianceLandingPage() {
  const [active, setActive] = useState<ApplianceCategory | 'ALL'>('ALL');
  const visible = active === 'ALL' ? APPLIANCES : appliancesForCategory(active);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-2 text-xs text-gray-500 flex items-center gap-1.5">
          <Link href="/" className="hover:text-orange-500">Home</Link>
          <span>›</span>
          <Link href="/services" className="hover:text-orange-500">Services</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Appliance Rental</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-100 via-zinc-50 to-gray-50">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-gray-300/30 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-14 sm:pt-16 sm:pb-20 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] text-slate-700 uppercase mb-3">Chafers · Stoves · Induction · Tandoor</p>
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-[1.05]">
                Appliance Rental
              </h1>
              <p className="mt-4 text-base sm:text-lg text-gray-700">
                Chafing dishes, commercial stoves, induction cookers, tandoors, grinders and beverage urns — rent by the day, delivered + picked up.
                <span className="font-semibold text-slate-800"> ₹150 per day onwards.</span>
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
                <span>✓ Delivery + pickup included</span>
                <span>✓ Clean, tested units</span>
                <span>✓ Same-day dispatch</span>
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/services/appliances/order" className="bg-gray-900 hover:bg-black text-white rounded-full px-6 py-3 text-sm font-bold shadow-lg shadow-gray-900/25 transition">
                  Book Now →
                </Link>
                <a href="#catalogue" className="bg-white border border-gray-200 text-gray-800 rounded-full px-6 py-3 text-sm font-semibold hover:bg-gray-50 transition">
                  Browse catalogue
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                {[
                  { n: '100+', l: 'Units in pool' },
                  { n: '20',   l: 'Cities' },
                  { n: '4.8 ★',l: 'Rating' },
                ].map(s => (
                  <div key={s.l}>
                    <p className="text-xl font-bold text-gray-900">{s.n}</p>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl hidden md:block bg-gradient-to-br from-slate-200 to-gray-300 flex items-center justify-center">
              <span className="absolute inset-0 flex items-center justify-center text-9xl opacity-30">🔌</span>
              <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1000&auto=format&fit=crop"
                   alt="Banquet chafing dishes"
                   onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                   className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-full px-3 py-1 text-xs font-bold text-gray-800 flex items-center gap-1">
                <span>🔌</span> {APPLIANCES.length} items
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category pills */}
      <section id="catalogue" className="sticky top-0 bg-white border-b z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActive('ALL')}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              active === 'ALL' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            All items
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setActive(c.key)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition flex items-center gap-1.5 ${
                active === c.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}>
              <span>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* Catalogue */}
      <section className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Our rental catalogue</h2>
          <p className="text-sm text-gray-500 mt-1">{visible.length} items · daily rates shown · multi-day discounts available</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map(a => (
            <Link key={a.key} href={`/services/appliances/order?add=${a.key}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-gray-300 transition-all">
              <div className="aspect-square overflow-hidden relative bg-gradient-to-br from-zinc-100 to-slate-200 flex items-center justify-center">
                <span className="text-6xl opacity-40">🔌</span>
                <img src={a.photoUrl} alt={a.label} loading="lazy"
                     onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                     className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-gray-900 truncate">{a.label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-snug">{a.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-gray-900">{INR(a.dailyRatePaise)}<span className="text-[10px] text-gray-400 font-normal">/day</span></span>
                  <span className="text-[11px] text-gray-900 font-bold opacity-0 group-hover:opacity-100 transition">+ Add</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 bg-gray-900 text-white rounded-2xl p-6 sm:p-8 text-center">
          <h3 className="text-xl sm:text-2xl font-bold">Can't find what you need?</h3>
          <p className="mt-2 text-white/80 text-sm">WhatsApp us with what you're looking for — we can source most commercial kitchen equipment.</p>
          <Link href="/services/appliances/order" className="inline-block mt-4 bg-white text-gray-900 rounded-full px-6 py-2.5 text-sm font-bold hover:bg-gray-100 transition">
            Start an order →
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">How it works</h2>
            <p className="text-sm text-gray-500 mt-2">Four steps from booking to return pickup.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { n: '1', icon: '🛒', title: 'Pick items + dates', body: 'Choose quantities, pickup + drop dates. See live total.' },
              { n: '2', icon: '🔒', title: 'Pay & confirm',      body: 'Secure 50% advance. Balance paid on delivery day.' },
              { n: '3', icon: '🚚', title: 'Delivered + setup',  body: 'Our team delivers clean, tested units and sets them up.' },
              { n: '4', icon: '↩️', title: 'Return pickup',       body: 'We come back next morning (or end-of-rental) for pickup.' },
            ].map(s => (
              <div key={s.n} className="bg-white rounded-2xl p-5 text-center border border-gray-100">
                <span className="text-3xl block mb-2">{s.icon}</span>
                <p className="text-[10px] text-gray-900 font-bold tracking-[0.2em]">STEP {s.n}</p>
                <p className="font-semibold text-gray-900 mt-1">{s.title}</p>
                <p className="text-xs text-gray-500 mt-1.5 leading-snug">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 py-14 sm:py-16">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-[0.25em] text-gray-800 uppercase mb-2">Trusted by event planners</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">What our customers say</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex gap-0.5 text-amber-500 mb-2">{'★'.repeat(t.stars)}</div>
              <p className="text-sm text-gray-700 leading-relaxed">"{t.text}"</p>
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-semibold text-gray-900">{t.name}</p>
                <p className="text-[11px] text-gray-500">{t.city}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-14 sm:py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8">Frequently asked</h2>
          <div className="space-y-2">
            {FAQ.map((f, i) => (
              <details key={i} className="bg-white rounded-xl border border-gray-100 group">
                <summary className="px-5 py-4 cursor-pointer flex items-center justify-between text-sm font-semibold text-gray-900 list-none">
                  {f.q}
                  <span className="text-gray-900 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to rent?</h2>
          <p className="mt-3 text-white/80 max-w-xl mx-auto">Clean, tested units · delivery + pickup included · transparent daily rates.</p>
          <Link href="/services/appliances/order" className="inline-block mt-6 bg-white text-gray-900 rounded-full px-7 py-3 text-sm font-bold shadow-xl hover:bg-gray-100 transition">
            Start rental →
          </Link>
          <p className="mt-4 text-xs text-white/70">Or call <a href="tel:7367034295" className="underline font-semibold">7367034295</a></p>
        </div>
      </section>

      <div className="fixed bottom-0 inset-x-0 bg-white border-t shadow-xl p-3 md:hidden z-30">
        <Link href="/services/appliances/order" className="block w-full bg-gray-900 hover:bg-black text-white text-center rounded-xl py-3 text-sm font-bold transition">
          Book Now →
        </Link>
      </div>
    </div>
  );
}
