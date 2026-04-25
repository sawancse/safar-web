'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import { CAKES, WEIGHTS, FLAVOURS, TIER_SURCHARGE } from '../catalog';

const GST_RATE = 0.18;
const COUPON_CODE = 'SAFARSWEET';
const COUPON_DISCOUNT_PAISE = 5000;  // ₹50

type Step = 'design' | 'summary';

export default function DesignerCakeOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Pre-select a cake from the landing gallery via ?cake=<key>.
  const preselectedCake = searchParams.get('cake') ?? '';

  const [step, setStep] = useState<Step>('design');
  const [eggless, setEggless] = useState(false);
  const [weightKey, setWeightKey] = useState<string>('');
  const [cakeKey, setCakeKey] = useState<string>(preselectedCake);
  const [flavour, setFlavour] = useState('');
  const [message, setMessage] = useState('');

  // When the URL's ?cake= changes (e.g., user opened different gallery
  // items in different tabs and came back), honour it.
  useEffect(() => {
    if (preselectedCake && CAKES.some(c => c.key === preselectedCake)) {
      setCakeKey(preselectedCake);
      // Scroll the matching card into view so the user sees what's selected.
      setTimeout(() => {
        document.getElementById(`cake-${preselectedCake}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 50);
    }
  }, [preselectedCake]);

  // Delivery + payment state
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('09:00');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const [couponApplied, setCouponApplied] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const selectedWeight = WEIGHTS.find(w => w.key === weightKey) ?? null;
  const selectedCake   = CAKES.find(c => c.key === cakeKey) ?? null;

  const priceBreakdown = useMemo(() => {
    if (!selectedWeight || !selectedCake) return null;
    const weightBase = selectedWeight.basePaise;
    const tierAdd = TIER_SURCHARGE[selectedCake.tier];
    const egglessAdd = eggless ? Math.round(weightBase * 0.10) : 0;
    const serviceCharges = weightBase + tierAdd + egglessAdd;
    const discount = couponApplied ? COUPON_DISCOUNT_PAISE : 0;
    const taxable = Math.max(0, serviceCharges - discount);
    const gst = Math.round(taxable * GST_RATE);
    const total = taxable + gst;
    return { weightBase, tierAdd, egglessAdd, serviceCharges, discount, gst, total };
  }, [selectedWeight, selectedCake, eggless, couponApplied]);

  const canProceedToSummary = selectedWeight && selectedCake && flavour;
  const canPay = !!priceBreakdown && !!deliveryDate && !!address.trim() && !!city.trim()
    && !!pincode.trim() && !!customerName.trim() && !!customerPhone.trim() && agreeTerms;

  function applyCoupon() {
    setCouponError('');
    if (couponInput.trim().toUpperCase() === COUPON_CODE) {
      setCouponApplied(true);
    } else {
      setCouponError('Invalid coupon code');
    }
  }

  async function handlePay() {
    if (!priceBreakdown || !selectedWeight || !selectedCake) return;
    const token = localStorage.getItem('access_token') || '';
    if (!token) {
      const returnTo = '/services/cake/order' + (selectedCake ? `?cake=${selectedCake.key}` : '');
      router.push(`/auth?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }
    setError('');
    setProcessing(true);
    try {
      // Persist as an event booking with event_type=DESIGNER_CAKE — reuses
      // the existing payment, lifecycle, and admin surfaces.
      const menuDescription = JSON.stringify({
        type: 'DESIGNER_CAKE',
        weight: selectedWeight.label,
        weightKey: selectedWeight.key,
        cakeKey: selectedCake.key,
        cakeLabel: selectedCake.label,
        cakePhotoUrl: selectedCake.photoUrl,
        tier: selectedCake.tier,
        flavour,
        eggless,
        messageOnCake: message,
        breakdown: priceBreakdown,
      });
      const created: any = await api.createEventBooking({
        eventType: 'DESIGNER_CAKE',
        eventDate: deliveryDate,
        eventTime: deliveryTime,
        durationHours: 1,
        guestCount: 1,                           // cake ordering isn't guest-scaled
        venueAddress: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        menuDescription,
        customerName,
        customerPhone,
        customerEmail,
        decorationRequired: false,
        cakeRequired: true,
        staffRequired: false,
      }, token || undefined);

      // Open Razorpay. Cake ordering is full payment up-front (non-refundable
      // advance per the doc). We reuse the /payments/order endpoint; it only
      // uses bookingId as a notes reference.
      const order = await api.createPaymentOrder(created.id, priceBreakdown.total, token);
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload  = () => resolve();
          s.onerror = () => reject(new Error('Failed to load Razorpay'));
          document.body.appendChild(s);
        });
      }
      const rzp = new (window as any).Razorpay({
        key: order.razorpayKeyId,
        amount: order.amountPaise,
        currency: 'INR',
        name: 'Safar Cakes',
        description: `${selectedCake.label} · ${selectedWeight.label}`,
        order_id: order.razorpayOrderId,
        handler: async () => {
          try {
            await api.markEventAdvancePaid(created.id, localStorage.getItem('access_token') || token);
            router.push(`/cooks/my-bookings/${created.id}`);
          } catch (e: any) {
            setError(e?.message || 'Payment succeeded but status update failed — contact support.');
            setProcessing(false);
          }
        },
        prefill: { name: customerName, contact: customerPhone, email: customerEmail },
        theme: { color: '#f97316' },
        modal: { ondismiss: () => setProcessing(false) },
      });
      rzp.on('payment.failed', (r: any) => {
        setError(r.error?.description || 'Payment failed');
        setProcessing(false);
      });
      rzp.open();
    } catch (e: any) {
      setError(e?.message || 'Failed to place the order');
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => step === 'summary' ? setStep('design') : router.push('/services')}
                  className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm">
            ← {step === 'summary' ? 'Edit cake' : 'Back'}
          </button>
          <h1 className="font-bold text-gray-900">{step === 'design' ? 'Select Cake Design' : 'Summary'}</h1>
          <span className="w-16" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* ── Step 1: Design ───────────────────────────────────── */}
        {step === 'design' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
            <div className="bg-white rounded-xl border p-5 space-y-5">
              {/* Eggless toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-sm font-medium text-gray-700">Eggless Only</span>
                <button type="button" onClick={() => setEggless(e => !e)}
                        className={`relative w-12 h-6 rounded-full transition ${eggless ? 'bg-orange-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition ${eggless ? 'translate-x-6' : ''}`} />
                  <span className="absolute text-[9px] font-bold text-white top-1/2 -translate-y-1/2" style={{ left: eggless ? 7 : 'auto', right: eggless ? 'auto' : 6 }}>
                    {eggless ? 'ON' : 'OFF'}
                  </span>
                </button>
                {eggless && <span className="text-[11px] text-orange-600">+10% eggless surcharge</span>}
              </label>

              {/* Weight */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Select Weight</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {WEIGHTS.map(w => (
                    <button key={w.key} type="button" onClick={() => setWeightKey(w.key)}
                            className={`py-2.5 rounded-lg border text-sm font-medium transition ${weightKey === w.key ? 'bg-orange-500 text-white border-orange-500' : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'}`}>
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cake design */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Select Cake</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
                  {CAKES.map(c => {
                    const on = cakeKey === c.key;
                    return (
                      <button key={c.key} id={`cake-${c.key}`} type="button" onClick={() => setCakeKey(c.key)}
                              className={`group rounded-xl border overflow-hidden text-left transition ${on ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200 hover:border-orange-300'}`}>
                        <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                          <img src={c.photoUrl} alt={c.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-semibold text-gray-900 truncate">{c.label}</p>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${c.tier === 'LUXURY' ? 'bg-purple-100 text-purple-700' : c.tier === 'PREMIUM' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                              {c.tier}
                            </span>
                            {TIER_SURCHARGE[c.tier] > 0 && <span className="text-[9px] text-gray-400">+{formatPaise(TIER_SURCHARGE[c.tier])}</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Flavour */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Select Flavour</label>
                <select value={flavour} onChange={e => setFlavour(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm">
                  <option value="">Select flavour</option>
                  {FLAVOURS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Message on Cake</label>
                <input type="text" value={message} onChange={e => setMessage(e.target.value)}
                       placeholder="e.g. Happy Birthday Rohan!" maxLength={60}
                       className="w-full border rounded-lg px-3 py-2.5 text-sm" />
                <p className="text-[10px] text-gray-400 mt-1">Max 60 characters. Leave blank for no message.</p>
              </div>
            </div>

            {/* Preview panel */}
            <div className="bg-white rounded-xl border p-5 lg:sticky lg:top-20 lg:self-start">
              <h3 className="font-semibold text-gray-900 mb-3">Preview</h3>
              {selectedCake ? (
                <img src={selectedCake.photoUrl} alt={selectedCake.label} className="w-full aspect-square object-cover rounded-lg mb-3" />
              ) : (
                <div className="w-full aspect-square bg-gradient-to-br from-pink-50 to-rose-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-6xl opacity-40">🎂</span>
                </div>
              )}
              <div className="space-y-1.5 text-sm">
                <Row label="Eggless"  value={eggless ? 'Yes' : 'No'} />
                <Row label="Weight"   value={selectedWeight?.label || '—'} />
                <Row label="Design"   value={selectedCake?.label || '—'} />
                <Row label="Flavour"  value={flavour || '—'} />
                {message && <Row label="Message" value={`"${message}"`} />}
              </div>
              {priceBreakdown && (
                <div className="mt-4 pt-4 border-t text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Service charge</span>
                    <span>{formatPaise(priceBreakdown.serviceCharges)}</span>
                  </div>
                  <div className="flex justify-between pt-1 mt-1 border-t font-bold text-gray-900">
                    <span>Estimated</span>
                    <span>{formatPaise(priceBreakdown.serviceCharges + Math.round(priceBreakdown.serviceCharges * GST_RATE))}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">Incl. GST 18% · before delivery details</p>
                </div>
              )}
              <button
                disabled={!canProceedToSummary}
                onClick={() => setStep('summary')}
                className="w-full mt-5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl py-3 text-sm font-semibold transition">
                Continue to Summary
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Summary ──────────────────────────────────── */}
        {step === 'summary' && selectedCake && selectedWeight && priceBreakdown && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
            <div className="space-y-4">
              {/* Order card */}
              <div className="bg-white rounded-xl border p-5">
                <div className="flex items-start gap-4">
                  <img src={selectedCake.photoUrl} alt="" className="w-20 h-20 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">1 × {selectedCake.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedWeight.label} · {flavour} · {eggless ? 'Eggless' : 'With egg'}</p>
                    {message && <p className="text-xs text-orange-700 mt-1 italic">"{message}"</p>}
                  </div>
                  <button onClick={() => setStep('design')} className="text-xs text-blue-600 hover:text-blue-700">✏ Edit</button>
                </div>
              </div>

              {/* Delivery */}
              <div className="bg-white rounded-xl border p-5 space-y-4">
                <h3 className="font-semibold text-gray-900">Delivery details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Delivery date *</label>
                    <input type="date" required value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
                           min={new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]}
                           className="w-full border rounded-lg px-3 py-2 text-sm" />
                    <p className="text-[10px] text-gray-400 mt-0.5">Earliest: tomorrow (24-hr lead time)</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Delivery time *</label>
                    <input type="time" required value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)}
                           className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Delivery address *</label>
                  <textarea required value={address} onChange={e => setAddress(e.target.value)}
                            rows={2} placeholder="Flat, building, street, area"
                            className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" required value={city} onChange={e => setCity(e.target.value)}
                         placeholder="City *" className="border rounded-lg px-3 py-2 text-sm" />
                  <input type="text" required value={pincode} onChange={e => setPincode(e.target.value)}
                         placeholder="Pincode *" maxLength={6} className="border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              {/* Contact */}
              <div className="bg-white rounded-xl border p-5 space-y-3">
                <h3 className="font-semibold text-gray-900">Your details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" required value={customerName}  onChange={e => setCustomerName(e.target.value)}  placeholder="Your name *"  className="border rounded-lg px-3 py-2 text-sm" />
                  <input type="tel"  required value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone *"      maxLength={10} className="border rounded-lg px-3 py-2 text-sm" />
                </div>
                <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="Email (optional)" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            {/* Payment summary sidebar */}
            <div className="bg-white rounded-xl border p-5 lg:sticky lg:top-20 lg:self-start">
              <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Charges</span>
                  <span className="font-medium">{formatPaise(priceBreakdown.serviceCharges)}</span>
                </div>
                {priceBreakdown.discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Coupon Discount <button onClick={() => { setCouponApplied(false); setCouponInput(''); }} className="text-[10px] text-gray-400 ml-1 underline">Remove</button></span>
                    <span>− {formatPaise(priceBreakdown.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>GST 18%</span>
                  <span>{formatPaise(priceBreakdown.gst)}</span>
                </div>
                <div className="flex justify-between bg-amber-50 -mx-5 px-5 py-2 mt-2 font-bold text-gray-900">
                  <span>Total Amount</span>
                  <span>{formatPaise(priceBreakdown.total)}</span>
                </div>
              </div>

              {/* Coupon */}
              {!couponApplied && (
                <div className="mt-4 pt-4 border-t">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Have a coupon?</label>
                  <div className="flex gap-2">
                    <input type="text" value={couponInput} onChange={e => setCouponInput(e.target.value)}
                           placeholder="SAFARSWEET" className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                    <button onClick={applyCoupon} className="bg-gray-900 hover:bg-black text-white rounded-lg px-4 text-sm font-semibold">Apply</button>
                  </div>
                  {couponError && <p className="text-[11px] text-red-500 mt-1">{couponError}</p>}
                </div>
              )}

              {/* Terms */}
              <label className="flex items-start gap-2 mt-4 pt-4 border-t cursor-pointer">
                <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)}
                       className="mt-0.5 w-4 h-4" />
                <span className="text-[11px] text-gray-600 leading-snug">
                  Advance payment is non-refundable. I agree to the <Link href="/terms" className="text-blue-600 hover:underline">T&C</Link>, <Link href="/privacy" className="text-blue-600 hover:underline">privacy policy</Link> and <Link href="/cancellation" className="text-blue-600 hover:underline">cancellation policy</Link>.
                </span>
              </label>

              {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

              <button
                disabled={!canPay || processing}
                onClick={handlePay}
                className="w-full mt-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl py-3 text-sm font-bold transition shadow-md shadow-amber-500/30">
                {processing ? 'Processing…' : `Pay to book (${formatPaise(priceBreakdown.total)})`}
              </button>

              <p className="text-[10px] text-gray-400 mt-2 text-center">
                Need help? Call <a href="tel:9004044234" className="text-blue-600">9004044234</a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium text-right ml-3 truncate">{value}</span>
    </div>
  );
}
