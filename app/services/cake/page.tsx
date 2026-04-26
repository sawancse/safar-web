'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CATEGORIES, cakesForCategory } from './catalog';

// Landing: coox.in/cake-style gallery grouped by occasion. CATEGORIES +
// cake list come from ./catalog so the order page and landing stay in sync.

const TESTIMONIALS = [
  { name: 'Priya S.',  city: 'Hyderabad', text: 'Ordered a photo-print cake for my dad\'s 60th. Delivered on time, looked exactly like the photo. Whole family was amazed.', stars: 5 },
  { name: 'Arun K.',   city: 'Bengaluru', text: 'Anniversary cake was stunning. Fondant was soft, cake inside was moist. Will order again for sure.',                       stars: 5 },
  { name: 'Neha M.',   city: 'Mumbai',    text: 'Last-minute order, delivered in 18 hours. Eggless, vanilla, floral design — my mom loved it.',                            stars: 5 },
];

const FAQ = [
  { q: 'How far in advance do I need to order?',       a: 'Minimum 24 hours for standard designs. Premium fondant / wedding tiers need 48-72 hours. Last-minute orders — call 7367034295.' },
  { q: 'Do you deliver pan-India?',                    a: 'We deliver in 20 cities including Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai, Pune and more. Pincode availability is checked at checkout.' },
  { q: 'Can I customise a cake beyond what\'s shown?', a: 'Absolutely. After placing the order, our baker will reach out on WhatsApp within 2 hours to discuss custom designs, colours and themes.' },
  { q: 'What about eggless and sugar-free options?',   a: 'Every design is available eggless (+10%). Sugar-free is available on select flavours — mention it in the message field and we\'ll confirm.' },
  { q: 'Is the advance refundable?',                   a: 'The advance is non-refundable after the baker confirms. Cancellations up to 6 hours after booking are fully refundable.' },
];

export default function DesignerCakeLandingPage() {
  const [activeCategory, setActiveCategory] = useState<string>('anniversary');
  const active = CATEGORIES.find(c => c.key === activeCategory)!;
  const activeCakes = cakesForCategory(activeCategory);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-2 text-xs text-gray-500 flex items-center gap-1.5">
          <Link href="/" className="hover:text-orange-500">Home</Link>
          <span>›</span>
          <Link href="/services" className="hover:text-orange-500">Services</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Designer Cake</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-pink-200/40 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-14 sm:pt-16 sm:pb-20 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] text-rose-600 uppercase mb-3">Delivered at your door</p>
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-[1.05]">
                Designer Cakes
              </h1>
              <p className="mt-4 text-base sm:text-lg text-gray-700">
                From anniversaries to birthdays, kids' parties to weddings — we bake, decorate and deliver fresh. <span className="font-semibold text-rose-700">₹999 onwards.</span>
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
                <span>✓ Eggless on request</span>
                <span>✓ 20+ flavours</span>
                <span>✓ Same-day in metros</span>
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/services/cake/order" className="bg-rose-600 hover:bg-rose-700 text-white rounded-full px-6 py-3 text-sm font-bold shadow-lg shadow-rose-600/25 transition">
                  Book Now →
                </Link>
                <a href="#gallery" className="bg-white border border-gray-200 text-gray-800 rounded-full px-6 py-3 text-sm font-semibold hover:bg-gray-50 transition">
                  Browse designs
                </a>
              </div>
              {/* Stats */}
              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                {[
                  { n: '10L+',   l: 'Cakes delivered' },
                  { n: '20',     l: 'Cities' },
                  { n: '4.8 ★',  l: 'Rating' },
                ].map(s => (
                  <div key={s.l}>
                    <p className="text-xl font-bold text-gray-900">{s.n}</p>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Hero image */}
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=1000&auto=format&fit=crop"
                alt="Designer cake"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-full px-3 py-1 text-xs font-bold text-gray-800 flex items-center gap-1">
                <span>🎂</span> 500+ designs
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category pills */}
      <section id="gallery" className="sticky top-0 bg-white border-b z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => {
                setActiveCategory(c.key);
                document.getElementById('gallery-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activeCategory === c.key
                  ? 'bg-rose-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-rose-50 hover:text-rose-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery-grid" className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{active.label}</h2>
          <p className="text-sm text-gray-500 mt-1">{active.tagline} · {activeCakes.length} designs</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {activeCakes.map(cake => (
            <Link
              key={cake.key}
              href={`/services/cake/order?cake=${cake.key}`}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-rose-200 transition-all"
            >
              <div className="aspect-square overflow-hidden bg-gray-100">
                <img src={cake.photoUrl} alt={cake.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 truncate">{cake.label}</p>
                  <span className="text-[11px] text-rose-600 font-bold opacity-0 group-hover:opacity-100 transition">Book →</span>
                </div>
                <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${cake.tier === 'LUXURY' ? 'bg-purple-100 text-purple-700' : cake.tier === 'PREMIUM' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                  {cake.tier}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Inline CTA */}
        <div className="mt-10 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl p-6 sm:p-8 text-center">
          <h3 className="text-xl sm:text-2xl font-bold">Can't find what you want?</h3>
          <p className="mt-2 text-white/90 text-sm">Describe your design in the booking form — our baker will reach out on WhatsApp within 2 hours.</p>
          <Link href="/services/cake/order" className="inline-block mt-4 bg-white text-rose-600 rounded-full px-6 py-2.5 text-sm font-bold hover:bg-rose-50 transition">
            Start your custom order →
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">How it works</h2>
            <p className="text-sm text-gray-500 mt-2">From order to doorstep in 24 hours.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { n: '1', icon: '🎨', title: 'Pick a design',  body: 'Browse 500+ designs or describe your own.' },
              { n: '2', icon: '🛒', title: 'Book & pay',     body: 'Weight, flavour, message, delivery slot. Pay secure.' },
              { n: '3', icon: '👩‍🍳', title: 'Baker confirms', body: 'WhatsApp within 2 hours to finalise design + photo reference.' },
              { n: '4', icon: '🚚', title: 'Fresh delivery', body: 'Hand-delivered in insulated packaging, on time.' },
            ].map(s => (
              <div key={s.n} className="bg-white rounded-2xl p-5 text-center border border-gray-100">
                <span className="text-3xl block mb-2">{s.icon}</span>
                <p className="text-[10px] text-rose-600 font-bold tracking-[0.2em]">STEP {s.n}</p>
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
          <p className="text-xs font-semibold tracking-[0.25em] text-rose-600 uppercase mb-2">What our customers say</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Loved across 20 cities</h2>
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
                  <span className="text-rose-600 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-rose-500 via-pink-500 to-amber-500 text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to order?</h2>
          <p className="mt-3 text-white/90 max-w-xl mx-auto">Fresh, hand-decorated, delivered on time. Every cake backed by our 4.8-star rating.</p>
          <Link href="/services/cake/order" className="inline-block mt-6 bg-white text-rose-600 rounded-full px-7 py-3 text-sm font-bold shadow-xl hover:bg-rose-50 transition">
            Book your cake →
          </Link>
          <p className="mt-4 text-xs text-white/80">Or call <a href="tel:7367034295" className="underline font-semibold">7367034295</a> for help</p>
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t shadow-xl p-3 md:hidden z-30">
        <Link href="/services/cake/order" className="block w-full bg-rose-600 hover:bg-rose-700 text-white text-center rounded-xl py-3 text-sm font-bold transition">
          Book Now →
        </Link>
      </div>
    </div>
  );
}
