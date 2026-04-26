'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import DateField from '@/components/DateField';
import MapLocationPicker from '@/components/MapLocationPicker';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import { ROLES, OCCASIONS, ARRIVAL_SLOTS, formatSlot, computePrice, StaffRole } from '../catalog';

const COUPON_CODE = 'STAFFSAVE';
const COUPON_DISCOUNT_PAISE = 5000;

type Step = 'design' | 'summary';

export default function StaffHireOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleKey = (searchParams.get('role') as StaffRole | null) ?? 'waiter';
  const spec = ROLES[roleKey] ?? ROLES.waiter;

  const [step, setStep] = useState<Step>('design');
  const [occasion, setOccasion] = useState<string>('WEDDING');
  const [eventDate, setEventDate] = useState<string>('');
  const [arrivalSlot, setArrivalSlot] = useState<string>('');
  const [count, setCount] = useState<number>(2);
  const [hours, setHours] = useState<number>(4);
  const [guestCount, setGuestCount] = useState<number | ''>('');

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [venueLat, setVenueLat] = useState(0);
  const [venueLng, setVenueLng] = useState(0);

  function handleMapPick(loc: { lat: number; lng: number; address?: string; city?: string; pincode?: string }) {
    setVenueLat(loc.lat);
    setVenueLng(loc.lng);
    if (loc.address) setAddress(loc.address);
    if (loc.city)    setCity(loc.city);
    if (loc.pincode) setPincode(loc.pincode);
  }

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Prefill contact + address from the signed-in user's profile so they don't have to retype it.
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    api.getMyProfile(token).then((p: any) => {
      if (p?.name)    setCustomerName(prev  => prev || p.name);
      if (p?.phone)   setCustomerPhone(prev => prev || p.phone);
      if (p?.email)   setCustomerEmail(prev => prev || p.email);
      if (p?.address) setAddress(prev       => prev || p.address);
    }).catch(() => { /* anonymous browse — leave fields empty */ });
  }, []);

  const [couponApplied, setCouponApplied] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const priceBreakdown = useMemo(
    () => computePrice(roleKey, count, hours, couponApplied ? COUPON_DISCOUNT_PAISE : 0),
    [roleKey, count, hours, couponApplied],
  );

  const selectedOccasion = OCCASIONS.find(o => o.key === occasion);

  // Nudge count based on guests — rough rule: 1 waiter per 15 for meal, 1
  // cleaner per 30, 1 bartender per 40 drinking guests.
  const suggestedCount = useMemo(() => {
    if (!guestCount || guestCount < 10) return null;
    const divisor = roleKey === 'waiter' ? 15 : roleKey === 'cleaner' ? 30 : 40;
    return Math.max(1, Math.ceil((guestCount as number) / divisor));
  }, [guestCount, roleKey]);

  const canProceed = count > 0 && hours >= spec.minHours && !!eventDate && !!arrivalSlot && !!occasion;
  const canPay = canProceed && !!priceBreakdown && !!address.trim() && !!city.trim() && !!pincode.trim()
    && !!customerName.trim() && !!customerPhone.trim() && agreeTerms;

  function applyCoupon() {
    setCouponError('');
    if (couponInput.trim().toUpperCase() === COUPON_CODE) setCouponApplied(true);
    else setCouponError('Invalid coupon code');
  }

  async function handlePay() {
    if (!priceBreakdown) return;
    const token = localStorage.getItem('access_token') || '';
    // Payment endpoints require auth. Park the user on /auth and come back
    // to this exact URL (with ?role=) after they log in.
    if (!token) {
      const returnTo = `/services/staff-hire/order?role=${roleKey}`;
      router.push(`/auth?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }
    setError('');
    setProcessing(true);
    try {
      // Use existing staff roster pipeline: store role → count as
      // staffRolesJson on the event booking. Backend computes staff
      // cost from STAFF_ROLE pricing (V17).
      const staffRolesJson = JSON.stringify({ [roleKey]: count });
      const menuDescription = JSON.stringify({
        type: 'STAFF_HIRE',
        role: roleKey,
        roleLabel: spec.label,
        count,
        hours,
        occasion,
        arrivalSlot,
        breakdown: priceBreakdown,
      });
      const created: any = await api.createEventBooking({
        eventType: occasion,
        eventDate,
        eventTime: arrivalSlot,
        durationHours: hours,
        guestCount: (guestCount as number) || count * 15,  // fallback if customer didn't enter
        venueAddress: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        menuDescription,
        staffRolesJson,
        staffRequired: true,
        staffCount: count,
        customerName,
        customerPhone,
        customerEmail,
        decorationRequired: false,
        cakeRequired: false,
        specialRequests,
      } as any, token || undefined);

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
        name: `Safar ${spec.label}s`,
        description: `${count} × ${spec.label.toLowerCase()}${count > 1 ? 's' : ''} · ${hours} hrs`,
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
        theme: { color: '#2563eb' },
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
          <button onClick={() => step === 'summary' ? setStep('design') : router.push(`/services/staff-hire?role=${roleKey}`)}
                  className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm">
            ← {step === 'summary' ? 'Edit booking' : 'Back'}
          </button>
          <h1 className="font-bold text-gray-900">{step === 'design' ? `Hire ${spec.label}s` : 'Summary'}</h1>
          <span className="w-16" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 pb-28">
        {step === 'design' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
            <div className="bg-white rounded-xl border p-5 space-y-5">
              {/* Count picker — the crucial thing */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Number of {spec.label}s</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setCount(c => Math.max(1, c - 1))} disabled={count <= 1}
                          className="w-11 h-11 rounded-lg border bg-gray-50 disabled:opacity-30 text-xl font-bold text-gray-700 hover:bg-gray-100">−</button>
                  <div className="flex-1 text-center">
                    <div className="text-4xl font-bold text-gray-900">{count}</div>
                    <p className="text-[10px] text-gray-400">{spec.label}{count > 1 ? 's' : ''}</p>
                  </div>
                  <button type="button" onClick={() => setCount(c => Math.min(30, c + 1))}
                          className={`w-11 h-11 rounded-lg ${spec.theme.cta} text-white text-xl font-bold`}>+</button>
                </div>
                <input type="number" min={1} max={30} value={count} onChange={e => setCount(Math.max(1, Number(e.target.value) || 1))}
                       className="w-full mt-2 border rounded-lg px-3 py-2 text-sm text-center" />
              </div>

              {/* Guest count — suggestion only */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">How many guests? (optional)</label>
                <input type="number" min={0} value={guestCount} onChange={e => setGuestCount(e.target.value === '' ? '' : Number(e.target.value))}
                       placeholder="e.g. 50"
                       className="w-full border rounded-lg px-3 py-2 text-sm" />
                {suggestedCount != null && (
                  <div className={`mt-2 text-xs rounded-lg px-3 py-2 ${suggestedCount === count ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    {suggestedCount === count
                      ? `✓ ${count} ${spec.label.toLowerCase()}s is a good fit for ${guestCount} guests.`
                      : `For ${guestCount} guests we suggest ${suggestedCount} ${spec.label.toLowerCase()}${suggestedCount > 1 ? 's' : ''}. `}
                    {suggestedCount !== count && (
                      <button type="button" onClick={() => setCount(suggestedCount)} className="underline font-semibold">Use {suggestedCount}</button>
                    )}
                  </div>
                )}
              </div>

              {/* Hours */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">How many hours?</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {[2,3,4,5,6,8,10,12].map(h => (
                    <button key={h} type="button" onClick={() => setHours(h)}
                            className={`py-2.5 rounded-lg border text-sm font-medium transition ${hours === h ? `${spec.theme.cta} text-white border-transparent` : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                      {h} hr{h > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Base: 4-hour shift at {formatPaise(spec.baseShiftPaise)}/person. Each extra hour: {formatPaise(spec.perHourPaise)}/person.
                </p>
              </div>

              {/* Occasion */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Occasion</label>
                <select value={occasion} onChange={e => setOccasion(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm bg-gray-900 text-white">
                  {OCCASIONS.map(o => <option key={o.key} value={o.key}>{o.icon} {o.label}</option>)}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Date</label>
                <DateField required value={eventDate} onChange={e => setEventDate(e.target.value)}
                       min={new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]}
                       className="w-full border rounded-lg px-3 py-2.5 text-sm bg-gray-900 text-white" />
              </div>

              {/* Arrival time */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Arrival time</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {ARRIVAL_SLOTS.map(s => (
                    <button key={s} type="button" onClick={() => setArrivalSlot(s)}
                            className={`py-2 rounded-lg border text-sm font-medium transition ${arrivalSlot === s ? `${spec.theme.cta} text-white border-transparent` : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                      {formatSlot(s)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special requests */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Special notes (optional)</label>
                <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)}
                          rows={2} placeholder={roleKey === 'bartender' ? 'Cocktail menu preferences, alcohol brand, dry-event mocktails' : roleKey === 'cleaner' ? 'Pre-event prep, post-event pickup time, specific areas' : 'Language preference, uniform colour, specific duties'}
                          className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-xl border p-5 lg:sticky lg:top-20 lg:self-start">
              <h3 className="font-semibold text-gray-900 mb-3">Your booking</h3>
              <div className="space-y-1.5 text-sm">
                <Row label="Service" value={`${count} × ${spec.label}${count > 1 ? 's' : ''}`} />
                <Row label="Duration" value={`${hours} hour${hours > 1 ? 's' : ''}`} />
                <Row label="Occasion" value={selectedOccasion ? `${selectedOccasion.icon} ${selectedOccasion.label}` : '—'} />
                <Row label="Date"     value={eventDate ? new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'long' }) : '—'} />
                <Row label="Arrival"  value={arrivalSlot ? formatSlot(arrivalSlot) : '—'} />
                {guestCount && <Row label="Guests" value={String(guestCount)} />}
              </div>
              {priceBreakdown && (
                <div className="mt-4 pt-4 border-t text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>{count} × {spec.label.toLowerCase()}{count > 1 ? 's' : ''} ({hours}h)</span>
                    <span>{formatPaise(priceBreakdown.service)}</span>
                  </div>
                  <div className="flex justify-between pt-1 mt-1 border-t font-bold text-gray-900">
                    <span>Total (incl. GST)</span>
                    <span>{formatPaise(priceBreakdown.total)}</span>
                  </div>
                </div>
              )}
              <button
                disabled={!canProceed}
                onClick={() => setStep('summary')}
                className={`w-full mt-5 ${spec.theme.cta} disabled:opacity-40 text-white rounded-xl py-3 text-sm font-semibold transition`}>
                View Total Bill →
              </button>
            </div>
          </div>
        )}

        {step === 'summary' && priceBreakdown && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
            <div className="space-y-4">
              <div className="bg-white rounded-xl border p-5 space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 text-lg">{spec.icon}</span>
                  <p className="text-gray-900">
                    <strong>{count}</strong> {spec.label}{count > 1 ? 's' : ''} will arrive for <strong>{hours} hour{hours > 1 ? 's' : ''}</strong>
                  </p>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 text-lg">🗓️</span>
                  <div>
                    <p className="text-gray-900">Arrival by <strong>{formatSlot(arrivalSlot)}</strong> <button onClick={() => setStep('design')} className="text-blue-600 text-xs ml-2">✏ Edit</button></p>
                    <p className="text-gray-700 text-xs mt-0.5">{new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 text-lg">📍</span>
                  <p className="text-gray-700 flex-1">
                    {address ? `${address}, ${city} ${pincode}` : <span className="text-red-500">Enter your address below</span>}
                  </p>
                </div>
              </div>

              {/* Delivery */}
              <div className="bg-white rounded-xl border p-5 space-y-3">
                <h3 className="font-semibold text-gray-900">Event venue</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Pin venue on map</label>
                  <MapLocationPicker lat={venueLat} lng={venueLng} onLocationChange={handleMapPick}
                                     className="h-56 w-full rounded-xl overflow-hidden border" />
                  <p className="text-[10px] text-gray-400 mt-1">Search, drop a pin or use GPS — address fields auto-fill.</p>
                </div>
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

            <div className="bg-white rounded-xl border p-5 lg:sticky lg:top-20 lg:self-start">
              <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{count} × {formatPaise(priceBreakdown.perPerson)}</span>
                  <span className="font-medium">{formatPaise(priceBreakdown.service)}</span>
                </div>
                {priceBreakdown.extraHours > 0 && (
                  <p className="text-[11px] text-gray-400">
                    Includes {priceBreakdown.extraHours} extra hr{priceBreakdown.extraHours > 1 ? 's' : ''} at {formatPaise(spec.perHourPaise)}/person/hr
                  </p>
                )}
                {priceBreakdown.discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Coupon <button onClick={() => { setCouponApplied(false); setCouponInput(''); }} className="text-[10px] text-gray-400 ml-1 underline">Remove</button></span>
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
                  <span className={`font-bold ${spec.theme.accent}`}>{formatPaise(priceBreakdown.advance)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Balance on event day</span>
                  <span className="text-gray-700">{formatPaise(priceBreakdown.balance)}</span>
                </div>
              </div>

              {!couponApplied && (
                <div className="mt-4 pt-4 border-t">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Have a coupon?</label>
                  <div className="flex gap-2">
                    <input type="text" value={couponInput} onChange={e => setCouponInput(e.target.value)}
                           placeholder="STAFFSAVE" className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                    <button onClick={applyCoupon} className="bg-gray-900 hover:bg-black text-white rounded-lg px-4 text-sm font-semibold">Apply</button>
                  </div>
                  {couponError && <p className="text-[11px] text-red-500 mt-1">{couponError}</p>}
                </div>
              )}

              <label className="flex items-start gap-2 mt-4 pt-4 border-t cursor-pointer">
                <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="mt-0.5 w-4 h-4" />
                <span className="text-[11px] text-gray-600 leading-snug">
                  60% advance is non-refundable after staff accepts. Overtime billed at {formatPaise(spec.perHourPaise)}/hr/person beyond {hours} hrs. I agree to the <Link href="/terms" className="text-blue-600 hover:underline">T&C</Link>.
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
                Need help? Call <a href="tel:7367034295" className="text-blue-600">7367034295</a>
              </p>
            </div>
          </div>
        )}
      </div>

      {step === 'design' && (
        <div className={`fixed bottom-0 inset-x-0 ${spec.theme.cta} text-white text-center py-3 px-4 text-sm font-bold shadow-xl lg:hidden`}>
          {canProceed ? (
            <button onClick={() => setStep('summary')} className="w-full">View Total Bill →</button>
          ) : (
            <span className="opacity-80">Pick count, hours, date and arrival time</span>
          )}
        </div>
      )}
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
