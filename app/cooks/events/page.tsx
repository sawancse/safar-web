'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';

const EVENT_TYPES = [
  { value: 'BIRTHDAY', label: 'Birthday Party', icon: '🎂' },
  { value: 'HOUSEWARMING', label: 'House-warming', icon: '🏠' },
  { value: 'KITTY_PARTY', label: 'Kitty Party', icon: '🎉' },
  { value: 'CORPORATE', label: 'Corporate Event', icon: '💼' },
  { value: 'WEDDING', label: 'Wedding', icon: '💒' },
  { value: 'ANNIVERSARY', label: 'Anniversary', icon: '💍' },
  { value: 'FESTIVAL', label: 'Festival Celebration', icon: '🪔' },
  { value: 'OTHER', label: 'Other', icon: '🎊' },
];

const CUISINE_OPTIONS = [
  'North Indian', 'South Indian', 'Chinese', 'Continental', 'Mughlai',
  'Multi-cuisine', 'Rajasthani', 'Bengali', 'Maharashtrian', 'Italian',
];

export default function EventBookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const chefId = searchParams.get('chefId') ?? '';
  const chefName = searchParams.get('chefName') ?? '';

  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [eventType, setEventType] = useState('BIRTHDAY');
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

  // Add-ons
  const [decoration, setDecoration] = useState(false);
  const [cake, setCake] = useState(false);
  const [extraStaff, setExtraStaff] = useState(false);
  const [staffCount, setStaffCount] = useState(2);

  // Price estimate (client-side)
  const foodPaise = guestCount * 30000; // ~300/plate base
  const decorPaise = decoration ? 500000 : 0; // 5000
  const cakePaise = cake ? 200000 : 0; // 2000
  const staffPaise = extraStaff ? staffCount * 150000 : 0; // 1500/staff
  const subtotalPaise = foodPaise + decorPaise + cakePaise + staffPaise;
  const platformFeePaise = Math.round(subtotalPaise * 0.1);
  const totalPaise = subtotalPaise + platformFeePaise;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const t = localStorage.getItem('access_token');
      if (!t) {
        router.push('/auth?redirect=/cooks/events');
        return;
      }
      setToken(t);
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError('');

    try {
      await api.createEventBooking(
        {
          chefId: chefId || undefined,
          eventType,
          eventDate,
          eventTime,
          durationHours,
          guestCount,
          venueAddress,
          city,
          pincode,
          cuisineType,
          vegNonVeg,
          specialRequests,
          addOns: {
            decoration,
            cake,
            extraStaff,
            staffCount: extraStaff ? staffCount : 0,
          },
        },
        token,
      );
      router.push('/cooks/my-bookings');
    } catch (err: any) {
      setError(err?.message || 'Failed to submit event booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <button onClick={() => router.push('/cooks')} className="hover:text-orange-500">Safar Cooks</button>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Event Catering</span>
        </nav>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Plan Your Event</h1>
              <p className="text-gray-500 mb-6">
                {chefName ? `Event catering with ${chefName}` : 'Get a custom quote for your event catering'}
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {EVENT_TYPES.map((et) => (
                      <button
                        key={et.value}
                        type="button"
                        onClick={() => setEventType(et.value)}
                        className={`p-3 rounded-lg border text-center text-sm transition ${
                          eventType === et.value
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-orange-300 text-gray-600'
                        }`}
                      >
                        <div className="text-2xl mb-1">{et.icon}</div>
                        {et.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date, Time, Duration */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border rounded-lg px-4 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full border rounded-lg px-4 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hrs)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={24}
                      value={durationHours}
                      onChange={(e) => setDurationHours(Number(e.target.value))}
                      className="w-full border rounded-lg px-4 py-2.5 text-sm"
                    />
                  </div>
                </div>

                {/* Guest Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={1000}
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full border rounded-lg px-4 py-2.5 text-sm"
                  />
                </div>

                {/* Venue */}
                <div className="border-t pt-5">
                  <h3 className="font-semibold text-gray-900 mb-3">Venue Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Venue Address</label>
                      <input
                        type="text"
                        required
                        value={venueAddress}
                        onChange={(e) => setVenueAddress(e.target.value)}
                        placeholder="Full venue address"
                        className="w-full border rounded-lg px-4 py-2.5 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full border rounded-lg px-4 py-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                        <input
                          type="text"
                          required
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          maxLength={6}
                          className="w-full border rounded-lg px-4 py-2.5 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Preferences */}
                <div className="border-t pt-5">
                  <h3 className="font-semibold text-gray-900 mb-3">Menu Preferences</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Type</label>
                      <select
                        value={cuisineType}
                        onChange={(e) => setCuisineType(e.target.value)}
                        className="w-full border rounded-lg px-4 py-2.5 text-sm bg-white"
                      >
                        {CUISINE_OPTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Food Preference</label>
                      <div className="flex gap-3">
                        {([
                          { value: 'VEG', label: 'Veg Only', color: 'green' },
                          { value: 'NON_VEG', label: 'Non-Veg Only', color: 'red' },
                          { value: 'BOTH', label: 'Both', color: 'orange' },
                        ] as const).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setVegNonVeg(opt.value)}
                            className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${
                              vegNonVeg === opt.value
                                ? `border-${opt.color}-500 bg-${opt.color}-50 text-${opt.color}-700`
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                            style={vegNonVeg === opt.value ? {
                              borderColor: opt.color === 'green' ? '#22c55e' : opt.color === 'red' ? '#ef4444' : '#f97316',
                              backgroundColor: opt.color === 'green' ? '#f0fdf4' : opt.color === 'red' ? '#fef2f2' : '#fff7ed',
                              color: opt.color === 'green' ? '#15803d' : opt.color === 'red' ? '#b91c1c' : '#c2410c',
                            } : {}}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                      <textarea
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Any specific dishes, dietary restrictions, or preferences..."
                        rows={3}
                        className="w-full border rounded-lg px-4 py-2.5 text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Add-ons */}
                <div className="border-t pt-5">
                  <h3 className="font-semibold text-gray-900 mb-3">Add-ons</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                      <input
                        type="checkbox"
                        checked={decoration}
                        onChange={(e) => setDecoration(e.target.checked)}
                        className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-sm text-gray-900">Decoration</span>
                        <p className="text-xs text-gray-500">Basic event decoration setup</p>
                      </div>
                      <span className="text-sm font-medium text-gray-600">+{formatPaise(500000)}</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                      <input
                        type="checkbox"
                        checked={cake}
                        onChange={(e) => setCake(e.target.checked)}
                        className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-sm text-gray-900">Cake</span>
                        <p className="text-xs text-gray-500">Custom theme cake (1-2 kg)</p>
                      </div>
                      <span className="text-sm font-medium text-gray-600">+{formatPaise(200000)}</span>
                    </label>

                    <div className={`p-3 border rounded-lg ${extraStaff ? 'bg-orange-50 border-orange-200' : ''}`}>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={extraStaff}
                          onChange={(e) => setExtraStaff(e.target.checked)}
                          className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-sm text-gray-900">Extra Staff</span>
                          <p className="text-xs text-gray-500">Additional serving staff</p>
                        </div>
                        <span className="text-sm font-medium text-gray-600">+{formatPaise(150000)}/person</span>
                      </label>
                      {extraStaff && (
                        <div className="mt-3 ml-7">
                          <label className="text-xs text-gray-600">Number of staff</label>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={staffCount}
                            onChange={(e) => setStaffCount(Number(e.target.value))}
                            className="ml-2 w-20 border rounded px-2 py-1 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Request Quote'}
                </button>
              </form>
            </div>
          </div>

          {/* Price Summary Sidebar */}
          <div className="mt-6 lg:mt-0">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Price Estimate</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Food ({guestCount} guests x {formatPaise(30000)}/plate)</span>
                  <span className="font-medium">{formatPaise(foodPaise)}</span>
                </div>
                {decoration && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Decoration</span>
                    <span className="font-medium">{formatPaise(decorPaise)}</span>
                  </div>
                )}
                {cake && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cake</span>
                    <span className="font-medium">{formatPaise(cakePaise)}</span>
                  </div>
                )}
                {extraStaff && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Extra Staff ({staffCount})</span>
                    <span className="font-medium">{formatPaise(staffPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform fee (10%)</span>
                  <span className="font-medium">{formatPaise(platformFeePaise)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t font-semibold text-base">
                  <span>Estimated Total</span>
                  <span className="text-orange-600">{formatPaise(totalPaise)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                This is an estimate. The chef will provide a final quote based on your requirements.
              </p>

              {chefName && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg">
                      👨‍🍳
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{chefName}</p>
                      <p className="text-xs text-gray-500">Event caterer</p>
                    </div>
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
