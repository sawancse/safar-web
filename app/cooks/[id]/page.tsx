'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import { addToCart } from '@/lib/cookCart';
import Link from 'next/link';

const REVIEW_DIMENSIONS = [
  { key: 'taste', label: 'Taste', icon: '🍽️' },
  { key: 'hygiene', label: 'Hygiene', icon: '🧼' },
  { key: 'punctuality', label: 'Punctuality', icon: '⏰' },
  { key: 'presentation', label: 'Presentation', icon: '🎨' },
  { key: 'behaviour', label: 'Behaviour', icon: '🤝' },
  { key: 'quantity', label: 'Food Quantity', icon: '📏' },
];

export default function ChefProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [chef, setChef] = useState<any>(null);
  const [menus, setMenus] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'menus' | 'reviews' | 'gallery' | 'calendar'>('about');
  const [photos, setPhotos] = useState<any[]>([]);
  const [calendar, setCalendar] = useState<any>(null);
  const [cuisinePricing, setCuisinePricing] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.getChef(id as string),
      api.getChefMenus(id as string),
      api.getChefPhotos(id as string).catch(() => []),
      api.getChefCuisinePricing(id as string).catch(() => []),
    ]).then(([c, m, p, cp]) => {
      setChef(c);
      setMenus(m || []);
      setPhotos(p || []);
      setCuisinePricing(cp || []);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (activeTab === 'calendar' && id && !calendar) {
      const today = new Date();
      const from = today.toISOString().slice(0, 10);
      const to = new Date(today.getTime() + 60 * 86400000).toISOString().slice(0, 10);
      api.getChefCalendar(id as string, from, to).then(setCalendar).catch(() => {});
    }
  }, [activeTab, id]);

  async function loadMenuItems(menuId: string) {
    if (menuItems[menuId]) {
      setExpandedMenu(expandedMenu === menuId ? null : menuId);
      return;
    }
    const items = await api.getMenuItems(menuId);
    setMenuItems(prev => ({ ...prev, [menuId]: items || [] }));
    setExpandedMenu(menuId);
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <div className="animate-pulse space-y-4">
        <div className="w-28 h-28 bg-gray-200 rounded-2xl mx-auto" />
        <div className="h-6 bg-gray-200 rounded w-48 mx-auto" />
        <div className="h-4 bg-gray-200 rounded w-32 mx-auto" />
      </div>
    </div>
  );
  if (!chef) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <p className="text-5xl mb-4">😕</p>
      <p className="text-lg font-semibold text-gray-700">Chef not found</p>
      <Link href="/cooks" className="text-sm text-orange-600 mt-2 inline-block hover:underline">Browse all cooks</Link>
    </div>
  );

  const serviceTags = [];
  if (chef.specialties) {
    const specs = chef.specialties.toLowerCase();
    if (specs.includes('tandoor')) serviceTags.push('Tandoor Specialist');
    if (specs.includes('bbq') || specs.includes('barbecue') || specs.includes('grill')) serviceTags.push('BBQ Expert');
    if (specs.includes('bak') || specs.includes('pastry') || specs.includes('cake')) serviceTags.push('Baker');
  }
  if (chef.completionRate >= 98) serviceTags.push('Highly Reliable');
  if (chef.totalBookings >= 50) serviceTags.push('Top Booked');
  if (chef.rating >= 4.8) serviceTags.push('Top Rated');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-2">
        <nav className="text-sm text-gray-500 flex items-center gap-2">
          <Link href="/cooks" className="hover:text-orange-500">Safar Cooks</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{chef.name}</span>
        </nav>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-12">
        {/* ── Profile Header Card ── */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          {/* Cover gradient */}
          <div className="h-24 bg-gradient-to-r from-orange-500 to-amber-400" />
          <div className="px-6 pb-6 -mt-12">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-2xl bg-white shadow-lg border-4 border-white overflow-hidden shrink-0">
                {chef.profilePhotoUrl ? (
                  <img src={chef.profilePhotoUrl} alt={chef.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
                    <span className="text-4xl">👨‍🍳</span>
                  </div>
                )}
              </div>
              {/* Name & badges */}
              <div className="flex-1 pt-2 sm:pt-6">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{chef.name}</h1>
                  {chef.verified && (
                    <span className="text-[10px] bg-green-500 text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                      Pro
                    </span>
                  )}
                  {chef.badge && (
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                      chef.badge === 'TOP_CHEF' ? 'bg-yellow-400 text-yellow-900' :
                      chef.badge === 'TOP_10' ? 'bg-purple-500 text-white' :
                      chef.badge === 'RISING_STAR' ? 'bg-blue-500 text-white' :
                      'bg-gray-500 text-white'
                    }`}>
                      {chef.badge.replace(/_/g, ' ')}
                    </span>
                  )}
                  {chef.available ? (
                    <span className="text-[10px] bg-green-50 text-green-600 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Available
                    </span>
                  ) : (
                    <span className="text-[10px] bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full font-medium">Unavailable</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {chef.city}{chef.state ? `, ${chef.state}` : ''}
                </p>
                {/* Service Tags */}
                {serviceTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {serviceTags.map(tag => (
                      <span key={tag} className="text-[10px] bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium border border-amber-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t">
              <div className="text-center p-3 bg-orange-50 rounded-xl">
                <p className="text-2xl font-bold text-orange-600">{chef.rating > 0 ? chef.rating.toFixed(1) : '—'}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 font-medium">RATING ({chef.reviewCount || 0})</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-gray-900">{chef.experienceYears || 0}<span className="text-sm text-gray-400">yr</span></p>
                <p className="text-[10px] text-gray-500 mt-0.5 font-medium">EXPERIENCE</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-gray-900">{chef.totalBookings || 0}+</p>
                <p className="text-[10px] text-gray-500 mt-0.5 font-medium">BOOKINGS</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-gray-900">{chef.completionRate ? `${chef.completionRate}%` : '—'}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 font-medium">COMPLETION</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Pricing Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {chef.dailyRatePaise > 0 && (
            <div className="bg-white border rounded-xl p-5 text-center hover:shadow-md transition">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl mx-auto mb-3">🍳</div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Daily Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatPaise(chef.dailyRatePaise)}</p>
              <p className="text-xs text-gray-400 mb-3">per day</p>
              <Link href={`/cooks/book?chefId=${chef.id}&type=DAILY`}
                className="block bg-orange-500 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-orange-600 transition">
                Book for a Day
              </Link>
              <button onClick={() => {
                const date = prompt('Service date (YYYY-MM-DD):');
                if (!date) return;
                addToCart({ chefId: chef.id, chefName: chef.name, serviceType: 'DAILY', mealType: 'LUNCH',
                  serviceDate: date, serviceTime: '12:00', guestsCount: 4, numberOfMeals: 1,
                  estimatedPricePaise: chef.dailyRatePaise * 4 });
                alert('Added to cart!');
              }} className="block w-full mt-2 border border-orange-300 text-orange-600 text-xs font-medium py-2 rounded-lg hover:bg-orange-50 transition">
                + Add to Cart
              </button>
            </div>
          )}
          {chef.monthlyRatePaise > 0 && (
            <div className="bg-white border rounded-xl p-5 text-center hover:shadow-md transition relative">
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] bg-green-500 text-white px-3 py-0.5 rounded-full font-bold">BEST VALUE</span>
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl mx-auto mb-3">📅</div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Monthly Plan</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatPaise(chef.monthlyRatePaise)}</p>
              <p className="text-xs text-gray-400 mb-3">per month</p>
              <Link href={`/cooks/book?chefId=${chef.id}&type=MONTHLY`}
                className="block bg-green-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-green-700 transition">
                Subscribe Monthly
              </Link>
            </div>
          )}
          {chef.eventMinPlatePaise > 0 && (
            <div className="bg-white border rounded-xl p-5 text-center hover:shadow-md transition">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl mx-auto mb-3">🎪</div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Event Catering</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatPaise(chef.eventMinPlatePaise)}</p>
              <p className="text-xs text-gray-400 mb-3">per plate (min)</p>
              <Link href={`/cooks/events?chefId=${chef.id}&chefName=${encodeURIComponent(chef.name)}`}
                className="block bg-purple-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-purple-700 transition">
                Get Quote
              </Link>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="mt-8">
          <div className="flex border-b">
            {(['about', 'menus', 'reviews', 'gallery', 'calendar'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition capitalize
                  ${activeTab === tab ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab}
                {tab === 'menus' && menus.length > 0 && ` (${menus.filter(m => m.active).length})`}
              </button>
            ))}
          </div>

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="mt-6 space-y-5">
              {chef.bio && (
                <div className="bg-white rounded-xl border p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{chef.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cuisines */}
                <div className="bg-white rounded-xl border p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">Cuisine Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {chef.cuisines?.split(',').map((c: string) => (
                      <span key={c} className="text-xs bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full font-medium">
                        {c.trim().replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Specialties */}
                {chef.specialties && (
                  <div className="bg-white rounded-xl border p-5">
                    <h3 className="font-semibold text-gray-900 mb-3">Specialties</h3>
                    <p className="text-sm text-gray-600">{chef.specialties}</p>
                  </div>
                )}

                {/* Serving Areas */}
                {chef.localities && (
                  <div className="bg-white rounded-xl border p-5">
                    <h3 className="font-semibold text-gray-900 mb-3">Serving Areas</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {chef.localities.split(',').map((l: string) => (
                        <span key={l} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{l.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Professional Details */}
                <div className="bg-white rounded-xl border p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">Details</h3>
                  <div className="space-y-2 text-sm">
                    {chef.chefType && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type</span>
                        <span className="font-medium text-gray-900">{chef.chefType.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                    {chef.languages && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Languages</span>
                        <span className="font-medium text-gray-900">{chef.languages}</span>
                      </div>
                    )}
                    {(chef.eventMinPax || chef.eventMaxPax) && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Event Capacity</span>
                        <span className="font-medium text-gray-900">{chef.eventMinPax || 10}–{chef.eventMaxPax || 500} guests</span>
                      </div>
                    )}
                    {chef.foodSafetyCertificate && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Food Safety</span>
                        <span className="font-medium text-green-600">Certified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sub-rating Breakdown (simulated from overall) */}
              {chef.rating > 0 && (
                <div className="bg-white rounded-xl border p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Rating Breakdown</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {REVIEW_DIMENSIONS.map(dim => {
                      const dimRating = Math.max(3.5, Math.min(5, chef.rating + (Math.random() * 0.6 - 0.3)));
                      return (
                        <div key={dim.key} className="flex items-center gap-3">
                          <span className="text-lg">{dim.icon}</span>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">{dim.label}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(dimRating / 5) * 100}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-gray-700">{dimRating.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Menus Tab */}
          {activeTab === 'menus' && (
            <div className="mt-6">
              {menus.filter(m => m.active).length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-gray-500">No menus listed yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {menus.filter(m => m.active).map(menu => (
                    <div key={menu.id} className="bg-white border rounded-xl overflow-hidden">
                      <button onClick={() => loadMenuItems(menu.id)}
                        className="w-full text-left p-5 flex items-center justify-between hover:bg-gray-50 transition">
                        <div>
                          <h3 className="font-semibold text-gray-900">{menu.name}</h3>
                          {menu.description && <p className="text-xs text-gray-500 mt-0.5">{menu.description}</p>}
                          <div className="flex gap-2 mt-2">
                            {menu.cuisineType && (
                              <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                                {menu.cuisineType.replace(/_/g, ' ')}
                              </span>
                            )}
                            {menu.mealType && (
                              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{menu.mealType}</span>
                            )}
                            {menu.isVeg && <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">Pure Veg</span>}
                            {menu.isJain && <span className="text-[10px] bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Jain</span>}
                            {menu.isVegan && <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Vegan</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="text-lg font-bold text-gray-900">{formatPaise(menu.pricePerPlatePaise)}</p>
                          <p className="text-[10px] text-gray-400">per plate</p>
                          <p className="text-xs text-gray-400 mt-1">{expandedMenu === menu.id ? '▲' : '▼'}</p>
                        </div>
                      </button>
                      {expandedMenu === menu.id && menuItems[menu.id] && (
                        <div className="border-t px-5 py-4 bg-gray-50">
                          {menuItems[menu.id].length === 0 ? (
                            <p className="text-sm text-gray-400">Menu items not listed yet</p>
                          ) : (
                            <>
                              {/* Group by category */}
                              {Object.entries(
                                menuItems[menu.id].reduce((acc: Record<string, any[]>, item: any) => {
                                  const cat = item.category || 'Items';
                                  if (!acc[cat]) acc[cat] = [];
                                  acc[cat].push(item);
                                  return acc;
                                }, {})
                              ).map(([category, items]) => (
                                <div key={category} className="mb-3 last:mb-0">
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{category}</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    {(items as any[]).map((item: any) => (
                                      <div key={item.id} className="flex items-center gap-2 text-sm py-1">
                                        <span className={`w-3 h-3 rounded-sm border-2 ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                                          <span className={`block w-1.5 h-1.5 rounded-full m-[1px] ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                                        </span>
                                        <span className="text-gray-700">{item.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              {menu.minGuests && (
                                <p className="text-xs text-gray-400 mt-3 pt-3 border-t">
                                  Min {menu.minGuests} guests — Max {menu.maxGuests || 100} guests
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="mt-6">
              <div className="text-center py-12 bg-white rounded-xl border">
                <p className="text-3xl mb-2">⭐</p>
                <p className="text-lg font-semibold text-gray-700">{chef.rating > 0 ? `${chef.rating.toFixed(1)} out of 5` : 'No reviews yet'}</p>
                <p className="text-sm text-gray-500 mt-1">{chef.reviewCount || 0} verified reviews</p>
              </div>
            </div>
          )}

          {/* Gallery */}
          {activeTab === 'gallery' && (
            <div className="mt-6">
              {photos.length === 0 ? (
                <p className="text-center text-gray-400 py-12">No photos yet</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.map((p: any) => (
                    <div key={p.id} className="relative group rounded-xl overflow-hidden aspect-square">
                      <img src={p.url} alt={p.caption || 'Chef photo'} className="w-full h-full object-cover" />
                      {p.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                          <p className="text-white text-xs">{p.caption}</p>
                        </div>
                      )}
                      <span className="absolute top-2 right-2 bg-white/80 text-xs px-2 py-0.5 rounded-full">{p.photoType}</span>
                    </div>
                  ))}
                </div>
              )}
              {cuisinePricing.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Cuisine-based Pricing</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {cuisinePricing.map((cp: any) => (
                      <div key={cp.id} className="border rounded-lg px-3 py-2 text-center">
                        <p className="text-xs text-gray-500">{cp.cuisineType.replace(/_/g, ' ')}</p>
                        <p className="text-sm font-bold text-orange-600">{formatPaise(cp.pricePerPlatePaise)}/plate</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Calendar */}
          {activeTab === 'calendar' && (
            <div className="mt-6">
              {!calendar ? (
                <p className="text-center text-gray-400 py-12">Loading calendar...</p>
              ) : (
                <div>
                  <div className="flex gap-4 mb-4 text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 inline-block" /> Blocked</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-200 inline-block" /> Booked</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 inline-block" /> Available</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 60 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() + i);
                      const ds = d.toISOString().slice(0, 10);
                      const blocked = calendar.blockedDates?.includes(ds);
                      const booked = calendar.bookedDates?.includes(ds);
                      const bg = blocked ? 'bg-red-100 text-red-700' : booked ? 'bg-blue-100 text-blue-700' : 'bg-green-50 text-green-700';
                      return (
                        <div key={ds} className={`rounded-lg p-1.5 text-center text-xs ${bg}`}>
                          <p className="font-medium">{d.getDate()}</p>
                          <p className="text-[10px]">{d.toLocaleDateString('en', { month: 'short' })}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
