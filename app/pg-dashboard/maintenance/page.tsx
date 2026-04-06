'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type TicketComment = {
  id: string;
  authorName: string;
  authorRole: string;
  commentText: string;
  createdAt: string;
};

type MaintenanceRequest = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedTo?: string;
  photoUrls?: string[];
  rating?: number;
  feedback?: string;
  slaDeadlineAt?: string;
  slaBreached?: boolean;
  escalationLevel?: number;
  reopenCount?: number;
  createdAt: string;
  updatedAt: string;
};

const STATUS_TABS = ['ALL', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED', 'CLOSED'] as const;

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700',
  ASSIGNED: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  REOPENED: 'bg-purple-100 text-purple-700',
  CLOSED: 'bg-gray-100 text-gray-500',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

const ESCALATION_COLORS: Record<number, string> = {
  1: 'bg-green-100 text-green-700',
  2: 'bg-yellow-100 text-yellow-700',
  3: 'bg-red-100 text-red-700',
};

const CATEGORIES = [
  'PLUMBING',
  'ELECTRICAL',
  'FURNITURE',
  'APPLIANCE',
  'CLEANING',
  'PEST_CONTROL',
  'HOUSEKEEPING',
  'FOOD_MEALS',
  'WIFI_INTERNET',
  'WATER',
  'ELECTRICITY',
  'SECURITY',
  'NOISE_COMPLAINT',
  'ROOMMATE_ISSUE',
  'BILLING_PAYMENT',
  'AC_COOLING',
  'COMMON_AREA',
  'PARKING',
  'LAUNDRY',
  'OTHER',
] as const;

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

function formatCategoryLabel(cat: string) {
  return cat.replace(/_/g, ' ');
}

function getSlaRemainingText(deadlineStr: string): string {
  const now = Date.now();
  const deadline = new Date(deadlineStr).getTime();
  const diff = deadline - now;
  if (diff <= 0) return 'Overdue';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  return hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
}

function isWithin48Hours(dateStr: string): boolean {
  const resolved = new Date(dateStr).getTime();
  const now = Date.now();
  return now - resolved < 48 * 60 * 60 * 1000;
}

export default function MaintenancePage() {
  const router = useRouter();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [tenancyId, setTenancyId] = useState<string>('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New request form
  const [newCategory, setNewCategory] = useState<string>('PLUMBING');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<string>('MEDIUM');
  const [newPhotos, setNewPhotos] = useState('');

  // Rate form
  const [rateStars, setRateStars] = useState(5);
  const [rateFeedback, setRateFeedback] = useState('');

  // Reopen modal
  const [showReopenModal, setShowReopenModal] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState('');

  // Comment thread state
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, TicketComment[]>>({});
  const [commentsLoading, setCommentsLoading] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // SLA countdown refresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth?redirect=/pg-dashboard/maintenance');
      return;
    }
    try {
      const dashboard = await api.getTenantDashboard(token);
      const tid = dashboard.tenancyId || dashboard.id;
      setTenancyId(tid);
      const data = await api.getMaintenanceRequests(tid, token);
      setRequests(Array.isArray(data) ? data : data?.content ?? []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = activeTab === 'ALL'
    ? requests
    : requests.filter((r) => r.status === activeTab);

  async function handleCreateRequest() {
    const token = localStorage.getItem('access_token');
    if (!token || !tenancyId) return;
    setSubmitting(true);
    try {
      const photoUrls = newPhotos
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean);
      await api.createMaintenanceRequest(
        tenancyId,
        {
          category: newCategory,
          title: newTitle,
          description: newDescription,
          priority: newPriority,
          photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
        },
        token
      );
      setShowNewModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewPhotos('');
      setNewPriority('MEDIUM');
      setNewCategory('PLUMBING');
      setLoading(true);
      await loadData();
    } catch {
      alert('Failed to create request');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRate(requestId: string) {
    const token = localStorage.getItem('access_token');
    if (!token || !tenancyId) return;
    setSubmitting(true);
    try {
      await api.rateMaintenanceRequest(tenancyId, requestId, rateStars, rateFeedback, token);
      setShowRateModal(null);
      setRateStars(5);
      setRateFeedback('');
      setLoading(true);
      await loadData();
    } catch {
      alert('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReopen(requestId: string) {
    const token = localStorage.getItem('access_token');
    if (!token || !tenancyId || !reopenReason.trim()) return;
    setSubmitting(true);
    try {
      await api.reopenTicket(tenancyId, requestId, reopenReason);
      setShowReopenModal(null);
      setReopenReason('');
      setLoading(true);
      await loadData();
    } catch {
      alert('Failed to reopen ticket');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClose(requestId: string) {
    const token = localStorage.getItem('access_token');
    if (!token || !tenancyId) return;
    if (!confirm('Confirm this issue has been resolved?')) return;
    try {
      await api.closeTicket(tenancyId, requestId);
      setLoading(true);
      await loadData();
    } catch {
      alert('Failed to close ticket');
    }
  }

  async function loadComments(requestId: string) {
    const token = localStorage.getItem('access_token');
    if (!token || !tenancyId) return;
    setCommentsLoading(requestId);
    try {
      const data = await api.getTicketComments(tenancyId, requestId);
      setComments((prev) => ({ ...prev, [requestId]: Array.isArray(data) ? data : data?.content ?? [] }));
    } catch {
      setComments((prev) => ({ ...prev, [requestId]: [] }));
    } finally {
      setCommentsLoading(null);
    }
  }

  function toggleComments(requestId: string) {
    if (expandedTicket === requestId) {
      setExpandedTicket(null);
    } else {
      setExpandedTicket(requestId);
      if (!comments[requestId]) {
        loadComments(requestId);
      }
    }
  }

  async function handleAddComment(requestId: string) {
    const token = localStorage.getItem('access_token');
    if (!token || !tenancyId || !newComment.trim()) return;
    setCommentSubmitting(true);
    try {
      await api.addTicketComment(tenancyId, requestId, { commentText: newComment.trim() });
      setNewComment('');
      await loadComments(requestId);
    } catch {
      alert('Failed to add comment');
    } finally {
      setCommentSubmitting(false);
    }
  }

  const ROLE_BADGE_COLORS: Record<string, string> = {
    TENANT: 'bg-blue-100 text-blue-700',
    MANAGER: 'bg-orange-100 text-orange-700',
    MAINTENANCE: 'bg-green-100 text-green-700',
    ADMIN: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-400">
        <div className="text-4xl mb-4 animate-spin">&#x23F3;</div>
        <p>Loading maintenance requests...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Maintenance Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage your maintenance issues</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 text-sm"
        >
          + New Request
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              activeTab === tab
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Request Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">&#x1F527;</p>
          <p className="text-sm font-medium">No maintenance requests</p>
          <p className="text-xs text-gray-400 mt-1">
            {activeTab === 'ALL'
              ? 'Submit a request when something needs fixing'
              : `No ${activeTab.replace(/_/g, ' ').toLowerCase()} requests`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => (
            <div key={req.id} className="border rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{req.title}</h3>
                  {req.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{req.description}</p>
                  )}
                </div>
                <span
                  className={`ml-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {req.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Category + Priority badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                  {formatCategoryLabel(req.category)}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${
                    PRIORITY_COLORS[req.priority] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {req.priority}
                </span>
                {req.assignedTo && (
                  <span className="text-xs text-gray-500">
                    Assigned to: <span className="font-medium">{req.assignedTo}</span>
                  </span>
                )}
              </div>

              {/* SLA + Escalation info line */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {req.slaDeadlineAt && (
                  req.slaBreached ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700">
                      SLA Breached
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                      {getSlaRemainingText(req.slaDeadlineAt)}
                    </span>
                  )
                )}
                {req.escalationLevel != null && req.escalationLevel > 0 && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      ESCALATION_COLORS[req.escalationLevel] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    L{req.escalationLevel}
                  </span>
                )}
                {req.reopenCount != null && req.reopenCount > 0 && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                    Reopened {req.reopenCount}x
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {new Date(req.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>

                <div className="flex items-center gap-3">
                  {/* Reopen button - only on RESOLVED within 48hr */}
                  {req.status === 'RESOLVED' && isWithin48Hours(req.updatedAt) && (
                    <button
                      onClick={() => {
                        setShowReopenModal(req.id);
                        setReopenReason('');
                      }}
                      className="text-xs font-semibold text-purple-600 hover:text-purple-700"
                    >
                      Reopen
                    </button>
                  )}

                  {/* Close button - on RESOLVED tickets */}
                  {req.status === 'RESOLVED' && (
                    <button
                      onClick={() => handleClose(req.id)}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                    >
                      Close
                    </button>
                  )}

                  {/* Rate button */}
                  {req.status === 'RESOLVED' && !req.rating && (
                    <button
                      onClick={() => {
                        setShowRateModal(req.id);
                        setRateStars(5);
                        setRateFeedback('');
                      }}
                      className="text-xs font-semibold text-orange-500 hover:text-orange-600"
                    >
                      Rate Resolution
                    </button>
                  )}
                  {req.rating && (
                    <span className="text-xs text-gray-500">
                      Rated: {'★'.repeat(req.rating)}{'☆'.repeat(5 - req.rating)}
                    </span>
                  )}

                  {/* Comments toggle */}
                  <button
                    onClick={() => toggleComments(req.id)}
                    className="text-xs font-semibold text-orange-500 hover:text-orange-600"
                  >
                    {expandedTicket === req.id ? 'Hide Comments' : 'Comments'}
                  </button>
                </div>
              </div>

              {/* Comment Thread */}
              {expandedTicket === req.id && (
                <div className="mt-4 pt-4 border-t">
                  {commentsLoading === req.id ? (
                    <p className="text-xs text-gray-400 text-center py-4">Loading comments...</p>
                  ) : (
                    <>
                      {(comments[req.id] ?? []).length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-3">No comments yet</p>
                      ) : (
                        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                          {(comments[req.id] ?? []).map((c) => (
                            <div key={c.id} className="flex gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-semibold text-gray-800">
                                    {c.authorName}
                                  </span>
                                  <span
                                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                      ROLE_BADGE_COLORS[c.authorRole] || 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {c.authorRole}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    {new Date(c.createdAt).toLocaleString('en-IN', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{c.commentText}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add comment input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment(req.id);
                            }
                          }}
                          className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <button
                          onClick={() => handleAddComment(req.id)}
                          disabled={commentSubmitting || !newComment.trim()}
                          className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
                        >
                          {commentSubmitting ? '...' : 'Send'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Request Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">New Maintenance Request</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {formatCategoryLabel(c)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Brief description of the issue"
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  placeholder="Provide more details about the issue"
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setNewPriority(p)}
                      className={`flex-1 text-xs font-medium py-2 rounded-xl transition ${
                        newPriority === p
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photo URLs <span className="text-gray-400">(comma-separated, optional)</span>
                </label>
                <input
                  type="text"
                  value={newPhotos}
                  onChange={(e) => setNewPhotos(e.target.value)}
                  placeholder="https://example.com/photo1.jpg, https://..."
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewModal(false)}
                className="flex-1 border rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRequest}
                disabled={submitting || !newTitle.trim()}
                className="flex-1 bg-orange-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold mb-4">Rate Resolution</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRateStars(star)}
                      className={`text-2xl transition ${
                        star <= rateStars ? 'text-orange-500' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={rateFeedback}
                  onChange={(e) => setRateFeedback(e.target.value)}
                  rows={3}
                  placeholder="How was the resolution handled?"
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRateModal(null)}
                className="flex-1 border rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRate(showRateModal)}
                disabled={submitting}
                className="flex-1 bg-orange-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold mb-4">Reopen Ticket</h2>
            <p className="text-sm text-gray-500 mb-4">
              Please explain why the issue is not resolved. You can reopen within 48 hours of resolution.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                rows={3}
                placeholder="Describe why this needs to be reopened..."
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowReopenModal(null)}
                className="flex-1 border rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReopen(showReopenModal)}
                disabled={submitting || !reopenReason.trim()}
                className="flex-1 bg-purple-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
              >
                {submitting ? 'Reopening...' : 'Reopen Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
