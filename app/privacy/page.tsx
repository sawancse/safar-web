export const metadata = { title: 'Privacy Notice | Safar' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-[#003B95] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold">Privacy Notice</h1>
          <p className="mt-3 text-white/80">Last updated: April 2026</p>
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 prose prose-gray max-w-none">
        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">1. Information We Collect</h2>
        <p className="text-gray-600 leading-relaxed mb-4">We collect information you provide directly: name, email, phone number, government ID (for KYC), payment details, and profile information. We also collect usage data, device information, location data (when permitted), and cookies.</p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">2. How We Use Your Information</h2>
        <ul className="text-gray-600 space-y-2 list-disc pl-5 mb-4">
          <li>To provide and improve our services — booking stays, connecting with hosts, processing payments</li>
          <li>To verify your identity (KYC) and prevent fraud</li>
          <li>To send booking confirmations, reminders, and important service updates</li>
          <li>To personalise your experience with recommendations and search results</li>
          <li>To comply with legal obligations under Indian law</li>
        </ul>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">3. Data Sharing</h2>
        <p className="text-gray-600 leading-relaxed mb-4">We share your information with hosts (for bookings), payment processors (Razorpay), cloud infrastructure providers (AWS), and communication services (for OTP and notifications). We do not sell your personal data to third parties.</p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">4. Data Security</h2>
        <p className="text-gray-600 leading-relaxed mb-4">We use AES-256-GCM encryption for sensitive personal information, secure HTTPS connections, and follow industry-standard security practices. Payment data is handled by PCI-DSS compliant processors.</p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">5. Data Retention</h2>
        <p className="text-gray-600 leading-relaxed mb-4">We retain your data for as long as your account is active. Booking records are retained for 7 years for tax and legal compliance. You can request deletion of your account and personal data at any time.</p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">6. Your Rights</h2>
        <ul className="text-gray-600 space-y-2 list-disc pl-5 mb-4">
          <li>Access your personal data</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of your data</li>
          <li>Withdraw consent for data processing</li>
          <li>Port your data to another service</li>
        </ul>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">7. Cookies</h2>
        <p className="text-gray-600 leading-relaxed mb-4">We use essential cookies for authentication and session management, and analytics cookies (Google Analytics) to understand usage patterns. You can manage cookie preferences in your browser settings.</p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">8. Contact</h2>
        <p className="text-gray-600 leading-relaxed">For privacy-related queries, contact our Data Protection Officer at <a href="mailto:privacy@ysafar.com" className="text-[#003B95] hover:underline">privacy@ysafar.com</a>.</p>
      </div>
    </div>
  );
}
