'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface BrokerProfile {
  id: string;
  userId: string;
  companyName: string;
  reraAgentId?: string;
  reraVerified: boolean;
  operatingCities: string[];
  specialization: string;
  experienceYears: number;
  totalDealsCount: number;
  bio?: string;
  website?: string;
  officeAddress?: string;
  officeCity?: string;
  officeState?: string;
  officePincode?: string;
  subscriptionTier: string;
  verified: boolean;
  active: boolean;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  avatarUrl?: string;
  createdAt: string;
}

export default function BrokerProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [broker, setBroker] = useState<BrokerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getBrokerById(id)
      .then((data: any) => setBroker(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">Broker Not Found</h1>
        <Link href="/broker" className="text-amber-400 hover:text-amber-300 underline">
          Browse Brokers
        </Link>
      </div>
    );
  }

  const initials = broker.userName
    ? broker.userName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'BR';

  const memberSince = broker.createdAt
    ? new Date(broker.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {broker.avatarUrl ? (
                <img
                  src={broker.avatarUrl}
                  alt={broker.userName || 'Broker'}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-white/10"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-3xl font-bold text-black">
                  {initials}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold">{broker.userName || 'Broker'}</h1>
                {broker.verified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
                {broker.reraVerified && broker.reraAgentId && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                    RERA: {broker.reraAgentId}
                  </span>
                )}
              </div>

              {broker.companyName && (
                <p className="text-lg text-gray-400 mt-1">{broker.companyName}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                {broker.specialization && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {broker.specialization.charAt(0) + broker.specialization.slice(1).toLowerCase()}
                  </span>
                )}
                {broker.experienceYears > 0 && (
                  <span>{broker.experienceYears} years experience</span>
                )}
                {memberSince && <span>Member since {memberSince}</span>}
              </div>
            </div>

            {/* Contact button */}
            <div className="flex-shrink-0">
              <button
                onClick={() => setShowContact(!showContact)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold transition-all"
              >
                {showContact ? 'Hide Contact' : 'Contact Broker'}
              </button>
            </div>
          </div>

          {/* Contact details */}
          {showContact && (
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="grid sm:grid-cols-2 gap-4">
                {broker.userPhone && (
                  <a
                    href={`tel:${broker.userPhone}`}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {broker.userPhone}
                  </a>
                )}
                {broker.userEmail && (
                  <a
                    href={`mailto:${broker.userEmail}`}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {broker.userEmail}
                  </a>
                )}
              </div>
              {broker.website && (
                <a
                  href={broker.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {broker.website}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main */}
          <div className="md:col-span-2 space-y-8">
            {/* Bio */}
            {broker.bio && (
              <div>
                <h2 className="text-lg font-semibold mb-3">About</h2>
                <p className="text-gray-400 leading-relaxed whitespace-pre-line">{broker.bio}</p>
              </div>
            )}

            {/* Operating Cities */}
            {broker.operatingCities && broker.operatingCities.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Operating Cities</h2>
                <div className="flex flex-wrap gap-2">
                  {broker.operatingCities.map((city) => (
                    <span
                      key={city}
                      className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300"
                    >
                      {city}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Listed Properties (placeholder) */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Listed Properties</h2>
              <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-gray-500">Property listings will appear here.</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats card */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
              <h3 className="font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Experience</span>
                  <span className="font-medium">{broker.experienceYears} years</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Deals Closed</span>
                  <span className="font-medium">{broker.totalDealsCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Specialization</span>
                  <span className="font-medium">
                    {broker.specialization.charAt(0) + broker.specialization.slice(1).toLowerCase()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tier</span>
                  <span className="font-medium">{broker.subscriptionTier}</span>
                </div>
              </div>
            </div>

            {/* Office */}
            {(broker.officeAddress || broker.officeCity) && (
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
                <h3 className="font-semibold mb-3">Office Location</h3>
                <div className="text-sm text-gray-400 space-y-1">
                  {broker.officeAddress && <p>{broker.officeAddress}</p>}
                  {broker.officeCity && (
                    <p>
                      {broker.officeCity}
                      {broker.officeState ? `, ${broker.officeState}` : ''}
                      {broker.officePincode ? ` - ${broker.officePincode}` : ''}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
