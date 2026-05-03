'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import DateField from '@/components/DateField';
import MapLocationPicker from '@/components/MapLocationPicker';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import { PUJAS, OCCASIONS, ARRIVAL_SLOTS, LANGUAGES, formatSlot, pujasForOccasion } from '../catalog';

const GST_RATE = 0.18;
const ADVANCE_PCT = 0.60;
const COUPON_CODE = 'PUJABLESS';
const COUPON_DISCOUNT_PAISE = 5000;

type Step = 'design' | 'summary';

export default function PanditOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPuja = searchParams.get('puja') ?? '';

  const preselectedService = PUJAS.find(p => p.key === preselectedPuja) || null;
  const preselectedOccasion = preselectedService?.tags[0] ?? 'HOUSEWARMING';

  const [step, setStep] = useState<Step>('design');
  const [occasion, setOccasion] = useState<string>(preselectedOccasion);
  const [eventDate, setEventDate] = useState<string>('');
  const [arrivalSlot, setArrivalSlot] = useState<string>('');
  const [pujaKey, setPujaKey] = useState<string>(preselectedPuja);
  const [language, setLanguage] = useState<string>('Hindi');
  const [gotra, setGotra] = useState<string>('');
  const [familyNames, setFamilyNames] = useState<string>('');

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

  const [couponApplied, setCouponApplied] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [attemptedStep1, setAttemptedStep1] = useState(false);
  const [attemptedStep2, setAttemptedStep2] = useState(false);

  // Reset puja selection if customer changes occasion and the puja no longer fits.
  useEffect(() => {
    if (!pujaKey) return;
    const p = PUJAS.find(x => x.key === pujaKey);
    if (p && !p.tags.includes(occasion)) setPujaKey('');
  }, [occasion, pujaKey]);

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

  const tomorrowIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const availablePujas = useMemo(() => pujasForOccasion(occasion), [occasion]);
  const selectedPuja = PUJAS.find(p => p.key === pujaKey) || null;

  const priceBreakdown = useMemo(() => {
    if (!selectedPuja) return null;
    const service = selectedPuja.pricePaise;
    const discount = couponApplied ? COUPON_DISCOUNT_PAISE : 0;
    const taxable = Math.max(0, service - discount);
    const gst = Math.round(taxable * GST_RATE);
    const total = taxable + gst;
    const advance = Math.round(total * ADVANCE_PCT);
    const balance = total - advance;
    return { service, discount, gst, total, advance, balance, dakshina: selectedPuja.recommendedDakshinaPaise };
  }, [selectedPuja, couponApplied]);

  const step1Errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!occasion)     e.occasion    = 'Pick the occasion';
    if (!eventDate)    e.eventDate   = 'Pick the date of the puja';
    else if (eventDate < tomorrowIso) e.eventDate = 'Date must be tomorrow or later (24-hour lead time)';
    if (!arrivalSlot)  e.arrivalSlot = 'Pick the pandit arrival time';
    if (!pujaKey)      e.pujaKey     = 'Choose a puja from the list';
    if (!language)     e.language    = 'Pick a preferred language';
    return e;
  }, [occasion, eventDate, arrivalSlot, pujaKey, language, tomorrowIso]);

  const step2Errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!address.trim())       e.address  = 'Enter the venue address';
    if (!city.trim())          e.city     = 'Enter the city';
    if (!pincode.trim())       e.pincode  = 'Enter the pincode';
    else if (!/^\d{6}$/.test(pincode.trim())) e.pincode = 'Pincode must be 6 digits';
    if (!customerName.trim())  e.customerName  = 'Enter your name';
    if (!customerPhone.trim()) e.customerPhone = 'Enter your phone number';
    else if (!/^\d{10}$/.test(customerPhone.trim())) e.customerPhone = 'Phone must be 10 digits';
    if (customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) e.customerEmail = 'Enter a valid email or leave it blank';
    if (!agreeTerms)           e.agreeTerms = 'Please accept the T&C to continue';
    return e;
  }, [address, city, pincode, customerName, customerPhone, customerEmail, agreeTerms]);

  const canProceedToSummary = Object.keys(step1Errors).length === 0;
  const canPay = !!priceBreakdown && Object.keys(step2Errors).length === 0;

  function applyCoupon() {
    setCouponError('');
    if (couponInput.trim().toUpperCase() === COUPON_CODE) setCouponApplied(true);
    else setCouponError('Invalid coupon code');
  }

  function handleProceedToSummary() {
    setAttemptedStep1(true);
    if (canProceedToSummary) setStep('summary');
  }

  async function handlePay() {
    setAttemptedStep2(true);
    if (!canPay) return;
    if (!priceBreakdown || !selectedPuja) return;
    const token = localStorage.getItem('access_token') || '';
    if (!token) {
      const returnTo = `/services/pandit/order?puja=${selectedPuja.key}`;
      router.push(`/auth?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }
    setError('');
    setProcessing(true);
    try {
      const menuDescription = JSON.stringify({
        type: 'PANDIT_PUJA',
        occasion,
        arrivalSlot,
        pujaKey: selectedPuja.key,
        pujaLabel: selectedPuja.label,
        pujaTier: selectedPuja.tier,
        pujaPhotoUrl: selectedPuja.photoUrl,
        inclusions: selectedPuja.inclusions,
        samagri: selectedPuja.samagri,
        durationHours: selectedPuja.durationHours,
        language,
        gotra,
        familyNames,
        breakdown: priceBreakdown,
      });
      const created: any = await api.createEventBooking({
        eventType: occasion,
        eventDate,
        eventTime: arrivalSlot,
        durationHours: selectedPuja.durationHours + 1,
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
        specialRequests,
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
        name: 'Safar Pandit',
        description: `${selectedPuja.label} · ${new Date(eventDate).toDateString()}`,
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
        theme: { color: '#ea580c' },
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
          <button onClick={() => step === 'summary' ? setStep('design') : router.push('/services/pandit')}
                  className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm">
            ← {step === 'summary' ? 'Edit booking' : 'Back'}
          </button>
          <h1 className="font-bold text-gray-900">{step === 'design' ? 'Select Puja' : 'Summary'}</h1>
          <span className="w-16" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 pb-28">
        {/* ── Step 1 ───────────────────────────────────────────── */}
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
                <DateField required value={eventDate} onChange={e => setEventDate(e.target.value)}
                           min={tomorrowIso}
                           className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-gray-900 text-white ${attemptedStep1 && step1Errors.eventDate ? 'border-red-500 ring-1 ring-red-300' : ''}`} />
                <p className="text-[10px] text-gray-400 mt-1">Earliest: tomorrow (24-hr lead time)</p>
                {attemptedStep1 && step1Errors.eventDate && <p className="text-[11px] text-red-600 mt-1">{step1Errors.eventDate}</p>}
              </div>

              {/* Arrival time */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Select Pandit Arrival Time</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {ARRIVAL_SLOTS.map(s => (
                    <button key={s} type="button" onClick={() => setArrivalSlot(s)}
                            className={`py-2 rounded-lg border text-sm font-medium transition ${arrivalSlot === s ? 'bg-orange-600 text-white border-orange-600' : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'}`}>
                      {formatSlot(s)}
                    </button>
                  ))}
                </div>
                {attemptedStep1 && step1Errors.arrivalSlot && <p className="text-[11px] text-red-600 mt-1">{step1Errors.arrivalSlot}</p>}
              </div>

              {/* Puja picker */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Select Puja</label>
                <select value={pujaKey} onChange={e => setPujaKey(e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2.5 text-sm ${attemptedStep1 && step1Errors.pujaKey ? 'border-red-500 ring-1 ring-red-300' : ''}`}>
                  <option value="">Select from here</option>
                  {availablePujas.map(p => (
                    <option key={p.key} value={p.key}>{p.label} — {formatPaise(p.pricePaise)}</option>
                  ))}
                </select>
                {attemptedStep1 && step1Errors.pujaKey && <p className="text-[11px] text-red-600 mt-1">{step1Errors.pujaKey}</p>}

                {availablePujas.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                    {availablePujas.map(p => {
                      const on = pujaKey === p.key;
                      return (
                        <button key={p.key} id={`puja-${p.key}`} type="button" onClick={() => setPujaKey(p.key)}
                                className={`text-left rounded-xl border overflow-hidden transition ${on ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200 hover:border-orange-300'}`}>
                          <div className="aspect-video bg-gradient-to-br from-amber-100 via-orange-100 to-red-100 overflow-hidden relative flex items-center justify-center">
                            <span className="text-5xl opacity-40">🪔</span>
                            <img src={p.photoUrl} alt={p.label} loading="lazy"
                                 onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                 className="absolute inset-0 w-full h-full object-cover" />
                            <span className={`absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded ${p.tier === 'LUXURY' ? 'bg-purple-600 text-white' : p.tier === 'PREMIUM' ? 'bg-amber-500 text-white' : 'bg-white/95 text-gray-700'}`}>
                              {p.tier}
                            </span>
                          </div>
                          <div className="p-2.5">
                            <p className="text-sm font-semibold text-gray-900">{p.label}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{p.durationHours}h · {p.inclusions[0]}</p>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-sm font-bold text-gray-900">{formatPaise(p.pricePaise)}</span>
                              <span className="text-[10px] text-gray-400">+dakshina {formatPaise(p.recommendedDakshinaPaise)}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Preferred Language</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => (
                    <button key={l} type="button" onClick={() => setLanguage(l)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${language === l ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-700 hover:border-orange-300'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional lineage details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Gotra (optional)</label>
                  <input type="text" value={gotra} onChange={e => setGotra(e.target.value)}
                         placeholder="e.g. Bharadwaj"
                         className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Family names for sankalp (optional)</label>
                  <input type="text" value={familyNames} onChange={e => setFamilyNames(e.target.value)}
                         placeholder="e.g. Rohan & Priya"
                         className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              {/* Special requests */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Special requests (optional)</label>
                <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)}
                          rows={2} placeholder="Specific mantras, avoidances, elder-sensitive timing…"
                          className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-xl border p-5 lg:sticky lg:top-20 lg:self-start">
              <h3 className="font-semibold text-gray-900 mb-3">Selected puja</h3>
              {selectedPuja ? (
                <>
                  <div className="w-full aspect-video rounded-lg mb-3 relative bg-gradient-to-br from-amber-100 via-orange-100 to-red-100 overflow-hidden flex items-center justify-center">
                    <span className="text-6xl opacity-40">🪔</span>
                    <img src={selectedPuja.photoUrl} alt={selectedPuja.label}
                         onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                         className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                  <p className="font-bold text-gray-900">{selectedPuja.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Duration: {selectedPuja.durationHours} hours</p>
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Included</p>
                    <ul className="mt-1 space-y-0.5 text-xs text-gray-700">
                      {selectedPuja.inclusions.map((it, i) => <li key={i}>• {it}</li>)}
                    </ul>
                  </div>
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Samagri kit</p>
                    <ul className="mt-1 space-y-0.5 text-xs text-gray-700">
                      {selectedPuja.samagri.map((it, i) => <li key={i}>• {it}</li>)}
                    </ul>
                  </div>
                  <p className="text-[10px] text-amber-700 bg-amber-50 rounded-lg p-2 mt-3">
                    Recommended dakshina: <strong>{formatPaise(selectedPuja.recommendedDakshinaPaise)}</strong> (paid in cash to the pandit on the day).
                  </p>
                </>
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-amber-50 to-orange-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-6xl opacity-40">🪔</span>
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
              {attemptedStep1 && !canProceedToSummary && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                  <p className="font-semibold mb-1">Please fix the following before continuing:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {Object.values(step1Errors).map((msg, i) => <li key={i}>{msg}</li>)}
                  </ul>
                </div>
              )}
              <button
                onClick={handleProceedToSummary}
                className="w-full mt-5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl py-3 text-sm font-semibold transition">
                View Total Bill →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2 ───────────────────────────────────────────── */}
        {step === 'summary' && selectedPuja && priceBreakdown && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="bg-white rounded-xl border p-5 space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 text-lg">🙏</span>
                  <p className="text-gray-900">1 Pandit will arrive · language: <strong>{language}</strong></p>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 text-lg">🗓️</span>
                  <div>
                    <p className="text-gray-900">Arrival by <strong>{formatSlot(arrivalSlot)}</strong> <button onClick={() => setStep('design')} className="text-blue-600 text-xs ml-2">✏ Edit</button></p>
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

              {/* Puja card */}
              <div className="bg-white rounded-xl border p-5 flex items-start gap-4">
                <div className="w-24 h-24 rounded-lg relative bg-gradient-to-br from-amber-100 to-orange-200 overflow-hidden flex items-center justify-center shrink-0">
                  <span className="text-3xl opacity-40">🪔</span>
                  <img src={selectedPuja.photoUrl} alt=""
                       onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                       className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{selectedPuja.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{selectedPuja.tier} · {selectedPuja.durationHours}h · Samagri included</p>
                  <ul className="text-[11px] text-gray-600 mt-1 space-y-0.5">
                    {selectedPuja.inclusions.slice(0, 3).map((it, i) => <li key={i}>• {it}</li>)}
                  </ul>
                  {(gotra || familyNames) && (
                    <p className="text-[11px] text-orange-700 mt-2">
                      {gotra && <>Gotra: <strong>{gotra}</strong>{familyNames && ' · '}</>}
                      {familyNames && <>Sankalp: <strong>{familyNames}</strong></>}
                    </p>
                  )}
                </div>
                <button onClick={() => setStep('design')} className="text-xs text-blue-600 hover:text-blue-700 whitespace-nowrap">✏ Edit</button>
              </div>

              {/* Delivery */}
              <div className="bg-white rounded-xl border p-5 space-y-3">
                <h3 className="font-semibold text-gray-900">Puja venue</h3>
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
                            className={`w-full border rounded-lg px-3 py-2 text-sm resize-none ${attemptedStep2 && step2Errors.address ? 'border-red-500 ring-1 ring-red-300' : ''}`} />
                  {attemptedStep2 && step2Errors.address && <p className="text-[11px] text-red-600 mt-1">{step2Errors.address}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input type="text" required value={city} onChange={e => setCity(e.target.value)}
                           placeholder="City *" className={`w-full border rounded-lg px-3 py-2 text-sm ${attemptedStep2 && step2Errors.city ? 'border-red-500 ring-1 ring-red-300' : ''}`} />
                    {attemptedStep2 && step2Errors.city && <p className="text-[11px] text-red-600 mt-1">{step2Errors.city}</p>}
                  </div>
                  <div>
                    <input type="text" required value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                           placeholder="Pincode *" maxLength={6} inputMode="numeric"
                           className={`w-full border rounded-lg px-3 py-2 text-sm ${attemptedStep2 && step2Errors.pincode ? 'border-red-500 ring-1 ring-red-300' : ''}`} />
                    {attemptedStep2 && step2Errors.pincode && <p className="text-[11px] text-red-600 mt-1">{step2Errors.pincode}</p>}
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-white rounded-xl border p-5 space-y-3">
                <h3 className="font-semibold text-gray-900">Your details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input type="text" required value={customerName}  onChange={e => setCustomerName(e.target.value)}  placeholder="Your name *"
                           className={`w-full border rounded-lg px-3 py-2 text-sm ${attemptedStep2 && step2Errors.customerName ? 'border-red-500 ring-1 ring-red-300' : ''}`} />
                    {attemptedStep2 && step2Errors.customerName && <p className="text-[11px] text-red-600 mt-1">{step2Errors.customerName}</p>}
                  </div>
                  <div>
                    <input type="tel"  required value={customerPhone} onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, ''))} placeholder="Phone *" maxLength={10} inputMode="numeric"
                           className={`w-full border rounded-lg px-3 py-2 text-sm ${attemptedStep2 && step2Errors.customerPhone ? 'border-red-500 ring-1 ring-red-300' : ''}`} />
                    {attemptedStep2 && step2Errors.customerPhone && <p className="text-[11px] text-red-600 mt-1">{step2Errors.customerPhone}</p>}
                  </div>
                </div>
                <div>
                  <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="Email (optional)"
                         className={`w-full border rounded-lg px-3 py-2 text-sm ${attemptedStep2 && step2Errors.customerEmail ? 'border-red-500 ring-1 ring-red-300' : ''}`} />
                  {attemptedStep2 && step2Errors.customerEmail && <p className="text-[11px] text-red-600 mt-1">{step2Errors.customerEmail}</p>}
                </div>
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
                  <span className="font-bold text-orange-700">{formatPaise(priceBreakdown.advance)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Balance on puja day</span>
                  <span className="text-gray-700">{formatPaise(priceBreakdown.balance)}</span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-dashed">
                  <span className="text-gray-500">Dakshina (recommended, cash on day)</span>
                  <span className="text-gray-700">{formatPaise(priceBreakdown.dakshina)}</span>
                </div>
              </div>

              {/* Coupon */}
              {!couponApplied && (
                <div className="mt-4 pt-4 border-t">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Have a coupon?</label>
                  <div className="flex gap-2">
                    <input type="text" value={couponInput} onChange={e => setCouponInput(e.target.value)}
                           placeholder="PUJABLESS" className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                    <button onClick={applyCoupon} className="bg-gray-900 hover:bg-black text-white rounded-lg px-4 text-sm font-semibold">Apply</button>
                  </div>
                  {couponError && <p className="text-[11px] text-red-500 mt-1">{couponError}</p>}
                </div>
              )}

              {/* Terms */}
              <label className="flex items-start gap-2 mt-4 pt-4 border-t cursor-pointer">
                <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)}
                       className={`mt-0.5 w-4 h-4 ${attemptedStep2 && step2Errors.agreeTerms ? 'ring-2 ring-red-300 rounded' : ''}`} />
                <span className="text-[11px] text-gray-600 leading-snug">
                  60% advance is non-refundable after pandit confirmation. Dakshina is separate and customer pays in cash on the day. I agree to the <Link href="/terms" className="text-blue-600 hover:underline">T&C</Link>, <Link href="/privacy" className="text-blue-600 hover:underline">privacy policy</Link> and <Link href="/cancellation" className="text-blue-600 hover:underline">cancellation policy</Link>.
                </span>
              </label>
              {attemptedStep2 && step2Errors.agreeTerms && <p className="text-[11px] text-red-600 mt-1">{step2Errors.agreeTerms}</p>}

              {attemptedStep2 && !canPay && Object.keys(step2Errors).length > 0 && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                  <p className="font-semibold mb-1">Please fix the following before paying:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {Object.values(step2Errors).map((msg, i) => <li key={i}>{msg}</li>)}
                  </ul>
                </div>
              )}

              {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

              <button
                disabled={processing}
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
        <div className="fixed bottom-0 inset-x-0 bg-amber-500 text-white text-center py-3 px-4 text-sm font-bold shadow-xl lg:hidden">
          <button onClick={handleProceedToSummary} className="w-full">View Total Bill →</button>
        </div>
      )}
    </div>
  );
}
