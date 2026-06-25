export const metadata = { title: 'Privacy Notice | BhramanKaro' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-[#003B95] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold">Privacy Notice</h1>
          <p className="mt-3 text-white/80">Last updated: June 2026</p>
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 prose prose-gray max-w-none">
        <p className="text-gray-600 leading-relaxed mb-4">This Privacy Notice explains how <strong>BhramanKaro India Pvt. Ltd.</strong> ("BhramanKaro", "we", "us") collects, uses, and protects your information across our website (bhramankaro.com) and our <strong>BhramanKaro mobile app</strong> for Android and iOS. It is published in compliance with India&apos;s Digital Personal Data Protection Act, 2023 (DPDP Act) and the Information Technology Act, 2000 and rules thereunder.</p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">1. Information We Collect</h2>
        <p className="text-gray-600 leading-relaxed mb-4">We collect information you provide directly: name, email, phone number, government ID (for KYC of hosts and service providers), payment details, and profile information. We also collect usage data, device information (device model, OS version, app version, and a device identifier), approximate and—only with your permission—precise location data, photos you choose to upload, and cookies. When you enable notifications, we collect a push notification token.</p>

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

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">8. Mobile App Permissions</h2>
        <p className="text-gray-600 leading-relaxed mb-4">The BhramanKaro mobile app requests the following device permissions, each only when needed for a feature and all optional except where essential to a task you initiate:</p>
        <ul className="text-gray-600 space-y-2 list-disc pl-5 mb-4">
          <li><strong>Camera & Photos</strong> — to take or upload photos of your property listings, profile, or KYC documents.</li>
          <li><strong>Location</strong> — to show nearby properties and prefill addresses. Precise location is used only while you use the app and only with your consent; you can decline and still use the app.</li>
          <li><strong>Notifications</strong> — to deliver booking updates, reminders, and messages.</li>
        </ul>
        <p className="text-gray-600 leading-relaxed mb-4">You can revoke any permission at any time in your device settings.</p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">9. Push Notifications</h2>
        <p className="text-gray-600 leading-relaxed mb-4">With your consent, we send push notifications via Google Firebase Cloud Messaging (Android) and Apple Push Notification service (iOS) for booking confirmations, payment reminders, messages, and service updates. We store a push token tied to your account so we can reach your device. You can turn notifications off in your device settings at any time.</p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">10. Account & Data Deletion</h2>
        <p className="text-gray-600 leading-relaxed mb-4">You can delete your account and associated personal data at any time. In the app or website, go to <strong>Profile &rarr; Settings &rarr; Delete Account</strong>, or email <a href="mailto:privacy@bhramankaro.com" className="text-[#003B95] hover:underline">privacy@bhramankaro.com</a> from your registered address with the subject &ldquo;Delete my account&rdquo;. We will action verified requests within 30 days. Certain records (e.g. completed booking and transaction records) may be retained for up to 7 years where required for tax, accounting, or legal compliance, after which they are deleted.</p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">11. Children&apos;s Privacy</h2>
        <p className="text-gray-600 leading-relaxed mb-4">BhramanKaro is not directed to children under 18, and we do not knowingly collect personal data from children. If you believe a child has provided us personal data, contact us and we will delete it.</p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">12. Contact &amp; Grievance Officer</h2>
        <p className="text-gray-600 leading-relaxed">For privacy-related queries or to exercise your rights, contact our Data Protection / Grievance Officer at <a href="mailto:privacy@bhramankaro.com" className="text-[#003B95] hover:underline">privacy@bhramankaro.com</a>. BhramanKaro India Pvt. Ltd., India. We respond to grievances within the timelines prescribed under applicable Indian law.</p>
      </div>
    </div>
  );
}
