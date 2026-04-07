import Link from 'next/link';

export const metadata = { title: 'Help Center | Safar' };

export default function HelpPage() {
  const faqs = [
    { q: 'How do I book a stay?', a: 'Search for your destination, select dates and guests, choose a listing, and complete payment. You will receive a confirmation email and can manage your booking from your dashboard.' },
    { q: 'How do I cancel a booking?', a: 'Go to Dashboard > Bookings, select the booking, and click Cancel. Refund amount depends on the listing\'s cancellation policy. Refunds are processed within 5-10 business days.' },
    { q: 'What payment methods are accepted?', a: 'We accept UPI, credit/debit cards, net banking, and wallets through Razorpay. All transactions are secured with bank-grade encryption.' },
    { q: 'How does the zero-commission model work?', a: 'Hosts pay a flat monthly subscription (starting at Rs 999/month) instead of per-booking commission. This means hosts keep 100% of their booking earnings.' },
    { q: 'How do I list my property?', a: 'Click "List your space" or go to the Host section. Complete the listing wizard with photos, pricing, and amenities. Our team will verify your listing before it goes live.' },
    { q: 'How do I book a cook or chef?', a: 'Visit the Cooks section, browse by city, cuisine, or occasion. Select a cook, choose your date and menu, and complete the booking.' },
    { q: 'What is Aashray?', a: 'Aashray is our social initiative providing free and subsidised stays for people in need — disaster relief, medical patients, and underprivileged travellers. Hosts can donate nights and donors receive 80G tax certificates.' },
    { q: 'How do reviews work?', a: 'Both guests and hosts can leave reviews after checkout. Reviews use a double-blind system — both are hidden until both parties submit or 14 days pass. Ratings are on a 1-5 star scale.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-[#003B95] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold">Help Center</h1>
          <p className="mt-3 text-white/80">Find answers to common questions.</p>
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {[
            { label: 'Manage Bookings', href: '/dashboard/bookings', icon: '📋' },
            { label: 'Contact Support', href: 'mailto:support@ysafar.com', icon: '💬' },
            { label: 'Host Help', href: '/host', icon: '🏠' },
          ].map(item => (
            <Link key={item.label} href={item.href}
              className="flex items-center gap-3 p-5 border rounded-xl hover:shadow-md hover:border-[#003B95]/30 transition">
              <span className="text-2xl">{item.icon}</span>
              <span className="font-semibold text-gray-900">{item.label}</span>
            </Link>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="border rounded-xl p-5 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                {faq.q}
                <span className="text-gray-400 group-open:rotate-180 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </span>
              </summary>
              <p className="text-gray-600 mt-3 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 rounded-xl p-6 text-center">
          <p className="text-gray-700 font-medium">Still need help?</p>
          <p className="text-sm text-gray-500 mt-1">Email us at <a href="mailto:support@ysafar.com" className="text-[#003B95] hover:underline">support@ysafar.com</a> and we'll get back to you within 24 hours.</p>
        </div>
      </div>
    </div>
  );
}
