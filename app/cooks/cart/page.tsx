'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import { CartItem, getCart, removeFromCart, clearCart, getCartTotal } from '@/lib/cookCart';

export default function CookCartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<{ itemId: string; status: 'success' | 'error'; message: string; booking?: any }[]>([]);

  useEffect(() => {
    setCart(getCart());
    const handler = () => setCart(getCart());
    window.addEventListener('cart-updated', handler);
    return () => window.removeEventListener('cart-updated', handler);
  }, []);

  function handleRemove(id: string) {
    removeFromCart(id);
  }

  async function handleCheckout() {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/auth'); return; }

    setChecking(true);
    const checkoutResults: typeof results = [];

    for (const item of cart) {
      try {
        let booking: any;
        if (item.serviceType === 'MONTHLY') {
          booking = await api.createChefSubscription({
            chefId: item.chefId,
            plan: item.plan || 'Full Day',
            mealsPerDay: item.mealsPerDay || 2,
            mealTypes: item.mealTypes || 'Lunch, Dinner',
            schedule: item.schedule || 'Mon-Sat',
            monthlyRatePaise: item.estimatedPricePaise,
            startDate: item.serviceDate,
            address: item.address || '',
            city: item.city || '',
            locality: item.locality || '',
            pincode: item.pincode || '',
            specialRequests: item.specialRequests || '',
            dietaryPreferences: item.dietaryPreferences || '',
            customerName: item.customerName || '',
          }, token);
          checkoutResults.push({ itemId: item.id, status: 'success', message: `Subscribed! Ref: ${booking.subscriptionRef}`, booking });
        } else if (item.serviceType === 'EVENT') {
          booking = await api.createEventBooking({
            chefId: item.chefId,
            eventType: item.eventType || 'Party',
            eventDate: item.serviceDate,
            eventTime: item.serviceTime || '19:00',
            durationHours: item.durationHours || 4,
            guestCount: item.guestsCount,
            venueAddress: item.venueAddress || item.address || '',
            city: item.city || '',
            locality: item.locality || '',
            pincode: item.pincode || '',
            menuDescription: item.menuDescription || '',
            cuisinePreferences: item.cuisinePreferences || '',
            decorationRequired: item.decorationRequired || false,
            cakeRequired: item.cakeRequired || false,
            staffRequired: item.staffRequired || false,
            staffCount: item.staffCount || 0,
            specialRequests: item.specialRequests || '',
            customerName: item.customerName || '',
            customerPhone: item.customerPhone || '',
            customerEmail: item.customerEmail || '',
          }, token);
          checkoutResults.push({ itemId: item.id, status: 'success', message: `Event inquiry sent! Ref: ${booking.bookingRef}`, booking });
        } else {
          booking = await api.bookChef({
            chefId: item.chefId,
            serviceType: item.serviceType,
            mealType: item.mealType || 'LUNCH',
            serviceDate: item.serviceDate,
            serviceTime: item.serviceTime,
            guestsCount: item.guestsCount,
            numberOfMeals: item.numberOfMeals,
            menuId: item.menuId || undefined,
            specialRequests: item.specialRequests || '',
            address: item.address || '',
            city: item.city || '',
            locality: item.locality || '',
            pincode: item.pincode || '',
            customerName: item.customerName || '',
            customerPhone: item.customerPhone || '',
          }, token);
          checkoutResults.push({ itemId: item.id, status: 'success', message: `Booked! Ref: ${booking.bookingRef}`, booking });
        }
      } catch (err: any) {
        checkoutResults.push({ itemId: item.id, status: 'error', message: err.message || 'Failed to book' });
      }
    }

    setResults(checkoutResults);
    const successCount = checkoutResults.filter(r => r.status === 'success').length;
    if (successCount > 0) {
      clearCart();
    }
    setChecking(false);
  }

  const total = getCartTotal(cart);

  if (results.length > 0) {
    const successCount = results.filter(r => r.status === 'success').length;
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl border p-8 text-center">
            <span className="text-5xl block mb-4">{successCount === results.length ? '🎉' : '⚠️'}</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {successCount === results.length ? 'All Bookings Created!' : `${successCount} of ${results.length} Booked`}
            </h2>
            <div className="space-y-3 mt-6 text-left">
              {results.map((r, i) => (
                <div key={i} className={`rounded-xl p-4 ${r.status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2">
                    <span>{r.status === 'success' ? '✅' : '❌'}</span>
                    <span className={`text-sm font-medium ${r.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>{r.message}</span>
                  </div>
                  {r.booking && (
                    <p className="text-xs text-gray-500 mt-1">
                      {r.booking.chefName} | {r.booking.serviceDate} | {formatPaise(r.booking.totalAmountPaise)} (10% advance: {formatPaise(r.booking.advanceAmountPaise)})
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-8 justify-center">
              <Link href="/cooks/my-bookings"
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition">
                View My Bookings
              </Link>
              <Link href="/cooks"
                className="border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-xl transition">
                Browse More Cooks
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Cook Cart</h1>
            <p className="text-sm text-gray-500">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/cooks/my-bookings" className="text-sm text-orange-500 hover:underline font-medium">
            My Bookings →
          </Link>
        </div>

        {cart.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <span className="text-5xl block mb-4">🛒</span>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Cart is empty</h2>
            <p className="text-sm text-gray-500 mb-6">Add cook bookings from chef profiles to get started.</p>
            <Link href="/cooks" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition">
              Browse Cooks
            </Link>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-3 mb-6">
              {cart.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border p-5 hover:shadow-sm transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{item.serviceType === 'EVENT' ? '🎪' : item.serviceType === 'MONTHLY' ? '📅' : '👨‍🍳'}</span>
                        <p className="font-semibold text-gray-900">{item.chefName}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          item.serviceType === 'EVENT' ? 'bg-purple-100 text-purple-600' :
                          item.serviceType === 'MONTHLY' ? 'bg-green-100 text-green-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>{item.serviceType}</span>
                      </div>
                      {item.serviceType === 'DAILY' && (
                        <p className="text-xs text-gray-500">
                          {item.serviceDate} at {item.serviceTime} | {item.mealType} | {item.guestsCount} guest{item.guestsCount !== 1 ? 's' : ''}
                          {item.numberOfMeals > 1 ? ` | ${item.numberOfMeals} meals` : ''}
                        </p>
                      )}
                      {item.serviceType === 'MONTHLY' && (
                        <p className="text-xs text-gray-500">
                          Start: {item.serviceDate} | {item.mealsPerDay || 2} meals/day | {item.schedule || 'Mon-Sat'} | {item.mealTypes || 'Lunch, Dinner'}
                        </p>
                      )}
                      {item.serviceType === 'EVENT' && (
                        <p className="text-xs text-gray-500">
                          {item.eventType || 'Event'} | {item.serviceDate} at {item.serviceTime} | {item.guestsCount} guests | {item.durationHours || 4}h
                        </p>
                      )}
                      {item.menuName && <p className="text-xs text-gray-500">Menu: {item.menuName}</p>}
                      {item.city && <p className="text-xs text-gray-400">{item.venueAddress || item.address ? (item.venueAddress || item.address) + ', ' : ''}{item.city}</p>}
                      {item.specialRequests && <p className="text-xs text-orange-600 mt-1 italic">"{item.specialRequests}"</p>}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-gray-900">{formatPaise(item.estimatedPricePaise)}</p>
                      <p className="text-xs text-green-600">
                        {item.serviceType === 'EVENT' ? `Advance (50%): ${formatPaise(item.estimatedPricePaise * 50 / 100)}` :
                         item.serviceType === 'MONTHLY' ? 'Monthly recurring' :
                         `Advance (10%): ${formatPaise(Math.max(item.estimatedPricePaise * 10 / 100, 100))}`}
                      </p>
                      <button onClick={() => handleRemove(item.id)}
                        className="text-xs text-red-500 hover:text-red-700 mt-2 font-medium">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary + Checkout */}
            <div className="bg-white rounded-2xl border p-6 sticky bottom-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">{cart.length} booking{cart.length !== 1 ? 's' : ''}</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPaise(total)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Advance varies by type</p>
                  <p className="text-sm font-semibold text-green-600">
                    Est. advance: {formatPaise(cart.reduce((s, i) => {
                      if (i.serviceType === 'EVENT') return s + i.estimatedPricePaise * 50 / 100;
                      if (i.serviceType === 'MONTHLY') return s + i.estimatedPricePaise;
                      return s + Math.max(i.estimatedPricePaise * 10 / 100, 100);
                    }, 0))}
                  </p>
                </div>
              </div>
              <button onClick={handleCheckout} disabled={checking}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition text-lg disabled:opacity-50">
                {checking ? 'Booking...' : `Checkout (${cart.length} item${cart.length !== 1 ? 's' : ''})`}
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                Daily: 10% advance, balance at service | Event: 50% advance | Monthly: full month upfront
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
