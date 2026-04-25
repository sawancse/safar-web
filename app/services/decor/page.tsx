'use client';

import { useState } from 'react';
import Link from 'next/link';
import { OCCASIONS, DECORATIONS, decorationsForOccasion } from './catalog';

const INR = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;

const TESTIMONIALS = [
  { name: 'Sneha T.', city: 'Hyderabad', text: 'The decorator arrived on time, set up the rose room decor in 2 hours and it looked MAGICAL. My husband cried.',   stars: 5 },
  { name: 'Rahul V.', city: 'Bengaluru', text: 'Booked the mandap floral for our Tamil wedding — fresh flowers, clean setup, cleared up after. Worth every rupee.',  stars: 5 },
  { name: 'Kavya N.', city: 'Chennai',   text: 'Baby shower was a dream. Pink theme, perfect photo backdrop, kids loved the balloons. Family still talks about it.', stars: 5 },
];

const FAQ = [
  { q: 'How far in advance should I book?',           a: 'For standard decor: 24 hours minimum. Wedding mandaps and large events: 5-7 days. For urgent bookings, call 9004044234.' },
  { q: 'What if the decorator arrives late?',         a: 'We guarantee arrival within a 30-minute window. If we\'re later, the additional setup time is free and we may offer a discount.' },
  { q: 'What are overtime charges?',                  a: 'Each decoration includes a setup window (typically 2-3 hours). If you need the decor to stay longer or want additions, overtime is charged per hour as shown on the design.' },
  { q: 'Can I customise the decoration?',             a: 'Absolutely. After booking, our decorator reaches out on WhatsApp to finalise theme colours, add-ons and personal touches.' },
  { q: 'Is the advance refundable?',                  a: '60% advance locks in the date + decorator. Cancellations up to 12 hours after booking are fully refundable. After that the advance is non-refundable.' },
];

export default function DecorLandingPage() {
  const [active, setActive] = useState<string>('ANNIVERSARY');
  const activeOccasion = OCCASIONS.find(o => o.key === active)!;
  const activeDecor = decorationsForOccasion(active);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-2 text-xs text-gray-500 flex items-center gap-1.5">
          <Link href="/" className="hover:text-orange-500">Home</Link>
          <span>›</span>
          <Link href="/services" className="hover:text-orange-500">Services</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Event Decoration</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-100 via-rose-50 to-amber-50">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-pink-200/40 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-14 sm:pt-16 sm:pb-20 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] text-rose-600 uppercase mb-3">At your home · On time</p>
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-[1.05]">
                Event Decoration
              </h1>
              <p className="mt-4 text-base sm:text-lg text-gray-700">
                Anniversary rooms, birthday stages, baby shower backdrops, wedding mandaps — set up in hours, cleaned up after.
                <span className="font-semibold text-rose-700"> ₹2,500 onwards.</span>
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
                <span>✓ Setup in 2-6 hrs</span>
                <span>✓ Fresh flowers & premium balloons</span>
                <span>✓ Cleanup included</span>
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/services/decor/order" className="bg-rose-600 hover:bg-rose-700 text-white rounded-full px-6 py-3 text-sm font-bold shadow-lg shadow-rose-600/25 transition">
                  Book Now →
                </Link>
                <a href="#gallery" className="bg-white border border-gray-200 text-gray-800 rounded-full px-6 py-3 text-sm font-semibold hover:bg-gray-50 transition">
                  Browse designs
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                {[
                  { n: '5L+',    l: 'Decors delivered' },
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
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&auto=format&fit=crop"
                alt="Event decoration"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-full px-3 py-1 text-xs font-bold text-gray-800 flex items-center gap-1">
                <span>🌸</span> {DECORATIONS.length}+ designs
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Occasion pills */}
      <section id="gallery" className="sticky top-0 bg-white border-b z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
          {OCCASIONS.map(o => (
            <button
              key={o.key}
              onClick={() => {
                setActive(o.key);
                document.getElementById('gallery-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition flex items-center gap-1.5 ${
                active === o.key ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-rose-50 hover:text-rose-700'
              }`}
            >
              <span>{o.icon}</span>
              {o.label}
            </button>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery-grid" className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{activeOccasion.icon} {activeOccasion.label} Decorations</h2>
            <p className="text-sm text-gray-500 mt-1">{activeDecor.length} designs · all include setup + cleanup</p>
          </div>
        </div>

        {activeDecor.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>No designs in this category yet.</p>
            <Link href="/services/decor/order" className="inline-block mt-3 text-rose-600 font-semibold">Request custom decoration →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeDecor.map(d => (
              <Link
                key={d.key}
                href={`/services/decor/order?decor=${d.key}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-rose-200 transition-all"
              >
                <div className="aspect-square overflow-hidden relative bg-gradient-to-br from-pink-100 via-rose-100 to-amber-100 flex items-center justify-center">
                  <span className="text-6xl opacity-40">🌸</span>
                  <img src={d.photoUrl} alt={d.label} loading="lazy"
                       onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                       className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${d.tier === 'LUXURY' ? 'bg-purple-600 text-white' : d.tier === 'PREMIUM' ? 'bg-amber-500 text-white' : 'bg-white/95 text-gray-700'}`}>
                    {d.tier}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-900 truncate">{d.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{d.inclusions[0]}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs">
                      <span className="text-gray-400">from </span>
                      <span className="font-bold text-gray-900">{INR(d.pricePaise)}</span>
                    </span>
                    <span className="text-[11px] text-rose-600 font-bold opacity-0 group-hover:opacity-100 transition">Book →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl p-6 sm:p-8 text-center">
          <h3 className="text-xl sm:text-2xl font-bold">Want a custom theme?</h3>
          <p className="mt-2 text-white/90 text-sm">Describe your vision — our decorator reaches out on WhatsApp within 2 hours to scope it.</p>
          <Link href="/services/decor/order" className="inline-block mt-4 bg-white text-rose-600 rounded-full px-6 py-2.5 text-sm font-bold hover:bg-rose-50 transition">
            Start custom booking →
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">How it works</h2>
            <p className="text-sm text-gray-500 mt-2">From picking a design to a ready-to-shoot room.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { n: '1', icon: '🌸', title: 'Pick a design',        body: 'Browse by occasion. Each design shows exactly what\'s included.' },
              { n: '2', icon: '📅', title: 'Date + arrival time',  body: 'Select when the decorator should arrive — we\'ve got slots from 8am to 11pm.' },
              { n: '3', icon: '🔒', title: 'Pay 60% advance',      body: 'Lock in the booking with a secure advance. Balance on the day.' },
              { n: '4', icon: '✨', title: 'Decorator arrives',   body: 'On-time setup, handover, and cleanup after your event.' },
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
          <p className="text-xs font-semibold tracking-[0.25em] text-rose-600 uppercase mb-2">Loved in 20 cities</p>
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
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to book?</h2>
          <p className="mt-3 text-white/90 max-w-xl mx-auto">Hand-decorated, on-time, cleanup included. Backed by our 4.8-star rating.</p>
          <Link href="/services/decor/order" className="inline-block mt-6 bg-white text-rose-600 rounded-full px-7 py-3 text-sm font-bold shadow-xl hover:bg-rose-50 transition">
            Book your decoration →
          </Link>
          <p className="mt-4 text-xs text-white/80">Or call <a href="tel:9004044234" className="underline font-semibold">9004044234</a> for help</p>
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t shadow-xl p-3 md:hidden z-30">
        <Link href="/services/decor/order" className="block w-full bg-rose-600 hover:bg-rose-700 text-white text-center rounded-xl py-3 text-sm font-bold transition">
          Book Now →
        </Link>
      </div>
    </div>
  );
}
