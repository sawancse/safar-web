'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';

const CITIES = ['All Cities', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Delhi', 'Kolkata'];

export default function DesignersPage() {
  const [designers, setDesigners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => { loadDesigners(); }, [selectedCity]);

  async function loadDesigners() {
    setLoading(true);
    try {
      const list = await api.getInteriorDesigners(selectedCity || undefined);
      setDesigners(Array.isArray(list) ? list : []);
    } catch { setDesigners([]); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/services/interiors" className="text-sm text-orange-500 hover:underline mb-2 block">&larr; Home Interiors</Link>
          <h1 className="text-2xl font-bold text-gray-900">Interior Designers</h1>
          <p className="text-gray-500 mt-1">Verified professionals for your home transformation</p>
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

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : designers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No designers found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designers.map((d: any) => (
              <Link key={d.id} href={`/services/interiors/designers/${d.id}`}
                    className="bg-white rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition overflow-hidden block">
                {/* Portfolio preview */}
                {d.portfolioUrls && d.portfolioUrls.length > 0 ? (
                  <div className="h-40 overflow-hidden">
                    <img src={d.portfolioUrls[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
                    <span className="text-4xl">🎨</span>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold flex-shrink-0">
                      {d.profilePhotoUrl ? <img src={d.profilePhotoUrl} alt="" className="w-10 h-10 rounded-full object-cover" /> : d.fullName?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{d.fullName}</h3>
                      {d.companyName && <p className="text-xs text-gray-400">{d.companyName}</p>}
                    </div>
                    {d.verified && <span className="ml-auto text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Verified</span>}
                  </div>
                  <p className="text-sm text-gray-500">{d.city}{d.state ? `, ${d.state}` : ''}</p>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                    {d.experienceYears && <span>{d.experienceYears} yrs</span>}
                    {d.completedProjects != null && <span>{d.completedProjects} projects</span>}
                    {d.rating != null && <span className="text-yellow-600">{d.rating} / 5</span>}
                  </div>
                  {d.specializations && d.specializations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {d.specializations.slice(0, 3).map((s: string, i: number) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  )}
                  {d.consultationFeePaise != null && (
                    <p className="mt-3 pt-3 border-t text-sm">
                      <span className="font-semibold text-orange-600">{formatPaise(d.consultationFeePaise)}</span>
                      <span className="text-gray-400 ml-1">/ consultation</span>
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
