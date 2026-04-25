'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import { APPLIANCES, CATEGORIES, appliancesForCategory, ApplianceCategory, DELIVERY_FEE_PAISE, GST_RATE } from '../catalog';

const ADVANCE_PCT = 0.50;
const COUPON_CODE = 'APPLIANCE10';
const COUPON_DISCOUNT_PAISE = 10000;   // ₹100

type Step = 'cart' | 'summary';

export default function ApplianceOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedAdd = searchParams.get('add') ?? '';

  const [step, setStep] = useState<Step>('cart');
  const [cart, setCart] = useState<Record<string, number>>(preselectedAdd ? { [preselectedAdd]: 1 } : {});
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [pickupDate, setPickupDate] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<ApplianceCategory | 'ALL'>('ALL');

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [couponApplied, setCouponApplied] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const visible = activeCategory === 'ALL' ? APPLIANCES : appliancesForCategory(activeCategory);
  const cartEntries = APPLIANCES.filter(a => (cart[a.key] || 0) > 0);
  const totalItems = Object.values(cart).reduce((sum, n) => sum + n, 0);

  // Rental days — inclusive of both dates (min 1).
  const rentalDays = useMemo(() => {
    if (!deliveryDate || !pickupDate) return 1;
    const start = new Date(deliveryDate).getTime();
    const end   = new Date(pickupDate).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return 1;
    return Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1);
  }, [deliveryDate, pickupDate]);

  const priceBreakdown = useMemo(() => {
    if (cartEntries.length === 0) return null;
    const subtotal = cartEntries.reduce((sum, a) => sum + a.dailyRatePaise * (cart[a.key] || 0) * rentalDays, 0);
    const delivery = DELIVERY_FEE_PAISE;
    const discount = couponApplied ? COUPON_DISCOUNT_PAISE : 0;
    const preTax = Math.max(0, subtotal + delivery - discount);
    const gst = Math.round(preTax * GST_RATE);
    const total = preTax + gst;
    const advance = Math.round(total * ADVANCE_PCT);
    const balance = total - advance;
    return { subtotal, delivery, discount, gst, total, advance, balance };
  }, [cart, cartEntries, rentalDays, couponApplied]);

  function bump(key: string, delta: number) {
    setCart(prev => {
      const next = Math.max(0, (prev[key] || 0) + delta);
      const n = { ...prev };
      if (next === 0) delete n[key]; else n[key] = next;
      return n;
    });
  }

  function applyCoupon() {
    setCouponError('');
    if (couponInput.trim().toUpperCase() === COUPON_CODE) setCouponApplied(true);
    else setCouponError('Invalid coupon code');
  }

  const canProceed = cartEntries.length > 0 && !!deliveryDate && !!pickupDate && rentalDays >= 1;
  const canPay = canProceed && !!priceBreakdown && !!address.trim() && !!city.trim() && !!pincode.trim()
    && !!customerName.trim() && !!customerPhone.trim() && agreeTerms;

  async function handlePay() {
    if (!priceBreakdown) return;
    const token = localStorage.getItem('access_token') || '';
    if (!token) {
      router.push(`/auth?redirect=${encodeURIComponent('/services/appliances/order')}`);
      return;
    }
    setError('');
    setProcessing(true);
    try {
      const menuDescription = JSON.stringify({
        type: 'APPLIANCE_RENTAL',
        items: cartEntries.map(a => ({ key: a.key, label: a.label, qty: cart[a.key], dailyRatePaise: a.dailyRatePaise })),
        deliveryDate,
        pickupDate,
        rentalDays,
        breakdown: priceBreakdown,
      });
      const created: any = await api.createEventBooking({
        eventType: 'APPLIANCE_RENTAL',
        eventDate: deliveryDate,
        eventTime: '09:00',
        durationHours: rentalDays * 24,
        guestCount: 1,
        venueAddress: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        menuDescription,
        customerName,
        customerPhone,
        customerEmail,
        decorationRequired: false,
        cakeRequired: false,
        staffRequired: false,
        specialRequests: notes,
      }, token || undefined);

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
        name: 'Safar Appliance Rental',
        description: `${totalItems} items × ${rentalDays} day(s)`,
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
        theme: { color: '#111827' },
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
          <button onClick={() => step === 'summary' ? setStep('cart') : router.push('/services/appliances')}
                  className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm">
            ← {step === 'summary' ? 'Edit cart' : 'Back'}
          </button>
          <h1 className="font-bold text-gray-900">{step === 'cart' ? 'Select Appliances' : 'Summary'}</h1>
          <span className="w-16" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 pb-28">
        {step === 'cart' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
            <div className="space-y-5">
              {/* Rental dates */}
              <div className="bg-white rounded-xl border p-5 space-y-3">
                <h3 className="font-semibold text-gray-900">Rental dates</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Delivery date *</label>
                    <input type="date" required value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
                           min={new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]}
                           className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Pickup date *</label>
                    <input type="date" required value={pickupDate} onChange={e => setPickupDate(e.target.value)}
                           min={deliveryDate || new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]}
                           className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <p className="text-[11px] text-gray-500">
                  Rental duration: <strong>{rentalDays} day{rentalDays > 1 ? 's' : ''}</strong>. Daily rates multiply with duration.
                </p>
              </div>

              {/* Category pills */}
              <div className="bg-white rounded-xl border p-5">
                <div className="flex gap-2 overflow-x-auto mb-4">
                  <button onClick={() => setActiveCategory('ALL')}
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${activeCategory === 'ALL' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>
                    All
                  </button>
                  {CATEGORIES.map(c => (
                    <button key={c.key} onClick={() => setActiveCategory(c.key)}
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition flex items-center gap-1 ${activeCategory === c.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>
                      <span>{c.icon}</span> {c.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {visible.map(a => {
                    const qty = cart[a.key] || 0;
                    return (
                      <div key={a.key} id={`item-${a.key}`} className={`flex items-center gap-3 p-3 rounded-xl border transition ${qty > 0 ? 'border-gray-900 bg-gray-50' : 'border-gray-200'}`}>
                        <div className="w-16 h-16 rounded-lg relative bg-gradient-to-br from-zinc-100 to-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          <span className="text-2xl opacity-40">🔌</span>
                          <img src={a.photoUrl} alt="" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                               className="absolute inset-0 w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900">{a.label}</p>
                          <p className="text-[11px] text-gray-500 line-clamp-1">{a.description}</p>
                          <p className="text-xs text-gray-900 font-bold mt-0.5">{formatPaise(a.dailyRatePaise)}<span className="text-[10px] text-gray-400 font-normal">/day</span></p>
                        </div>
                        <div className="flex items-center shrink-0">
                          <button type="button" onClick={() => bump(a.key, -1)} disabled={qty === 0}
                                  className="w-8 h-8 rounded-l-lg border border-r-0 bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-30 font-bold text-lg flex items-center justify-center">−</button>
                          <div className={`w-10 h-8 border flex items-center justify-center text-sm font-bold ${qty > 0 ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'}`}>
                            {qty}
                          </div>
                          <button type="button" onClick={() => bump(a.key, 1)}
                                  className="w-8 h-8 rounded-r-lg border border-l-0 bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold text-lg flex items-center justify-center">+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-xl border p-5">
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Special notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                          rows={2} placeholder="E.g. need gas refill, specific model, delivery window"
                          className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
            </div>

            {/* Cart sidebar */}
            <div className="bg-white rounded-xl border p-5 lg:sticky lg:top-20 lg:self-start">
              <h3 className="font-semibold text-gray-900 mb-3">Your cart</h3>
              {cartEntries.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No items yet. Pick from the catalogue →</p>
              ) : (
                <ul className="space-y-2 text-sm max-h-[300px] overflow-y-auto pr-1">
                  {cartEntries.map(a => (
                    <li key={a.key} className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 truncate">{a.label}</p>
                        <p className="text-[10px] text-gray-400">{cart[a.key]} × {formatPaise(a.dailyRatePaise)}/day × {rentalDays}d</p>
                      </div>
                      <span className="text-gray-900 font-semibold whitespace-nowrap">{formatPaise(a.dailyRatePaise * cart[a.key] * rentalDays)}</span>
                    </li>
                  ))}
                </ul>
              )}

              {priceBreakdown && (
                <div className="mt-4 pt-4 border-t space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatPaise(priceBreakdown.subtotal)}</span></div>
                  <div className="flex justify-between text-gray-500"><span>Delivery + pickup</span><span>{formatPaise(priceBreakdown.delivery)}</span></div>
                  <div className="flex justify-between text-gray-500"><span>GST 18%</span><span>{formatPaise(priceBreakdown.gst)}</span></div>
                  <div className="flex justify-between pt-2 mt-1 border-t font-bold text-gray-900">
                    <span>Total</span><span>{formatPaise(priceBreakdown.total)}</span>
                  </div>
                </div>
              )}

              {!canProceed && (
                <div className="mt-4 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {cartEntries.length === 0
                    ? 'Add at least one item to your cart.'
                    : (!deliveryDate || !pickupDate)
                      ? 'Pick delivery + pickup dates above to continue.'
                      : 'Fill in the rental dates.'}
                </div>
              )}
              <button
                disabled={!canProceed}
                onClick={() => setStep('summary')}
                className="w-full mt-4 bg-gray-900 hover:bg-black disabled:opacity-40 text-white rounded-xl py-3 text-sm font-semibold transition">
                Continue to Payment →
              </button>
            </div>
          </div>
        )}

        {step === 'summary' && priceBreakdown && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
            <div className="space-y-4">
              {/* Items card */}
              <div className="bg-white rounded-xl border p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Your rental <button onClick={() => setStep('cart')} className="text-xs text-blue-600 float-right">✏ Edit</button></h3>
                <ul className="divide-y">
                  {cartEntries.map(a => (
                    <li key={a.key} className="py-2.5 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg relative bg-gradient-to-br from-zinc-100 to-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                        <span className="text-xl opacity-40">🔌</span>
                        <img src={a.photoUrl} alt="" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">{a.label}</p>
                        <p className="text-[11px] text-gray-500">{cart[a.key]} × {rentalDays} day{rentalDays > 1 ? 's' : ''}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{formatPaise(a.dailyRatePaise * cart[a.key] * rentalDays)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t text-xs text-gray-500 flex justify-between">
                  <span>Delivery on <strong className="text-gray-900">{new Date(deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong> · pickup on <strong className="text-gray-900">{new Date(pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong></span>
                </div>
              </div>

              {/* Address */}
              <div className="bg-white rounded-xl border p-5 space-y-3">
                <h3 className="font-semibold text-gray-900">Delivery address</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address *</label>
                  <textarea required value={address} onChange={e => setAddress(e.target.value)}
                            rows={2} placeholder="Flat, building, street, area"
                            className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" required value={city} onChange={e => setCity(e.target.value)} placeholder="City *" className="border rounded-lg px-3 py-2 text-sm" />
                  <input type="text" required value={pincode} onChange={e => setPincode(e.target.value)} placeholder="Pincode *" maxLength={6} className="border rounded-lg px-3 py-2 text-sm" />
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

            {/* Payment */}
            <div className="bg-white rounded-xl border p-5 lg:sticky lg:top-20 lg:self-start">
              <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Subtotal ({totalItems} items × {rentalDays}d)</span><span className="font-medium">{formatPaise(priceBreakdown.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Delivery + pickup</span><span className="font-medium">{formatPaise(priceBreakdown.delivery)}</span></div>
                {priceBreakdown.discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Coupon <button onClick={() => { setCouponApplied(false); setCouponInput(''); }} className="text-[10px] text-gray-400 ml-1 underline">Remove</button></span>
                    <span>− {formatPaise(priceBreakdown.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500"><span>GST 18%</span><span>{formatPaise(priceBreakdown.gst)}</span></div>
                <div className="flex justify-between bg-gray-900 -mx-5 px-5 py-2 mt-2 font-bold text-white">
                  <span>Total</span><span>{formatPaise(priceBreakdown.total)}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-gray-700">Pay Now (50% advance)</span>
                  <span className="font-bold text-gray-900">{formatPaise(priceBreakdown.advance)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Balance on delivery</span>
                  <span className="text-gray-700">{formatPaise(priceBreakdown.balance)}</span>
                </div>
              </div>

              {!couponApplied && (
                <div className="mt-4 pt-4 border-t">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Have a coupon?</label>
                  <div className="flex gap-2">
                    <input type="text" value={couponInput} onChange={e => setCouponInput(e.target.value)} placeholder="APPLIANCE10" className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                    <button onClick={applyCoupon} className="bg-gray-900 hover:bg-black text-white rounded-lg px-4 text-sm font-semibold">Apply</button>
                  </div>
                  {couponError && <p className="text-[11px] text-red-500 mt-1">{couponError}</p>}
                </div>
              )}

              <label className="flex items-start gap-2 mt-4 pt-4 border-t cursor-pointer">
                <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="mt-0.5 w-4 h-4" />
                <span className="text-[11px] text-gray-600 leading-snug">
                  50% advance locks the rental. Accidental damage charged at repair cost. Extension available by WhatsApp. I agree to the <Link href="/terms" className="text-blue-600 hover:underline">T&C</Link>.
                </span>
              </label>

              {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

              {!canPay && (
                <div className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {!address.trim() || !city.trim() || !pincode.trim()
                    ? 'Fill in the delivery address above.'
                    : !customerName.trim() || !customerPhone.trim()
                      ? 'Fill in your name and phone above.'
                      : !agreeTerms
                        ? 'Accept the terms to enable payment.'
                        : 'Complete all fields to proceed.'}
                </div>
              )}
              <button
                disabled={!canPay || processing}
                onClick={handlePay}
                className="w-full mt-3 bg-gray-900 hover:bg-black disabled:opacity-40 text-white rounded-xl py-3 text-sm font-bold transition">
                {processing ? 'Processing…' : `Pay ${formatPaise(priceBreakdown.advance)} →`}
              </button>

              <p className="text-[10px] text-gray-400 mt-2 text-center">
                Need help? Call <a href="tel:9004044234" className="text-blue-600">9004044234</a>
              </p>
            </div>
          </div>
        )}
      </div>

      {step === 'cart' && totalItems > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-gray-900 text-white text-center py-3 px-4 text-sm font-bold shadow-xl lg:hidden">
          {canProceed ? (
            <button onClick={() => setStep('summary')} className="w-full flex items-center justify-between">
              <span>{totalItems} item(s) · {rentalDays}d</span>
              <span>View Total →</span>
            </button>
          ) : (
            <span className="opacity-80">Pick rental dates first</span>
          )}
        </div>
      )}
    </div>
  );
}
