'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';

interface Tenancy {
  id: string;
  tenancyRef: string;
  status: string;
  moveInDate: string;
  moveOutDate: string | null;
  monthlyRentPaise: number;
  securityDepositPaise: number;
}

interface Agreement {
  status: string;
  agreementNumber: string;
  pdfUrl: string | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  grandTotalPaise: number;
  dueDate: string;
  status: string;
}

interface Subscription {
  status: string;
  razorpaySubscriptionId: string | null;
}

interface TenantDashboardData {
  tenancy: Tenancy;
  agreement: Agreement;
  currentInvoice: Invoice | null;
  totalPaidPaise: number;
  outstandingPaise: number;
  openMaintenanceRequests: number;
  subscription: Subscription;
}

const TENANCY_STATUS: Record<string, { label: string; color: string }> = {
  ACTIVE:        { label: 'Active',        color: 'bg-green-100 text-green-700' },
  NOTICE_PERIOD: { label: 'Notice Period', color: 'bg-yellow-100 text-yellow-700' },
  VACATED:       { label: 'Vacated',       color: 'bg-gray-100 text-gray-600' },
  PENDING:       { label: 'Pending',       color: 'bg-yellow-100 text-yellow-700' },
  TERMINATED:    { label: 'Terminated',    color: 'bg-red-100 text-red-600' },
};

const AGREEMENT_STATUS: Record<string, { label: string; color: string }> = {
  DRAFT:               { label: 'Draft',                color: 'bg-gray-100 text-gray-600' },
  PENDING_HOST_SIGN:   { label: 'Pending Host Sign',    color: 'bg-yellow-100 text-yellow-700' },
  PENDING_TENANT_SIGN: { label: 'Pending Your Sign',    color: 'bg-orange-100 text-orange-700' },
  ACTIVE:              { label: 'Active',                color: 'bg-green-100 text-green-700' },
  EXPIRED:             { label: 'Expired',               color: 'bg-gray-100 text-gray-500' },
};

const INVOICE_STATUS: Record<string, { label: string; color: string }> = {
  GENERATED: { label: 'Unpaid',   color: 'bg-yellow-100 text-yellow-700' },
  PAID:      { label: 'Paid',     color: 'bg-green-100 text-green-700' },
  OVERDUE:   { label: 'Overdue',  color: 'bg-red-100 text-red-600' },
  WAIVED:    { label: 'Waived',   color: 'bg-gray-100 text-gray-500' },
  PARTIAL:   { label: 'Partial',  color: 'bg-orange-100 text-orange-700' },
};

export default function PgDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<TenantDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('access_token') ?? '';
    if (!t) {
      router.push('/auth?redirect=/pg-dashboard');
      return;
    }
    setToken(t);
    loadDashboard(t);
  }, [router]);

  function loadDashboard(t: string) {
    setLoading(true);
    setError('');
    api.getTenantDashboard(t)
      .then((res) => setData(res))
      .catch((err) => {
        if (err?.status === 404 || err?.message?.includes('not found')) {
          setData(null);
        } else {
          setError(err?.message || 'Failed to load dashboard');
        }
      })
      .finally(() => setLoading(false));
  }

  async function handleSignAgreement() {
    if (!data || !token) return;
    setSigning(true);
    try {
      await api.tenantSignAgreement(data.tenancy.id, token);
      loadDashboard(token);
    } catch (e: any) {
      alert(e.message || 'Failed to sign agreement');
    } finally {
      setSigning(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Loading your PG dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => loadDashboard(token)}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No tenancy found
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No active PG tenancy found</h2>
          <p className="text-gray-500 mb-6">
            You don&apos;t have an active PG or hostel tenancy yet. Browse available PGs and find your next home.
          </p>
          <Link
            href="/search?type=PG"
            className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
          >
            Search PGs
          </Link>
        </div>
      </div>
    );
  }

  const [givingNotice, setGivingNotice] = useState(false);
  const [noticeConfirm, setNoticeConfirm] = useState(false);

  async function handleGiveNotice() {
    if (!data || !token) return;
    setGivingNotice(true);
    try {
      await api.tenantGiveNotice(data.tenancy.id, token);
      setNoticeConfirm(false);
      loadDashboard(token);
    } catch (e: any) {
      alert(e.message || 'Failed to give notice');
    } finally {
      setGivingNotice(false);
    }
  }

  const { tenancy, agreement, currentInvoice, totalPaidPaise, outstandingPaise, openMaintenanceRequests, subscription } = data;
  const tenancyStatus = TENANCY_STATUS[tenancy.status] || { label: tenancy.status, color: 'bg-gray-100 text-gray-600' };
  const agreementStatus = AGREEMENT_STATUS[agreement.status] || { label: agreement.status, color: 'bg-gray-100 text-gray-600' };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-1 bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-6">
          <Link href="/pg-dashboard" className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg text-center">
            Overview
          </Link>
          <Link href={`/pg-dashboard/invoices?tenancyId=${tenancy.id}`} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg text-center transition">
            Invoices
          </Link>
          <Link href={`/pg-dashboard/maintenance?tenancyId=${tenancy.id}`} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg text-center transition">
            Maintenance
          </Link>
          <Link href={`/pg-dashboard/utilities?tenancyId=${tenancy.id}`} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg text-center transition">
            Utilities
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My PG</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500">Ref: {tenancy.tenancyRef}</span>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${tenancyStatus.color}`}>
                {tenancyStatus.label}
              </span>
            </div>
          </div>
          {tenancy.moveInDate && (
            <div className="text-right text-sm text-gray-500">
              <p>Move-in: {new Date(tenancy.moveInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              {tenancy.moveOutDate && (
                <p>Move-out: {new Date(tenancy.moveOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Monthly Rent"
            value={formatPaise(tenancy.monthlyRentPaise)}
            icon="💰"
            accent="text-orange-600"
          />
          <StatCard
            label="Outstanding Dues"
            value={formatPaise(outstandingPaise)}
            icon="📋"
            accent={outstandingPaise > 0 ? 'text-red-600' : 'text-green-600'}
          />
          <StatCard
            label="Total Paid"
            value={formatPaise(totalPaidPaise)}
            icon="✅"
            accent="text-green-600"
          />
          <StatCard
            label="Security Deposit"
            value={formatPaise(tenancy.securityDepositPaise)}
            icon="🔒"
            accent="text-gray-700"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Agreement Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Rental Agreement</h2>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${agreementStatus.color}`}>
                {agreementStatus.label}
              </span>
            </div>
            {agreement.agreementNumber && (
              <p className="text-sm text-gray-500 mb-4">Agreement #{agreement.agreementNumber}</p>
            )}

            {agreement.status === 'PENDING_TENANT_SIGN' && (
              <div className="space-y-3">
                <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                  Your agreement is ready for signing. Please review and sign to complete onboarding.
                </p>
                <div className="flex gap-2">
                  <a
                    href={`/api/v1/pg-tenancies/${tenancy.id}/agreement/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium text-center"
                  >
                    Review Agreement
                  </a>
                  <button
                    onClick={handleSignAgreement}
                    disabled={signing}
                    className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {signing ? 'Signing...' : 'Sign Agreement'}
                  </button>
                </div>
              </div>
            )}

            {agreement.status === 'PENDING_HOST_SIGN' && (
              <div className="space-y-3">
                <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                  Waiting for the host to sign the agreement.
                </p>
                <a
                  href={`/api/v1/pg-tenancies/${tenancy.id}/agreement/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                >
                  Preview Agreement
                </a>
              </div>
            )}

            {agreement.status === 'DRAFT' && (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                Your agreement is being prepared. You will be notified once it is ready for signing.
              </p>
            )}

            {agreement.status === 'ACTIVE' && (
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/api/v1/pg-tenancies/${tenancy.id}/agreement/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Agreement
                </a>
                <a
                  href={`/api/v1/pg-tenancies/${tenancy.id}/agreement/pdf`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </a>
                <button
                  onClick={() => window.open(`/api/v1/pg-tenancies/${tenancy.id}/agreement/view`, '_blank')?.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
              </div>
            )}

            {agreement.status === 'NOT_CREATED' && (
              <p className="text-sm text-gray-400 bg-gray-50 p-3 rounded-lg">
                No agreement created yet. Your host will initiate the agreement process.
              </p>
            )}
          </div>

          {/* Current Invoice Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Invoice</h2>
            {currentInvoice ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">{currentInvoice.invoiceNumber}</span>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${(INVOICE_STATUS[currentInvoice.status] || { color: 'bg-gray-100 text-gray-600' }).color}`}>
                    {(INVOICE_STATUS[currentInvoice.status] || { label: currentInvoice.status }).label}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-semibold text-gray-900">{formatPaise(currentInvoice.grandTotalPaise)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Due Date</span>
                    <span className="text-gray-700">
                      {new Date(currentInvoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                {(currentInvoice.status === 'GENERATED' || currentInvoice.status === 'OVERDUE') && (
                  <button
                    onClick={() => router.push(`/pg-dashboard/invoices/${currentInvoice.id}/pay`)}
                    className={`w-full px-4 py-2.5 text-white rounded-lg transition font-medium ${
                      currentInvoice.status === 'OVERDUE'
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                  >
                    {currentInvoice.status === 'OVERDUE' ? 'Pay Now (Overdue)' : 'Pay Invoice'}
                  </button>
                )}
                {currentInvoice.status === 'PAID' && (
                  <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg text-center">
                    Paid - You are all caught up!
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm">No pending invoice</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <QuickAction
              title="Maintenance Requests"
              description={openMaintenanceRequests > 0 ? `${openMaintenanceRequests} open request${openMaintenanceRequests > 1 ? 's' : ''}` : 'No open requests'}
              icon="🔧"
              href={`/pg-dashboard/maintenance?tenancyId=${tenancy.id}`}
              badge={openMaintenanceRequests > 0 ? openMaintenanceRequests : undefined}
            />
            <QuickAction
              title="Utility Readings"
              description="Submit meter readings"
              icon="⚡"
              href={`/pg-dashboard/utilities?tenancyId=${tenancy.id}`}
            />
            {tenancy.status === 'ACTIVE' ? (
              <button
                onClick={() => setNoticeConfirm(true)}
                className="flex items-center gap-4 p-4 rounded-xl border border-red-200 hover:border-red-300 hover:bg-red-50 transition hover:shadow-sm text-left w-full"
              >
                <span className="text-2xl">📤</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Give Notice</p>
                  <p className="text-xs text-gray-500 truncate">Initiate 1-month move-out notice</p>
                </div>
              </button>
            ) : tenancy.status === 'NOTICE_PERIOD' ? (
              <div className="flex items-center gap-4 p-4 rounded-xl border border-yellow-200 bg-yellow-50">
                <span className="text-2xl">📋</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Notice Given</p>
                  <p className="text-xs text-gray-500">Move-out: {tenancy.moveOutDate ? new Date(tenancy.moveOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}</p>
                </div>
              </div>
            ) : (
              <QuickAction
                title="Notice"
                description="Tenancy ended"
                icon="✓"
                href="#"
              />
            )}
          </div>
        </div>

        {/* Notice Confirmation Modal */}
        {noticeConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Give 1-Month Notice?</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                This will start your notice period. Your move-out date will be set to <strong>{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>.
                Your rental agreement will be terminated and the settlement process will begin after move-out.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-800">
                  You must clear all pending rent and utilities before move-out. Your security deposit will be settled after room inspection.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setNoticeConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGiveNotice}
                  disabled={givingNotice}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium disabled:opacity-50"
                >
                  {givingNotice ? 'Processing...' : 'Confirm Notice'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Auto-Debit (Subscription)</h2>
          {subscription.status === 'ACTIVE' ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Auto-debit is active</p>
                <p className="text-xs text-gray-500">
                  Your rent will be automatically debited each month.
                  {subscription.razorpaySubscriptionId && (
                    <span className="ml-1">ID: {subscription.razorpaySubscriptionId.slice(0, 12)}...</span>
                  )}
                </p>
              </div>
            </div>
          ) : subscription.status === 'PAUSED' ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Auto-debit is paused</p>
                <p className="text-xs text-gray-500">Contact your host to resume auto-debit.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Auto-debit not set up</p>
                <p className="text-xs text-gray-500">You will need to pay invoices manually each month.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────── */

function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: string; accent: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`text-xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function QuickAction({ title, description, icon, href, badge, destructive }: {
  title: string;
  description: string;
  icon: string;
  href: string;
  badge?: number;
  destructive?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 p-4 rounded-xl border transition hover:shadow-sm ${
        destructive ? 'border-red-200 hover:border-red-300 hover:bg-red-50' : 'border-gray-100 hover:border-orange-200 hover:bg-orange-50'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 truncate">{description}</p>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-orange-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </Link>
  );
}
