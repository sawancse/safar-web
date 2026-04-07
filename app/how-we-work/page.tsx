export const metadata = { title: 'How We Work | Safar' };

export default function HowWeWorkPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-[#003B95] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold">How We Work</h1>
          <p className="mt-3 text-white/80">Transparent, fair, and built for India.</p>
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Zero Commission Model</h2>
          <p className="text-gray-600 leading-relaxed">Traditional platforms charge 15-20% per booking. Safar charges hosts a flat monthly subscription instead. This means hosts earn more and can offer better prices to guests.</p>
          <div className="grid sm:grid-cols-4 gap-4 mt-6">
            {[
              { tier: 'Starter', rate: '18%', fee: '999' },
              { tier: 'Pro', rate: '12%', fee: '2,499' },
              { tier: 'Commercial', rate: '10%', fee: '3,999' },
              { tier: 'Aashray', rate: '0%', fee: 'Free' },
            ].map(t => (
              <div key={t.tier} className="border rounded-xl p-4 text-center">
                <p className="font-bold text-[#003B95]">{t.tier}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{t.rate}</p>
                <p className="text-xs text-gray-500">commission</p>
                <p className="text-sm font-medium text-gray-600 mt-2">Rs {t.fee}/mo</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Verification Process</h2>
          <p className="text-gray-600 leading-relaxed">Every listing goes through our verification process before going live. We check photos, amenities, location accuracy, and host identity (KYC). Verified listings earn a badge and rank higher in search.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Search & Ranking</h2>
          <p className="text-gray-600 leading-relaxed">Our search is powered by Elasticsearch with smart query parsing. Listings are ranked by relevance, rating, response rate, and recency. We do not boost listings based on payment — ranking is merit-based.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Payments & Payouts</h2>
          <p className="text-gray-600 leading-relaxed">Guest payments are processed via Razorpay and held securely. Host payouts are transferred after guest check-in. We support UPI, bank transfers, credit/debit cards, and net banking.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">AI & Automation</h2>
          <p className="text-gray-600 leading-relaxed">Our AI Autopilot helps hosts with dynamic pricing, automated responses, listing optimization, and calendar management. All AI features are optional and can be toggled from the host dashboard.</p>
        </section>
      </div>
    </div>
  );
}
