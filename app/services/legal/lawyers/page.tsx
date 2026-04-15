'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';

interface Advocate {
  id: string;
  fullName: string;
  barCouncilId?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  experienceYears?: number;
  specializations?: string[];
  profilePhotoUrl?: string;
  rating?: number;
  totalCases?: number;
  completedCases?: number;
  verified?: boolean;
  consultationFeePaise?: number;
  bio?: string;
}

const CITIES = ['All Cities', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Delhi', 'Kolkata', 'Jaipur'];

export default function LawyersPage() {
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => { loadAdvocates(); }, [selectedCity]);

  async function loadAdvocates() {
    setLoading(true);
    try {
      const list = await api.getAdvocates(selectedCity || undefined);
      setAdvocates(Array.isArray(list) ? list : []);
    } catch { setAdvocates([]); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/services/legal" className="text-sm text-orange-500 hover:underline mb-2 block">&larr; Legal Services</Link>
          <h1 className="text-2xl font-bold text-gray-900">Our Legal Partners</h1>
          <p className="text-gray-500 mt-1">Verified advocates for property legal services</p>
        </div>

        {/* City Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {CITIES.map(city => (
            <button
              key={city}
              onClick={() => setSelectedCity(city === 'All Cities' ? '' : city)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                (city === 'All Cities' && !selectedCity) || city === selectedCity
                  ? 'bg-orange-500 text-white' : 'bg-white border text-gray-600 hover:border-orange-300'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : advocates.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No advocates found{selectedCity ? ` in ${selectedCity}` : ''}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advocates.map(adv => (
              <Link key={adv.id} href={`/services/legal/lawyers/${adv.id}`}
                    className="bg-white rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition p-6 block">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl flex-shrink-0">
                    {adv.profilePhotoUrl ? (
                      <img src={adv.profilePhotoUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
                    ) : adv.fullName?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{adv.fullName}</h3>
                      {adv.verified && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Verified</span>}
                    </div>
                    {adv.barCouncilId && <p className="text-xs text-gray-400 mt-0.5">Bar: {adv.barCouncilId}</p>}
                    <p className="text-sm text-gray-500 mt-1">{adv.city}{adv.state ? `, ${adv.state}` : ''}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4 text-sm">
                  {adv.experienceYears && (
                    <span className="text-gray-500">{adv.experienceYears} yrs exp</span>
                  )}
                  {adv.completedCases != null && (
                    <span className="text-gray-500">{adv.completedCases} cases</span>
                  )}
                  {adv.rating != null && (
                    <span className="text-yellow-600 font-medium">{adv.rating} / 5</span>
                  )}
                </div>

                {adv.specializations && adv.specializations.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {adv.specializations.slice(0, 3).map((s, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s}</span>
                    ))}
                    {adv.specializations.length > 3 && (
                      <span className="text-xs text-gray-400">+{adv.specializations.length - 3} more</span>
                    )}
                  </div>
                )}

                {adv.consultationFeePaise != null && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="text-sm font-semibold text-orange-600">{formatPaise(adv.consultationFeePaise)}</span>
                    <span className="text-xs text-gray-400 ml-1">/ consultation</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
