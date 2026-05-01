'use client';

import Link from 'next/link';

type Vertical = {
  emoji: string;
  title: string;
  tagline: string;
  earnings: string;
  href: string;
  cta: string;
  badge?: string;
};

const VERTICALS: Vertical[] = [
  {
    emoji: '👨‍🍳',
    title: 'Cook / Chef',
    tagline: 'Cook daily meals, run subscriptions, cater events',
    earnings: '₹15,000 – ₹80,000 / mo',
    href: '/cooks/register',
    cta: 'Register as a cook',
    badge: 'Most popular',
  },
  {
    emoji: '🪔',
    title: 'Pandit / Acharya',
    tagline: 'Offer pujas — Griha Pravesh, Satyanarayan, weddings, online video pujas',
    earnings: '₹2,500 – ₹25,000 / puja',
    href: '/vendor/onboard/pandit',
    cta: 'Register as a pandit',
  },
  {
    emoji: '🎂',
    title: 'Cake Designer',
    tagline: 'Sell bespoke cakes — fondant, photo-print, sculpted, theme cakes',
    earnings: '₹500 – ₹15,000 / cake',
    href: '/vendor/onboard/cake',
    cta: 'Register as a baker',
  },
  {
    emoji: '🌸',
    title: 'Decorator',
    tagline: 'Decorate weddings, sangeet, birthdays, corporate events',
    earnings: '₹5,000 – ₹2,00,000 / event',
    href: '/vendor/onboard/decor',
    cta: 'Register as a decorator',
  },
  {
    emoji: '🎤',
    title: 'Singer / Performer',
    tagline: 'Get booked for weddings, sangeet nights, corporate events',
    earnings: '₹8,000 – ₹1,50,000 / event',
    href: '/vendor/onboard/singer',
    cta: 'Register as a performer',
  },
  {
    emoji: '🧑‍🍳',
    title: 'Staff Agency',
    tagline: 'Supply waiters, bartenders, cooks, hostesses for events',
    earnings: '₹500 – ₹2,500 / staff / day',
    href: '/vendor/onboard/staff-hire',
    cta: 'Register your agency',
  },
];

const HOW_IT_WORKS = [
  { step: 1, title: 'Register & verify', body: 'Fill the wizard, upload Aadhaar + PAN. We verify in 24-48 hours.' },
  { step: 2, title: 'Set your prices & calendar', body: 'You decide rates and which dates you accept work.' },
  { step: 3, title: 'Receive bookings', body: 'Customers book directly. Confirm, deliver, get paid.' },
  { step: 4, title: 'Get paid weekly', body: 'Bank settlement every Tuesday. Commission only on completed jobs.' },
];

export default function BecomePartnerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-12 pb-10 text-center">
        <p className="text-xs font-bold text-orange-600 uppercase tracking-[0.2em] mb-3">For partners</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3 leading-tight">
          Earn on Safar.
          <br />
          <span className="text-orange-500">Pick your craft.</span>
        </h1>
        <p className="text-base text-gray-600 max-w-2xl mx-auto">
          Six ways to grow your business with Safar — from home cooking to wedding decor.
          Set your own prices, calendar, and service area. Free to join.
        </p>
      </section>

      {/* Verticals grid */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {VERTICALS.map(v => (
            <Link
              key={v.href}
              href={v.href}
              className="group relative bg-white border border-gray-200 rounded-2xl p-5 hover:border-orange-400 hover:shadow-lg transition flex flex-col"
            >
              {v.badge && (
                <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  {v.badge}
                </span>
              )}
              <div className="text-4xl mb-3">{v.emoji}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition">
                {v.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3 flex-1">{v.tagline}</p>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs font-semibold text-emerald-600">{v.earnings}</span>
                <span className="text-sm font-semibold text-orange-600 group-hover:translate-x-0.5 transition">
                  {v.cta} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-900 text-white py-14">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(s => (
              <div key={s.step} className="flex flex-col">
                <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center mb-3">
                  {s.step}
                </div>
                <h3 className="font-semibold text-base mb-1">{s.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* List-your-property anchor */}
      <section className="max-w-5xl mx-auto px-4 py-12 text-center">
        <p className="text-sm text-gray-500 mb-2">Have a property to rent out instead?</p>
        <Link href="/host" className="text-orange-600 font-semibold hover:underline">
          List your property on Safar →
        </Link>
      </section>
    </div>
  );
}
