'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';

const DEV_MOCK_PAYMENT = process.env.NEXT_PUBLIC_MOCK_PAYMENT === 'true';

declare global {
  interface Window { Razorpay: any }
}

/* ── Amount presets with impact labels (Ketto/UNHCR pattern) ─── */
const PRESET_AMOUNTS = [
  { amount: 500,   label: '1 night of shelter',   popular: false },
  { amount: 1000,  label: '2 nights of shelter',  popular: false },
  { amount: 2500,  label: '1 week of shelter',    popular: true  },
  { amount: 5000,  label: '2 weeks of shelter',   popular: false },
  { amount: 10000, label: '1 month of shelter',   popular: false },
  { amount: 25000, label: '3 months of shelter',  popular: false },
];

const IMPACT_TIERS = [
  { amount: 500,   label: '1 night of safe shelter',       icon: '🛏️' },
  { amount: 2500,  label: '1 week in a safe home',         icon: '🏠' },
  { amount: 10000, label: '1 full month of housing',       icon: '🏡' },
  { amount: 25000, label: '3 months — a fresh start',      icon: '💛' },
];

const FUND_USAGE = [
  { pct: 70, label: 'Rent & Deposits',     desc: 'Paid directly to Aashray hosts', color: 'bg-teal-500' },
  { pct: 15, label: 'Essential Supplies',   desc: 'Bedding, kitchenware, furnishings', color: 'bg-blue-500' },
  { pct: 10, label: 'Case Worker Support',  desc: 'NGO coordination & matching', color: 'bg-amber-500' },
  { pct: 5,  label: 'Platform Operations',  desc: 'Tech, verification, processing', color: 'bg-gray-400' },
];

const DONOR_TIERS = [
  { min: 500,   name: 'Shelter Friend',    badge: '🤝' },
  { min: 2000,  name: 'Shelter Builder',   badge: '🔨' },
  { min: 5000,  name: 'Shelter Champion',  badge: '🏆' },
  { min: 15000, name: 'Shelter Patron',    badge: '👑' },
];

const TRUST_BADGES = [
  { icon: '🛡️', label: '80G Certified' },
  { icon: '✓',  label: 'NGO Verified' },
  { icon: '📊', label: 'Transparent Finances' },
  { icon: '🔒', label: 'Razorpay Secure' },
];

const STORIES = [
  {
    name: 'Amina & Family',
    origin: 'Afghan refugee, Delhi',
    quote: 'After 2 years in a cramped shared room, Aashray helped us find a real home. My children can finally study in peace.',
    months: 6,
    before: 'Shared 1 room with 5 family members',
    after: '2BHK apartment near children\'s school',
  },
  {
    name: 'Tenzin Dorje',
    origin: 'Tibetan refugee, Dharamshala',
    quote: 'The host family treats us like their own. For the first time in years, I feel safe.',
    months: 4,
    before: 'Temporary camp, no running water',
    after: 'Furnished room with kitchen access',
  },
  {
    name: 'Roshni & daughters',
    origin: 'Climate displaced, Assam',
    quote: 'Floods took our house twice. Safar Aashray gave us stability while we rebuild our lives.',
    months: 3,
    before: 'Government relief camp',
    after: 'Private room in host\'s home',
  },
];

type DonationStats = {
  totalRaisedPaise: number;
  goalPaise: number;
  totalDonors: number;
  familiesHoused: number;
  monthlyDonors: number;
  progressPercent: number;
  activeCampaign: string | null;
  campaignTagline: string | null;
  recentDonors: { name: string; amountPaise: number; city: string | null; minutesAgo: number }[];
};

export default function AashrayDonatePage() {
  const [selectedAmount, setSelectedAmount] = useState(2500);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPan, setDonorPan] = useState('');
  const [isMonthly, setIsMonthly] = useState(false);
  const [dedicatedTo, setDedicatedTo] = useState('');
  const [showDedication, setShowDedication] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [donationResult, setDonationResult] = useState<any>(null);
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [tickerIdx, setTickerIdx] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);

  const effectiveAmount = isCustom ? parseInt(customAmount) || 0 : selectedAmount;
  const taxSaving = Math.round(effectiveAmount * 0.5);
  const donorTier = [...DONOR_TIERS].reverse().find(t => effectiveAmount >= t.min);

  // Fetch live stats
  useEffect(() => {
    api.getDonationStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  // Recent donor ticker rotation
  useEffect(() => {
    if (!stats?.recentDonors?.length) return;
    const interval = setInterval(() => {
      setTickerIdx(i => (i + 1) % stats.recentDonors.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [stats?.recentDonors]);

  async function loadRazorpay() {
    if (window.Razorpay) return;
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay'));
      document.body.appendChild(script);
    });
  }

  async function handleDonate() {
    if (effectiveAmount < 100) return;

    if (DEV_MOCK_PAYMENT) {
      setLoading(true);
      await new Promise(r => setTimeout(r, 1500));
      setDonationResult({ receiptNumber: '80G-MOCK-001', donationRef: 'DON-MOCK-001' });
      setSubmitted(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || undefined;

      // Step 1: Create donation order on backend
      const order = await api.createDonation({
        amountPaise: effectiveAmount * 100,
        frequency: isMonthly ? 'MONTHLY' : 'ONE_TIME',
        donorName: donorName || undefined,
        donorEmail: donorEmail || undefined,
        donorPan: donorPan || undefined,
        dedicatedTo: dedicatedTo || undefined,
      }, token);

      // Step 2: Open Razorpay checkout
      await loadRazorpay();

      const rzpOptions: any = {
        key: order.razorpayKeyId,
        amount: order.amountPaise,
        currency: 'INR',
        name: 'Safar Aashray',
        description: isMonthly ? 'Monthly Aashray SIP' : 'Aashray Donation',
        ...(order.razorpayOrderId ? { order_id: order.razorpayOrderId } : {}),
        ...(order.razorpaySubscriptionId ? { subscription_id: order.razorpaySubscriptionId } : {}),
        handler: async (response: any) => {
          try {
            // Step 3: Verify payment
            const result = await api.verifyDonation({
              razorpayOrderId: response.razorpay_order_id || order.razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }, token);
            setDonationResult(result);
            setSubmitted(true);
          } catch {
            setError('Payment verification failed. Please contact support.');
          }
          setLoading(false);
        },
        prefill: {
          ...(donorName ? { name: donorName } : {}),
          ...(donorEmail ? { email: donorEmail } : {}),
        },
        theme: { color: '#0d9488' },
        modal: {
          ondismiss: () => setLoading(false),
        },
        // UPI preferred order (India-first)
        config: {
          display: {
            preferences: { show_default_blocks: true },
            blocks: {
              utib: { name: 'Pay via UPI', instruments: [{ method: 'upi' }] },
            },
            sequence: ['block.utib'],
          },
        },
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.on('payment.failed', (resp: any) => {
        setError(resp.error?.description || 'Payment failed. Please try again.');
        setLoading(false);
      });
      rzp.open();
    } catch (e: any) {
      setError(e.message || 'Failed to initiate payment');
      setLoading(false);
    }
  }

  // ── Thank You Screen ───────────────────────────────────────
  if (submitted) {
    const whatsappMsg = encodeURIComponent(
      `I just donated ${'\u20B9'}${effectiveAmount.toLocaleString('en-IN')} to help house a displaced family through Safar Aashray. You can too: https://www.ysafar.com/aashray/donate`
    );
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          {/* Confetti-like dots */}
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 flex items-center justify-center text-6xl animate-bounce">🙏</div>
            <div className="absolute -top-2 -left-2 w-3 h-3 bg-teal-400 rounded-full animate-ping" />
            <div className="absolute -top-1 -right-3 w-2 h-2 bg-amber-400 rounded-full animate-ping delay-75" />
            <div className="absolute -bottom-2 left-1 w-2.5 h-2.5 bg-blue-400 rounded-full animate-ping delay-150" />
          </div>

          <h1 className="text-3xl font-bold mb-2">Thank You{donorName ? `, ${donorName.split(' ')[0]}` : ''}!</h1>

          {donorTier && (
            <div className="inline-block bg-teal-100 text-teal-700 rounded-full px-4 py-1 text-sm font-semibold mb-3">
              {donorTier.badge} {donorTier.name}
            </div>
          )}

          <p className="text-gray-500 mb-1">
            Your contribution of <span className="font-bold text-teal-600">{'\u20B9'}{effectiveAmount.toLocaleString('en-IN')}</span>
            {isMonthly ? '/month' : ''} will help provide shelter to displaced families.
          </p>

          {donationResult?.receiptNumber && (
            <p className="text-sm text-gray-400 mb-2">
              80G Receipt: <span className="font-mono font-semibold text-gray-600">{donationResult.receiptNumber}</span>
            </p>
          )}

          {donorEmail && (
            <p className="text-sm text-gray-400 mb-6">
              Confirmation and tax receipt will be emailed to <span className="font-medium">{donorEmail}</span>
            </p>
          )}

          {/* WhatsApp share & Certificate */}
          <div className="flex flex-wrap gap-3 justify-center mb-4">
          <a
            href={`https://wa.me/?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition text-sm"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Share on WhatsApp
          </a>
          <Link
            href={`/aashray/donate/certificate?ref=${donationResult?.donationRef || ''}&name=${encodeURIComponent(donorName)}&amount=${effectiveAmount}&to=${encodeURIComponent(dedicatedTo)}&receipt=${donationResult?.receiptNumber || ''}`}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Certificate
          </Link>
          </div>

          <div className="flex gap-3 justify-center mt-2">
            <Link href="/aashray"
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm">
              Back to Aashray
            </Link>
            <Link href="/"
              className="border border-gray-300 text-gray-700 font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-50 transition text-sm">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6TTAgMzR2Mkgydi0ySDEweiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-block bg-white/20 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            Safar Aashray — Fund a Stay
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Give the gift of shelter
          </h1>
          <p className="text-lg text-orange-100 mb-4 max-w-2xl mx-auto">
            Your donation directly funds safe housing for displaced families across India.
            {isMonthly
              ? ` ${'\u20B9'}${effectiveAmount.toLocaleString('en-IN')}/month = ${'\u20B9'}${(effectiveAmount * 12).toLocaleString('en-IN')}/year of impact.`
              : ' Every rupee goes towards rent, deposits, and essential supplies.'}
          </p>

          {/* Trust badge strip */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {TRUST_BADGES.map(b => (
              <span key={b.label} className="flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-full px-3 py-1 text-xs font-medium">
                <span>{b.icon}</span> {b.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Progress bar + social proof */}
      {stats && (
        <section className="max-w-5xl mx-auto px-4 -mt-6 relative z-10">
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Progress */}
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-bold text-gray-800">
                    {formatPaise(stats.totalRaisedPaise)} raised
                  </span>
                  <span className="text-gray-400">Goal: {formatPaise(stats.goalPaise)}</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(stats.progressPercent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats cards */}
              <div className="flex gap-4">
                <div className="text-center px-3">
                  <p className="text-xl font-bold text-gray-900">{stats.totalDonors}</p>
                  <p className="text-xs text-gray-500">Donors</p>
                </div>
                <div className="text-center px-3 border-l">
                  <p className="text-xl font-bold text-gray-900">{stats.familiesHoused}</p>
                  <p className="text-xs text-gray-500">Families Housed</p>
                </div>
                <div className="text-center px-3 border-l">
                  <p className="text-xl font-bold text-gray-900">{stats.monthlyDonors}</p>
                  <p className="text-xs text-gray-500">Monthly SIPs</p>
                </div>
              </div>
            </div>

            {/* Recent donor ticker */}
            {stats.recentDonors?.length > 0 && (
              <div className="mt-3 pt-3 border-t text-center">
                <p className="text-sm text-gray-500 animate-pulse">
                  <span className="font-semibold text-teal-600">{stats.recentDonors[tickerIdx]?.name}</span>
                  {' '}donated {formatPaise(stats.recentDonors[tickerIdx]?.amountPaise)}
                  {' '}— {stats.recentDonors[tickerIdx]?.minutesAgo < 60
                    ? `${stats.recentDonors[tickerIdx]?.minutesAgo}m ago`
                    : `${Math.round(stats.recentDonors[tickerIdx]?.minutesAgo / 60)}h ago`}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-12" ref={formRef}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* ── Donation form — left 3 cols ── */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold mb-6">Choose your contribution</h2>

            {/* One-time / Monthly SIP toggle */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setIsMonthly(false)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition border-2 ${
                  !isMonthly ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                One-time
              </button>
              <button
                onClick={() => setIsMonthly(true)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition border-2 ${
                  isMonthly ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Aashray SIP (Monthly)
              </button>
              {isMonthly && (
                <span className="text-xs text-teal-600 font-medium hidden sm:inline">
                  Like a mutual fund SIP — sustained impact
                </span>
              )}
            </div>

            {/* Preset amounts with impact labels */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {PRESET_AMOUNTS.map(p => (
                <button
                  key={p.amount}
                  onClick={() => { setSelectedAmount(p.amount); setIsCustom(false); }}
                  className={`relative py-4 px-3 rounded-xl font-semibold text-sm border-2 transition text-left ${
                    !isCustom && selectedAmount === p.amount
                      ? 'border-teal-600 bg-teal-50 text-teal-700 ring-2 ring-teal-200'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-2.5 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      MOST POPULAR
                    </span>
                  )}
                  <span className="text-lg">{'\u20B9'}{p.amount.toLocaleString('en-IN')}</span>
                  {isMonthly && <span className="text-xs text-gray-400">/mo</span>}
                  <br />
                  <span className="text-xs text-gray-500 font-normal">{p.label}</span>
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="mb-5">
              <button
                onClick={() => setIsCustom(true)}
                className={`text-sm font-medium ${isCustom ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Enter custom amount
              </button>
              {isCustom && (
                <div className="mt-2 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-lg">{'\u20B9'}</span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    placeholder="Enter amount (min 100)"
                    min="100"
                    className="w-full pl-9 pr-4 py-3 border-2 border-teal-300 rounded-xl focus:outline-none focus:border-teal-500 text-lg"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* 80G Tax benefit calculator (inline) */}
            {effectiveAmount >= 100 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🧾</span>
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      Save {'\u20B9'}{taxSaving.toLocaleString('en-IN')} in taxes under Section 80G
                    </p>
                    <p className="text-xs text-green-600 mt-0.5">
                      Effective cost: only {'\u20B9'}{(effectiveAmount - taxSaving).toLocaleString('en-IN')} after tax deduction.
                      80G receipt emailed within 24 hours — guaranteed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Donor tier badge */}
            {donorTier && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-center gap-3">
                <span className="text-2xl">{donorTier.badge}</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    You'll earn the "{donorTier.name}" badge
                  </p>
                  <p className="text-xs text-amber-600">Displayed on your Safar profile (optional)</p>
                </div>
              </div>
            )}

            {/* Donor info */}
            <div className="space-y-3 mb-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-gray-400 font-normal">(for 80G receipt)</span></label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={e => setDonorName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(for receipt)</span></label>
                  <input
                    type="email"
                    value={donorEmail}
                    onChange={e => setDonorEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN <span className="text-gray-400 font-normal">(optional, for 80G certificate)</span></label>
                <input
                  type="text"
                  value={donorPan}
                  onChange={e => setDonorPan(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:border-teal-500 uppercase"
                />
              </div>

              {/* Dedicate donation */}
              {!showDedication ? (
                <button
                  onClick={() => setShowDedication(true)}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  + Dedicate this donation to someone
                </button>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dedicate to</label>
                  <input
                    type="text"
                    value={dedicatedTo}
                    onChange={e => setDedicatedTo(e.target.value)}
                    placeholder="In honor of..."
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">
                {error}
              </div>
            )}

            {/* Donate button */}
            <button
              onClick={handleDonate}
              disabled={effectiveAmount < 100 || loading}
              className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 rounded-xl transition text-lg shadow-lg shadow-teal-200 disabled:shadow-none"
            >
              {loading
                ? 'Processing...'
                : effectiveAmount >= 100
                  ? `Donate ${'\u20B9'}${effectiveAmount.toLocaleString('en-IN')}${isMonthly ? ' / month' : ''}`
                  : 'Enter an amount (min \u20B9100)'}
            </button>

            {/* Payment method hint */}
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-400">
              <span>UPI</span>
              <span>&#8226;</span>
              <span>Cards</span>
              <span>&#8226;</span>
              <span>Net Banking</span>
              <span>&#8226;</span>
              <span>Wallets</span>
            </div>
            <p className="text-xs text-gray-400 text-center mt-1">
              Secure payment via Razorpay. 80G tax receipt issued automatically.
            </p>

            {DEV_MOCK_PAYMENT && (
              <p className="text-xs text-amber-500 text-center mt-2">Dev mode: Payment will be simulated</p>
            )}
          </div>

          {/* ── Impact sidebar — right 2 cols ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Your impact checklist */}
            <div className="bg-teal-50 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">Your impact</h3>
              <div className="space-y-3">
                {IMPACT_TIERS.map(tier => (
                  <div key={tier.amount}
                    className={`flex items-center gap-3 p-3 rounded-xl transition ${
                      effectiveAmount >= tier.amount ? 'bg-teal-100 border border-teal-300' : 'bg-white border border-gray-100'
                    }`}
                  >
                    <span className="text-2xl">{tier.icon}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${effectiveAmount >= tier.amount ? 'text-teal-700' : 'text-gray-400'}`}>
                        {'\u20B9'}{tier.amount.toLocaleString('en-IN')}
                      </p>
                      <p className={`text-xs ${effectiveAmount >= tier.amount ? 'text-teal-600' : 'text-gray-400'}`}>
                        {tier.label}
                      </p>
                    </div>
                    {effectiveAmount >= tier.amount && (
                      <span className="text-teal-600 text-lg">&#10003;</span>
                    )}
                  </div>
                ))}
              </div>

              {isMonthly && effectiveAmount >= 100 && (
                <div className="mt-4 pt-4 border-t border-teal-200">
                  <p className="text-sm text-teal-700 font-semibold">
                    Annual impact: {'\u20B9'}{(effectiveAmount * 12).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-teal-600">
                    = {Math.round(effectiveAmount * 12 / 10000)} months of housing
                  </p>
                </div>
              )}
            </div>

            {/* Where your money goes — pie bar */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">Where your money goes</h3>
              {/* Visual bar */}
              <div className="flex h-4 rounded-full overflow-hidden mb-4">
                {FUND_USAGE.map(item => (
                  <div key={item.label} className={`${item.color} transition-all`} style={{ width: `${item.pct}%` }} />
                ))}
              </div>
              <div className="space-y-3">
                {FUND_USAGE.map(item => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color} mt-1 shrink-0`} />
                    <div>
                      <p className="text-sm font-semibold">{item.pct}% — {item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                      {effectiveAmount >= 100 && (
                        <p className="text-xs text-teal-600 font-medium">
                          = {'\u20B9'}{Math.round(effectiveAmount * item.pct / 100).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Employer matching prompt */}
            <div className="border border-blue-200 bg-blue-50 rounded-2xl p-5">
              <p className="text-sm font-semibold text-blue-800 mb-1">Does your employer match donations?</p>
              <p className="text-xs text-blue-600">
                Many companies (TCS, Infosys, Wipro, Google, Microsoft) match employee donations 1:1.
                Check with your HR team to double your impact.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stories with Before/After */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">Lives changed through Aashray</h2>
          <p className="text-gray-500 text-center mb-10">Real stories from families who found shelter</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STORIES.map(story => (
              <div key={story.name} className="bg-white rounded-2xl p-6 border hover:shadow-lg transition">
                <p className="text-sm text-gray-600 italic mb-4">"{story.quote}"</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-red-50 rounded-lg p-2">
                    <p className="text-[10px] uppercase font-bold text-red-400 mb-0.5">Before</p>
                    <p className="text-xs text-red-700">{story.before}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-[10px] uppercase font-bold text-green-400 mb-0.5">After</p>
                    <p className="text-xs text-green-700">{story.after}</p>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <p className="font-semibold text-sm">{story.name}</p>
                  <p className="text-xs text-gray-500">{story.origin}</p>
                  <p className="text-xs text-teal-600 mt-1">Housed for {story.months} months</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {[
              { q: 'Is my donation tax-deductible?', a: 'Yes. All donations to Safar Aashray are eligible for 50% deduction under Section 80G of the Income Tax Act. You\'ll receive an automatic 80G certificate via email within 24 hours.' },
              { q: 'Can I donate anonymously?', a: 'Yes. Name, email, and PAN fields are optional. However, you\'ll need to provide PAN to receive the 80G tax certificate.' },
              { q: 'How is my money used?', a: '70% goes directly to rent and security deposits for Aashray hosts. 15% covers essential supplies (bedding, kitchenware). 10% supports NGO case workers. 5% covers platform and payment processing costs.' },
              { q: 'What is Aashray SIP?', a: 'Like a mutual fund SIP, Aashray SIP is a monthly recurring donation. Your card/UPI is charged automatically each month. You can cancel anytime from your Safar dashboard. Monthly giving provides predictable funding for long-term housing placements.' },
              { q: 'Which payment methods are accepted?', a: 'UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Wallets — all processed securely through Razorpay.' },
              { q: 'Can I dedicate my donation?', a: 'Yes! You can dedicate your donation in honor of someone — their name will appear on the 80G certificate.' },
              { q: 'Does my employer match donations?', a: 'Many Indian IT companies and MNCs match employee charitable donations. Check with your HR team — this could double your impact at no extra cost to you.' },
              { q: 'Can I fund a specific family or city?', a: 'Currently we pool donations to maximize impact. Directed funding for specific families or cities is planned for a future update.' },
            ].map(faq => (
              <details key={faq.q} className="border rounded-xl p-4 group hover:shadow-sm transition">
                <summary className="font-semibold text-sm cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform ml-2 shrink-0">&#9660;</span>
                </summary>
                <p className="text-sm text-gray-600 mt-3">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-teal-600 to-blue-600 text-white py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-3">Other ways to help</h2>
        <p className="text-teal-100 mb-6 max-w-lg mx-auto">
          Not ready to donate? You can still make a difference.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/aashray/host"
            className="bg-white text-teal-700 font-semibold px-8 py-3 rounded-xl hover:bg-teal-50 transition text-sm">
            Open your home as a host
          </Link>
          <Link href="/aashray/ngo"
            className="border-2 border-white text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition text-sm">
            Partner as an NGO
          </Link>
        </div>
      </section>
    </div>
  );
}
