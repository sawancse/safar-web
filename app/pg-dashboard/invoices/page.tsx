'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';

interface Invoice {
  id: string;
  invoiceNumber: string;
  billingMonth: number;
  billingYear: number;
  rentPaise: number;
  packagesPaise: number;
  electricityPaise: number;
  waterPaise: number;
  gstPaise: number;
  grandTotalPaise: number;
  latePenaltyPaise: number;
  status: string;
  dueDate: string;
  paidDate: string | null;
}

const INVOICE_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  GENERATED: { label: 'Unpaid',   color: 'text-yellow-700', bg: 'bg-yellow-100' },
  SENT:      { label: 'Sent',     color: 'text-blue-700',   bg: 'bg-blue-100' },
  PAID:      { label: 'Paid',     color: 'text-green-700',  bg: 'bg-green-100' },
  OVERDUE:   { label: 'Overdue',  color: 'text-red-700',    bg: 'bg-red-100' },
  WAIVED:    { label: 'Waived',   color: 'text-gray-500',   bg: 'bg-gray-100' },
};

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function InvoicesPage() {
  const router = useRouter();
  const params = useSearchParams();
  const tenancyId = params.get('tenancyId') ?? '';
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('access_token') ?? '';
    if (!t) {
      router.push('/auth?redirect=/pg-dashboard/invoices');
      return;
    }
    setToken(t);

    if (!tenancyId) {
      // No tenancyId — fetch from dashboard to get it
      api.getTenantDashboard(t)
        .then((res) => {
          if (res?.tenancy?.id) {
            loadInvoices(res.tenancy.id, t);
          }
        })
        .catch(() => setLoading(false));
    } else {
      loadInvoices(tenancyId, t);
    }
  }, [router, tenancyId]);

  function loadInvoices(tid: string, t: string) {
    setLoading(true);
    api.getTenancyInvoices(tid, t)
      .then((res) => {
        const list = res?.content ?? res ?? [];
        setInvoices(Array.isArray(list) ? list : []);
      })
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }

  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.grandTotalPaise, 0);
  const totalOutstanding = invoices.filter(i => i.status === 'GENERATED' || i.status === 'OVERDUE').reduce((s, i) => s + i.grandTotalPaise, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-1 bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-6">
          <Link href="/pg-dashboard" className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg text-center transition">
            Overview
          </Link>
          <Link href={`/pg-dashboard/invoices?tenancyId=${tenancyId}`} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg text-center">
            Invoices
          </Link>
          <Link href={`/pg-dashboard/maintenance?tenancyId=${tenancyId}`} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg text-center transition">
            Maintenance
          </Link>
          <Link href={`/pg-dashboard/utilities?tenancyId=${tenancyId}`} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg text-center transition">
            Utilities
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-gray-500 mb-1">Total Paid</p>
            <p className="text-xl font-bold text-green-600">{formatPaise(totalPaid)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-gray-500 mb-1">Outstanding</p>
            <p className={`text-xl font-bold ${totalOutstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatPaise(totalOutstanding)}
            </p>
          </div>
        </div>

        {/* Invoice List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No invoices yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {invoices.map((inv) => {
                const st = INVOICE_STATUS[inv.status] || { label: inv.status, color: 'text-gray-600', bg: 'bg-gray-100' };
                const canPay = inv.status === 'GENERATED' || inv.status === 'OVERDUE';

                return (
                  <div key={inv.id} className="px-6 py-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900">{inv.invoiceNumber}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{formatPaise(inv.grandTotalPaise)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>{MONTHS[inv.billingMonth]} {inv.billingYear}</span>
                        <span>Due: {new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        {inv.paidDate && <span className="text-green-600">Paid: {new Date(inv.paidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                        {inv.latePenaltyPaise > 0 && <span className="text-red-600">Penalty: {formatPaise(inv.latePenaltyPaise)}</span>}
                      </div>
                      {canPay && (
                        <button
                          onClick={() => router.push(`/pg-dashboard/invoices/${inv.id}/pay`)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg text-white ${
                            inv.status === 'OVERDUE' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'
                          } transition`}
                        >
                          Pay Now
                        </button>
                      )}
                    </div>

                    {/* Breakdown (collapsed) */}
                    {(inv.packagesPaise > 0 || inv.electricityPaise > 0 || inv.waterPaise > 0 || inv.gstPaise > 0) && (
                      <div className="mt-2 flex gap-3 text-xs text-gray-400">
                        <span>Rent: {formatPaise(inv.rentPaise)}</span>
                        {inv.packagesPaise > 0 && <span>Packages: {formatPaise(inv.packagesPaise)}</span>}
                        {inv.electricityPaise > 0 && <span>Electricity: {formatPaise(inv.electricityPaise)}</span>}
                        {inv.waterPaise > 0 && <span>Water: {formatPaise(inv.waterPaise)}</span>}
                        {inv.gstPaise > 0 && <span>GST: {formatPaise(inv.gstPaise)}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
