'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  getService, ServiceTemplate,
  DEFAULT_HOW_IT_WORKS, DEFAULT_TESTIMONIALS, DEFAULT_FAQ,
} from '../_templates';

// Generic L2 landing for "simple" partner services (photographer, DJ,
// makeup, etc.). Driven entirely by ../_templates.ts and live pricing
// from /chef-events/pricing. CTA routes into the existing event booking
// flow with ?focus=<key> so no new order-flow code is needed.

function priceFromLabel(paise?: number): string | null {
  if (!paise || paise <= 0) return null;
  const rupees = paise / 100;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(rupees >= 1000000 ? 0 : 1)}L`;
  if (rupees >= 1000)   return `₹${Math.round(rupees / 1000)}k`;
  return `₹${Math.round(rupees).toLocaleString('en-IN')}`;
}

type PricingItem = {
  itemKey: string;
  pricePaise: number;
  minPricePaise?: number;
  maxPricePaise?: number;
};

export default function GenericServicePage() {
  const { service: slug } = useParams<{ service: string }>();
  const svc = getService(slug);

  const [pricing, setPricing] = useState<PricingItem | null>(null);

  useEffect(() => {
    if (!svc) return;
    api.getEventPricing()
      .then((items: any[]) => {
        const match = items.find(i => i.itemKey === svc.pricingKey);
        if (match) setPricing(match);
      })
      .catch(() => { /* fall back to hardcoded */ });
  }, [svc]);

  if (!svc) {
    notFound();
  }

  const fromPaise = pricing?.minPricePaise ?? pricing?.pricePaise;
  const from = priceFromLabel(fromPaise);
  const howItWorks   = svc.howItWorks   ?? DEFAULT_HOW_IT_WORKS;
  const testimonials = svc.testimonials ?? DEFAULT_TESTIMONIALS;
  const faq          = svc.faq          ?? DEFAULT_FAQ;
  const stats        = svc.stats        ?? [
    { n: '50K+',  l: 'Events' },
    { n: '20',    l: 'Cities' },
    { n: '4.8 ★', l: 'Rating' },
  ];

  const bookHref = `/cooks/events?focus=${encodeURIComponent(svc.focusKey ?? svc.pricingKey)}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-2 text-xs text-gray-500 flex items-center gap-1.5">
          <Link href="/" className="hover:text-orange-500">Home</Link>
          <span>›</span>
          <Link href="/services" className="hover:text-orange-500">Services</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">{svc.label}</span>
        </div>
      </div>

      {/* Hero */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${svc.heroGradient}`}>
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/30 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-white/30 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-14 sm:pt-16 sm:pb-20 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className={`text-xs font-semibold tracking-[0.25em] ${svc.accentText} uppercase mb-3`}>{svc.heroTagline}</p>
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-[1.05]">
                {svc.label}
              </h1>
              <p className="mt-4 text-base sm:text-lg text-gray-700">
                {svc.heroSubheading}
                {from && <span className={`font-semibold ${svc.accentText}`}> From {from}.</span>}
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
                {svc.heroChips.map((c, i) => <span key={i}>{c}</span>)}
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={bookHref} className={`${svc.ctaBg} text-white rounded-full px-6 py-3 text-sm font-bold shadow-lg transition`}>
                  Book Now →
                </Link>
                <a href="#gallery" className="bg-white border border-gray-200 text-gray-800 rounded-full px-6 py-3 text-sm font-semibold hover:bg-gray-50 transition">
                  Browse
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                {stats.map(s => (
                  <div key={s.l}>
                    <p className="text-xl font-bold text-gray-900">{s.n}</p>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <span className="text-9xl opacity-30">{svc.icon}</span>
              </div>
              <img src={svc.heroPhoto} alt={svc.label}
                   onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                   className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-full px-3 py-1 text-xs font-bold text-gray-800 flex items-center gap-1">
                <span>{svc.icon}</span> {svc.heroBadge}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{svc.galleryTitle}</h2>
          <p className="text-sm text-gray-500 mt-1">{svc.gallerySubtitle}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {svc.gallery.map((g, i) => (
            <Link key={i} href={bookHref}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-orange-200 transition-all">
              <div className="aspect-[4/3] relative bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex items-center justify-center">
                <span className="text-5xl opacity-40">{svc.icon}</span>
                <img src={g.photoUrl} alt={g.label} loading="lazy"
                     onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                     className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 truncate">{g.label}</p>
                <span className={`text-[11px] font-bold opacity-0 group-hover:opacity-100 transition ${svc.accentText}`}>Book →</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Inline CTA */}
        <div className={`mt-10 ${svc.ctaBg} text-white rounded-2xl p-6 sm:p-8 text-center`}>
          <h3 className="text-xl sm:text-2xl font-bold">Ready to book a {svc.label.toLowerCase()}?</h3>
          <p className="mt-2 text-white/90 text-sm">Share your date and venue — our partner reaches out on WhatsApp within 2 hours.</p>
          <Link href={bookHref} className="inline-block mt-4 bg-white text-gray-900 rounded-full px-6 py-2.5 text-sm font-bold hover:bg-gray-50 transition">
            Start booking →
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">How it works</h2>
            <p className="text-sm text-gray-500 mt-2">Four simple steps from booking to service.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {howItWorks.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 text-center border border-gray-100">
                <span className="text-3xl block mb-2">{s.icon}</span>
                <p className={`text-[10px] font-bold tracking-[0.2em] ${svc.accentText}`}>STEP {i + 1}</p>
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
          <p className={`text-xs font-semibold tracking-[0.25em] ${svc.accentText} uppercase mb-2`}>Loved across India</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">What our customers say</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex gap-0.5 text-amber-500 mb-2">{'★'.repeat(t.stars ?? 5)}</div>
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
            {faq.map((f, i) => (
              <details key={i} className="bg-white rounded-xl border border-gray-100 group">
                <summary className="px-5 py-4 cursor-pointer flex items-center justify-between text-sm font-semibold text-gray-900 list-none">
                  {f.q}
                  <span className={`${svc.accentText} group-open:rotate-45 transition-transform text-xl leading-none`}>+</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`${svc.ctaBg} text-white`}>
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to book?</h2>
          <p className="mt-3 text-white/90 max-w-xl mx-auto">Backed by our 4.8-star rating · payment secured · fully vetted partners.</p>
          <Link href={bookHref} className="inline-block mt-6 bg-white text-gray-900 rounded-full px-7 py-3 text-sm font-bold shadow-xl hover:bg-gray-50 transition">
            Book {svc.label} →
          </Link>
          <p className="mt-4 text-xs text-white/80">Or call <a href="tel:7367034295" className="underline font-semibold">7367034295</a> for help</p>
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t shadow-xl p-3 md:hidden z-30">
        <Link href={bookHref} className={`block w-full ${svc.ctaBg} text-white text-center rounded-xl py-3 text-sm font-bold transition`}>
          Book Now →
        </Link>
      </div>
    </div>
  );
}
