'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import DateField from '@/components/DateField';
import MapLocationPicker from '@/components/MapLocationPicker';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import {
  OCCASIONS, GENRES, PREFERENCES, ARRIVAL_SLOTS,
  SOUND_EQUIPMENT_PAISE, OVERTIME_PER_MINUTE_PAISE, DEFAULT_PERFORMANCE_HOURS,
  formatSlot, computePrice, SingerGenre,
} from '../catalog';

const COUPON_CODE = 'MUSICLOVE';
const COUPON_DISCOUNT_PAISE = 5000;   // ₹50

type Step = 'design' | 'summary';

export default function BookSingerOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedGenre = (searchParams.get('genre') as SingerGenre | null) ?? '';

  const [step, setStep] = useState<Step>('design');
  const [occasion, setOccasion] = useState<string>('SHADI_KA_GHAR');
  const [eventDate, setEventDate] = useState<string>('');
  const [arrivalSlot, setArrivalSlot] = useState<string>('');
  const [genre, setGenre] = useState<SingerGenre | ''>(preselectedGenre || '');
  const [preference, setPreference] = useState<string>('WITH_SOUND');

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
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const priceBreakdown = useMemo(() => computePrice(
    genre, preference, couponApplied ? COUPON_DISCOUNT_PAISE : 0,
  ), [genre, preference, couponApplied]);

  const selectedGenre = GENRES.find(g => g.key === genre);
  const selectedOccasion = OCCASIONS.find(o => o.key === occasion);

  const canProceedToSummary = !!occasion && !!eventDate && !!arrivalSlot && !!genre && !!preference;
  const canSubmit = !!priceBreakdown && !!address.trim() && !!city.trim() && !!pincode.trim()
    && !!customerName.trim() && !!customerPhone.trim() && agreeTerms;

  function applyCoupon() {
    setCouponError('');
    if (couponInput.trim().toUpperCase() === COUPON_CODE) setCouponApplied(true);
    else setCouponError('Invalid coupon code');
  }

  async function handleCheckAvailability() {
    if (!priceBreakdown || !selectedGenre) return;
    const token = localStorage.getItem('access_token') || '';
    if (!token) {
      const returnTo = `/services/live-music/order${genre ? `?genre=${genre}` : ''}`;
      router.push(`/auth?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const menuDescription = JSON.stringify({
        type: 'LIVE_MUSIC',
        occasion,
        occasionLabel: selectedOccasion?.label,
        arrivalSlot,
        genre,
        genreLabel: selectedGenre.label,
        preference,
        withSoundEquipment: preference === 'WITH_SOUND',
        performanceHours: DEFAULT_PERFORMANCE_HOURS,
        overtimePerMinutePaise: OVERTIME_PER_MINUTE_PAISE,
        breakdown: priceBreakdown,
      });
      // Availability-first flow: we create the booking in INQUIRY status.
      // Platform team confirms a singer within 2 hours — payment happens
      // then, not now. Reuses the existing chef-events endpoint.
      await api.createEventBooking({
        eventType: occasion,
        eventDate,
        eventTime: arrivalSlot,
        durationHours: DEFAULT_PERFORMANCE_HOURS + 1,
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

      setSuccess(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to send availability request');
    } finally {
      setSubmitting(false);
    }
  }

  // Post-submit: confirmation screen (not instant pay — payment after
  // platform confirms the singer).
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center text-3xl">✓</div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Request received</h1>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            We're checking availability for a <strong>{selectedGenre?.label}</strong> singer in your area for <strong>{new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>. Our team will WhatsApp <strong>{customerPhone}</strong> within 2 hours with confirmation and a payment link.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/cooks/my-bookings" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-3 text-sm font-bold transition">View my bookings</Link>
            <Link href="/services" className="text-gray-500 hover:text-gray-700 text-sm font-medium">← Back to services</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => step === 'summary' ? setStep('design') : router.push('/services/live-music')}
                  className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm">
            ← {step === 'summary' ? 'Edit booking' : 'Back'}
          </button>
          <h1 className="font-bold text-gray-900">{step === 'design' ? 'Book a Singer' : 'Summary'}</h1>
          <span className="w-16" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 pb-28">
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
                       min={new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]}
                       className="w-full border rounded-lg px-3 py-2.5 text-sm bg-gray-900 text-white" />
                <p className="text-[10px] text-gray-400 mt-1">Earliest: tomorrow (24-hr lead time)</p>
              </div>

              {/* Genre */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Select Genre</label>
                <select value={genre} onChange={e => setGenre(e.target.value as SingerGenre)}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm">
                  <option value="">Select from here</option>
                  {GENRES.map(g => <option key={g.key} value={g.key}>{g.label} — from {formatPaise(g.basePaise)}</option>)}
                </select>
                {selectedGenre && (
                  <p className="text-[11px] text-gray-500 mt-1 italic">{selectedGenre.tagline}</p>
                )}
              </div>

              {/* Preference */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Select Preference</label>
                <div className="space-y-2">
                  {PREFERENCES.map(p => (
                    <label key={p.key} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${preference === p.key ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300'}`}>
                      <input type="radio" checked={preference === p.key} onChange={() => setPreference(p.key)}
                             className="mt-1 w-4 h-4 text-amber-500" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900">{p.label}</span>
                          {p.key === 'WITH_SOUND' && <span className="text-[11px] text-gray-500">+{formatPaise(SOUND_EQUIPMENT_PAISE)}</span>}
                        </div>
                        <p className="text-[11px] text-gray-500">{p.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Arrival time */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Select Singer Arrival Time</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {ARRIVAL_SLOTS.map(s => (
                    <button key={s} type="button" onClick={() => setArrivalSlot(s)}
                            className={`py-2 rounded-lg border text-sm font-medium transition ${arrivalSlot === s ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-gray-200 text-gray-700 hover:border-amber-300'}`}>
                      {formatSlot(s)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special requests */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Song requests / notes (optional)</label>
                <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)}
                          rows={2} placeholder="Must-play songs, language mix, couple's favourites…"
                          className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-xl border p-5 lg:sticky lg:top-20 lg:self-start">
              <h3 className="font-semibold text-gray-900 mb-3">Your booking</h3>
              <div className="space-y-1.5 text-sm">
                <Row label="Occasion" value={selectedOccasion ? `${selectedOccasion.icon} ${selectedOccasion.label}` : '—'} />
                <Row label="Date"     value={eventDate ? new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'long' }) : '—'} />
                <Row label="Arrival"  value={arrivalSlot ? formatSlot(arrivalSlot) : '—'} />
                <Row label="Genre"    value={selectedGenre?.label || '—'} />
                <Row label="Sound"    value={preference === 'WITH_SOUND' ? 'Equipment included' : 'Bring your own'} />
                <Row label="Duration" value={`${DEFAULT_PERFORMANCE_HOURS} hrs`} />
              </div>
              {priceBreakdown && (
                <div className="mt-4 pt-4 border-t text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Base ({selectedGenre?.label})</span>
                    <span>{formatPaise(priceBreakdown.base)}</span>
                  </div>
                  {priceBreakdown.equipment > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Sound equipment</span>
                      <span>{formatPaise(priceBreakdown.equipment)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 mt-1 border-t font-bold text-gray-900">
                    <span>Total (incl. GST)</span>
                    <span>{formatPaise(priceBreakdown.total)}</span>
                  </div>
                </div>
              )}
              <button
                disabled={!canProceedToSummary}
                onClick={() => setStep('summary')}
                className="w-full mt-5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl py-3 text-sm font-semibold transition">
                View Total Bill →
              </button>
            </div>
          </div>
        )}

        {step === 'summary' && selectedGenre && priceBreakdown && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="bg-white rounded-xl border p-5 space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 text-lg">👤</span>
                  <p className="text-gray-900">1 Singer will come <span className="text-[11px] text-gray-500">(Profile visible once Singer accepts booking)</span></p>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 text-lg">🗓️</span>
                  <div>
                    <p className="text-gray-900">Singer will arrive by <strong>{formatSlot(arrivalSlot)}</strong> <button onClick={() => setStep('design')} className="text-blue-600 text-xs ml-2">✏ Edit</button></p>
                    <p className="text-gray-700 text-xs mt-0.5">{new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })} <span className="text-gray-400 italic ml-1">Exact time confirmed shortly</span></p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 text-lg">📍</span>
                  <p className="text-gray-700 flex-1">
                    {address ? `${address}, ${city} ${pincode}` : <span className="text-red-500">Enter your address below</span>}
                  </p>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 text-lg">🎶</span>
                  <p className="text-gray-700">Genre: <strong>{selectedGenre.label}</strong> · Singer will {preference === 'WITH_SOUND' ? 'carry Sound Equipment' : 'not bring sound equipment'}</p>
                </div>
              </div>

              {/* Address */}
              <div className="bg-white rounded-xl border p-5 space-y-3">
                <h3 className="font-semibold text-gray-900">Performance venue</h3>
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

              {/* Availability note */}
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-xs text-red-700">
                Once you send the request, we'll check availability in your area and confirm the singer within 2 hours. You pay only after the singer accepts.
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
                  <span className="text-gray-700">Pay Now 60% (Advance)</span>
                  <span className="font-bold text-amber-700">{formatPaise(priceBreakdown.advance)}</span>
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
                           placeholder="MUSICLOVE" className="flex-1 border rounded-lg px-3 py-2 text-sm" />
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
                  Advance payment is for booking confirmation and is non-refundable. Overtime charges are {formatPaise(OVERTIME_PER_MINUTE_PAISE)}/min if you extend service beyond {DEFAULT_PERFORMANCE_HOURS} hours. I agree to the <Link href="/terms" className="text-blue-600 hover:underline">T&C</Link>, <Link href="/privacy" className="text-blue-600 hover:underline">privacy policy</Link> and <Link href="/cancellation" className="text-blue-600 hover:underline">cancellation policy</Link>.
                </span>
              </label>

              {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

              <button
                disabled={!canSubmit || submitting}
                onClick={handleCheckAvailability}
                className="w-full mt-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl py-3 text-sm font-bold transition shadow-md shadow-amber-500/30">
                {submitting ? 'Sending request…' : 'Check Availability →'}
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
          {canProceedToSummary ? (
            <button onClick={() => setStep('summary')} className="w-full">View Total Bill →</button>
          ) : (
            <span className="opacity-80">Pick occasion, date, genre, preference and arrival time</span>
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
