import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PANDIT_CITIES, findCity } from '../../cities';
import { PUJAS } from '../../catalog';

const INR = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;

// A representative spread of popular pujas to feature on every city page.
const POPULAR_KEYS = [
  'griha_pravesh_premium', 'satyanarayan_small', 'wedding_pandit',
  'lakshmi_puja_diwali', 'kaal_sarp_dosh', 'namkaran',
];

export function generateStaticParams() {
  return PANDIT_CITIES.map(c => ({ city: c.slug }));
}

export function generateMetadata({ params }: { params: { city: string } }): Metadata {
  const city = findCity(params.city);
  if (!city) return { title: 'City not found' };
  const title = `Book a Pandit in ${city.name} — Verified Pandits for Puja | BhramanKaro`;
  const description = `Book experienced, Vedic-certified pandits in ${city.name}, ${city.state} for griha pravesh, satyanarayan, wedding, festival and dosh-nivaran pujas. Samagri kit included, 11 languages. Serving ${city.localities.slice(0, 3).join(', ')} and more.`;
  return {
    title,
    description,
    openGraph: { title, description },
    alternates: { canonical: `/services/pandit/city/${city.slug}` },
  };
}

export default function PanditCityPage({ params }: { params: { city: string } }) {
  const city = findCity(params.city);
  if (!city) notFound();

  const popular = POPULAR_KEYS.map(k => PUJAS.find(p => p.key === k)).filter(Boolean) as typeof PUJAS;
  const otherCities = PANDIT_CITIES.filter(c => c.slug !== city.slug);

  const faq = [
    { q: `Do you have pandits in ${city.name}?`, a: `Yes — we have verified, Vedic-certified pandits across ${city.name}, including ${city.localities.join(', ')}. Book online and a pandit reaches your home on the chosen date with the full samagri kit.` },
    { q: `Which areas of ${city.name} do you cover?`, a: `We serve ${city.localities.join(', ')} and most other neighbourhoods in ${city.name}. If your area isn't listed, book anyway or call us — we'll confirm a pandit for your locality.` },
    { q: 'Is the samagri (puja kit) included?', a: 'Yes, every puja includes its samagri kit. Premium and luxury pujas come with richer items like silver kalash and extended havan samagri.' },
    { q: 'Which languages can the pandit perform in?', a: 'Hindi, Sanskrit, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Odia and Punjabi — pick your preferred language when you book.' },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        serviceType: 'Pandit / Puja booking',
        provider: { '@type': 'Organization', name: 'BhramanKaro' },
        areaServed: { '@type': 'City', name: city.name, containedInPlace: city.state },
        name: `Pandit booking in ${city.name}`,
        description: `Verified pandits for home pujas in ${city.name}, samagri included.`,
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-2 text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-orange-500">Home</Link>
          <span>›</span>
          <Link href="/services/pandit" className="hover:text-orange-500">Pandit / Puja</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">{city.name}</span>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-100 via-orange-50 to-red-50">
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-12 sm:pt-16 sm:pb-16">
          <p className="text-xs font-semibold tracking-[0.25em] text-orange-700 uppercase mb-3">{city.state}</p>
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
            Book a Pandit in {city.name}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-700 max-w-2xl">
            Experienced, Vedic-certified pandits for griha pravesh, satyanarayan, wedding, festival and
            dosh-nivaran pujas across {city.name}. Samagri kit included, multi-lingual, on-time.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/services/pandit/order" className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6 py-3 text-sm font-bold shadow-lg shadow-orange-600/25 transition">
              Book a pandit →
            </Link>
            <a href="tel:7367034295" className="bg-white border border-gray-200 text-gray-800 rounded-full px-6 py-3 text-sm font-semibold hover:bg-gray-50 transition">
              Call to confirm
            </a>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
            <span>✓ Vedic-certified pandits</span>
            <span>✓ Samagri kit included</span>
            <span>✓ 11 languages</span>
          </div>
        </div>
      </section>

      {/* Popular pujas in this city */}
      <section className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Popular pujas in {city.name}</h2>
        <p className="text-sm text-gray-500 mt-1">All include the samagri kit and an on-time pandit arrival.</p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popular.map(p => (
            <Link key={p.key} href={`/services/pandit/${p.key}`}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-orange-200 transition-all">
              <div className="aspect-video overflow-hidden relative bg-gradient-to-br from-amber-100 to-red-100 flex items-center justify-center">
                <span className="text-5xl opacity-40">🪔</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photoUrl} alt={`${p.label} in ${city.name}`} loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-4">
                <p className="font-bold text-gray-900">{p.label}</p>
                <p className="text-sm mt-1"><span className="text-gray-400">from </span><span className="font-bold text-gray-900">{INR(p.pricePaise)}</span></p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Localities served */}
      <section className="bg-gray-50 border-y">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-xl font-bold text-gray-900">Pandit services across {city.name}</h2>
          <p className="text-sm text-gray-500 mt-1">We serve homes in these areas and more:</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {city.localities.map(l => (
              <span key={l} className="text-sm bg-white border border-gray-200 text-gray-700 rounded-full px-3 py-1.5">{l}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Pandit booking in {city.name} — FAQs</h2>
        <div className="space-y-2">
          {faq.map((f, i) => (
            <details key={i} className="bg-white rounded-xl border border-gray-100 group">
              <summary className="px-5 py-4 cursor-pointer flex items-center justify-between text-sm font-semibold text-gray-900 list-none">
                {f.q}
                <span className="text-orange-600 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
              </summary>
              <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* Other cities */}
      <section className="bg-gray-50 border-t">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Pandit services in other cities</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {otherCities.map(c => (
              <Link key={c.slug} href={`/services/pandit/city/${c.slug}`}
                className="text-sm text-orange-600 hover:text-orange-700 hover:underline bg-white border border-gray-200 rounded-full px-3 py-1.5">
                Pandit in {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-orange-500 via-amber-500 to-red-500 text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">Book a verified pandit in {city.name}</h2>
          <p className="mt-3 text-white/90 max-w-xl mx-auto">Samagri included. Multi-lingual. On-time, every time.</p>
          <Link href="/services/pandit/order" className="inline-block mt-6 bg-white text-orange-600 rounded-full px-7 py-3 text-sm font-bold shadow-xl hover:bg-orange-50 transition">
            Book puja →
          </Link>
        </div>
      </section>
    </div>
  );
}
