'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import { DECORATIONS, OCCASIONS, ARRIVAL_SLOTS, formatSlot, decorationsForOccasion } from '../catalog';

const GST_RATE = 0.18;
const ADVANCE_PCT = 0.60;                 // 60% advance, 40% balance on delivery
const COUPON_CODE = 'DECORLOVE';
const COUPON_DISCOUNT_PAISE = 5000;       // ₹50

type Step = 'design' | 'summary';

export default function DecorOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedDecor = searchParams.get('decor') ?? '';

  // Find the occasion this decor belongs to, so we can default the dropdown.
  const preselectedDecoration = DECORATIONS.find(d => d.key === preselectedDecor) || null;
  const preselectedOccasion = preselectedDecoration?.tags[0] ?? 'ANNIVERSARY';

  const [step, setStep] = useState<Step>('design');
  const [occasion, setOccasion] = useState<string>(preselectedOccasion);
  const [eventDate, setEventDate] = useState<string>('');
  const [arrivalSlot, setArrivalSlot] = useState<string>('');
  const [decorKey, setDecorKey] = useState<string>(preselectedDecor);

  // Customer + delivery
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Payment
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Keep decor in sync with occasion — clear selection if it doesn't fit.
  useEffect(() => {
    if (!decorKey) return;
    const d = DECORATIONS.find(x => x.key === decorKey);
    if (d && !d.tags.includes(occasion)) setDecorKey('');
  }, [occasion, decorKey]);

  const availableDecor = useMemo(() => decorationsForOccasion(occasion), [occasion]);
  const selectedDecor = DECORATIONS.find(d => d.key === decorKey) || null;

  const priceBreakdown = useMemo(() => {
    if (!selectedDecor) return null;
    const service = selectedDecor.pricePaise;
    const discount = couponApplied ? COUPON_DISCOUNT_PAISE : 0;
    const taxable = Math.max(0, service - discount);
    const gst = Math.round(taxable * GST_RATE);
    const total = taxable + gst;
    const advance = Math.round(total * ADVANCE_PCT);
    const balance = total - advance;
    return { service, discount, gst, total, advance, balance };
  }, [selectedDecor, couponApplied]);

  const canProceedToSummary = !!occasion && !!eventDate && !!arrivalSlot && !!selectedDecor;
  const canPay = !!priceBreakdown && !!address.trim() && !!city.trim() && !!pincode.trim()
    && !!customerName.trim() && !!customerPhone.trim() && agreeTerms;

  function applyCoupon() {
    setCouponError('');
    if (couponInput.trim().toUpperCase() === COUPON_CODE) setCouponApplied(true);
    else setCouponError('Invalid coupon code');
  }

  async function handlePay() {
    if (!priceBreakdown || !selectedDecor) return;
    setError('');
    setProcessing(true);
    try {
      const token = localStorage.getItem('access_token') || '';
      const menuDescription = JSON.stringify({
        type: 'EVENT_DECOR',
        occasion,
        arrivalSlot,
        decorKey: selectedDecor.key,
        decorLabel: selectedDecor.label,
        decorTier: selectedDecor.tier,
        decorPhotoUrl: selectedDecor.photoUrl,
        inclusions: selectedDecor.inclusions,
        setupHours: selectedDecor.setupHours,
        overtimePerHourPaise: selectedDecor.overtimePerHourPaise,
        breakdown: priceBreakdown,
      });
      const created: any = await api.createEventBooking({
        eventType: occasion,
        eventDate,
        eventTime: arrivalSlot,
        durationHours: selectedDecor.setupHours + 2,   // buffer after setup
        guestCount: 1,
        venueAddress: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        menuDescription,
        customerName,
        customerPhone,
        customerEmail,
        decorationRequired: true,
        cakeRequired: false,
        staffRequired: false,
        specialRequests,
      }, token || undefined);

      // 60% advance via Razorpay.
      const order = await api.createPaymentOrder(created.id, priceBreakdown.advance, token);
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
        name: 'Safar Decor',
        description: `${selectedDecor.label} · ${new Date(eventDate).toDateString()}`,
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
        theme: { color: '#e11d48' },
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
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => step === 'summary' ? setStep('design') : router.push('/cooks/services/decor')}
                  className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm">
            ← {step === 'summary' ? 'Edit booking' : 'Back'}
          </button>
          <h1 className="font-bold text-gray-900">{step === 'design' ? 'Select Decoration' : 'Summary'}</h1>
          <span className="w-16" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 pb-28">
        {/* ── Step 1: Design ───────────────────────────────────── */}
        {step === 'design' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
            <div className="bg-white rounded-xl border p-5 space-y-5">
              {/* Occasion */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Select Occasion</label>
                <select value={occasion} onChange={e => setOccasion(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm bg-gray-900 text-white">
                  {OCCASIONS.map(o => <option key={o.key} value={o.key}>{o.icon} {o.label}</option>)}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Select Date</label>
                <input type="date" required value={eventDate} onChange={e => setEventDate(e.target.value)}
                       min={new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]}
                       className="w-full border rounded-lg px-3 py-2.5 text-sm bg-gray-900 text-white" />
                <p className="text-[10px] text-gray-400 mt-1">Earliest: tomorrow (24-hr lead time)</p>
              </div>

              {/* Arrival time pills */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Select Decorator Arrival Time</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {ARRIVAL_SLOTS.map(s => (
                    <button key={s} type="button" onClick={() => setArrivalSlot(s)}
                            className={`py-2 rounded-lg border text-sm font-medium transition ${arrivalSlot === s ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-gray-200 text-gray-700 hover:border-rose-300'}`}>
                      {formatSlot(s)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Decoration dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Select Decoration</label>
                <select value={decorKey} onChange={e => setDecorKey(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm">
                  <option value="">Select from here</option>
                  {availableDecor.map(d => (
                    <option key={d.key} value={d.key}>{d.label} — {formatPaise(d.pricePaise)}</option>
                  ))}
                </select>

                {/* Gallery of available decor for the selected occasion */}
                {availableDecor.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {availableDecor.map(d => {
                      const on = decorKey === d.key;
                      return (
                        <button key={d.key} id={`decor-${d.key}`} type="button" onClick={() => setDecorKey(d.key)}
                                className={`text-left rounded-xl border overflow-hidden transition ${on ? 'border-rose-500 ring-2 ring-rose-200' : 'border-gray-200 hover:border-rose-300'}`}>
                          <div className="aspect-video bg-gradient-to-br from-pink-100 to-rose-200 overflow-hidden relative flex items-center justify-center">
                            <span className="text-4xl opacity-40">🌸</span>
                            <img src={d.photoUrl} alt={d.label} loading="lazy"
                                 onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                 className="absolute inset-0 w-full h-full object-cover" />
                            <span className={`absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded ${d.tier === 'LUXURY' ? 'bg-purple-600 text-white' : d.tier === 'PREMIUM' ? 'bg-amber-500 text-white' : 'bg-white/95 text-gray-700'}`}>
                              {d.tier}
                            </span>
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-semibold text-gray-900 truncate">{d.label}</p>
                            <p className="text-[10px] text-gray-500 truncate">{d.inclusions[0]}</p>
                            <p className="text-xs font-bold text-gray-900 mt-1">{formatPaise(d.pricePaise)}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Special requests */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Special requests (optional)</label>
                <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)}
                          rows={2} placeholder="Colour theme, favourite flowers, allergies, kid-safe materials…"
                          className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
            </div>

            {/* Preview + selection panel */}
            <div className="bg-white rounded-xl border p-5 lg:sticky lg:top-20 lg:self-start">
              <h3 className="font-semibold text-gray-900 mb-3">Selected decoration</h3>
              {selectedDecor ? (
                <>
                  <div className="w-full aspect-square rounded-lg mb-3 relative bg-gradient-to-br from-pink-100 via-rose-100 to-amber-100 overflow-hidden flex items-center justify-center">
                    <span className="text-6xl opacity-40">🌸</span>
                    <img src={selectedDecor.photoUrl} alt={selectedDecor.label}
                         onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                         className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                  <p className="font-bold text-gray-900">{selectedDecor.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Setup time: {selectedDecor.setupHours} hours</p>
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">What's included</p>
                    <ul className="mt-1 space-y-0.5 text-xs text-gray-700">
                      {selectedDecor.inclusions.map((it, i) => <li key={i}>• {it}</li>)}
                    </ul>
                  </div>
                  <p className="text-[10px] text-amber-700 bg-amber-50 rounded-lg p-2 mt-3">
                    Overtime: {formatPaise(selectedDecor.overtimePerHourPaise)}/hr if setup runs past the {selectedDecor.setupHours}-hour window.
                  </p>
                </>
              ) : (
                <div className="w-full aspect-square bg-gradient-to-br from-pink-50 to-rose-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-6xl opacity-40">🌸</span>
                </div>
              )}
              {priceBreakdown && (
                <div className="mt-4 pt-4 border-t text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Service charge</span>
                    <span>{formatPaise(priceBreakdown.service)}</span>
                  </div>
                  <div className="flex justify-between pt-1 mt-1 border-t font-bold text-gray-900">
                    <span>Estimated (incl. GST)</span>
                    <span>{formatPaise(priceBreakdown.total)}</span>
                  </div>
                </div>
              )}
              <button
                disabled={!canProceedToSummary}
                onClick={() => setStep('summary')}
                className="w-full mt-5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl py-3 text-sm font-semibold transition">
                View Total Bill →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Summary ──────────────────────────────────── */}
        {step === 'summary' && selectedDecor && priceBreakdown && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
            <div className="space-y-4">
              {/* Header row */}
              <div className="bg-white rounded-xl border p-5 space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 text-lg">👤</span>
                  <p className="text-gray-900">1 Decorator will arrive</p>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 text-lg">🗓️</span>
                  <div>
                    <p className="text-gray-900">Decorator will arrive by <strong>{formatSlot(arrivalSlot)}</strong> <button onClick={() => setStep('design')} className="text-blue-600 text-xs ml-2">✏ Edit</button></p>
                    <p className="text-gray-700 text-xs mt-0.5">{new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' })}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 text-lg">📍</span>
                  <p className="text-gray-700 flex-1">
                    {address ? `${address}, ${city} ${pincode}` : <span className="text-red-500">Enter your address below</span>}
                  </p>
                </div>
              </div>

              {/* Decoration card */}
              <div className="bg-white rounded-xl border p-5 flex items-start gap-4">
                <div className="w-24 h-24 rounded-lg relative bg-gradient-to-br from-pink-100 to-rose-200 overflow-hidden flex items-center justify-center shrink-0">
                  <span className="text-3xl opacity-40">🌸</span>
                  <img src={selectedDecor.photoUrl} alt=""
                       onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                       className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{selectedDecor.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{selectedDecor.tier} · Setup {selectedDecor.setupHours} hrs</p>
                  <ul className="text-[11px] text-gray-600 mt-1 space-y-0.5">
                    {selectedDecor.inclusions.slice(0, 3).map((it, i) => <li key={i}>• {it}</li>)}
                    {selectedDecor.inclusions.length > 3 && <li className="text-gray-400">+{selectedDecor.inclusions.length - 3} more included</li>}
                  </ul>
                </div>
                <button onClick={() => setStep('design')} className="text-xs text-blue-600 hover:text-blue-700 whitespace-nowrap">✏ Edit</button>
              </div>

              {/* Delivery */}
              <div className="bg-white rounded-xl border p-5 space-y-3">
                <h3 className="font-semibold text-gray-900">Delivery details</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address *</label>
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

            {/* Payment summary */}
            <div className="bg-white rounded-xl border p-5 lg:sticky lg:top-20 lg:self-start">
              <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Charges</span>
                  <span className="font-medium">{formatPaise(priceBreakdown.service)}</span>
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
                <div className="flex justify-between pt-2">
                  <span className="text-gray-700">Pay Now (60%)</span>
                  <span className="font-bold text-rose-700">{formatPaise(priceBreakdown.advance)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Balance on event day</span>
                  <span className="text-gray-700">{formatPaise(priceBreakdown.balance)}</span>
                </div>
              </div>

              {/* Coupon */}
              {!couponApplied && (
                <div className="mt-4 pt-4 border-t">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Have a coupon?</label>
                  <div className="flex gap-2">
                    <input type="text" value={couponInput} onChange={e => setCouponInput(e.target.value)}
                           placeholder="DECORLOVE" className="flex-1 border rounded-lg px-3 py-2 text-sm" />
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
                  60% advance is non-refundable after decorator confirmation. Overtime is {formatPaise(selectedDecor.overtimePerHourPaise)}/hr beyond the {selectedDecor.setupHours}-hr setup window. I agree to the <Link href="/terms" className="text-blue-600 hover:underline">T&C</Link>, <Link href="/privacy" className="text-blue-600 hover:underline">privacy policy</Link> and <Link href="/cancellation" className="text-blue-600 hover:underline">cancellation policy</Link>.
                </span>
              </label>

              {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

              <button
                disabled={!canPay || processing}
                onClick={handlePay}
                className="w-full mt-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl py-3 text-sm font-bold transition shadow-md shadow-amber-500/30">
                {processing ? 'Processing…' : `Pay 60% advance (${formatPaise(priceBreakdown.advance)})`}
              </button>

              <p className="text-[10px] text-gray-400 mt-2 text-center">
                Need help? Call <a href="tel:9004044234" className="text-blue-600">9004044234</a>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom CTA for step 1 on mobile (matches the doc's "View Total Bill" bar) */}
      {step === 'design' && (
        <div className="fixed bottom-0 inset-x-0 bg-amber-500 text-white text-center py-3 px-4 text-sm font-bold shadow-xl lg:hidden">
          {canProceedToSummary ? (
            <button onClick={() => setStep('summary')} className="w-full">View Total Bill →</button>
          ) : (
            <span className="opacity-80">Pick occasion, date, time and decoration</span>
          )}
        </div>
      )}
    </div>
  );
}
