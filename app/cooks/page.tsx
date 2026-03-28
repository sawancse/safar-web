'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import Link from 'next/link';

const CUISINES = ['SOUTH_INDIAN', 'NORTH_INDIAN', 'BENGALI', 'MAHARASHTRIAN', 'GUJARATI', 'PUNJABI', 'HYDERABADI', 'KERALA', 'CHINESE', 'CONTINENTAL', 'MUGHLAI', 'STREET_FOOD'];
const CHEF_TYPES = [
  { key: 'DOMESTIC', label: 'Home Cook', icon: '🏠' },
  { key: 'PROFESSIONAL', label: 'Professional Chef', icon: '👨‍🍳' },
  { key: 'EVENT_SPECIALIST', label: 'Event Caterer', icon: '🎉' },
];
const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS', 'ALL_DAY'];

export default function CooksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chefs, setChefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [cuisine, setCuisine] = useState(searchParams.get('cuisine') || '');
  const [chefType, setChefType] = useState(searchParams.get('chefType') || '');
  const [mealType, setMealType] = useState(searchParams.get('mealType') || '');

  useEffect(() => {
    const params: Record<string, string> = { size: '20' };
    if (city) params.city = city;
    if (cuisine) params.cuisine = cuisine;
    if (chefType) params.chefType = chefType;
    if (mealType) params.mealType = mealType;

    setLoading(true);
    api.searchChefs(params)
      .then((data: any) => setChefs(data.content || data || []))
      .catch(() => setChefs([]))
      .finally(() => setLoading(false));
  }, [city, cuisine, chefType, mealType]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Safar Cooks</h1>
        <p className="text-gray-500 mt-1">Find home cooks, professional chefs & event caterers near you</p>
      </div>

      {/* Chef Type Selector */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        <button onClick={() => setChefType('')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium border whitespace-nowrap transition
            ${!chefType ? 'bg-orange-50 border-orange-500 text-orange-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          All Cooks
        </button>
        {CHEF_TYPES.map(t => (
          <button key={t.key} onClick={() => setChefType(t.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border whitespace-nowrap transition flex items-center gap-2
              ${chefType === t.key ? 'bg-orange-50 border-orange-500 text-orange-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input placeholder="City" value={city} onChange={e => setCity(e.target.value)}
          className="border rounded-xl px-3 py-2 text-sm w-40 outline-none focus:ring-2 focus:ring-orange-400" />
        <select value={cuisine} onChange={e => setCuisine(e.target.value)}
          className="border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400">
          <option value="">All Cuisines</option>
          {CUISINES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={mealType} onChange={e => setMealType(e.target.value)}
          className="border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400">
          <option value="">All Meals</option>
          {MEAL_TYPES.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : chefs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">👨‍🍳</p>
          <p className="text-lg font-medium text-gray-700">No cooks found</p>
          <p className="text-sm text-gray-500 mt-1">Try a different city or cuisine</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {chefs.map(chef => (
            <Link key={chef.id} href={`/cooks/${chef.id}`}
              className="border rounded-2xl overflow-hidden hover:shadow-lg transition group">
              {/* Photo */}
              <div className="h-40 bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
                {chef.profilePhotoUrl ? (
                  <img src={chef.profilePhotoUrl} alt={chef.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl">👨‍🍳</span>
                )}
              </div>
              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition">{chef.name}</h3>
                    <p className="text-xs text-gray-500">{chef.city}{chef.state ? `, ${chef.state}` : ''}</p>
                  </div>
                  {chef.verified && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Verified</span>}
                </div>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{chef.bio || chef.specialties || chef.cuisines}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {chef.cuisines?.split(',').slice(0, 3).map((c: string) => (
                    <span key={c} className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{c.trim().replace(/_/g, ' ')}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex items-center gap-1">
                    {chef.rating > 0 && <>
                      <span className="text-yellow-500 text-sm">&#9733;</span>
                      <span className="text-sm font-medium">{chef.rating.toFixed(1)}</span>
                      <span className="text-xs text-gray-400">({chef.reviewCount})</span>
                    </>}
                    {chef.experienceYears > 0 && <span className="text-xs text-gray-500 ml-2">{chef.experienceYears}y exp</span>}
                  </div>
                  <div className="text-right">
                    {chef.dailyRatePaise > 0 && <p className="text-sm font-bold">{formatPaise(chef.dailyRatePaise)}<span className="text-xs font-normal text-gray-400">/day</span></p>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Register CTA */}
      <div className="mt-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">Are you a cook?</h2>
        <p className="text-orange-100 mb-4">Join Safar Cooks and start earning. Register your profile today.</p>
        <Link href="/cooks/register"
          className="inline-block bg-white text-orange-600 font-semibold px-6 py-2.5 rounded-xl hover:bg-orange-50 transition">
          Register as Cook
        </Link>
      </div>
    </div>
  );
}
