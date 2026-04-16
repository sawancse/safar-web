'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';

interface PassengerForm {
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
}

const EMPTY_PASSENGER: PassengerForm = {
  title: 'Mr',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: 'male',
  nationality: 'IN',
  passportNumber: '',
  passportExpiry: '',
};

export default function FlightBookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerId = searchParams.get('offerId') || '';
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const departureDate = searchParams.get('departureDate') || '';
  const passengerCount = Number(searchParams.get('passengers')) || 1;
  const cabinClass = searchParams.get('cabinClass') || 'economy';
  const international = searchParams.get('international') === 'true';
  const totalPaise = Number(searchParams.get('totalPaise')) || 0;
  const airline = searchParams.get('airline') || '';
  const flightNumber = searchParams.get('flightNumber') || '';

  const [passengers, setPassengers] = useState<PassengerForm[]>([]);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('access_token') ?? '';
    if (!t) {
      router.push('/auth?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }
    setToken(t);
    // Initialize passenger forms
    setPassengers(Array.from({ length: passengerCount }, () => ({ ...EMPTY_PASSENGER })));
  }, [passengerCount, router]);

  function updatePassenger(index: number, field: keyof PassengerForm, value: string) {
    setPassengers(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  // Price breakdown
  const baseFarePaise = totalPaise * passengerCount;
  const taxesPaise = Math.round(baseFarePaise * 0.05); // 5% taxes estimate
  const platformFeePaise = Math.round(baseFarePaise * 0.02); // 2% platform fee
  const grandTotalPaise = baseFarePaise + taxesPaise + platformFeePaise;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validate
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.firstName || !p.lastName || !p.dateOfBirth) {
        setError(`Please fill all required fields for Passenger ${i + 1}`);
        return;
      }
      if (international && (!p.passportNumber || !p.passportExpiry)) {
        setError(`Passport details required for Passenger ${i + 1} (international flight)`);
        return;
      }
    }
    if (!contactEmail || !contactPhone) {
      setError('Contact email and phone are required');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        offerId,
        origin,
        destination,
        departureDate,
        cabinClass,
        airline,
        flightNumber,
        international,
        passengers: passengers.map(p => ({
          title: p.title,
          firstName: p.firstName,
          lastName: p.lastName,
          dateOfBirth: p.dateOfBirth,
          gender: p.gender,
          nationality: p.nationality,
          passportNumber: international ? p.passportNumber : undefined,
          passportExpiry: international ? p.passportExpiry : undefined,
        })),
        contactEmail,
        contactPhone,
        totalAmountPaise: grandTotalPaise,
      };

      const booking = await api.createFlightBooking(body, token);
      const bookingId = booking?.id || booking?.bookingId;

      // MVP: auto-confirm with dummy payment IDs
      if (bookingId) {
        try {
          await api.confirmFlightPayment(
            bookingId,
            `order_safar_${Date.now()}`,
            `pay_safar_${Date.now()}`,
            token
          );
        } catch {
          // Payment confirmation is best-effort for MVP
        }
        router.push(`/flights/${bookingId}`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#003B95] text-white py-4">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-xl font-bold">Complete Your Booking</h1>
          <p className="text-blue-200 text-sm">
            {origin} &rarr; {destination} &middot; {departureDate} &middot; {airline} {flightNumber}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Form */}
          <div className="flex-1 space-y-6">
            {/* Passenger Forms */}
            {passengers.map((p, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Passenger {idx + 1}
                  {idx === 0 && <span className="text-sm text-gray-400 font-normal ml-2">(Primary)</span>}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                    <select
                      value={p.title}
                      onChange={(e) => updatePassenger(idx, 'title', e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003B95]"
                    >
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                    </select>
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-600 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={p.firstName}
                      onChange={(e) => updatePassenger(idx, 'firstName', e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B95]"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={p.lastName}
                      onChange={(e) => updatePassenger(idx, 'lastName', e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B95]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      value={p.dateOfBirth}
                      onChange={(e) => updatePassenger(idx, 'dateOfBirth', e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B95]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
                    <select
                      value={p.gender}
                      onChange={(e) => updatePassenger(idx, 'gender', e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003B95]"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nationality</label>
                    <select
                      value={p.nationality}
                      onChange={(e) => updatePassenger(idx, 'nationality', e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003B95]"
                    >
                      <option value="IN">India</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AE">UAE</option>
                      <option value="SG">Singapore</option>
                      <option value="TH">Thailand</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                {/* Passport section for international flights */}
                {international && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-amber-700 mb-3">
                        Passport details required for international travel
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Passport Number *</label>
                      <input
                        type="text"
                        value={p.passportNumber}
                        onChange={(e) => updatePassenger(idx, 'passportNumber', e.target.value.toUpperCase())}
                        placeholder="e.g. A1234567"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B95]"
                        required={international}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Passport Expiry *</label>
                      <input
                        type="date"
                        value={p.passportExpiry}
                        onChange={(e) => updatePassenger(idx, 'passportExpiry', e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B95]"
                        required={international}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Contact Details */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Details</h3>
              <p className="text-sm text-gray-500 mb-4">Booking confirmation and updates will be sent here.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email *</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B95]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B95]"
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Sticky Price Summary */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sticky top-20">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Summary</h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <span className="text-[#003B95] font-bold text-xs">{airline?.substring(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{origin} &rarr; {destination}</p>
                    <p className="text-gray-400 text-xs">{departureDate} &middot; {cabinClass.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Base fare ({passengerCount} pax)</span>
                  <span>{formatPaise(baseFarePaise)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taxes &amp; fees</span>
                  <span>{formatPaise(taxesPaise)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Platform fee (2%)</span>
                  <span>{formatPaise(platformFeePaise)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-base pt-3 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-[#003B95]">{formatPaise(grandTotalPaise)}</span>
                </div>
              </div>

              <button
                type="submit"
                form=""
                onClick={handleSubmit as any}
                disabled={submitting}
                className="w-full mt-6 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition text-sm"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Proceed to Pay'
                )}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                By proceeding, you agree to our terms of service and cancellation policy.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
