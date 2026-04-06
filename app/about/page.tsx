import Link from 'next/link';

export const metadata = { title: 'About Safar | India\'s Zero-Commission Stay Platform' };

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-[#003B95] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold">About Safar</h1>
          <p className="mt-3 text-white/80 text-lg">India's first zero-commission property rental marketplace.</p>
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed">
            Safar was built with a simple belief: property hosts should keep 100% of what they earn. Unlike traditional platforms that charge 15-20% commission per booking, Safar operates on a flat monthly subscription model. This means more money for hosts and better prices for travellers.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">What We Offer</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: 'Stays', desc: 'Homes, hotels, villas, PGs, hostels, resorts and more across 50+ Indian cities.' },
              { title: 'Cooks & Chefs', desc: 'Hire verified home cooks for daily meals or professional chefs for events and parties.' },
              { title: 'Experiences', desc: 'Curated local experiences — food tours, heritage walks, adventure activities and more.' },
              { title: 'Value-Added Services', desc: 'Sale agreements, home loans, legal services, and interior design — all in one place.' },
              { title: 'Aashray', desc: 'Free and subsidised stays for those in need, powered by host generosity and NGO partnerships.' },
              { title: 'Property Buy/Sell', desc: 'Explore properties for sale, new builder projects, and connect directly with sellers.' },
            ].map(item => (
              <div key={item.title} className="border rounded-xl p-5">
                <h3 className="font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Numbers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { val: '50+', label: 'Cities' },
              { val: '10,000+', label: 'Listings' },
              { val: '500+', label: 'Verified Cooks' },
              { val: '4.8', label: 'Avg Rating' },
            ].map(s => (
              <div key={s.label} className="text-center bg-blue-50 rounded-xl p-5">
                <p className="text-2xl font-bold text-[#003B95]">{s.val}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Contact Us</h2>
          <p className="text-gray-600">
            Email: <a href="mailto:hello@ysafar.com" className="text-[#003B95] hover:underline">hello@ysafar.com</a><br />
            Support: <a href="mailto:support@ysafar.com" className="text-[#003B95] hover:underline">support@ysafar.com</a><br />
            Website: <a href="https://ysafar.com" className="text-[#003B95] hover:underline">ysafar.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}
