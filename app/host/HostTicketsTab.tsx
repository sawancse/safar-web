'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

/* ─── Types ─── */
type Ticket = {
  id: string; tenancyId: string; listingId: string;
  requestNumber: string; category: string; title: string;
  description: string; photoUrls?: string; priority: string;
  status: string; assignedTo?: string; assignedAt?: string;
  resolvedAt?: string; resolutionNotes?: string;
  slaDeadlineAt?: string; slaBreached: boolean;
  escalationLevel: number; reopenCount: number;
  createdAt: string; updatedAt: string;
};

type TicketComment = {
  id: string; authorId: string; authorRole: string;
  commentText: string; attachmentUrls?: string;
  systemNote: boolean; createdAt: string;
};

type TicketStats = {
  openCount: number; inProgressCount: number;
  slaBreachedCount: number; avgResolutionHours: number;
  slaCompliancePercent: number;
  categoryBreakdown: Record<string, number>;
};

interface Props {
  token: string;
  listings: { id: string; title: string }[];
}

/* ─── Helpers ─── */
function getToken(fallback: string) {
  return typeof window !== 'undefined'
    ? (localStorage.getItem('access_token') ?? fallback)
    : fallback;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

/* ─── Badge maps ─── */
const STATUS_BADGE: Record<string, { bg: string; label: string }> = {
  OPEN:        { bg: 'bg-yellow-100 text-yellow-700', label: 'Open' },
  ASSIGNED:    { bg: 'bg-blue-100 text-blue-700', label: 'Assigned' },
  IN_PROGRESS: { bg: 'bg-indigo-100 text-indigo-700', label: 'In Progress' },
  RESOLVED:    { bg: 'bg-green-100 text-green-700', label: 'Resolved' },
  CLOSED:      { bg: 'bg-gray-100 text-gray-600', label: 'Closed' },
  REJECTED:    { bg: 'bg-red-100 text-red-600', label: 'Rejected' },
  REOPENED:    { bg: 'bg-orange-100 text-orange-700', label: 'Reopened' },
};

const PRIORITY_BADGE: Record<string, { bg: string; label: string }> = {
  LOW:      { bg: 'bg-gray-100 text-gray-600', label: 'Low' },
  MEDIUM:   { bg: 'bg-yellow-100 text-yellow-700', label: 'Medium' },
  HIGH:     { bg: 'bg-orange-100 text-orange-700', label: 'High' },
  CRITICAL: { bg: 'bg-red-100 text-red-700', label: 'Critical' },
};

const ROLE_BADGE: Record<string, string> = {
  TENANT: 'bg-blue-100 text-blue-700',
  HOST:   'bg-orange-100 text-orange-700',
  SYSTEM: 'bg-gray-100 text-gray-500',
  ADMIN:  'bg-red-100 text-red-700',
};

const ESCALATION_BADGE: Record<number, { bg: string; label: string }> = {
  1: { bg: 'bg-slate-100 text-slate-600', label: 'L1' },
  2: { bg: 'bg-amber-100 text-amber-700', label: 'L2' },
  3: { bg: 'bg-red-100 text-red-700', label: 'L3' },
};

const CATEGORIES = [
  'PLUMBING', 'ELECTRICAL', 'FURNITURE', 'APPLIANCE',
  'PEST_CONTROL', 'CLEANING', 'SECURITY', 'WIFI_INTERNET',
  'WATER_SUPPLY', 'OTHER',
];

const STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED', 'REOPENED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const HOST_ACTIONS = ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

/* ═══════════════════════════ COMPONENT ═══════════════════════════ */
export default function HostTicketsTab({ token: initialToken, listings }: Props) {
  const [selectedListing, setSelectedListing] = useState(listings[0]?.id ?? '');
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Detail modal
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentSending, setCommentSending] = useState(false);

  // Actions
  const [actionStatus, setActionStatus] = useState('');
  const [actionAssignedTo, setActionAssignedTo] = useState('');
  const [actionResolutionNotes, setActionResolutionNotes] = useState('');
  const [actionSaving, setActionSaving] = useState(false);

  const token = getToken(initialToken);

  /* ─── Data fetching ─── */
  const fetchStats = useCallback(() => {
    if (!selectedListing) return;
    setStatsLoading(true);
    api.getTicketStats(selectedListing, token)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, [selectedListing, token]);

  const fetchTickets = useCallback(() => {
    if (!selectedListing) return;
    setLoading(true);
    api.getListingTickets(selectedListing, {
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      category: categoryFilter || undefined,
      page,
    }, token)
      .then((res: any) => {
        setTickets(res.content ?? []);
        setTotalPages(res.totalPages ?? 0);
      })
      .catch(() => { setTickets([]); setTotalPages(0); })
      .finally(() => setLoading(false));
  }, [selectedListing, statusFilter, priorityFilter, categoryFilter, page, token]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [statusFilter, priorityFilter, categoryFilter, selectedListing]);

  /* ─── Open detail modal ─── */
  const openDetail = (ticket: Ticket) => {
    setSelected(ticket);
    setActionStatus(ticket.status);
    setActionAssignedTo(ticket.assignedTo ?? '');
    setActionResolutionNotes(ticket.resolutionNotes ?? '');
    setNewComment('');
    setCommentsLoading(true);
    api.getTicketComments(ticket.tenancyId, ticket.id, token)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  };

  const closeDetail = () => { setSelected(null); setComments([]); };

  /* ─── Add comment ─── */
  const handleAddComment = async () => {
    if (!selected || !newComment.trim()) return;
    setCommentSending(true);
    try {
      await api.addTicketComment(selected.tenancyId, selected.id, { commentText: newComment.trim() }, token);
      setNewComment('');
      const fresh = await api.getTicketComments(selected.tenancyId, selected.id, token);
      setComments(fresh);
    } catch { /* ignore */ }
    setCommentSending(false);
  };

  /* ─── Update ticket ─── */
  const handleUpdateTicket = async () => {
    if (!selected) return;
    setActionSaving(true);
    try {
      const body: any = {};
      if (actionStatus && actionStatus !== selected.status) body.status = actionStatus;
      if (actionAssignedTo && actionAssignedTo !== selected.assignedTo) body.assignedTo = actionAssignedTo;
      if (actionResolutionNotes && actionResolutionNotes !== selected.resolutionNotes) body.resolutionNotes = actionResolutionNotes;
      if (Object.keys(body).length > 0) {
        await api.updateListingTicket(selected.listingId, selected.id, body, token);
      }
      closeDetail();
      fetchTickets();
      fetchStats();
    } catch { /* ignore */ }
    setActionSaving(false);
  };

  /* ─── Parse photo URLs ─── */
  const parsePhotos = (urls?: string): string[] => {
    if (!urls) return [];
    try { return JSON.parse(urls); } catch { return urls.split(',').map(s => s.trim()).filter(Boolean); }
  };

  /* ═══════════════════════════ RENDER ═══════════════════════════ */
  return (
    <div className="space-y-6">
      {/* ─── Listing Selector ─── */}
      {listings.length > 1 && (
        <div className="bg-white border rounded-2xl p-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">Select Listing</label>
          <select
            value={selectedListing}
            onChange={e => setSelectedListing(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          >
            {listings.map(l => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* ─── Stats Bar ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open', value: stats?.openCount ?? '-', color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'In Progress', value: stats?.inProgressCount ?? '-', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'SLA Breached', value: stats?.slaBreachedCount ?? '-', color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Avg Resolution', value: stats ? `${stats.avgResolutionHours.toFixed(1)}h` : '-', color: 'text-green-600', bg: 'bg-green-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border`}>
            {statsLoading ? (
              <div className="animate-pulse h-10 bg-gray-200 rounded" />
            ) : (
              <>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ─── SLA Compliance ─── */}
      {stats && stats.slaCompliancePercent !== undefined && (
        <div className="bg-white border rounded-2xl p-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">SLA Compliance</p>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  stats.slaCompliancePercent >= 90 ? 'bg-green-500' :
                  stats.slaCompliancePercent >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(stats.slaCompliancePercent, 100)}%` }}
              />
            </div>
          </div>
          <span className="text-lg font-bold text-gray-700">{stats.slaCompliancePercent.toFixed(0)}%</span>
        </div>
      )}

      {/* ─── Filter Bar ─── */}
      <div className="bg-white border rounded-2xl p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_BADGE[s]?.label ?? s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Priority</label>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_BADGE[p]?.label ?? p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Category</label>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => { setStatusFilter(''); setPriorityFilter(''); setCategoryFilter(''); }}
          className="text-orange-500 hover:text-orange-600 text-sm font-medium underline"
        >
          Clear Filters
        </button>
      </div>

      {/* ─── Tickets Table / Cards ─── */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-4 animate-spin">&#8987;</div>
          <p>Loading tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">&#128221;</div>
          <p className="text-lg font-medium">No tickets found</p>
          <p className="text-sm mt-1">Tenant maintenance requests will appear here.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Request #</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">SLA</th>
                  <th className="px-4 py-3 text-left">Escalation</th>
                  <th className="px-4 py-3 text-left">Assigned To</th>
                  <th className="px-4 py-3 text-left">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tickets.map(t => {
                  const stBadge = STATUS_BADGE[t.status] ?? { bg: 'bg-gray-100 text-gray-600', label: t.status };
                  const prBadge = PRIORITY_BADGE[t.priority] ?? { bg: 'bg-gray-100 text-gray-600', label: t.priority };
                  const escBadge = ESCALATION_BADGE[t.escalationLevel] ?? ESCALATION_BADGE[1];
                  return (
                    <tr
                      key={t.id}
                      onClick={() => openDetail(t)}
                      className="hover:bg-orange-50 cursor-pointer transition"
                    >
                      <td className="px-4 py-3 font-mono text-xs">{t.requestNumber}</td>
                      <td className="px-4 py-3 text-xs">{t.category.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 font-medium max-w-[200px] truncate">{t.title}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prBadge.bg}`}>{prBadge.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stBadge.bg}`}>{stBadge.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {t.slaBreached ? (
                          <span className="text-red-600 font-semibold text-xs">Breached</span>
                        ) : (
                          <span className="text-green-600 text-xs">&#10003; OK</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${escBadge.bg}`}>{escBadge.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{t.assignedTo ?? '-'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(t.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {tickets.map(t => {
              const stBadge = STATUS_BADGE[t.status] ?? { bg: 'bg-gray-100 text-gray-600', label: t.status };
              const prBadge = PRIORITY_BADGE[t.priority] ?? { bg: 'bg-gray-100 text-gray-600', label: t.priority };
              const escBadge = ESCALATION_BADGE[t.escalationLevel] ?? ESCALATION_BADGE[1];
              return (
                <div
                  key={t.id}
                  onClick={() => openDetail(t)}
                  className="bg-white border rounded-2xl p-4 cursor-pointer hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">{t.title}</p>
                      <p className="text-xs text-gray-400 font-mono">{t.requestNumber}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prBadge.bg}`}>{prBadge.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${stBadge.bg}`}>{stBadge.label}</span>
                    <span className="text-gray-400">{t.category.replace(/_/g, ' ')}</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${escBadge.bg}`}>{escBadge.label}</span>
                    {t.slaBreached && <span className="text-red-600 font-semibold">SLA Breached</span>}
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-gray-400">
                    <span>{t.assignedTo ? `Assigned: ${t.assignedTo}` : 'Unassigned'}</span>
                    <span>{fmtDate(t.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm rounded-xl border disabled:opacity-40 hover:bg-orange-50 transition"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-8 h-8 text-sm rounded-xl border transition ${
                    i === page ? 'bg-orange-500 text-white border-orange-500' : 'hover:bg-orange-50'
                  }`}
                >
                  {i + 1}
                </button>
              )).slice(Math.max(0, page - 2), page + 3)}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm rounded-xl border disabled:opacity-40 hover:bg-orange-50 transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* ═══════════════ Ticket Detail Modal ═══════════════ */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeDetail}>
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-start rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold">{selected.title}</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{selected.requestNumber}</p>
              </div>
              <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Category</p>
                  <p className="font-medium">{selected.category.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Priority</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${(PRIORITY_BADGE[selected.priority] ?? PRIORITY_BADGE.LOW).bg}`}>
                    {(PRIORITY_BADGE[selected.priority] ?? PRIORITY_BADGE.LOW).label}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${(STATUS_BADGE[selected.status] ?? STATUS_BADGE.OPEN).bg}`}>
                    {(STATUS_BADGE[selected.status] ?? STATUS_BADGE.OPEN).label}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400">SLA Deadline</p>
                  <p className="font-medium">{selected.slaDeadlineAt ? fmtDateTime(selected.slaDeadlineAt) : '-'}</p>
                  {selected.slaBreached && <span className="text-red-600 text-xs font-semibold">Breached</span>}
                </div>
                <div>
                  <p className="text-xs text-gray-400">Escalation Level</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${(ESCALATION_BADGE[selected.escalationLevel] ?? ESCALATION_BADGE[1]).bg}`}>
                    {(ESCALATION_BADGE[selected.escalationLevel] ?? ESCALATION_BADGE[1]).label}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Reopened</p>
                  <p className="font-medium">{selected.reopenCount} time{selected.reopenCount !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs text-gray-400 mb-1">Description</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-3">{selected.description}</p>
              </div>

              {/* Photos */}
              {parsePhotos(selected.photoUrls).length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Photos</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {parsePhotos(selected.photoUrls).map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Ticket photo ${i + 1}`}
                        className="w-24 h-24 object-cover rounded-xl border flex-shrink-0"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Comment Thread */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Comments ({comments.length})</p>
                {commentsLoading ? (
                  <div className="text-center py-4 text-gray-400 text-sm">Loading comments...</div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No comments yet.</p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {comments.map(c => (
                      <div key={c.id} className={`p-3 rounded-xl text-sm ${c.systemNote ? 'bg-gray-50 border border-dashed' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[c.authorRole] ?? 'bg-gray-100 text-gray-600'}`}>
                            {c.authorRole}
                          </span>
                          <span className="text-xs text-gray-400">{fmtDateTime(c.createdAt)}</span>
                          {c.systemNote && <span className="text-xs italic text-gray-400">System</span>}
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{c.commentText}</p>
                      </div>
                    ))}
                  </div>
                )}
                {/* Add comment */}
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={commentSending || !newComment.trim()}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 transition"
                  >
                    {commentSending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t pt-4 space-y-4">
                <p className="text-xs text-gray-400 font-semibold uppercase">Actions</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Change Status</label>
                    <select
                      value={actionStatus}
                      onChange={e => setActionStatus(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      {HOST_ACTIONS.map(s => (
                        <option key={s} value={s}>{STATUS_BADGE[s]?.label ?? s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Assign To</label>
                    <input
                      type="text"
                      value={actionAssignedTo}
                      onChange={e => setActionAssignedTo(e.target.value)}
                      placeholder="e.g. Maintenance Team"
                      className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Resolution Notes</label>
                  <textarea
                    value={actionResolutionNotes}
                    onChange={e => setActionResolutionNotes(e.target.value)}
                    placeholder="Describe how the issue was resolved..."
                    rows={3}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={closeDetail}
                    className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateTicket}
                    disabled={actionSaving}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl text-sm font-medium disabled:opacity-50 transition"
                  >
                    {actionSaving ? 'Saving...' : 'Update Ticket'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
