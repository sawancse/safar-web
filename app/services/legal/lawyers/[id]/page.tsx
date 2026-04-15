'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';

export default function LawyerProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [advocate, setAdvocate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdvocate(id).then(setAdvocate).catch(() => setAdvocate(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!advocate) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Advocate not found</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/services/legal/lawyers" className="text-sm text-orange-500 hover:underline mb-4 block">&larr; All Lawyers</Link>

        {/* Profile Header */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-2xl flex-shrink-0">
              {advocate.profilePhotoUrl ? (
                <img src={advocate.profilePhotoUrl} alt="" className="w-20 h-20 rounded-full object-cover" />
              ) : advocate.fullName?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{advocate.fullName}</h1>
                {advocate.verified && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>}
              </div>
              {advocate.barCouncilId && <p className="text-sm text-gray-500">Bar Council: {advocate.barCouncilId}</p>}
              <p className="text-sm text-gray-500 mt-1">{advocate.city}{advocate.state ? `, ${advocate.state}` : ''}</p>
              <div className="flex gap-4 mt-3 text-sm">
                {advocate.experienceYears && <span className="bg-gray-100 px-3 py-1 rounded-lg">{advocate.experienceYears} yrs experience</span>}
                {advocate.completedCases != null && <span className="bg-gray-100 px-3 py-1 rounded-lg">{advocate.completedCases} cases completed</span>}
                {advocate.rating != null && <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-lg">{advocate.rating} / 5 rating</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {advocate.bio && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{advocate.bio}</p>
              </div>
            )}

            {/* Specializations */}
            {advocate.specializations && advocate.specializations.length > 0 && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Specializations</h2>
                <div className="flex flex-wrap gap-2">
                  {advocate.specializations.map((s: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-orange-50 text-orange-700 text-sm rounded-lg">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Contact */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Book Consultation</h3>
              {advocate.consultationFeePaise != null && (
                <div className="mb-4">
                  <span className="text-2xl font-bold text-orange-600">{formatPaise(advocate.consultationFeePaise)}</span>
                  <span className="text-sm text-gray-400 ml-1">/ session</span>
                </div>
              )}
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {advocate.email && <p>Email: {advocate.email}</p>}
                {advocate.phone && <p>Phone: {advocate.phone}</p>}
                {advocate.address && <p>Address: {advocate.address}</p>}
              </div>
              <Link
                href={`/services/legal/new?advocateId=${advocate.id}`}
                className="block w-full px-4 py-3 bg-orange-500 text-white text-center rounded-xl hover:bg-orange-600 transition font-semibold"
              >
                Start Legal Case
              </Link>
              <Link
                href={`/messages?recipientId=${advocate.id}`}
                className="block w-full px-4 py-3 mt-2 border-2 border-orange-500 text-orange-600 text-center rounded-xl hover:bg-orange-50 transition font-semibold"
              >
                Chat
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
