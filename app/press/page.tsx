export const metadata = { title: 'Press Center | Safar' };

export default function PressPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-[#003B95] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold">Press Center</h1>
          <p className="mt-3 text-white/80">News, updates, and media resources from Safar.</p>
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">About Safar</h2>
          <p className="text-gray-600 leading-relaxed">Safar is India's first zero-commission property rental marketplace. Founded in 2026, we connect travellers with verified stays, home cooks, and local experiences across 50+ Indian cities. Our mission is to make travel fair for hosts and affordable for guests.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Facts</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: 'Founded', value: '2026' },
              { label: 'Headquarters', value: 'Hyderabad, India' },
              { label: 'Model', value: 'Zero commission, subscription-based' },
              { label: 'Categories', value: 'Stays, Cooks, Experiences, Property Sales, VAS' },
              { label: 'Cities', value: '50+ across India' },
              { label: 'Platform', value: 'Web, iOS, Android' },
            ].map(item => (
              <div key={item.label} className="flex gap-3 border rounded-xl p-4">
                <span className="text-sm font-bold text-[#003B95] min-w-[100px]">{item.label}</span>
                <span className="text-sm text-gray-600">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Updates</h2>
          <div className="space-y-4">
            {[
              { date: 'April 2026', title: 'Safar launches Cooks & Chefs marketplace', desc: 'Hire verified home cooks and event caterers directly through the platform.' },
              { date: 'March 2026', title: 'Aashray Phase 2: 80G donations & gift certificates', desc: 'Donors can now receive tax certificates and send gift certificates to beneficiaries.' },
              { date: 'March 2026', title: 'Platform goes live on ysafar.com', desc: 'All 12 microservices deployed on AWS ECS with full production infrastructure.' },
              { date: 'March 2026', title: 'Value-Added Services launch', desc: 'Sale agreements, home loans, legal services, and interior design now available.' },
            ].map(item => (
              <div key={item.title} className="border rounded-xl p-5">
                <p className="text-xs text-[#003B95] font-semibold">{item.date}</p>
                <h3 className="font-bold text-gray-900 mt-1">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Media Contact</h2>
          <p className="text-gray-600">For press inquiries, interviews, or media resources:</p>
          <p className="text-gray-600 mt-2">
            <a href="mailto:press@ysafar.com" className="text-[#003B95] hover:underline font-medium">press@ysafar.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}
