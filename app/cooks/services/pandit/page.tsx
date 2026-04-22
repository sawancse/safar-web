'use client';

import { useState } from 'react';
import Link from 'next/link';
import { OCCASIONS, PUJAS, pujasForOccasion } from './catalog';

const INR = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;

const TESTIMONIALS = [
  { name: 'Ramesh P.',    city: 'Hyderabad', text: 'Pandit ji arrived 15 minutes early, explained every step in Hindi and Telugu. Our griha pravesh went perfectly.',   stars: 5 },
  { name: 'Anand & Sona', city: 'Bengaluru', text: 'Booked a silver jubilee puja — the pandit customised mantras to our lineage and brought full samagri. Impressive.',  stars: 5 },
  { name: 'Priya K.',     city: 'Chennai',   text: 'Annaprashan for my daughter was beautiful. Everything was arranged, we just had to show up and participate.',        stars: 5 },
];

const FAQ = [
  { q: 'Which languages are supported?',       a: 'Hindi, Sanskrit, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Odia and Punjabi. Pick your preferred language in the order form.' },
  { q: 'Is samagri (puja kit) included?',      a: 'Yes — every puja comes with the required samagri kit. Premium/luxury pujas include richer items like silver kalash, extended samagri, havan kund etc.' },
  { q: 'What is dakshina?',                    a: 'Dakshina is a traditional donation to the pandit, separate from the service charge. We show a recommended amount on the summary page — customer pays it in cash on the day.' },
  { q: 'How far in advance should I book?',    a: 'Standard pujas: 24-48 hours. Wedding pandits and large yagnas: 7 days+. For festival days (Diwali, Ganesh Chaturthi), book 2 weeks ahead.' },
  { q: 'Is the advance refundable?',           a: '60% advance locks in the date + pandit. Cancellations up to 12 hours after booking are fully refundable. After that, advance is non-refundable.' },
];

export default function PanditLandingPage() {
  const [active, setActive] = useState<string>('HOUSEWARMING');
  const activeOccasion = OCCASIONS.find(o => o.key === active)!;
  const activePujas = pujasForOccasion(active);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-2 text-xs text-gray-500 flex items-center gap-1.5">
          <Link href="/" className="hover:text-orange-500">Home</Link>
          <span>›</span>
          <Link href="/cooks/services" className="hover:text-orange-500">Services</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Pandit / Puja</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-100 via-orange-50 to-red-50">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-14 sm:pt-16 sm:pb-20 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] text-orange-700 uppercase mb-3">Authentic · Shastra-backed</p>
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-[1.05]">
                Pandit & Puja Services
              </h1>
              <p className="mt-4 text-base sm:text-lg text-gray-700">
                Experienced pandits for griha pravesh, anniversary, wedding, annaprashan and festival pujas. Samagri included. Verified and multi-lingual.
                <span className="font-semibold text-orange-700"> ₹1,500 onwards.</span>
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
                <span>✓ Samagri kit included</span>
                <span>✓ 11 languages</span>
                <span>✓ On-time arrival</span>
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/cooks/services/pandit/order" className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6 py-3 text-sm font-bold shadow-lg shadow-orange-600/25 transition">
                  Book Now →
                </Link>
                <a href="#gallery" className="bg-white border border-gray-200 text-gray-800 rounded-full px-6 py-3 text-sm font-semibold hover:bg-gray-50 transition">
                  Browse pujas
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                {[
                  { n: '2L+',    l: 'Pujas conducted' },
                  { n: '20',     l: 'Cities' },
                  { n: '4.9 ★',  l: 'Rating' },
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
                src="https://images.unsplash.com/photo-1609152867693-e7fd58b18b93?w=1000&auto=format&fit=crop"
                alt="Pandit conducting puja"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-full px-3 py-1 text-xs font-bold text-gray-800 flex items-center gap-1">
                <span>🪔</span> {PUJAS.length}+ pujas
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
                active === o.key ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-700'
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
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{activeOccasion.icon} {activeOccasion.label}</h2>
            <p className="text-sm text-gray-500 mt-1">{activePujas.length} pujas · all include samagri kit and pandit arrival</p>
          </div>
        </div>

        {activePujas.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>No pujas in this category yet.</p>
            <Link href="/cooks/services/pandit/order" className="inline-block mt-3 text-orange-600 font-semibold">Request custom puja →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePujas.map(p => (
              <Link
                key={p.key}
                href={`/cooks/services/pandit/order?puja=${p.key}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-orange-200 transition-all"
              >
                <div className="aspect-video overflow-hidden relative bg-gradient-to-br from-amber-100 via-orange-100 to-red-100 flex items-center justify-center">
                  {/* Emoji fallback sits underneath — visible if the remote photo fails to load */}
                  <span className="text-6xl opacity-40">🪔</span>
                  <img src={p.photoUrl} alt={p.label} loading="lazy"
                       onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                       className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${p.tier === 'LUXURY' ? 'bg-purple-600 text-white' : p.tier === 'PREMIUM' ? 'bg-amber-500 text-white' : 'bg-white/95 text-gray-700'}`}>
                    {p.tier}
                  </span>
                </div>
                <div className="p-4">
                  <p className="font-bold text-gray-900">{p.label}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{p.inclusions[0]}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm">
                        <span className="text-gray-400">from </span>
                        <span className="font-bold text-gray-900">{INR(p.pricePaise)}</span>
                      </p>
                      <p className="text-[10px] text-gray-400">{p.durationHours}h · +dakshina {INR(p.recommendedDakshinaPaise)}</p>
                    </div>
                    <span className="text-[11px] text-orange-600 font-bold opacity-0 group-hover:opacity-100 transition">Book →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-6 sm:p-8 text-center">
          <h3 className="text-xl sm:text-2xl font-bold">Need a specific puja?</h3>
          <p className="mt-2 text-white/90 text-sm">Tell us the puja, language and gotra — our pandit reaches out on WhatsApp within 2 hours to confirm.</p>
          <Link href="/cooks/services/pandit/order" className="inline-block mt-4 bg-white text-orange-600 rounded-full px-6 py-2.5 text-sm font-bold hover:bg-orange-50 transition">
            Request custom puja →
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">How it works</h2>
            <p className="text-sm text-gray-500 mt-2">Book, get a verified pandit and complete your puja at peace.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { n: '1', icon: '🪔', title: 'Pick your puja',         body: 'Browse by occasion. Each puja lists what samagri and rituals are included.' },
              { n: '2', icon: '📅', title: 'Date + arrival time',    body: 'Pick date and arrival slot. We handle the pandit and samagri logistics.' },
              { n: '3', icon: '🔒', title: 'Pay 60% advance',        body: 'Secure advance locks the pandit and date. Balance on the day.' },
              { n: '4', icon: '🙏', title: 'Pandit arrives',         body: 'On-time, with samagri kit. They conduct the ritual in your preferred language.' },
            ].map(s => (
              <div key={s.n} className="bg-white rounded-2xl p-5 text-center border border-gray-100">
                <span className="text-3xl block mb-2">{s.icon}</span>
                <p className="text-[10px] text-orange-600 font-bold tracking-[0.2em]">STEP {s.n}</p>
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
          <p className="text-xs font-semibold tracking-[0.25em] text-orange-600 uppercase mb-2">Devotees across India</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">What our families say</h2>
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
                  <span className="text-orange-600 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-orange-500 via-amber-500 to-red-500 text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">Book your pandit</h2>
          <p className="mt-3 text-white/90 max-w-xl mx-auto">Verified, experienced, multilingual. Backed by our 4.9-star rating.</p>
          <Link href="/cooks/services/pandit/order" className="inline-block mt-6 bg-white text-orange-600 rounded-full px-7 py-3 text-sm font-bold shadow-xl hover:bg-orange-50 transition">
            Book puja →
          </Link>
          <p className="mt-4 text-xs text-white/80">Or call <a href="tel:9004044234" className="underline font-semibold">9004044234</a> for help</p>
        </div>
      </section>

      <div className="fixed bottom-0 inset-x-0 bg-white border-t shadow-xl p-3 md:hidden z-30">
        <Link href="/cooks/services/pandit/order" className="block w-full bg-orange-600 hover:bg-orange-700 text-white text-center rounded-xl py-3 text-sm font-bold transition">
          Book Now →
        </Link>
      </div>
    </div>
  );
}
