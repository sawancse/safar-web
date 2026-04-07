export const metadata = { title: 'Safety Resource Center | Safar' };

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-[#003B95] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold">Safety Resource Center</h1>
          <p className="mt-3 text-white/80">Your safety is our top priority.</p>
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">For Guests</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'Verified Listings', desc: 'Every listing is reviewed before going live. Look for the verified badge for extra assurance.' },
              { title: 'Secure Payments', desc: 'All payments go through Razorpay with bank-grade encryption. Never pay outside the platform.' },
              { title: 'Reviews You Can Trust', desc: 'Our double-blind review system ensures honest, unbiased feedback from real guests.' },
              { title: '24/7 Support', desc: 'Reach our support team anytime if you feel unsafe or encounter issues during your stay.' },
            ].map(item => (
              <div key={item.title} className="border rounded-xl p-5">
                <h3 className="font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">For Hosts</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'Guest Verification', desc: 'Guests verify their identity via phone OTP or government ID before booking.' },
              { title: 'Damage Protection', desc: 'Security deposits and our resolution center help protect your property.' },
              { title: 'House Rules', desc: 'Set clear house rules that guests must agree to before booking.' },
              { title: 'Instant Block', desc: 'Block problematic guests immediately and report issues to our trust & safety team.' },
            ].map(item => (
              <div key={item.title} className="border rounded-xl p-5">
                <h3 className="font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Emergency Contacts</h2>
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <p className="text-gray-700"><strong>Police:</strong> 100</p>
            <p className="text-gray-700"><strong>Women Helpline:</strong> 181</p>
            <p className="text-gray-700"><strong>Ambulance:</strong> 108</p>
            <p className="text-gray-700"><strong>Safar Emergency:</strong> <a href="mailto:safety@ysafar.com" className="text-[#003B95] hover:underline">safety@ysafar.com</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
