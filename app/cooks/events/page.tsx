'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';

const EVENT_TYPES = [
  { value: 'BIRTHDAY', label: 'Birthday Party', icon: '🎂' },
  { value: 'WEDDING', label: 'Wedding', icon: '💍' },
  { value: 'ANNIVERSARY', label: 'Anniversary', icon: '💝' },
  { value: 'HOUSEWARMING', label: 'House-warming', icon: '🏠' },
  { value: 'KITTY_PARTY', label: 'Kitty Party', icon: '🎉' },
  { value: 'CORPORATE', label: 'Corporate', icon: '💼' },
  { value: 'BABY_SHOWER', label: 'Baby Shower', icon: '👶' },
  { value: 'COCKTAIL', label: 'Cocktail Night', icon: '🍹' },
  { value: 'POOJA', label: 'Pooja / Puja', icon: '🙏' },
  { value: 'BBQ', label: 'BBQ Party', icon: '🔥' },
  { value: 'NAVRATRI', label: 'Navratri', icon: '🕉️' },
  { value: 'FESTIVAL', label: 'Festival', icon: '🪔' },
  { value: 'RECEPTION', label: 'Reception', icon: '🥂' },
  { value: 'ENGAGEMENT', label: 'Engagement', icon: '💎' },
  { value: 'FAREWELL', label: 'Farewell', icon: '👋' },
  { value: 'OTHER', label: 'Other Event', icon: '🎊' },
];

const CUISINE_OPTIONS = [
  'North Indian', 'South Indian', 'Chinese', 'Continental', 'Mughlai',
  'Multi-cuisine', 'Rajasthani', 'Bengali', 'Maharashtrian', 'Italian',
  'Thai', 'Mexican', 'Ghar ka Khaana', 'Street Food', 'Jain', 'Navratri Special',
];

const LIVE_COUNTERS = [
  { key: 'dosa', label: 'Live Dosa Counter', icon: '🥞', paise: 300000 },
  { key: 'pasta', label: 'Live Pasta Counter', icon: '🍝', paise: 350000 },
  { key: 'bbq', label: 'Live BBQ Counter', icon: '🔥', paise: 500000 },
  { key: 'chaat', label: 'Live Chaat Counter', icon: '🥗', paise: 250000 },
  { key: 'tandoor', label: 'Live Tandoor Counter', icon: '🫓', paise: 400000 },
];

const ADDONS = [
  { key: 'decoration', label: 'Event Decoration', desc: 'Balloons, banners, table setting & theme decor', icon: '🎈', paise: 500000 },
  { key: 'cake', label: 'Designer Cake', desc: 'Custom theme cake (1-2 kg)', icon: '🎂', paise: 200000 },
  { key: 'crockery', label: 'Crockery Rental', desc: 'Plates, glasses, cutlery, serving bowls', icon: '🍽️', paise: 80000 },
  { key: 'appliances', label: 'Appliance Rental', desc: 'Chafing dishes, gas stoves, induction', icon: '🔌', paise: 50000 },
  { key: 'table_setup', label: 'Fine Dine Table Setup', desc: 'Premium tablecloth, candles, flowers', icon: '🕯️', paise: 80000 },
];

export default function EventBookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const chefId = searchParams.get('chefId') ?? '';
  const chefName = searchParams.get('chefName') ?? '';
  const preselectedEvent = searchParams.get('eventType') ?? '';

  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  // Form state
  const [eventType, setEventType] = useState(preselectedEvent || 'BIRTHDAY');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('12:00');
  const [durationHours, setDurationHours] = useState(4);
  const [guestCount, setGuestCount] = useState(25);
  const [venueAddress, setVenueAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [cuisineType, setCuisineType] = useState('Multi-cuisine');
  const [vegNonVeg, setVegNonVeg] = useState<'VEG' | 'NON_VEG' | 'BOTH'>('BOTH');
  const [specialRequests, setSpecialRequests] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Add-ons
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [selectedCounters, setSelectedCounters] = useState<Set<string>>(new Set());
  const [extraStaff, setExtraStaff] = useState(false);
  const [staffCount, setStaffCount] = useState(2);

  // Price estimate
  const foodPaise = guestCount * 30000;
  const countersPaise = [...selectedCounters].reduce((sum, k) => sum + (LIVE_COUNTERS.find(c => c.key === k)?.paise ?? 0), 0);
  const addonsPaise = [...selectedAddons].reduce((sum, k) => sum + (ADDONS.find(a => a.key === k)?.paise ?? 0), 0);
  const staffPaise = extraStaff ? staffCount * 150000 : 0;
  const subtotalPaise = foodPaise + countersPaise + addonsPaise + staffPaise;
  const platformFeePaise = Math.round(subtotalPaise * 0.1);
  const totalPaise = subtotalPaise + platformFeePaise;

  const toggleAddon = (key: string) => {
    setSelectedAddons(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };
  const toggleCounter = (key: string) => {
    setSelectedCounters(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const t = localStorage.getItem('access_token');
      if (!t) { router.push('/auth?redirect=/cooks/events'); return; }
      setToken(t);
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError('');
    try {
      const addOnsJson = JSON.stringify({
        decoration: selectedAddons.has('decoration'),
        cake: selectedAddons.has('cake'),
        crockery: selectedAddons.has('crockery'),
        appliances: selectedAddons.has('appliances'),
        tableSetup: selectedAddons.has('table_setup'),
        liveCounters: [...selectedCounters],
        extraStaff, staffCount: extraStaff ? staffCount : 0,
        vegNonVeg,
      });
      await api.createEventBooking({
        chefId: chefId || undefined,
        eventType,
        eventDate,
        eventTime,
        durationHours,
        guestCount,
        venueAddress,
        city,
        pincode,
        cuisinePreferences: cuisineType,
        decorationRequired: selectedAddons.has('decoration'),
        cakeRequired: selectedAddons.has('cake'),
        staffRequired: extraStaff,
        staffCount: extraStaff ? staffCount : 0,
        specialRequests,
        customerName,
        customerPhone,
        menuDescription: addOnsJson,
      }, token);
      router.push('/cooks/my-bookings');
    } catch (err: any) {
      setError(err?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const eventLabel = EVENT_TYPES.find(e => e.value === eventType)?.label || 'Event';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <button onClick={() => router.push('/cooks')} className="hover:text-orange-500">Safar Cooks</button>
          <span>/</span>
          <span className="text-gray-900 font-medium">Event Catering</span>
        </nav>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${step >= s ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{s}</div>
              <span className={`text-sm hidden sm:inline ${step >= s ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {s === 1 ? 'Event Details' : s === 2 ? 'Menu & Add-ons' : 'Confirm'}
              </span>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-orange-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
              )}

              {/* Step 1: Event Details */}
              {step === 1 && (
                <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">What's the occasion?</h2>
                    <p className="text-sm text-gray-500">Choose your event type and tell us the details</p>
                  </div>

                  {/* Event Type Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {EVENT_TYPES.map(et => (
                      <button key={et.value} type="button" onClick={() => setEventType(et.value)}
                        className={`p-3 rounded-xl border text-center text-sm transition
                          ${eventType === et.value ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-200 hover:border-orange-300 text-gray-600'}`}>
                        <div className="text-2xl mb-1">{et.icon}</div>
                        <span className="text-xs font-medium">{et.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Date, Time, Duration, Guests */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Event Date</label>
                      <input type="date" required value={eventDate} onChange={e => setEventDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                      <input type="time" required value={eventTime} onChange={e => setEventTime(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Duration (hrs)</label>
                      <input type="number" min={1} max={24} value={durationHours} onChange={e => setDurationHours(Number(e.target.value))}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Guests</label>
                      <input type="number" min={5} max={1000} value={guestCount} onChange={e => setGuestCount(Number(e.target.value))}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm" />
                    </div>
                  </div>

                  {/* Venue */}
                  <div className="border-t pt-5 space-y-4">
                    <h3 className="font-semibold text-gray-900">Venue Details</h3>
                    <input type="text" required value={venueAddress} onChange={e => setVenueAddress(e.target.value)}
                      placeholder="Full venue address" className="w-full border rounded-lg px-4 py-2.5 text-sm" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" required value={city} onChange={e => setCity(e.target.value)}
                        placeholder="City" className="border rounded-lg px-4 py-2.5 text-sm" />
                      <input type="text" required value={pincode} onChange={e => setPincode(e.target.value)}
                        placeholder="Pincode" maxLength={6} className="border rounded-lg px-4 py-2.5 text-sm" />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="border-t pt-5 space-y-4">
                    <h3 className="font-semibold text-gray-900">Your Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                        placeholder="Your name" className="border rounded-lg px-4 py-2.5 text-sm" />
                      <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                        placeholder="Phone number" maxLength={10} className="border rounded-lg px-4 py-2.5 text-sm" />
                    </div>
                  </div>

                  <button type="button" onClick={() => setStep(2)}
                    className="w-full py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition">
                    Next: Menu & Add-ons
                  </button>
                </div>
              )}

              {/* Step 2: Menu & Add-ons */}
              {step === 2 && (
                <div className="space-y-6">
                  {/* Menu Preferences */}
                  <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Menu Preferences</h2>
                      <p className="text-sm text-gray-500">Tell us about the food you'd like served</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Cuisine</label>
                      <div className="flex flex-wrap gap-2">
                        {CUISINE_OPTIONS.map(c => (
                          <button key={c} type="button" onClick={() => setCuisineType(c)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition
                              ${cuisineType === c ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:border-orange-300'}`}>
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Food Preference</label>
                      <div className="flex gap-3">
                        {([
                          { value: 'VEG', label: 'Veg Only', color: '#22c55e', bg: '#f0fdf4' },
                          { value: 'NON_VEG', label: 'Non-Veg', color: '#ef4444', bg: '#fef2f2' },
                          { value: 'BOTH', label: 'Both', color: '#f97316', bg: '#fff7ed' },
                        ] as const).map(opt => (
                          <button key={opt.value} type="button" onClick={() => setVegNonVeg(opt.value)}
                            className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition"
                            style={vegNonVeg === opt.value
                              ? { borderColor: opt.color, backgroundColor: opt.bg, color: opt.color }
                              : {}}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Special Requests</label>
                      <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)}
                        placeholder="Specific dishes, dietary restrictions, allergies..."
                        rows={3} className="w-full border rounded-lg px-4 py-2.5 text-sm resize-none" />
                    </div>
                  </div>

                  {/* Live Counters */}
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="font-semibold text-gray-900 mb-1">Live Counters</h3>
                    <p className="text-xs text-gray-500 mb-4">Add interactive food stations to your event</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {LIVE_COUNTERS.map(counter => (
                        <label key={counter.key}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition
                            ${selectedCounters.has(counter.key) ? 'border-orange-500 bg-orange-50' : 'hover:bg-gray-50'}`}>
                          <input type="checkbox" checked={selectedCounters.has(counter.key)}
                            onChange={() => toggleCounter(counter.key)}
                            className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500" />
                          <span className="text-xl">{counter.icon}</span>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">{counter.label}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-600">{formatPaise(counter.paise)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Add-ons */}
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="font-semibold text-gray-900 mb-1">Add-on Services</h3>
                    <p className="text-xs text-gray-500 mb-4">Make your event extra special</p>
                    <div className="space-y-3">
                      {ADDONS.map(addon => (
                        <label key={addon.key}
                          className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition
                            ${selectedAddons.has(addon.key) ? 'border-orange-500 bg-orange-50' : 'hover:bg-gray-50'}`}>
                          <input type="checkbox" checked={selectedAddons.has(addon.key)}
                            onChange={() => toggleAddon(addon.key)}
                            className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500" />
                          <span className="text-xl">{addon.icon}</span>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">{addon.label}</span>
                            <p className="text-xs text-gray-500">{addon.desc}</p>
                          </div>
                          <span className="text-sm font-semibold text-gray-600">+{formatPaise(addon.paise)}</span>
                        </label>
                      ))}

                      {/* Extra Staff */}
                      <div className={`p-4 rounded-lg border ${extraStaff ? 'border-orange-500 bg-orange-50' : ''}`}>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={extraStaff} onChange={e => setExtraStaff(e.target.checked)}
                            className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500" />
                          <span className="text-xl">🧑‍🍳</span>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">Extra Serving Staff</span>
                            <p className="text-xs text-gray-500">Waiters for serving & cleanup</p>
                          </div>
                          <span className="text-sm font-semibold text-gray-600">+{formatPaise(150000)}/person</span>
                        </label>
                        {extraStaff && (
                          <div className="mt-3 ml-11 flex items-center gap-3">
                            <label className="text-xs text-gray-600">Number of staff:</label>
                            <input type="number" min={1} max={20} value={staffCount}
                              onChange={e => setStaffCount(Number(e.target.value))}
                              className="w-20 border rounded px-2 py-1 text-sm" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)}
                      className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition">
                      Back
                    </button>
                    <button type="button" onClick={() => setStep(3)}
                      className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition">
                      Review & Confirm
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirm */}
              {step === 3 && (
                <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Review Your Booking</h2>
                    <p className="text-sm text-gray-500">Confirm the details before submitting</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-0.5">Event</p>
                      <p className="font-semibold">{eventLabel}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-0.5">Date & Time</p>
                      <p className="font-semibold">{eventDate} at {eventTime}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-0.5">Guests</p>
                      <p className="font-semibold">{guestCount} people</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-0.5">Duration</p>
                      <p className="font-semibold">{durationHours} hours</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                      <p className="text-xs text-gray-500 mb-0.5">Venue</p>
                      <p className="font-semibold">{venueAddress}, {city} {pincode}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-0.5">Cuisine</p>
                      <p className="font-semibold">{cuisineType} ({vegNonVeg === 'BOTH' ? 'Veg + Non-veg' : vegNonVeg === 'VEG' ? 'Pure Veg' : 'Non-Veg'})</p>
                    </div>
                    {chefName && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-0.5">Chef</p>
                        <p className="font-semibold">{chefName}</p>
                      </div>
                    )}
                  </div>

                  {(selectedCounters.size > 0 || selectedAddons.size > 0 || extraStaff) && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Selected Add-ons</h3>
                      <div className="flex flex-wrap gap-2">
                        {[...selectedCounters].map(k => {
                          const c = LIVE_COUNTERS.find(x => x.key === k);
                          return c && <span key={k} className="text-xs bg-orange-50 text-orange-700 px-3 py-1 rounded-full">{c.icon} {c.label}</span>;
                        })}
                        {[...selectedAddons].map(k => {
                          const a = ADDONS.find(x => x.key === k);
                          return a && <span key={k} className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full">{a.icon} {a.label}</span>;
                        })}
                        {extraStaff && <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">🧑‍🍳 {staffCount} staff</span>}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(2)}
                      className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition">
                      Back
                    </button>
                    <button type="submit" disabled={submitting}
                      className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50">
                      {submitting ? 'Submitting...' : 'Request Quote'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Price Sidebar */}
          <div className="mt-6 lg:mt-0">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Price Estimate</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Food ({guestCount} x {formatPaise(30000)})</span>
                  <span className="font-medium">{formatPaise(foodPaise)}</span>
                </div>
                {[...selectedCounters].map(k => {
                  const c = LIVE_COUNTERS.find(x => x.key === k);
                  return c && (
                    <div key={k} className="flex justify-between">
                      <span className="text-gray-600">{c.label}</span>
                      <span className="font-medium">{formatPaise(c.paise)}</span>
                    </div>
                  );
                })}
                {[...selectedAddons].map(k => {
                  const a = ADDONS.find(x => x.key === k);
                  return a && (
                    <div key={k} className="flex justify-between">
                      <span className="text-gray-600">{a.label}</span>
                      <span className="font-medium">{formatPaise(a.paise)}</span>
                    </div>
                  );
                })}
                {extraStaff && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Staff ({staffCount}x {formatPaise(150000)})</span>
                    <span className="font-medium">{formatPaise(staffPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>Platform fee (10%)</span>
                  <span>{formatPaise(platformFeePaise)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t font-bold text-base">
                  <span>Estimated Total</span>
                  <span className="text-orange-600">{formatPaise(totalPaise)}</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-3">
                Final price will be confirmed by the chef based on your requirements.
              </p>

              {chefName && (
                <div className="mt-4 pt-4 border-t flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg">👨‍🍳</div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{chefName}</p>
                    <p className="text-xs text-gray-500">Event caterer</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
