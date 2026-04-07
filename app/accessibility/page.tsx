export const metadata = { title: 'Accessibility Statement | Safar' };

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-[#003B95] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold">Accessibility Statement</h1>
          <p className="mt-3 text-white/80">Making Safar usable for everyone.</p>
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Our Commitment</h2>
          <p className="text-gray-600 leading-relaxed">Safar is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying relevant accessibility standards.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Standards</h2>
          <p className="text-gray-600 leading-relaxed">We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. These guidelines explain how to make web content more accessible to people with a wide range of disabilities.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">What We Do</h2>
          <ul className="text-gray-600 space-y-2 list-disc pl-5">
            <li>Semantic HTML for screen reader compatibility</li>
            <li>Keyboard navigation support across all pages</li>
            <li>Sufficient colour contrast ratios for text readability</li>
            <li>Alt text for meaningful images</li>
            <li>Responsive design that works across devices and zoom levels</li>
            <li>Form labels and error messages for assisted input</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Accessible Stays</h2>
          <p className="text-gray-600 leading-relaxed">Our search filters include accessibility features so you can find properties with wheelchair access, step-free entry, wide doorways, accessible bathrooms, and other features. Look for the "Accessibility" filter section when searching.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Feedback</h2>
          <p className="text-gray-600 leading-relaxed">We welcome your feedback on the accessibility of Safar. If you encounter any barriers, please contact us at <a href="mailto:accessibility@ysafar.com" className="text-[#003B95] hover:underline">accessibility@ysafar.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
