'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ROLES, StaffRole } from './catalog';

const INR = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;

const TESTIMONIALS = [
  { name: 'Ananya T.',     city: 'Hyderabad', text: 'Hired 4 waiters + 1 bartender for my engagement. They were on time, professional, and guests didn\'t wait for anything.',             stars: 5 },
  { name: 'Rahul V.',      city: 'Bengaluru', text: 'The cleaning team did the post-event deep clean overnight. Kitchen was spotless by morning — worth every rupee.',                      stars: 5 },
  { name: 'Deepika R.',    city: 'Mumbai',    text: 'Our bartender made custom cocktails named after the couple. Such a nice touch — everyone was impressed.',                             stars: 5 },
];

const FAQ = [
  { q: 'How many waiters do I need?',                 a: 'Rule of thumb: 1 waiter per 15 guests for a sit-down meal, or 1 per 25 for a buffet. For drinks-heavy events, add 1 more per 40 guests. Our checkout nudges you based on guest count.' },
  { q: 'Is a uniform included?',                      a: 'Yes — all staff arrive in our standard black-shirt / black-trouser uniform. If you need colour-coordinated uniforms to match your theme, mention it in the notes.' },
  { q: 'What\'s the minimum booking?',                a: '2 hours minimum, 12 hours maximum per staff. Base shift is 4 hours — shorter bookings still bill a 4-hour minimum; longer bookings add a per-hour charge.' },
  { q: 'Do they handle food preparation?',            a: 'Waiters serve + clear; they don\'t cook. If you need kitchen help while food is being prepared, book a cleaner (they assist with dishwashing + plating support too).' },
  { q: 'Is the advance refundable?',                  a: '60% advance locks in your staff. Cancellations up to 12 hours after booking are fully refundable. After that the advance is non-refundable.' },
];

export default function StaffHireLandingPage() {
  const search = useSearchParams();
  const router = useRouter();
  const roleKey = (search.get('role') as StaffRole | null) ?? 'waiter';
  const spec = ROLES[roleKey] ?? ROLES.waiter;

  const bookHref = `/services/staff-hire/order?role=${spec.key}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-2 text-xs text-gray-500 flex items-center gap-1.5">
          <Link href="/" className="hover:text-orange-500">Home</Link>
          <span>›</span>
          <Link href="/services" className="hover:text-orange-500">Services</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Hire {spec.label}</span>
        </div>
      </div>

      {/* Role switcher */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
          {(Object.values(ROLES)).map(r => (
            <button key={r.key} onClick={() => router.push(`/services/staff-hire?role=${r.key}`)}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition flex items-center gap-1.5 ${roleKey === r.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              <span>{r.icon}</span> Hire {r.label}s
            </button>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${spec.theme.hero}`}>
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/30 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-14 sm:pt-16 sm:pb-20 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className={`text-xs font-semibold tracking-[0.25em] ${spec.theme.accent} uppercase mb-3`}>{spec.occasionFit.slice(0,3).join(' · ')}</p>
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-[1.05]">
                Hire {spec.label}s
              </h1>
              <p className="mt-4 text-base sm:text-lg text-gray-700">
                {spec.tagline}
                <span className={`font-semibold ${spec.theme.accent}`}> {INR(spec.baseShiftPaise)} per {spec.label.toLowerCase()} for a 4-hour shift.</span>
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
                <span>✓ Uniformed &amp; vetted</span>
                <span>✓ On-time guarantee</span>
                <span>✓ Extendable by the hour</span>
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={bookHref} className={`${spec.theme.cta} text-white rounded-full px-6 py-3 text-sm font-bold shadow-lg transition`}>
                  Book {spec.label}s →
                </Link>
                <a href="#details" className="bg-white border border-gray-200 text-gray-800 rounded-full px-6 py-3 text-sm font-semibold hover:bg-gray-50 transition">
                  What's included
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                {[
                  { n: '50K+', l: 'Shifts completed' },
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
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl hidden md:block bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <span className="absolute inset-0 flex items-center justify-center text-9xl opacity-30">{spec.icon}</span>
              <img src={spec.heroPhoto} alt={`${spec.label} serving`}
                   onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                   className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-full px-3 py-1 text-xs font-bold text-gray-800 flex items-center gap-1">
                <span>{spec.icon}</span> {spec.heroBadge}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section id="details" className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">What's included</h2>
            <p className="text-sm text-gray-500 mt-1">Every {spec.label.toLowerCase()} you book comes with:</p>
            <ul className="mt-5 space-y-3">
              {spec.inclusions.map((inc, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className={`w-6 h-6 rounded-full ${spec.theme.cta} text-white text-xs font-bold flex items-center justify-center shrink-0`}>✓</span>
                  <span className="text-sm text-gray-700">{inc}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-50 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900">Good fit for</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {spec.occasionFit.map(o => (
                <span key={o} className="text-xs bg-white border border-gray-200 text-gray-700 rounded-full px-3 py-1">{o}</span>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-bold text-gray-900">Pricing</h3>
              <p className="mt-2 text-sm text-gray-700">
                <strong>{INR(spec.baseShiftPaise)}</strong> per {spec.label.toLowerCase()} · 4-hour shift.<br />
                Extra hours: <strong>{INR(spec.perHourPaise)}</strong> per hour per {spec.label.toLowerCase()}.
              </p>
              <Link href={bookHref} className={`inline-block mt-4 ${spec.theme.cta} text-white rounded-full px-5 py-2.5 text-sm font-bold transition`}>
                Check pricing for your event →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">How it works</h2>
            <p className="text-sm text-gray-500 mt-2">Four steps from booking to staff arrival.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { n: '1', icon: '👥', title: 'Pick how many',        body: `How many ${spec.label.toLowerCase()}s, for how many hours.` },
              { n: '2', icon: '🗓️', title: 'Date + arrival time',  body: 'Choose the day and when they should arrive.' },
              { n: '3', icon: '🔒', title: 'Pay 60% advance',      body: 'Secure the booking. Balance paid on event day.' },
              { n: '4', icon: '🎉', title: 'Staff arrive on time', body: 'Uniformed, vetted, ready to serve. Unique OTP check-in.' },
            ].map(s => (
              <div key={s.n} className="bg-white rounded-2xl p-5 text-center border border-gray-100">
                <span className="text-3xl block mb-2">{s.icon}</span>
                <p className={`text-[10px] ${spec.theme.accent} font-bold tracking-[0.2em]`}>STEP {s.n}</p>
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
          <p className={`text-xs font-semibold tracking-[0.25em] ${spec.theme.accent} uppercase mb-2`}>Loved across India</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">What our hosts say</h2>
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
                  <span className={`${spec.theme.accent} group-open:rotate-45 transition-transform text-xl leading-none`}>+</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`${spec.theme.cta} text-white`}>
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to hire {spec.label}s?</h2>
          <p className="mt-3 text-white/90 max-w-xl mx-auto">Vetted · uniformed · on time · 4.8-star rating.</p>
          <Link href={bookHref} className="inline-block mt-6 bg-white text-gray-900 rounded-full px-7 py-3 text-sm font-bold shadow-xl hover:bg-gray-100 transition">
            Book {spec.label}s →
          </Link>
          <p className="mt-4 text-xs text-white/80">Or call <a href="tel:7367034295" className="underline font-semibold">7367034295</a></p>
        </div>
      </section>

      <div className="fixed bottom-0 inset-x-0 bg-white border-t shadow-xl p-3 md:hidden z-30">
        <Link href={bookHref} className={`block w-full ${spec.theme.cta} text-white text-center rounded-xl py-3 text-sm font-bold transition`}>
          Book {spec.label}s →
        </Link>
      </div>
    </div>
  );
}
