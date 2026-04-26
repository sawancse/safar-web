'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import OnboardingWizard from '@/components/vendor/OnboardingWizard';
import { WIZARD_CONFIGS } from '@/lib/vendor-wizard-config';

export default function VendorOnboardPage() {
  const params = useParams<{ type: string }>();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push(`/auth?next=${encodeURIComponent(`/vendor/onboard/${slug}`)}`);
      return;
    }
    setAuthChecked(true);
  }, [router, slug]);

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

  if (!authChecked) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500 text-sm">
        Checking sign-in…
      </div>
    );
  }

  return <OnboardingWizard config={config} />;
}
