'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SINGERS, GENRES, singersForGenre, SingerGenre } from './catalog';

const INR = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;

const TESTIMONIALS = [
  { name: 'Neha & Rohan', city: 'Hyderabad', text: 'Booked a Sufi singer for our shaadi ka ghar. She was on time, had her own sound, and kept guests captivated for 3 hours.', stars: 5 },
  { name: 'Anand M.',     city: 'Bengaluru', text: 'Our sangeet needed Bollywood and the singer mixed retro with latest hits perfectly. Dance floor was packed.', stars: 5 },
  { name: 'Priya S.',     city: 'Chennai',   text: 'Classical carnatic recital for my housewarming — our elders loved it. Platform confirmed availability within 2 hours.', stars: 5 },
];

const FAQ = [
  { q: 'How soon will I know if the singer is available?', a: 'We confirm availability within 2 hours. You pay only after our team confirms a specific artist who matches your date, genre and city.' },
  { q: 'Do they bring their own sound equipment?',         a: 'Yes if you pick "With Sound Equipment" — mic, speaker, mixer and amp are included. Pick "Without" if you have your own PA or the venue provides it.' },
  { q: 'What about overtime?',                              a: 'Base charge covers a 2-hour performance. Beyond that, overtime is ₹16.5 per minute (≈ ₹1,000/hour).' },
  { q: 'Which cities do you cover?',                        a: 'Currently 20 cities including Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai, Pune, Ahmedabad, Jaipur, Kolkata and more. Check during booking.' },
  { q: 'Is the advance refundable?',                        a: '60% advance locks the singer once they accept. Cancellations up to 12 hours after confirmation are fully refundable. After that advance is non-refundable.' },
];

export default function LiveMusicLandingPage() {
  const [activeGenre, setActiveGenre] = useState<SingerGenre | 'ALL'>('ALL');
  const visible = activeGenre === 'ALL' ? SINGERS : singersForGenre(activeGenre);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-2 text-xs text-gray-500 flex items-center gap-1.5">
          <Link href="/" className="hover:text-orange-500">Home</Link>
          <span>›</span>
          <Link href="/services" className="hover:text-orange-500">Services</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Live Music</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-100 via-orange-50 to-red-50">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-14 sm:pt-16 sm:pb-20 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] text-amber-700 uppercase mb-3">Sufi · Classical · Bollywood · Band</p>
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-[1.05]">
                Book a Singer
              </h1>
              <p className="mt-4 text-base sm:text-lg text-gray-700">
                Live music for shaadi ka ghar, sangeet, reception, anniversary or cocktail night. Our platform matches a vetted singer based on genre and date.
                <span className="font-semibold text-amber-700"> ₹8,000 onwards.</span>
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
                <span>✓ Sound equipment optional</span>
                <span>✓ 10 genres</span>
                <span>✓ Confirmed in 2 hrs</span>
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/services/live-music/order" className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-6 py-3 text-sm font-bold shadow-lg shadow-amber-600/25 transition">
                  Check Availability →
                </Link>
                <a href="#gallery" className="bg-white border border-gray-200 text-gray-800 rounded-full px-6 py-3 text-sm font-semibold hover:bg-gray-50 transition">
                  Browse singers
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                {[
                  { n: '50K+',   l: 'Shows delivered' },
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
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl hidden md:block bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center">
              <span className="absolute inset-0 flex items-center justify-center text-9xl opacity-30">🎤</span>
              <img src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1000&auto=format&fit=crop"
                   alt="Live singer with band"
                   onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                   className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-full px-3 py-1 text-xs font-bold text-gray-800 flex items-center gap-1">
                <span>🎤</span> {SINGERS.length}+ artists
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Genre pills */}
      <section id="gallery" className="sticky top-0 bg-white border-b z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveGenre('ALL')}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeGenre === 'ALL' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-amber-50 hover:text-amber-700'
            }`}>
            All genres
          </button>
          {GENRES.map(g => (
            <button
              key={g.key}
              onClick={() => setActiveGenre(g.key)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activeGenre === g.key ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-amber-50 hover:text-amber-700'
              }`}>
              {g.label}
            </button>
          ))}
        </div>
      </section>

      {/* Singer gallery */}
      <section className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Featured artists</h2>
            <p className="text-sm text-gray-500 mt-1">Social proof — we'll match you with the best available artist from your chosen genre.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map(s => {
            const genre = GENRES.find(g => g.key === s.genre);
            return (
              <Link key={s.key} href={`/services/live-music/order?genre=${s.genre}`}
                    className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-amber-200 transition-all">
                <div className="aspect-square overflow-hidden relative bg-gradient-to-br from-amber-100 via-orange-100 to-red-100 flex items-center justify-center">
                  <span className="text-6xl opacity-40">🎤</span>
                  <img src={s.photoUrl} alt={s.name} loading="lazy"
                       onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                       className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-2 right-2 bg-white/95 backdrop-blur rounded-full px-2 py-0.5 text-[10px] font-bold text-gray-800">
                    ⭐ {s.rating.toFixed(1)}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-gray-900 truncate">{s.name}</p>
                  <p className="text-[11px] text-amber-700 font-semibold">{genre?.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-snug">{s.tagline}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-400">{s.experienceYears}y exp · {s.languages.slice(0,2).join(', ')}</span>
                    <span className="text-[11px] text-amber-600 font-bold opacity-0 group-hover:opacity-100 transition">Book →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-6 sm:p-8 text-center">
          <h3 className="text-xl sm:text-2xl font-bold">Know the genre you want?</h3>
          <p className="mt-2 text-white/90 text-sm">Skip browsing — share your occasion, date and genre. We'll confirm a matched singer within 2 hours.</p>
          <Link href="/services/live-music/order" className="inline-block mt-4 bg-white text-amber-600 rounded-full px-6 py-2.5 text-sm font-bold hover:bg-amber-50 transition">
            Check availability →
          </Link>
        </div>
      </section>

      {/* How it works — availability-first flow (no instant pay) */}
      <section className="bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">How it works</h2>
            <p className="text-sm text-gray-500 mt-2">We check availability first, then you pay — no upfront risk.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { n: '1', icon: '🎶', title: 'Pick genre & date',   body: 'Occasion, date, arrival time, genre and sound-equipment preference.' },
              { n: '2', icon: '🔍', title: 'We check availability',body: 'Our team confirms a matching singer for your city within 2 hours.' },
              { n: '3', icon: '🔒', title: 'Pay 60% advance',     body: 'Only after singer accepts. Balance on event day.' },
              { n: '4', icon: '🎤', title: 'Live performance',    body: 'Singer arrives on time, performs for 2 hours (extendable).' },
            ].map(s => (
              <div key={s.n} className="bg-white rounded-2xl p-5 text-center border border-gray-100">
                <span className="text-3xl block mb-2">{s.icon}</span>
                <p className="text-[10px] text-amber-600 font-bold tracking-[0.2em]">STEP {s.n}</p>
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
          <p className="text-xs font-semibold tracking-[0.25em] text-amber-600 uppercase mb-2">Loved across India</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">What our clients say</h2>
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
                  <span className="text-amber-600 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to book?</h2>
          <p className="mt-3 text-white/90 max-w-xl mx-auto">10 genres · 8,000+ songs · pay only after singer accepts. Backed by our 4.8-star rating.</p>
          <Link href="/services/live-music/order" className="inline-block mt-6 bg-white text-amber-600 rounded-full px-7 py-3 text-sm font-bold shadow-xl hover:bg-amber-50 transition">
            Check availability →
          </Link>
          <p className="mt-4 text-xs text-white/80">Or call <a href="tel:7367034295" className="underline font-semibold">7367034295</a> for help</p>
        </div>
      </section>

      <div className="fixed bottom-0 inset-x-0 bg-white border-t shadow-xl p-3 md:hidden z-30">
        <Link href="/services/live-music/order" className="block w-full bg-amber-600 hover:bg-amber-700 text-white text-center rounded-xl py-3 text-sm font-bold transition">
          Check Availability →
        </Link>
      </div>
    </div>
  );
}
