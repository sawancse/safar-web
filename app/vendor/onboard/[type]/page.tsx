'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import OnboardingWizard from '@/components/vendor/OnboardingWizard';
import { WIZARD_CONFIGS } from '@/lib/vendor-wizard-config';
import { api } from '@/lib/api';

export default function VendorOnboardPage() {
  const params = useParams<{ type: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [inviteWelcome, setInviteWelcome] = useState<{ phone?: string; businessName?: string } | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Map URL slug → service type enum
  const SLUG_TO_TYPE: Record<string, string> = {
    cake: 'CAKE_DESIGNER',
    singer: 'SINGER',
    pandit: 'PANDIT',
    decor: 'DECORATOR',
    'staff-hire': 'STAFF_HIRE',
  };

  const slug = String(params?.type ?? '').toLowerCase();
  const serviceType = SLUG_TO_TYPE[slug];
  const config = serviceType ? WIZARD_CONFIGS[serviceType] : null;
  const inviteToken = search?.get('invite');

  // Resolve invite token (if present) BEFORE auth check — invite landing
  // shows a friendly welcome and the auth screen pre-fills the phone.
  useEffect(() => {
    if (!inviteToken) return;
    api.resolveVendorInvite(inviteToken)
      .then(res => {
        if (res.valid) {
          setInviteWelcome({ phone: res.phone, businessName: res.businessName });
          if (typeof window !== 'undefined' && res.phone) {
            // Pre-fill phone for auth flow + wizard
            sessionStorage.setItem('safar_vendor_invite_phone', res.phone);
            sessionStorage.setItem('safar_vendor_invite_token', inviteToken);
            if (res.businessName) sessionStorage.setItem('safar_vendor_invite_business', res.businessName);
          }
        } else {
          setInviteError(res.message || 'Invite expired or invalid');
        }
      })
      .catch(() => setInviteError('Could not validate this invite link'));
  }, [inviteToken]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    if (!token) {
      // Pass invite token through the auth flow so phone-OTP screen can pre-fill
      const nextUrl = `/vendor/onboard/${slug}${inviteToken ? `?invite=${encodeURIComponent(inviteToken)}` : ''}`;
      router.push(`/auth?next=${encodeURIComponent(nextUrl)}`);
      return;
    }
    setAuthChecked(true);
  }, [router, slug, inviteToken]);

  if (!config) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Unknown service type</h1>
        <p className="text-gray-500 mb-6">
          We don't have an onboarding wizard for <code className="bg-gray-100 px-2 py-0.5 rounded">{slug}</code> yet.
        </p>
        <p className="text-sm text-gray-500 mb-6">Available types:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {Object.entries(SLUG_TO_TYPE).map(([s, t]) => (
            <a key={s} href={`/vendor/onboard/${s}`}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold">
              {WIZARD_CONFIGS[t]?.hero.emoji} {WIZARD_CONFIGS[t]?.displayName}
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invite link expired</h1>
        <p className="text-gray-500 mb-6">{inviteError}</p>
        <p className="text-xs text-gray-400">Ask your Safar contact for a new invite, or onboard directly:</p>
        <a href={`/vendor/onboard/${slug}`} className="inline-block mt-3 text-orange-500 hover:underline">
          Continue without invite →
        </a>
      </div>
    );
  }

  if (!authChecked) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500 text-sm">
        Checking sign-in…
      </div>
    );
  }

  return (
    <>
      {inviteWelcome && (
        <div className="max-w-3xl mx-auto px-4 mt-6">
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-800">
            👋 Welcome{inviteWelcome.businessName ? `, ${inviteWelcome.businessName}` : ''}! Your phone is pre-filled
            from the Safar invite. Walk through the steps below to get listed.
          </div>
        </div>
      )}
      <OnboardingWizard config={config} />
    </>
  );
}
