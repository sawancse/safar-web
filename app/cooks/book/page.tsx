'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';

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
    if (!chefId) return;
    Promise.all([api.getChef(chefId), api.getChefMenus(chefId)])
      .then(([c, m]) => { setChef(c); setMenus(m || []); if (c?.city) setCity(c.city); })
      .catch(() => {});
  }, [chefId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/auth'); return; }
    setSaving(true); setError(''); setSuccess('');

    try {
      if (serviceType === 'DAILY') {
        await api.bookChef({
          chefId, serviceType: 'DAILY', mealType, serviceDate, serviceTime,
          guestsCount, numberOfMeals, menuId: menuId || null,
          specialRequests, address, city, locality, pincode, customerName, customerPhone,
        }, token);
        setSuccess('Booking submitted! The cook will confirm shortly.');
      } else if (serviceType === 'MONTHLY') {
        await api.createChefSubscription({
          chefId, plan, mealsPerDay, mealTypes: mealType, schedule,
          monthlyRatePaise: chef?.monthlyRatePaise || 0, startDate: startDate || serviceDate,
          address, city, locality, pincode, specialRequests, dietaryPreferences, customerName,
        }, token);
        setSuccess('Subscription created! Your meals will start on the selected date.');
      } else if (serviceType === 'EVENT') {
        await api.createEventBooking({
          chefId, eventType, eventDate: serviceDate, eventTime: serviceTime,
          durationHours, guestCount: guestsCount, venueAddress: address,
          city, locality, pincode, menuDescription, cuisinePreferences,
          specialRequests, customerName, customerPhone, customerEmail,
        }, token);
        setSuccess('Event inquiry submitted! The cook will send you a quote.');
      }
    } catch (err: any) {
      setError(err.message || 'Booking failed');
    }
    setSaving(false);
  }

  if (!chef) return <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-pulse text-5xl">👨‍🍳</div>;

  const typeLabel = serviceType === 'MONTHLY' ? 'Subscribe to Meals' : serviceType === 'EVENT' ? 'Book for Event' : 'Book a Cook';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{typeLabel}</h1>
      <div className="flex items-center gap-3 mb-6 p-3 bg-orange-50 rounded-xl">
        <span className="text-3xl">👨‍🍳</span>
        <div>
          <p className="font-semibold">{chef.name}</p>
          <p className="text-xs text-gray-500">{chef.cuisines} - {chef.city}</p>
        </div>
      </div>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-semibold text-green-800">{success}</p>
          <button onClick={() => router.push('/cooks/my-bookings')}
            className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600">
            View My Bookings
          </button>
        </div>
      ) : (
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

          <button type="submit" disabled={saving}
            className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition">
            {saving ? 'Submitting...' : serviceType === 'EVENT' ? 'Send Inquiry' : serviceType === 'MONTHLY' ? 'Start Subscription' : 'Book Now'}
          </button>
        </form>
      )}
    </div>
  );
}
