import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PUJAS, OCCASIONS, pujasForOccasion, type PujaService } from '../catalog';

const INR = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;

export function generateStaticParams() {
  return PUJAS.map(p => ({ puja: p.key }));
}

function findPuja(key: string): PujaService | undefined {
  return PUJAS.find(p => p.key === key);
}

export function generateMetadata({ params }: { params: { puja: string } }): Metadata {
  const puja = findPuja(params.puja);
  if (!puja) return { title: 'Puja not found' };
  const title = `${puja.label} — Book a Verified Pandit | BhramanKaro`;
  const description = `Book ${puja.label} online from ${INR(puja.pricePaise)}. Samagri kit included, Vedic-certified pandit, 11 languages. ${puja.inclusions.slice(0, 3).join(', ')}.`;
  return {
    title,
    description,
    openGraph: { title, description, images: puja.photoUrl ? [puja.photoUrl] : undefined },
    alternates: { canonical: `/services/pandit/${puja.key}` },
  };
}

// Per-puja FAQ — shared base + a couple of puja-specific lines.
function faqFor(puja: PujaService) {
  return [
    { q: `What is included in ${puja.label}?`, a: `${puja.inclusions.join('. ')}. The full samagri kit is included in the service charge.` },
    { q: 'Is the samagri (puja kit) included?', a: `Yes. This puja ships with: ${puja.samagri.join(', ')}.` },
    { q: 'How long does it take?', a: `${puja.label} typically runs about ${puja.durationHours} hour${puja.durationHours > 1 ? 's' : ''}. The pandit arrives at your chosen slot, ready to begin.` },
    { q: 'What about dakshina?', a: `Dakshina is a traditional donation to the pandit, separate from the service charge. We recommend about ${INR(puja.recommendedDakshinaPaise)} for this puja, paid in cash on the day.` },
    { q: 'Which languages are available?', a: 'Hindi, Sanskrit, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Odia and Punjabi. Pick your preferred language while booking.' },
  ];
}

export default function PujaDetailPage({ params }: { params: { puja: string } }) {
  const puja = findPuja(params.puja);
  if (!puja) notFound();

  const occasion = OCCASIONS.find(o => o.key === puja.tags[0]);
  const related = pujasForOccasion(puja.tags[0]).filter(p => p.key !== puja.key).slice(0, 3);
  const faq = faqFor(puja);
  const bookHref = `/services/pandit/order?puja=${puja.key}`;

  // JSON-LD for SEO (Product + FAQ)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: puja.label,
        image: puja.photoUrl,
        description: `${puja.label} performed at home by a Vedic-certified pandit. Samagri kit included.`,
        brand: { '@type': 'Brand', name: 'BhramanKaro' },
        offers: {
          '@type': 'Offer',
          price: (puja.pricePaise / 100).toFixed(0),
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
        },
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
          <Link href="/services" className="hover:text-orange-500">Services</Link>
          <span>›</span>
          <Link href="/services/pandit" className="hover:text-orange-500">Pandit / Puja</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">{puja.label}</span>
        </div>
      </div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-8 sm:py-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="relative aspect-video md:aspect-square rounded-3xl overflow-hidden shadow-xl bg-gradient-to-br from-amber-100 via-orange-100 to-red-100 flex items-center justify-center">
          <span className="text-7xl opacity-40">🪔</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={puja.photoUrl} alt={puja.label} className="absolute inset-0 w-full h-full object-cover" />
          <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full ${puja.tier === 'LUXURY' ? 'bg-purple-600 text-white' : puja.tier === 'PREMIUM' ? 'bg-amber-500 text-white' : 'bg-white/95 text-gray-700'}`}>
            {puja.tier}
          </span>
        </div>

        <div>
          {occasion && (
            <Link href={`/services/pandit#gallery`} className="text-xs font-semibold tracking-[0.2em] text-orange-600 uppercase hover:underline">
              {occasion.icon} {occasion.label}
            </Link>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 leading-tight">{puja.label}</h1>

          <div className="mt-4 flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-900">{INR(puja.pricePaise)}</span>
            <span className="text-sm text-gray-500 mb-1">+ GST · service charge</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">≈ {puja.durationHours}h · recommended dakshina {INR(puja.recommendedDakshinaPaise)} (cash, on the day)</p>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-700">
            <span>✓ Samagri kit included</span>
            <span>✓ Vedic-certified pandit</span>
            <span>✓ 11 languages</span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={bookHref} className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-7 py-3 text-sm font-bold shadow-lg shadow-orange-600/25 transition">
              Book this puja →
            </Link>
            <a href="tel:7367034295" className="bg-white border border-gray-200 text-gray-800 rounded-full px-6 py-3 text-sm font-semibold hover:bg-gray-50 transition">
              Call to confirm
            </a>
          </div>

          {/* Inclusions */}
          <div className="mt-8">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">What's included</h2>
            <ul className="mt-3 space-y-1.5">
              {puja.inclusions.map(i => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-orange-500 mt-0.5">✓</span> {i}
                </li>
              ))}
            </ul>
          </div>

          {/* Samagri */}
          <div className="mt-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Samagri kit</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {puja.samagri.map(s => (
                <span key={s} className="text-xs bg-amber-50 text-amber-800 rounded-full px-2.5 py-1">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="bg-gray-50 border-y">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h2 className="text-xl font-bold text-gray-900">About {puja.label}</h2>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">
            {puja.label} is conducted at your home by an experienced, Vedic-certified pandit who performs the
            rituals following authentic shastra procedures{occasion ? ` for your ${occasion.label.toLowerCase()}` : ''}.
            The full samagri kit is arranged and brought to you — there is nothing to source yourself. You can choose
            your preferred language and share your gotra and family names so the sankalp is personalised. Book online,
            our team confirms the details on a call, and the pandit arrives on time at your chosen slot.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently asked</h2>
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

      {/* Related */}
      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-14">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Related pujas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map(p => (
              <Link key={p.key} href={`/services/pandit/${p.key}`} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-orange-200 transition-all">
                <div className="aspect-video overflow-hidden relative bg-gradient-to-br from-amber-100 to-red-100 flex items-center justify-center">
                  <span className="text-5xl opacity-40">🪔</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.photoUrl} alt={p.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <p className="font-bold text-gray-900">{p.label}</p>
                  <p className="text-sm mt-1"><span className="text-gray-400">from </span><span className="font-bold text-gray-900">{INR(p.pricePaise)}</span></p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t shadow-xl p-3 md:hidden z-30 flex items-center gap-3">
        <div className="text-sm font-bold text-gray-900">{INR(puja.pricePaise)}</div>
        <Link href={bookHref} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-center rounded-xl py-3 text-sm font-bold transition">
          Book this puja →
        </Link>
      </div>
    </div>
  );
}
