'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function formatPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
}

const STATUS_COLORS: Record<string, string> = {
  CONSULTATION_BOOKED: 'bg-blue-100 text-blue-700',
  MEASUREMENT_DONE: 'bg-indigo-100 text-indigo-700',
  DESIGN_IN_PROGRESS: 'bg-purple-100 text-purple-700',
  DESIGN_APPROVED: 'bg-violet-100 text-violet-700',
  MATERIAL_SELECTED: 'bg-yellow-100 text-yellow-700',
  QUOTE_APPROVED: 'bg-emerald-100 text-emerald-700',
  EXECUTION: 'bg-orange-100 text-orange-700',
  QC_IN_PROGRESS: 'bg-teal-100 text-teal-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_STEPS = ['CONSULTATION_BOOKED', 'MEASUREMENT_DONE', 'DESIGN_IN_PROGRESS', 'DESIGN_APPROVED', 'MATERIAL_SELECTED', 'QUOTE_APPROVED', 'EXECUTION', 'QC_IN_PROGRESS', 'COMPLETED'];

const TABS = ['Overview', 'Rooms', 'Materials', 'Quote', 'Milestones', 'Quality'] as const;
type Tab = typeof TABS[number];

export default function InteriorProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [token, setToken] = useState('');
  const [project, setProject] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  useEffect(() => {
    const t = localStorage.getItem('access_token') || '';
    setToken(t);
    if (t && id) {
      Promise.all([
        api.getInteriorProject(id, t).catch(() => null),
        api.getInteriorRoomDesigns(id, t).catch(() => []),
        api.getInteriorMilestones(id, t).catch(() => []),
        api.getInteriorQuote(id, t).catch(() => null),
      ]).then(([proj, rm, ms, q]) => {
        setProject(proj);
        setRooms(Array.isArray(rm) ? rm : []);
        setMilestones(Array.isArray(ms) ? ms : []);
        setQuote(q);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64" />
            <div className="h-4 bg-gray-200 rounded w-96" />
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded mb-3" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center max-w-md">
          <h3 className="font-semibold text-slate-900 mb-2">Sign in to continue</h3>
          <p className="text-sm text-gray-500 mb-4">You need to be logged in to view project details.</p>
          <Link href="/auth" className="inline-flex bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">Sign In</Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="font-semibold text-slate-900 mb-2">Project not found</h3>
          <Link href="/services/interiors" className="text-sm text-purple-600">Back to Interiors</Link>
        </div>
      </div>
    );
  }

  const currentStepIdx = STATUS_STEPS.indexOf(project.status || '');
  const progressPercent = project.progressPercent || (currentStepIdx >= 0 ? Math.round(((currentStepIdx + 1) / STATUS_STEPS.length) * 100) : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link href="/services/interiors" className="text-gray-500 hover:text-gray-700 text-sm mb-3 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            My Projects
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">{project.projectType || project.name || 'Interior Project'}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[project.status] || 'bg-gray-100 text-gray-700'}`}>
              {(project.status || '').replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {project.designerName && <span>Designer: {project.designerName} &middot; </span>}
            {project.startDate && <span>Started {new Date(project.startDate).toLocaleDateString('en-IN')} &middot; </span>}
            {project.estimatedEndDate && <span>Est. Completion {new Date(project.estimatedEndDate).toLocaleDateString('en-IN')}</span>}
          </p>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto border-b-0">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Project Progress</h2>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div className="bg-purple-500 h-3 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="text-sm text-gray-500">{progressPercent}% complete</p>

              <div className="mt-6 flex items-center gap-0 overflow-x-auto pb-2">
                {STATUS_STEPS.map((s, i) => {
                  const done = i <= currentStepIdx;
                  const active = i === currentStepIdx;
                  return (
                    <div key={s} className="flex items-center">
                      <div className="flex flex-col items-center min-w-[70px]">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium ${
                          done ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-400'
                        } ${active ? 'ring-2 ring-purple-300' : ''}`}>
                          {done && !active ? (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          ) : i + 1}
                        </div>
                        <span className="text-[9px] mt-1 text-center text-gray-400">{s.replace(/_/g, ' ')}</span>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`w-6 h-0.5 ${i < currentStepIdx ? 'bg-purple-500' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Key Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-3">Key Dates</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Start Date</span><span className="text-slate-900">{project.startDate ? new Date(project.startDate).toLocaleDateString('en-IN') : 'TBD'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Est. Completion</span><span className="text-slate-900">{project.estimatedEndDate ? new Date(project.estimatedEndDate).toLocaleDateString('en-IN') : 'TBD'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Actual Completion</span><span className="text-slate-900">{project.completedDate ? new Date(project.completedDate).toLocaleDateString('en-IN') : '-'}</span></div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-3">Budget</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Budget</span><span className="text-slate-900">{project.budgetPaise ? formatPaise(project.budgetPaise) : project.budgetRange || 'TBD'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Quoted Amount</span><span className="text-slate-900">{quote?.totalPaise ? formatPaise(quote.totalPaise) : 'Pending'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Paid</span><span className="text-slate-900">{project.paidPaise ? formatPaise(project.paidPaise) : '-'}</span></div>
                </div>
              </div>
            </div>

            {/* Designer Contact */}
            {project.designerName && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-3">Your Designer</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xl">
                    {(project.designerName || 'D')[0]}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{project.designerName}</div>
                    {project.designerPhone && <div className="text-sm text-gray-500">{project.designerPhone}</div>}
                    {project.designerEmail && <div className="text-sm text-gray-500">{project.designerEmail}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rooms Tab */}
        {activeTab === 'Rooms' && (
          <div className="space-y-4">
            {rooms.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500">Room designs are being prepared. Check back soon.</p>
              </div>
            ) : (
              rooms.map((room, idx) => (
                <div key={room.id || idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-300">
                    <div className="text-center">
                      <svg className="w-10 h-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5V19.5a1.5 1.5 0 001.5 1.5z" /></svg>
                      <span className="text-sm">3D Render / Floor Plan</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{room.roomName || room.name || `Room ${idx + 1}`}</h3>
                        {room.designStyle && <p className="text-sm text-gray-500">{room.designStyle} style</p>}
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        room.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        room.approvalStatus === 'REVISION_REQUESTED' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {(room.approvalStatus || 'PENDING').replace(/_/g, ' ')}
                      </span>
                    </div>
                    {room.description && <p className="text-sm text-gray-500 mb-4">{room.description}</p>}
                    <div className="flex gap-2">
                      {room.has3dRender && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded">3D Render</span>}
                      {room.hasFloorPlan && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">Floor Plan</span>}
                      {room.hasMoodBoard && <span className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded">Mood Board</span>}
                    </div>
                    {room.approvalStatus !== 'APPROVED' && (
                      <button className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                        Approve Design
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === 'Materials' && (
          <div className="space-y-6">
            {rooms.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500">Material selections will appear once room designs are finalized.</p>
              </div>
            ) : (
              rooms.map((room, idx) => (
                <div key={room.id || idx} className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">{room.roomName || room.name || `Room ${idx + 1}`}</h3>
                  {!room.materials || room.materials.length === 0 ? (
                    <p className="text-sm text-gray-500">No materials selected yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 font-medium text-gray-500">Category</th>
                            <th className="text-left py-2 font-medium text-gray-500">Material</th>
                            <th className="text-left py-2 font-medium text-gray-500">Brand</th>
                            <th className="text-right py-2 font-medium text-gray-500">Qty</th>
                            <th className="text-right py-2 font-medium text-gray-500">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {room.materials.map((m: any, mIdx: number) => (
                            <tr key={mIdx}>
                              <td className="py-2 text-gray-600">{m.category}</td>
                              <td className="py-2 text-slate-900 font-medium">{m.name}</td>
                              <td className="py-2 text-gray-600">{m.brand || '-'}</td>
                              <td className="py-2 text-right text-gray-600">{m.quantity} {m.unit || ''}</td>
                              <td className="py-2 text-right text-slate-900">{m.pricePaise ? formatPaise(m.pricePaise) : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Quote Tab */}
        {activeTab === 'Quote' && (
          <div className="space-y-6">
            {!quote ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500">Quote is being prepared. You will be notified when ready.</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="font-semibold text-slate-900 mb-4">Quote Breakdown</h2>
                  <div className="space-y-3 text-sm">
                    {quote.materialsCostPaise != null && (
                      <div className="flex justify-between"><span className="text-gray-500">Materials</span><span className="text-slate-900">{formatPaise(quote.materialsCostPaise)}</span></div>
                    )}
                    {quote.laborCostPaise != null && (
                      <div className="flex justify-between"><span className="text-gray-500">Labor</span><span className="text-slate-900">{formatPaise(quote.laborCostPaise)}</span></div>
                    )}
                    {quote.hardwareCostPaise != null && (
                      <div className="flex justify-between"><span className="text-gray-500">Hardware & Fittings</span><span className="text-slate-900">{formatPaise(quote.hardwareCostPaise)}</span></div>
                    )}
                    {quote.overheadPaise != null && (
                      <div className="flex justify-between"><span className="text-gray-500">Overhead</span><span className="text-slate-900">{formatPaise(quote.overheadPaise)}</span></div>
                    )}
                    {quote.discountPaise != null && quote.discountPaise > 0 && (
                      <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPaise(quote.discountPaise)}</span></div>
                    )}
                    <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold text-base">
                      <span className="text-slate-900">Total</span>
                      <span className="text-purple-600">{formatPaise(quote.totalPaise || 0)}</span>
                    </div>
                  </div>
                  {quote.status !== 'APPROVED' && (
                    <button className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors">
                      Approve Quote
                    </button>
                  )}
                </div>

                {/* Payment Schedule */}
                {quote.paymentSchedule && quote.paymentSchedule.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Payment Schedule</h3>
                    <div className="space-y-3">
                      {quote.paymentSchedule.map((p: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div>
                            <div className="text-sm font-medium text-slate-900">{p.milestone || `Payment ${idx + 1}`}</div>
                            <div className="text-xs text-gray-500">{p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-IN') : 'TBD'}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-slate-900">{formatPaise(p.amountPaise || 0)}</div>
                            <span className={`text-xs ${p.paid ? 'text-green-600' : 'text-gray-400'}`}>{p.paid ? 'Paid' : 'Pending'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Milestones Tab */}
        {activeTab === 'Milestones' && (
          <div className="space-y-4">
            {milestones.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500">Project milestones will appear here once work begins.</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                {milestones.map((ms, idx) => (
                  <div key={ms.id || idx} className="relative pl-10 pb-6">
                    <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                      ms.status === 'COMPLETED' ? 'bg-green-500 border-green-500' :
                      ms.status === 'IN_PROGRESS' ? 'bg-purple-500 border-purple-500' :
                      'bg-white border-gray-300'
                    }`} />
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-slate-900">{ms.name || ms.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          ms.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          ms.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {(ms.status || 'PENDING').replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500 mb-2">
                        {ms.scheduledDate && <span>Scheduled: {new Date(ms.scheduledDate).toLocaleDateString('en-IN')}</span>}
                        {ms.completedDate && <span>Completed: {new Date(ms.completedDate).toLocaleDateString('en-IN')}</span>}
                      </div>
                      {ms.description && <p className="text-sm text-gray-500 mb-2">{ms.description}</p>}
                      {ms.linkedPaymentPaise != null && (
                        <p className="text-sm text-purple-600 font-medium">Payment: {formatPaise(ms.linkedPaymentPaise)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quality Tab */}
        {activeTab === 'Quality' && (
          <div className="space-y-4">
            {!project.qualityChecks || project.qualityChecks.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500">Quality check results will appear here during execution phase.</p>
              </div>
            ) : (
              project.qualityChecks.map((qc: any, idx: number) => (
                <div key={qc.id || idx} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-slate-900">{qc.checkName || qc.name}</h4>
                      {qc.inspectorName && <p className="text-sm text-gray-500">Inspector: {qc.inspectorName}</p>}
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      qc.result === 'PASS' ? 'bg-green-100 text-green-700' :
                      qc.result === 'FAIL' ? 'bg-red-100 text-red-700' :
                      qc.result === 'REWORK' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {qc.result || 'Pending'}
                    </span>
                  </div>
                  {qc.notes && <p className="text-sm text-gray-500 mb-2">{qc.notes}</p>}
                  {qc.date && <p className="text-xs text-gray-400">Checked on {new Date(qc.date).toLocaleDateString('en-IN')}</p>}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
