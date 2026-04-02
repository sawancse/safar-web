'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useMemo } from 'react';
import Link from 'next/link';

function CertificateContent() {
  const params = useSearchParams();
  const donationRef = params.get('ref') || 'DON-2026-0000';
  const donorName = params.get('name') || 'A Kind Soul';
  const amount = parseInt(params.get('amount') || '0', 10);
  const dedicatedTo = params.get('to') || '';
  const receiptNumber = params.get('receipt') || '';
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Impact calculation: ~Rs 350/day for shelter
  const shelterDays = Math.max(1, Math.round(amount / 350));

  const certificateUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleWhatsAppShare = useCallback(() => {
    const msg = encodeURIComponent(
      `I received a Certificate of Generosity from Safar Aashray for donating \u20B9${amount.toLocaleString('en-IN')} to help house displaced families. You can donate too: https://www.ysafar.com/aashray/donate`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }, [amount]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(certificateUrl);
      alert('Link copied to clipboard!');
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = certificateUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      alert('Link copied to clipboard!');
    }
  }, [certificateUrl]);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:py-0">
      {/* Action buttons — hidden when printing */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap gap-3 justify-center print:hidden">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Certificate
        </button>
        <button
          onClick={handleWhatsAppShare}
          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Share on WhatsApp
        </button>
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          Copy Link
        </button>
        <Link
          href="/aashray/donate"
          className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition text-sm"
        >
          Back to Donate
        </Link>
      </div>

      {/* Certificate */}
      <div className="max-w-4xl mx-auto print:max-w-none" id="certificate">
        <div
          className="bg-white rounded-2xl print:rounded-none overflow-hidden shadow-2xl print:shadow-none"
          style={{
            border: '6px solid transparent',
            borderImage: 'linear-gradient(135deg, #0d9488, #d4a843, #0d9488, #d4a843) 1',
          }}
        >
          {/* Inner decorative border */}
          <div className="m-3 border-2 border-teal-200 rounded-xl p-8 md:p-12 print:p-16 relative">
            {/* Corner ornaments */}
            <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400 rounded-tl-lg" />
            <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400 rounded-tr-lg" />
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400 rounded-bl-lg" />
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400 rounded-br-lg" />

            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400" />
                <span className="text-amber-600 text-sm font-semibold tracking-[0.3em] uppercase">
                  Safar Aashray
                </span>
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400" />
              </div>
              <h1
                className="text-4xl md:text-5xl font-bold text-teal-700 mb-2"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Certificate of Generosity
              </h1>
              <div className="h-1 w-32 mx-auto bg-gradient-to-r from-teal-500 via-amber-400 to-teal-500 rounded-full" />
            </div>

            {/* Body */}
            <div className="text-center space-y-6 mb-10">
              <p className="text-gray-500 text-lg">This certifies that</p>

              <p
                className="text-3xl md:text-4xl font-bold text-gray-800"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {donorName}
              </p>

              <p className="text-gray-500 text-lg">
                has generously contributed
              </p>

              <div className="inline-block bg-gradient-to-r from-teal-50 to-amber-50 border border-teal-200 rounded-2xl px-8 py-4">
                <span className="text-4xl md:text-5xl font-bold text-teal-700">
                  {'\u20B9'}{amount.toLocaleString('en-IN')}
                </span>
              </div>

              <p className="text-gray-500 text-lg max-w-md mx-auto">
                to Safar Aashray, helping provide safe shelter to displaced families across India.
              </p>

              {dedicatedTo && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-4 max-w-md mx-auto">
                  <p className="text-amber-700 text-sm font-medium mb-1">Dedicated with love to</p>
                  <p className="text-amber-900 text-xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
                    {dedicatedTo}
                  </p>
                </div>
              )}
            </div>

            {/* Impact */}
            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6 text-center mb-8 max-w-lg mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">🏠</span>
                <p className="text-teal-800 font-semibold text-lg">Your Impact</p>
              </div>
              <p className="text-teal-700">
                Your donation provides approximately{' '}
                <span className="font-bold text-teal-900">{shelterDays} {shelterDays === 1 ? 'day' : 'days'}</span>{' '}
                of safe shelter for a family in need.
              </p>
            </div>

            {/* Footer details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm text-gray-500 mb-6">
              <div>
                <p className="font-medium text-gray-400 uppercase tracking-wide text-xs mb-1">Donation Ref</p>
                <p className="font-mono font-semibold text-gray-700">{donationRef}</p>
              </div>
              <div>
                <p className="font-medium text-gray-400 uppercase tracking-wide text-xs mb-1">Date</p>
                <p className="font-semibold text-gray-700">{today}</p>
              </div>
              {receiptNumber && (
                <div>
                  <p className="font-medium text-gray-400 uppercase tracking-wide text-xs mb-1">80G Receipt</p>
                  <p className="font-mono font-semibold text-gray-700">{receiptNumber}</p>
                </div>
              )}
            </div>

            {/* Signature line */}
            <div className="flex items-end justify-between mt-10 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="h-px w-40 bg-gray-400 mb-1" />
                <p className="text-xs text-gray-400">Safar Aashray Foundation</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 italic">
                  &ldquo;A home is not a place, it is a feeling.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Screenshot/download hint — hidden in print */}
      <div className="max-w-4xl mx-auto mt-4 text-center print:hidden">
        <p className="text-sm text-gray-400">
          Tip: Use Print &rarr; &ldquo;Save as PDF&rdquo; to download, or take a screenshot to share as an image.
        </p>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function AashrayDonationCertificatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      }
    >
      <CertificateContent />
    </Suspense>
  );
}
