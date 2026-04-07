export const metadata = { title: 'Sustainability | Safar' };

export default function SustainabilityPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-[#003B95] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold">Sustainability</h1>
          <p className="mt-3 text-white/80">Building a responsible travel ecosystem for India.</p>
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Approach</h2>
          <p className="text-gray-600 leading-relaxed">Safar is committed to promoting sustainable travel in India. We believe that technology can help reduce the environmental impact of tourism while empowering local communities.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Initiatives</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { title: 'Aashray Program', desc: 'Free stays for disaster relief, medical patients, and underprivileged travellers. Hosts donate nights, donors get 80G tax certificates.', icon: '🤝' },
              { title: 'Local Experiences', desc: 'We promote locally-run experiences — food tours, craft workshops, heritage walks — keeping tourism revenue in the community.', icon: '🌍' },
              { title: 'Farm Stays', desc: 'Our farm stay category encourages agritourism, supporting rural livelihoods and helping travellers connect with nature.', icon: '🌾' },
              { title: 'Eco-Friendly Listings', desc: 'Hosts can highlight eco-friendly amenities — solar power, rainwater harvesting, organic toiletries — helping conscious travellers choose better.', icon: '♻️' },
              { title: 'Zero Commission for NGOs', desc: 'Aashray-tier listings for NGOs and social organisations are completely free — no subscription, no commission.', icon: '💚' },
              { title: 'Digital-First Operations', desc: 'Paperless bookings, digital agreements with e-stamp, and online KYC reduce our operational footprint.', icon: '📱' },
            ].map(item => (
              <div key={item.title} className="border rounded-xl p-5">
                <span className="text-2xl">{item.icon}</span>
                <h3 className="font-bold text-gray-900 mt-2">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Goals</h2>
          <ul className="text-gray-600 space-y-2 list-disc pl-5">
            <li>Partner with 100+ eco-certified properties by 2027</li>
            <li>Facilitate 10,000 Aashray nights per year</li>
            <li>Carbon offset programme for long-distance bookings (upcoming)</li>
            <li>Promote homestays and community-based tourism across Tier 2 and Tier 3 cities</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
