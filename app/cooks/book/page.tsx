'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import RazorpayButton from '@/components/RazorpayButton';

export default function BookCookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chefId = searchParams.get('chefId') || '';
  const serviceType = searchParams.get('type') || 'DAILY';

  const [chef, setChef] = useState<any>(null);
  const [menus, setMenus] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [token, setToken] = useState('');

  // Form state
  const [mealType, setMealType] = useState('LUNCH');
  const [serviceDate, setServiceDate] = useState('');
  const [serviceTime, setServiceTime] = useState('12:00');
  const [guestsCount, setGuestsCount] = useState(4);
  const [numberOfMeals, setNumberOfMeals] = useState(1);
  const [menuId, setMenuId] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [locality, setLocality] = useState('');
  const [pincode, setPincode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  // Subscription fields
  const [plan, setPlan] = useState('Full Day');
  const [mealsPerDay, setMealsPerDay] = useState(2);
  const [schedule, setSchedule] = useState('Mon-Sat');
  const [startDate, setStartDate] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState('');
  // Event fields
  const [eventType, setEventType] = useState('Birthday');
  const [durationHours, setDurationHours] = useState(4);
  const [menuDescription, setMenuDescription] = useState('');
  const [cuisinePreferences, setCuisinePreferences] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('access_token') || '';
    setToken(t);
    if (!chefId) return;
    Promise.all([api.getChef(chefId), api.getChefMenus(chefId)])
      .then(([c, m]) => { setChef(c); setMenus(m || []); if (c?.city) setCity(c.city); })
      .catch(() => {});
  }, [chefId]);

  // Calculate estimated price for display
  function getEstimatedTotal(): number {
    if (!chef) return 0;
    const guests = guestsCount || 1;
    const meals = numberOfMeals || 1;
    if (menuId && menus.length > 0) {
      const menu = menus.find(m => m.id === menuId);
      if (menu) return menu.pricePerPlatePaise * guests * meals;
    }
    if (chef.dailyRatePaise) return chef.dailyRatePaise * guests * meals;
    return 0;
  }

  const estimatedTotal = getEstimatedTotal();
  const advanceAmount = Math.max(Math.round(estimatedTotal * 10 / 100), 100);
  const balanceAmount = estimatedTotal - advanceAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = localStorage.getItem('access_token');
    if (!t) { router.push('/auth'); return; }
    setSaving(true); setError(''); setSuccess('');

    try {
      if (serviceType === 'DAILY') {
        // Create booking (status will be PENDING_PAYMENT)
        const result = await api.bookChef({
          chefId, serviceType: 'DAILY', mealType, serviceDate, serviceTime,
          guestsCount, numberOfMeals, menuId: menuId || null,
          specialRequests, address, city, locality, pincode, customerName, customerPhone,
        }, t);
        // Show payment step
        setBooking(result);
      } else if (serviceType === 'MONTHLY') {
        await api.createChefSubscription({
          chefId, plan, mealsPerDay, mealTypes: mealType, schedule,
          monthlyRatePaise: chef?.monthlyRatePaise || 0, startDate: startDate || serviceDate,
          address, city, locality, pincode, specialRequests, dietaryPreferences, customerName,
        }, t);
        setSuccess('Subscription created! Your meals will start on the selected date.');
      } else if (serviceType === 'EVENT') {
        await api.createEventBooking({
          chefId, eventType, eventDate: serviceDate, eventTime: serviceTime,
          durationHours, guestCount: guestsCount, venueAddress: address,
          city, locality, pincode, menuDescription, cuisinePreferences,
          specialRequests, customerName, customerPhone, customerEmail,
        }, t || undefined);
        setSuccess('Event inquiry submitted! The cook will send you a quote.');
      }
    } catch (err: any) {
      setError(err.message || 'Booking failed');
    }
    setSaving(false);
  }

  async function handlePaymentSuccess(razorpayPaymentId: string, razorpayOrderId?: string) {
    if (!booking) return;
    const t = localStorage.getItem('access_token');
    if (!t) return;

    try {
      const orderId = razorpayOrderId || booking.razorpayOrderId || 'mock_order_' + Date.now();
      await api.confirmChefBookingPayment(booking.id, orderId, razorpayPaymentId, t);
      setBooking({ ...booking, paymentStatus: 'ADVANCE_PAID', status: 'PENDING' });
      setSuccess('Payment successful! Your booking is confirmed. The cook will accept shortly.');
    } catch (err: any) {
      setError(err.message || 'Payment confirmation failed. Please contact support.');
    }
  }

  if (!chef) return <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-pulse text-5xl">&#x1F468;&#x200D;&#x1F373;</div>;

  const typeLabel = serviceType === 'MONTHLY' ? 'Subscribe to Meals' : serviceType === 'EVENT' ? 'Book for Event' : 'Book a Cook';

  // After successful payment
  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{typeLabel}</h1>
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">&#x2705;</div>
          <p className="font-semibold text-green-800 mb-2">{success}</p>
          {booking && serviceType === 'DAILY' && (
            <div className="bg-white rounded-lg border border-green-100 p-4 mt-4 text-left space-y-2">
              <h3 className="font-semibold text-gray-900 text-sm">Payment Breakdown</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-medium">{formatPaise(booking.totalAmountPaise)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Advance Paid (10%)</span>
                <span className="font-medium text-green-700">{formatPaise(booking.advanceAmountPaise)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-orange-700 font-medium">Balance Due (at service)</span>
                <span className="font-bold text-orange-700">{formatPaise(booking.balanceAmountPaise)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Remaining amount to be paid directly to the cook at the time of service.
              </p>
            </div>
          )}
          <button onClick={() => router.push('/cooks/my-bookings')}
            className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600">
            View My Bookings
          </button>
        </div>
      </div>
    );
  }

  // Payment step: booking created, now pay 10% advance
  if (booking && booking.status === 'PENDING_PAYMENT' && serviceType === 'DAILY') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pay Advance to Confirm</h1>
        <div className="flex items-center gap-3 mb-6 p-3 bg-orange-50 rounded-xl">
          <span className="text-3xl">&#x1F468;&#x200D;&#x1F373;</span>
          <div>
            <p className="font-semibold">{chef.name}</p>
            <p className="text-xs text-gray-500">{chef.cuisines} - {chef.city}</p>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

        {/* Booking Summary */}
        <div className="border rounded-xl p-4 mb-6 space-y-3">
          <h3 className="font-semibold text-gray-900">Booking Summary</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-500">Booking Ref</span>
            <span className="font-medium text-right">{booking.bookingRef}</span>
            <span className="text-gray-500">Service Date</span>
            <span className="font-medium text-right">{booking.serviceDate}</span>
            <span className="text-gray-500">Time</span>
            <span className="font-medium text-right">{booking.serviceTime}</span>
            <span className="text-gray-500">Meal Type</span>
            <span className="font-medium text-right">{booking.mealType}</span>
            <span className="text-gray-500">Guests</span>
            <span className="font-medium text-right">{booking.guestsCount}</span>
            {booking.menuName && (
              <>
                <span className="text-gray-500">Menu</span>
                <span className="font-medium text-right">{booking.menuName}</span>
              </>
            )}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="border rounded-xl p-4 mb-6 space-y-3 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Price Breakdown</h3>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Amount</span>
            <span className="font-semibold">{formatPaise(booking.totalAmountPaise)}</span>
          </div>
          <div className="border-t pt-2 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-700 font-medium">Pay Now (10% Advance)</span>
              <span className="font-bold text-green-700 text-lg">{formatPaise(booking.advanceAmountPaise)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pay Later (at service)</span>
              <span className="font-medium text-gray-500">{formatPaise(booking.balanceAmountPaise)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Pay just 10% now to confirm your booking. The remaining 90% is to be paid directly to the cook at the time of service.
          </p>
        </div>

        {/* Razorpay Payment Button */}
        <RazorpayButton
          bookingId={booking.id}
          amountPaise={booking.advanceAmountPaise}
          token={token}
          description="Cook Booking - 10% Advance"
          onSuccess={handlePaymentSuccess}
        />

        <button onClick={() => { setBooking(null); setError(''); }}
          className="w-full mt-3 text-gray-500 text-sm py-2 hover:text-gray-700 transition">
          Go back and edit booking
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{typeLabel}</h1>
      <div className="flex items-center gap-3 mb-6 p-3 bg-orange-50 rounded-xl">
        <span className="text-3xl">&#x1F468;&#x200D;&#x1F373;</span>
        <div>
          <p className="font-semibold">{chef.name}</p>
          <p className="text-xs text-gray-500">{chef.cuisines} - {chef.city}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2">{error}</div>}

        {/* Service Type Tabs */}
        <div className="flex gap-2">
          {['DAILY', 'MONTHLY', 'EVENT'].map(t => (
            <button key={t} type="button" onClick={() => router.push(`/cooks/book?chefId=${chefId}&type=${t}`)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition
                ${serviceType === t ? 'bg-orange-50 border-orange-500 text-orange-600' : 'border-gray-200 text-gray-600'}`}>
              {t === 'DAILY' ? 'One Day' : t === 'MONTHLY' ? 'Monthly' : 'Event'}
            </button>
          ))}
        </div>

        {/* Common Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Your Name *</label>
            <input required value={customerName} onChange={e => setCustomerName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Full name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
            <input required value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="+91..." />
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{serviceType === 'MONTHLY' ? 'Start Date' : serviceType === 'EVENT' ? 'Event Date' : 'Service Date'} *</label>
            <input type="date" required value={serviceType === 'MONTHLY' ? startDate : serviceDate}
              onChange={e => serviceType === 'MONTHLY' ? setStartDate(e.target.value) : setServiceDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          {serviceType !== 'MONTHLY' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
              <input type="time" value={serviceTime} onChange={e => setServiceTime(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          )}
        </div>

        {/* Meal Type */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Meal Type</label>
          <div className="flex gap-2">
            {['BREAKFAST', 'LUNCH', 'DINNER', 'ALL_DAY'].map(m => (
              <button key={m} type="button" onClick={() => setMealType(m)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition
                  ${mealType === m ? 'bg-orange-50 border-orange-500 text-orange-600' : 'border-gray-200 text-gray-600'}`}>
                {m.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Guests */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{serviceType === 'EVENT' ? 'Guest Count' : 'Guests'} *</label>
            <input type="number" min={1} value={guestsCount} onChange={e => setGuestsCount(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          {serviceType === 'EVENT' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Duration (hours)</label>
              <input type="number" min={1} value={durationHours} onChange={e => setDurationHours(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          )}
          {serviceType === 'MONTHLY' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Meals per Day</label>
              <select value={mealsPerDay} onChange={e => setMealsPerDay(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value={1}>1 meal</option>
                <option value={2}>2 meals</option>
                <option value={3}>3 meals</option>
              </select>
            </div>
          )}
        </div>

        {/* Event specific */}
        {serviceType === 'EVENT' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Event Type</label>
                <select value={eventType} onChange={e => setEventType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  {['Birthday', 'Wedding', 'Corporate', 'Housewarming', 'Anniversary', 'Festival', 'Other'].map(t =>
                    <option key={t} value={t}>{t}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="For quote details" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Menu Description</label>
              <textarea value={menuDescription} onChange={e => setMenuDescription(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Describe the menu you'd like..." />
            </div>
          </>
        )}

        {/* Menu selection (for daily bookings) */}
        {serviceType === 'DAILY' && menus.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Select Menu (optional)</label>
            <select value={menuId} onChange={e => setMenuId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">No specific menu</option>
              {menus.map(m => <option key={m.id} value={m.id}>{m.name} — {formatPaise(m.pricePerPlatePaise)}/plate</option>)}
            </select>
          </div>
        )}

        {/* Address */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{serviceType === 'EVENT' ? 'Venue Address' : 'Delivery Address'} *</label>
          <input required value={address} onChange={e => setAddress(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Full address" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
            <input value={city} onChange={e => setCity(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Locality</label>
            <input value={locality} onChange={e => setLocality(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Pincode</label>
            <input value={pincode} onChange={e => setPincode(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" maxLength={6} />
          </div>
        </div>

        {/* Special requests */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Special Requests</label>
          <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Allergies, dietary needs, preferences..." />
        </div>

        {/* Price Preview (for DAILY bookings) */}
        {serviceType === 'DAILY' && estimatedTotal > 0 && (
          <div className="border rounded-xl p-4 bg-gray-50 space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Estimated Price</h4>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total</span>
              <span className="font-medium">{formatPaise(estimatedTotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-700">
              <span>Advance (10%)</span>
              <span className="font-semibold">{formatPaise(advanceAmount)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Pay at service (90%)</span>
              <span>{formatPaise(balanceAmount)}</span>
            </div>
            <p className="text-xs text-gray-400 pt-1">
              You only pay 10% now. Remaining 90% is paid to the cook at the time of service.
            </p>
          </div>
        )}

        <button type="submit" disabled={saving}
          className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition">
          {saving ? 'Submitting...' : serviceType === 'EVENT' ? 'Send Inquiry' : serviceType === 'MONTHLY' ? 'Start Subscription' : 'Proceed to Payment'}
        </button>
      </form>
    </div>
  );
}
