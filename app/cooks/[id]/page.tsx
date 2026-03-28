'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import Link from 'next/link';

export default function ChefProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [chef, setChef] = useState<any>(null);
  const [menus, setMenus] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.getChef(id as string),
      api.getChefMenus(id as string),
    ]).then(([c, m]) => {
      setChef(c);
      setMenus(m || []);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function loadMenuItems(menuId: string) {
    if (menuItems[menuId]) {
      setExpandedMenu(expandedMenu === menuId ? null : menuId);
      return;
    }
    const items = await api.getMenuItems(menuId);
    setMenuItems(prev => ({ ...prev, [menuId]: items || [] }));
    setExpandedMenu(menuId);
  }

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-20 text-center"><div className="animate-pulse text-5xl">👨‍🍳</div></div>;
  if (!chef) return <div className="max-w-4xl mx-auto px-4 py-20 text-center"><p>Chef not found</p></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center overflow-hidden shrink-0">
            {chef.profilePhotoUrl ? (
              <img src={chef.profilePhotoUrl} alt={chef.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl">👨‍🍳</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{chef.name}</h1>
                <p className="text-sm text-gray-500">{chef.city}, {chef.state}</p>
              </div>
              <div className="flex gap-2">
                {chef.verified && <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Verified</span>}
                {chef.available ? (
                  <span className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full">Available</span>
                ) : (
                  <span className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full">Unavailable</span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{chef.bio}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {chef.cuisines?.split(',').map((c: string) => (
                <span key={c} className="text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full font-medium">{c.trim().replace(/_/g, ' ')}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{chef.rating > 0 ? chef.rating.toFixed(1) : '—'}</p>
            <p className="text-xs text-gray-500">Rating ({chef.reviewCount || 0} reviews)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{chef.experienceYears || 0}</p>
            <p className="text-xs text-gray-500">Years Experience</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{chef.totalBookings || 0}</p>
            <p className="text-xs text-gray-500">Bookings</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{chef.completionRate ? `${chef.completionRate}%` : '—'}</p>
            <p className="text-xs text-gray-500">Completion Rate</p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {chef.dailyRatePaise > 0 && (
          <div className="border rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Daily Rate</p>
            <p className="text-xl font-bold text-gray-900">{formatPaise(chef.dailyRatePaise)}</p>
            <Link href={`/cooks/book?chefId=${chef.id}&type=DAILY`}
              className="mt-3 block bg-orange-500 text-white text-sm font-semibold py-2 rounded-lg hover:bg-orange-600 transition">
              Book for a Day
            </Link>
          </div>
        )}
        {chef.monthlyRatePaise > 0 && (
          <div className="border rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Monthly Plan</p>
            <p className="text-xl font-bold text-gray-900">{formatPaise(chef.monthlyRatePaise)}<span className="text-sm font-normal text-gray-400">/mo</span></p>
            <Link href={`/cooks/book?chefId=${chef.id}&type=MONTHLY`}
              className="mt-3 block bg-orange-500 text-white text-sm font-semibold py-2 rounded-lg hover:bg-orange-600 transition">
              Subscribe
            </Link>
          </div>
        )}
        {chef.eventMinPlatePaise > 0 && (
          <div className="border rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Event Catering</p>
            <p className="text-xl font-bold text-gray-900">{formatPaise(chef.eventMinPlatePaise)}<span className="text-sm font-normal text-gray-400">/plate</span></p>
            <Link href={`/cooks/book?chefId=${chef.id}&type=EVENT`}
              className="mt-3 block bg-orange-500 text-white text-sm font-semibold py-2 rounded-lg hover:bg-orange-600 transition">
              Get Quote
            </Link>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {chef.specialties && (
          <div className="border rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Specialties</h3>
            <p className="text-sm text-gray-600">{chef.specialties}</p>
          </div>
        )}
        {chef.localities && (
          <div className="border rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Serving Areas</h3>
            <p className="text-sm text-gray-600">{chef.localities}</p>
          </div>
        )}
        {chef.languages && (
          <div className="border rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Languages</h3>
            <p className="text-sm text-gray-600">{chef.languages}</p>
          </div>
        )}
        {(chef.eventMinPax || chef.eventMaxPax) && (
          <div className="border rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Event Capacity</h3>
            <p className="text-sm text-gray-600">{chef.eventMinPax || 10}–{chef.eventMaxPax || 500} guests</p>
          </div>
        )}
      </div>

      {/* Menus */}
      {menus.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Menus</h2>
          <div className="space-y-3">
            {menus.filter((m: any) => m.active).map((menu: any) => (
              <div key={menu.id} className="border rounded-xl overflow-hidden">
                <button onClick={() => loadMenuItems(menu.id)}
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 transition">
                  <div>
                    <h3 className="font-semibold text-gray-900">{menu.name}</h3>
                    <div className="flex gap-2 mt-1">
                      {menu.cuisineType && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{menu.cuisineType.replace(/_/g, ' ')}</span>}
                      {menu.mealType && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{menu.mealType}</span>}
                      {menu.isVeg && <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">Veg</span>}
                      {menu.isJain && <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded">Jain</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatPaise(menu.pricePerPlatePaise)}<span className="text-xs font-normal text-gray-400">/plate</span></p>
                    <span className="text-xs text-gray-400">{expandedMenu === menu.id ? '▲' : '▼'}</span>
                  </div>
                </button>
                {expandedMenu === menu.id && menuItems[menu.id] && (
                  <div className="border-t px-4 py-3 bg-gray-50">
                    {menuItems[menu.id].length === 0 ? (
                      <p className="text-sm text-gray-400">No items listed</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {menuItems[menu.id].map((item: any) => (
                          <div key={item.id} className="flex items-center gap-2 text-sm">
                            <span className={`w-3 h-3 rounded-sm border ${item.isVeg ? 'border-green-500 bg-green-500' : 'border-red-500 bg-red-500'}`} />
                            <span className="text-gray-700">{item.name}</span>
                            {item.category && <span className="text-xs text-gray-400">({item.category})</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
