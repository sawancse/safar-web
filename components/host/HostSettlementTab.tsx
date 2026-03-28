'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';

const SETTLEMENT_STEPS = ['INITIATED', 'INSPECTION_DONE', 'APPROVED', 'REFUND_PROCESSING', 'SETTLED'];

const STEP_LABELS: Record<string, string> = {
  INITIATED: 'Initiated',
  INSPECTION_DONE: 'Inspected',
  APPROVED: 'Approved',
  REFUND_PROCESSING: 'Refund Processing',
  SETTLED: 'Settled',
};

const DEDUCTION_CATEGORIES = [
  'UNPAID_RENT',
  'UNPAID_UTILITY',
  'DAMAGE',
  'LATE_PENALTY',
  'CLEANING',
  'OTHER',
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  UNPAID_RENT: 'Unpaid Rent',
  UNPAID_UTILITY: 'Unpaid Utility',
  DAMAGE: 'Damage',
  LATE_PENALTY: 'Late Penalty',
  CLEANING: 'Cleaning',
  OTHER: 'Other',
};

export default function HostSettlementTab({ listingId }: { listingId: string }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';

  const [tenancies, setTenancies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState<Record<string, any>>({});
  const [selectedTenancyId, setSelectedTenancyId] = useState<string | null>(null);
  const [showDeductionForm, setShowDeductionForm] = useState(false);
  const [deductionForm, setDeductionForm] = useState({
    category: 'UNPAID_RENT' as string,
    description: '',
    amountPaise: 0,
    evidenceUrl: '',
  });
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadData(); }, [listingId]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.getPgTenancies('listingId=' + listingId, token);
      const all: any[] = res.content || [];
      // Show tenancies in NOTICE_PERIOD or those that may have settlements
      const relevant = all.filter(
        (t: any) => t.status === 'NOTICE_PERIOD' || t.status === 'VACATED' || t.status === 'TERMINATED'
      );
      setTenancies(relevant);

      // Load settlements for each tenancy
      const settlementMap: Record<string, any> = {};
      await Promise.all(
        relevant.map(async (t: any) => {
          try {
            const s = await api.getSettlement(t.id, token);
            if (s) settlementMap[t.id] = s;
          } catch {
            // No settlement yet — that's fine
          }
        })
      );
      setSettlements(settlementMap);
    } catch (e) {
      console.error('Failed to load tenancies:', e);
    }
    setLoading(false);
  }

  async function handleInitiateSettlement(tenancy: any) {
    if (!confirm('Start settlement process for this tenancy?')) return;
    setActionLoading(true);
    try {
      await api.initiateSettlement(tenancy.id, { moveOutDate: tenancy.moveOutDate }, token);
      await loadData();
    } catch (e) {
      alert('Failed to initiate settlement: ' + e);
    }
    setActionLoading(false);
  }

  async function handleAddDeduction() {
    if (!selectedTenancyId) return;
    setActionLoading(true);
    try {
      await api.addSettlementDeduction(selectedTenancyId, {
        category: deductionForm.category,
        description: deductionForm.description,
        amountPaise: deductionForm.amountPaise,
        evidenceUrl: deductionForm.evidenceUrl || undefined,
      }, token);
      setShowDeductionForm(false);
      setDeductionForm({ category: 'UNPAID_RENT', description: '', amountPaise: 0, evidenceUrl: '' });
      await loadData();
    } catch (e) {
      alert('Failed to add deduction: ' + e);
    }
    setActionLoading(false);
  }

  async function handleRemoveDeduction(tenancyId: string, deductionId: string) {
    if (!confirm('Remove this deduction?')) return;
    setActionLoading(true);
    try {
      await api.removeSettlementDeduction(tenancyId, deductionId, token);
      await loadData();
    } catch (e) {
      alert('Failed to remove deduction: ' + e);
    }
    setActionLoading(false);
  }

  async function handleCompleteInspection(tenancyId: string) {
    if (!inspectionNotes.trim()) { alert('Please enter inspection notes.'); return; }
    setActionLoading(true);
    try {
      await api.completeInspection(tenancyId, inspectionNotes, token);
      setInspectionNotes('');
      await loadData();
    } catch (e) {
      alert('Failed to complete inspection: ' + e);
    }
    setActionLoading(false);
  }

  async function handleApprove(tenancyId: string) {
    if (!confirm('Approve this settlement?')) return;
    setActionLoading(true);
    try {
      await api.approveSettlement(tenancyId, 'HOST', token);
      await loadData();
    } catch (e) {
      alert('Failed to approve: ' + e);
    }
    setActionLoading(false);
  }

  async function handleProcessRefund(tenancyId: string) {
    if (!confirm('Process refund for this settlement?')) return;
    setActionLoading(true);
    try {
      await api.processSettlementRefund(tenancyId, token);
      await loadData();
    } catch (e) {
      alert('Failed to process refund: ' + e);
    }
    setActionLoading(false);
  }

  async function handleMarkSettled(tenancyId: string) {
    if (!confirm('Mark this settlement as complete?')) return;
    setActionLoading(true);
    try {
      await api.markSettled(tenancyId, token);
      await loadData();
    } catch (e) {
      alert('Failed to mark settled: ' + e);
    }
    setActionLoading(false);
  }

  const selectedSettlement = selectedTenancyId ? settlements[selectedTenancyId] : null;
  const selectedTenancy = tenancies.find((t: any) => t.id === selectedTenancyId);

  if (loading) return <div className="p-6 text-center text-gray-500">Loading settlements...</div>;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Notice Period</p>
          <p className="text-2xl font-bold text-yellow-600">
            {tenancies.filter(t => t.status === 'NOTICE_PERIOD').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Active Settlements</p>
          <p className="text-2xl font-bold text-orange-600">
            {Object.values(settlements).filter((s: any) => s.status !== 'SETTLED').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {Object.values(settlements).filter((s: any) => s.status === 'SETTLED').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Pending Refunds</p>
          <p className="text-2xl font-bold text-blue-600">
            {Object.values(settlements).filter((s: any) => s.status === 'REFUND_PROCESSING').length}
          </p>
        </div>
      </div>

      {/* Tenancy List */}
      <div className="bg-white rounded-xl border divide-y">
        <div className="p-4 border-b bg-gray-50 rounded-t-xl">
          <h3 className="font-semibold text-gray-800">Move-out Settlements</h3>
        </div>
        {tenancies.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No tenancies requiring settlement</div>
        ) : tenancies.map((t: any) => {
          const settlement = settlements[t.id];
          return (
            <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t.tenancyRef}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    t.status === 'NOTICE_PERIOD' ? 'bg-yellow-100 text-yellow-800' :
                    t.status === 'VACATED' ? 'bg-gray-100 text-gray-600' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {t.status}
                  </span>
                  {settlement && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      settlement.status === 'SETTLED' ? 'bg-green-100 text-green-800' :
                      settlement.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      Settlement: {settlement.status}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Move-in: {t.moveInDate}
                  {t.moveOutDate && ` · Move-out: ${t.moveOutDate}`}
                </div>
              </div>
              <div className="flex gap-2">
                {!settlement && t.status === 'NOTICE_PERIOD' && (
                  <button
                    onClick={() => handleInitiateSettlement(t)}
                    disabled={actionLoading}
                    className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50"
                  >
                    Start Settlement
                  </button>
                )}
                {settlement && (
                  <button
                    onClick={() => setSelectedTenancyId(selectedTenancyId === t.id ? null : t.id)}
                    className="text-sm text-orange-600 hover:underline"
                  >
                    {selectedTenancyId === t.id ? 'Close' : 'View Details'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Settlement Detail */}
      {selectedTenancyId && selectedSettlement && (
        <div className="bg-white rounded-xl border p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">
              Settlement — {selectedTenancy?.tenancyRef}
            </h3>
            <button onClick={() => setSelectedTenancyId(null)} className="text-gray-400 hover:text-gray-600 text-xl">
              ✕
            </button>
          </div>

          {/* Status Progress Steps */}
          <div className="flex items-center justify-between">
            {SETTLEMENT_STEPS.map((step, i) => {
              const currentIndex = SETTLEMENT_STEPS.indexOf(selectedSettlement.status);
              const isCompleted = i < currentIndex;
              const isCurrent = i === currentIndex;
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isCurrent ? 'bg-orange-500 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs mt-1 text-center ${
                      isCurrent ? 'text-orange-600 font-semibold' :
                      isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {STEP_LABELS[step]}
                    </span>
                  </div>
                  {i < SETTLEMENT_STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 ${
                      i < currentIndex ? 'bg-green-400' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-700 mb-3">Financial Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Security Deposit</p>
                <p className="font-semibold text-lg">{formatPaise(selectedSettlement.securityDepositPaise || 0)}</p>
              </div>
              <div>
                <p className="text-gray-500">Unpaid Rent</p>
                <p className="font-semibold text-lg text-red-600">{formatPaise(selectedSettlement.unpaidRentPaise || 0)}</p>
              </div>
              <div>
                <p className="text-gray-500">Unpaid Utilities</p>
                <p className="font-semibold text-lg text-red-600">{formatPaise(selectedSettlement.unpaidUtilitiesPaise || 0)}</p>
              </div>
              <div>
                <p className="text-gray-500">Damages</p>
                <p className="font-semibold text-lg text-red-600">{formatPaise(selectedSettlement.damagesPaise || 0)}</p>
              </div>
              <div>
                <p className="text-gray-500">Penalties</p>
                <p className="font-semibold text-lg text-red-600">{formatPaise(selectedSettlement.penaltiesPaise || 0)}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Deductions</p>
                <p className="font-semibold text-lg text-red-700">{formatPaise(selectedSettlement.totalDeductionsPaise || 0)}</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t">
              {(selectedSettlement.refundAmountPaise || 0) >= 0 ? (
                <div>
                  <p className="text-gray-500 text-sm">Refund to Tenant</p>
                  <p className="font-bold text-2xl text-green-600">{formatPaise(selectedSettlement.refundAmountPaise || 0)}</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 text-sm">Additional Amount Due from Tenant</p>
                  <p className="font-bold text-2xl text-red-600">{formatPaise(Math.abs(selectedSettlement.refundAmountPaise || 0))}</p>
                </div>
              )}
            </div>
          </div>

          {/* Deduction Line Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-gray-700">Deduction Line Items</h4>
              {(selectedSettlement.status === 'INITIATED' || selectedSettlement.status === 'INSPECTION_DONE') && (
                <button
                  onClick={() => setShowDeductionForm(!showDeductionForm)}
                  className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-orange-600"
                >
                  + Add Deduction
                </button>
              )}
            </div>

            {/* Add Deduction Form */}
            {showDeductionForm && (
              <div className="bg-orange-50 rounded-xl p-4 mb-4 border border-orange-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                      value={deductionForm.category}
                      onChange={e => setDeductionForm(f => ({ ...f, category: e.target.value }))}
                    >
                      {DEDUCTION_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (INR)</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                      value={deductionForm.amountPaise / 100 || ''}
                      onChange={e => setDeductionForm(f => ({ ...f, amountPaise: Math.round(Number(e.target.value) * 100) }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                      value={deductionForm.description}
                      onChange={e => setDeductionForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Describe the deduction"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Evidence URL (optional)</label>
                    <input
                      type="url"
                      className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                      value={deductionForm.evidenceUrl}
                      onChange={e => setDeductionForm(f => ({ ...f, evidenceUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleAddDeduction}
                    disabled={actionLoading || !deductionForm.description || deductionForm.amountPaise <= 0}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50"
                  >
                    Add Deduction
                  </button>
                  <button
                    onClick={() => setShowDeductionForm(false)}
                    className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Deductions Table */}
            {selectedSettlement.deductions && selectedSettlement.deductions.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Evidence</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSettlement.deductions.map((d: any) => (
                    <tr key={d.id} className="border-b">
                      <td className="py-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {CATEGORY_LABELS[d.category] || d.category}
                        </span>
                      </td>
                      <td className="py-2 text-gray-700">{d.description}</td>
                      <td className="py-2 font-medium">{formatPaise(d.amountPaise)}</td>
                      <td className="py-2">
                        {d.evidenceUrl ? (
                          <a href={d.evidenceUrl} target="_blank" rel="noopener noreferrer"
                            className="text-orange-600 hover:underline text-xs">
                            View
                          </a>
                        ) : (
                          <span className="text-gray-300 text-xs">--</span>
                        )}
                      </td>
                      <td className="py-2">
                        {(selectedSettlement.status === 'INITIATED' || selectedSettlement.status === 'INSPECTION_DONE') && (
                          <button
                            onClick={() => handleRemoveDeduction(selectedTenancyId!, d.id)}
                            disabled={actionLoading}
                            className="text-red-500 hover:text-red-700 text-xs disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-400">No deductions added yet</p>
            )}
          </div>

          {/* Actions */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="font-semibold text-gray-700">Actions</h4>

            {/* Complete Inspection */}
            {selectedSettlement.status === 'INITIATED' && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Inspection Notes</label>
                <textarea
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 min-h-[80px]"
                  value={inspectionNotes}
                  onChange={e => setInspectionNotes(e.target.value)}
                  placeholder="Describe the condition of the property after inspection..."
                />
                <button
                  onClick={() => handleCompleteInspection(selectedTenancyId!)}
                  disabled={actionLoading || !inspectionNotes.trim()}
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  Complete Inspection
                </button>
              </div>
            )}

            {/* Approve */}
            {selectedSettlement.status === 'INSPECTION_DONE' && (
              <button
                onClick={() => handleApprove(selectedTenancyId!)}
                disabled={actionLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
              >
                Approve Settlement
              </button>
            )}

            {/* Process Refund */}
            {selectedSettlement.status === 'APPROVED' && (
              <button
                onClick={() => handleProcessRefund(selectedTenancyId!)}
                disabled={actionLoading}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50"
              >
                Process Refund
              </button>
            )}

            {/* Mark Settled */}
            {selectedSettlement.status === 'REFUND_PROCESSING' && (
              <button
                onClick={() => handleMarkSettled(selectedTenancyId!)}
                disabled={actionLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
              >
                Mark as Settled
              </button>
            )}

            {/* Settled Confirmation */}
            {selectedSettlement.status === 'SETTLED' && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-green-800 text-sm">
                This settlement has been completed.
                {selectedSettlement.settledAt && (
                  <span className="ml-1">Settled on {new Date(selectedSettlement.settledAt).toLocaleDateString('en-IN')}.</span>
                )}
              </div>
            )}

            {/* Inspection Notes Display */}
            {selectedSettlement.inspectionNotes && selectedSettlement.status !== 'INITIATED' && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-600 mb-1">Inspection Notes</p>
                <p className="text-sm text-gray-700">{selectedSettlement.inspectionNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
