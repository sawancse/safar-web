'use client';

import Link from 'next/link';

const services = [
  {
    title: 'Online Sale Agreement',
    description: 'Legally binding agreements with e-stamping & e-signing. Doorstep delivery in 3-4 days.',
    cta: 'Create Agreement',
    href: '/services/agreement',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    title: 'Home Loan',
    description: 'Compare rates from 15+ banks. Check eligibility instantly. Free service.',
    cta: 'Check Eligibility',
    href: '/services/homeloan',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
  },
  {
    title: 'Legal Verification',
    description: 'Expert property verification, title search & risk assessment. Reports in 5-8 days.',
    cta: 'Get Started',
    href: '/services/legal',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: 'Home Interiors',
    description: 'End-to-end interior design & execution. 3D visualization. 10-year warranty.',
    cta: 'Book Free Consultation',
    href: '/services/interiors',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
  },
];

const stats = [
  { value: '5,000+', label: 'Agreements Created' },
  { value: '15+', label: 'Partner Banks' },
  { value: '500+', label: 'Legal Cases Resolved' },
  { value: '100+', label: 'Interior Projects' },
];

const steps = [
  {
    num: '01',
    title: 'Choose a Service',
    desc: 'Select from our range of property services tailored to your needs.',
  },
  {
    num: '02',
    title: 'Provide Details',
    desc: 'Fill in the required information about your property and preferences.',
  },
  {
    num: '03',
    title: 'Expert Processing',
    desc: 'Our verified professionals handle everything end-to-end.',
  },
  {
    num: '04',
    title: 'Delivered to You',
    desc: 'Receive completed documents, reports, or finished projects on time.',
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-[#003B95] text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Safar Services</h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            Property paperwork, home loans, legal verification, interiors &mdash; and everything you need
            for celebrations: cooks, cake, decor, pandit, music, staff. Under one roof.
          </p>
        </div>
      </section>

      {/* Property Service Cards */}
      <section className="max-w-7xl mx-auto px-4 -mt-12 relative z-10 pb-10">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-5 px-1">Property Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow group"
            >
              <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-gray-300 group-hover:from-orange-50 group-hover:to-orange-100 transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-white/80 flex items-center justify-center text-orange-500 shadow-sm">
                  {s.icon}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-sm mb-1.5 group-hover:text-orange-600 transition-colors">
                  {s.title}
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed mb-4">{s.description}</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500">
                  {s.cta}
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Celebration & Event Services */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-end justify-between mb-5 px-1 flex-wrap gap-3">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Celebration & Event Services</h2>
          <Link href="/services/events" className="text-sm font-semibold text-orange-500 hover:text-orange-600">
            Explore the marketplace →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { href: '/services/cake',        label: 'Designer Cake',  emoji: '🎂', tint: 'from-rose-100 to-pink-100' },
            { href: '/services/decor',       label: 'Event Decor',    emoji: '🌸', tint: 'from-rose-100 to-orange-100' },
            { href: '/services/pandit',      label: 'Pandit / Puja',  emoji: '🪔', tint: 'from-amber-100 to-yellow-100' },
            { href: '/services/live-music',  label: 'Live Singer',    emoji: '🎺', tint: 'from-amber-100 to-orange-100' },
            { href: '/services/appliances',  label: 'Appliances',     emoji: '🍳', tint: 'from-slate-100 to-gray-200' },
            { href: '/services/staff-hire',  label: 'Hire Staff',     emoji: '🧑‍🍳', tint: 'from-blue-100 to-sky-100' },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow group"
            >
              <div className={`h-24 bg-gradient-to-br ${c.tint} flex items-center justify-center text-3xl`}>
                {c.emoji}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 text-sm group-hover:text-orange-600 transition-colors">
                  {c.label}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-1">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-slate-900 mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="text-center">
              <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 font-bold text-lg flex items-center justify-center mx-auto mb-4">
                {step.num}
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-gray-400">
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span>Verified Professionals</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span>Secure & Encrypted</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Timely Delivery</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <span>Dedicated Support</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
