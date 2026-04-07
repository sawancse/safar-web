'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function LeadCapturePopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if: already dismissed, already submitted, or user is logged in
    const alreadyShown = sessionStorage.getItem('lead_popup_shown');
    const alreadySubmitted = localStorage.getItem('lead_submitted');
    const token = localStorage.getItem('token');

    if (alreadyShown || alreadySubmitted || token) return;

    // Show after 30 seconds of browsing
    const timer = setTimeout(() => {
      setShow(true);
      sessionStorage.setItem('lead_popup_shown', '1');
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  if (!show || dismissed) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/v1/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          city: city || undefined,
          source: 'WEBSITE_POPUP',
        }),
      });
      setSubmitted(true);
      localStorage.setItem('lead_submitted', '1');
      setTimeout(() => { setShow(false); setDismissed(true); }, 3000);
    } catch {
      // Silently fail — don't block user
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in"
      onClick={() => { setDismissed(true); setShow(false); }}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-[#003B95] px-6 py-5 relative">
          <button onClick={() => { setDismissed(true); setShow(false); }}
            className="absolute top-3 right-3 text-white/50 hover:text-white text-xl">&times;</button>
          <p className="text-[#FFB700] text-sm font-bold uppercase tracking-wide">Exclusive Deals</p>
          <h3 className="text-white text-xl font-bold mt-1">Get 10% off your first stay</h3>
          <p className="text-white/70 text-sm mt-1">Join 50,000+ travellers getting the best deals in India</p>
        </div>

        {submitted ? (
          <div className="px-6 py-8 text-center">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-lg font-bold text-gray-900">You're in!</p>
            <p className="text-sm text-gray-500 mt-1">Watch your inbox for exclusive deals.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#003B95]/30 focus:border-[#003B95]"
              />
            </div>
            <div>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#003B95]/30 text-gray-700"
              >
                <option value="">Select your city (optional)</option>
                {['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Goa', 'Jaipur', 'Kochi'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#003B95] text-white font-semibold py-3 rounded-xl hover:bg-[#00296b] transition disabled:opacity-50">
              {loading ? 'Subscribing...' : 'Get My 10% Off'}
            </button>
            <p className="text-[10px] text-gray-400 text-center">
              No spam. Unsubscribe anytime. By subscribing you agree to our <a href="/privacy" className="underline">privacy policy</a>.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
