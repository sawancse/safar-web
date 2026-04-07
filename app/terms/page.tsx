export const metadata = { title: 'Terms of Service | Safar' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-[#003B95] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold">Terms of Service</h1>
          <p className="mt-3 text-white/80">Last updated: April 2026</p>
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">1. Acceptance of Terms</h2>
        <p className="text-gray-600 leading-relaxed mb-4">By accessing or using Safar (ysafar.com), you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">2. Platform Description</h2>
        <p className="text-gray-600 leading-relaxed mb-4">Safar is a marketplace that connects property hosts with travellers. We facilitate bookings but are not a party to the rental agreement between hosts and guests. Safar also offers cook/chef bookings, experiences, and value-added services.</p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">3. User Accounts</h2>
        <p className="text-gray-600 leading-relaxed mb-4">You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your credentials. You must be at least 18 years old to use our services.</p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">4. Bookings & Payments</h2>
        <ul className="text-gray-600 space-y-2 list-disc pl-5 mb-4">
          <li>All prices are displayed in Indian Rupees (INR) and include applicable taxes unless stated otherwise</li>
          <li>Payments are processed securely through Razorpay</li>
          <li>Cancellation policies vary by listing and are displayed before booking</li>
          <li>Refunds are processed within 5-10 business days to the original payment method</li>
        </ul>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">5. Host Responsibilities</h2>
        <p className="text-gray-600 leading-relaxed mb-4">Hosts must ensure their listings are accurate, properties are safe and clean, and they comply with local laws and regulations. Hosts are responsible for paying applicable taxes on their earnings.</p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">6. Guest Responsibilities</h2>
        <p className="text-gray-600 leading-relaxed mb-4">Guests must treat properties with respect, follow house rules, and report any damage. Guests are liable for damage caused during their stay.</p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">7. Reviews</h2>
        <p className="text-gray-600 leading-relaxed mb-4">Reviews must be honest and based on actual experiences. We use a double-blind review system — both reviews are hidden until both parties submit or the 14-day deadline passes. Fake or malicious reviews will be removed.</p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">8. Intellectual Property</h2>
        <p className="text-gray-600 leading-relaxed mb-4">All content on Safar, including design, logos, and text, is owned by Safar India Pvt. Ltd. Users retain ownership of content they upload but grant Safar a licence to display it on the platform.</p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">9. Limitation of Liability</h2>
        <p className="text-gray-600 leading-relaxed mb-4">Safar acts as a marketplace and is not liable for the actions of hosts, guests, cooks, or other service providers. Our liability is limited to the fees paid for the specific transaction in question.</p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">10. Governing Law</h2>
        <p className="text-gray-600 leading-relaxed mb-4">These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Hyderabad, Telangana.</p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">11. Contact</h2>
        <p className="text-gray-600 leading-relaxed">For questions about these terms, contact <a href="mailto:legal@ysafar.com" className="text-[#003B95] hover:underline">legal@ysafar.com</a>.</p>
      </div>
    </div>
  );
}
