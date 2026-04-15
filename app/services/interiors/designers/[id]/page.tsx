'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';

export default function DesignerProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [designer, setDesigner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getInteriorDesigner(id).then(setDesigner).catch(() => setDesigner(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!designer) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Designer not found</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/services/interiors/designers" className="text-sm text-orange-500 hover:underline mb-4 block">&larr; All Designers</Link>

        {/* Profile Header */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-2xl flex-shrink-0">
              {designer.profilePhotoUrl ? <img src={designer.profilePhotoUrl} alt="" className="w-20 h-20 rounded-full object-cover" /> : designer.fullName?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{designer.fullName}</h1>
                {designer.verified && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>}
              </div>
              {designer.companyName && <p className="text-sm text-gray-500">{designer.companyName}</p>}
              <p className="text-sm text-gray-500 mt-1">{designer.city}{designer.state ? `, ${designer.state}` : ''}</p>
              <div className="flex gap-4 mt-3 text-sm">
                {designer.experienceYears && <span className="bg-gray-100 px-3 py-1 rounded-lg">{designer.experienceYears} yrs experience</span>}
                {designer.completedProjects != null && <span className="bg-gray-100 px-3 py-1 rounded-lg">{designer.completedProjects} projects</span>}
                {designer.rating != null && <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-lg">{designer.rating} / 5</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {designer.bio && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{designer.bio}</p>
              </div>
            )}

            {designer.specializations && designer.specializations.length > 0 && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Specializations</h2>
                <div className="flex flex-wrap gap-2">
                  {designer.specializations.map((s: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-pink-50 text-pink-700 text-sm rounded-lg">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Gallery */}
            {designer.portfolioUrls && designer.portfolioUrls.length > 0 && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Portfolio</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {designer.portfolioUrls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden hover:opacity-90 transition">
                      <img src={url} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Book */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Book Consultation</h3>
              {designer.consultationFeePaise != null && (
                <div className="mb-4">
                  <span className="text-2xl font-bold text-orange-600">{formatPaise(designer.consultationFeePaise)}</span>
                  <span className="text-sm text-gray-400 ml-1">/ session</span>
                </div>
              )}
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {designer.email && <p>Email: {designer.email}</p>}
                {designer.phone && <p>Phone: {designer.phone}</p>}
                {designer.address && <p>Office: {designer.address}</p>}
              </div>
              <Link
                href={`/services/interiors?designerId=${designer.id}`}
                className="block w-full px-4 py-3 bg-orange-500 text-white text-center rounded-xl hover:bg-orange-600 transition font-semibold"
              >
                Start Interior Project
              </Link>
              <Link
                href={`/messages?recipientId=${designer.id}`}
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
