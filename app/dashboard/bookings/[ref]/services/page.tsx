'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Booking } from '@/types';

const SERVICE_CATEGORIES = [
  { key: 'WATER',             label: 'Water',            icon: '💧', priority: 'URGENT' },
  { key: 'BREAKFAST',         label: 'Breakfast',        icon: '🥐', priority: 'MEDIUM' },
  { key: 'LUNCH',             label: 'Lunch',            icon: '🍽️', priority: 'MEDIUM' },
  { key: 'DINNER',            label: 'Dinner',           icon: '🍷', priority: 'MEDIUM' },
  { key: 'ROOM_SERVICE',      label: 'Room Service',     icon: '🛎️', priority: 'HIGH' },
  { key: 'TOWELS_LINEN',      label: 'Towels & Linen',   icon: '🧺', priority: 'MEDIUM' },
  { key: 'HOUSEKEEPING',      label: 'Housekeeping',     icon: '🧹', priority: 'MEDIUM' },
  { key: 'EXTRA_BED',         label: 'Extra Bed',        icon: '🛏️', priority: 'LOW' },
  { key: 'WAKE_UP_CALL',      label: 'Wake-up Call',     icon: '⏰', priority: 'HIGH' },
  { key: 'MINIBAR',           label: 'Minibar',          icon: '🧊', priority: 'LOW' },
  { key: 'CONCIERGE',         label: 'Concierge',        icon: '🎩', priority: 'MEDIUM' },
  { key: 'LUGGAGE',           label: 'Luggage Help',     icon: '🧳', priority: 'HIGH' },
  { key: 'TRANSPORT',         label: 'Transport',        icon: '🚗', priority: 'MEDIUM' },
  { key: 'CHECKOUT_EXTENSION',label: 'Late Checkout',    icon: '🕐', priority: 'LOW' },
  { key: 'WIFI_INTERNET',     label: 'WiFi Issue',       icon: '📶', priority: 'HIGH' },
  { key: 'AC_COOLING',        label: 'AC / Cooling',     icon: '❄️', priority: 'HIGH' },
  { key: 'PLUMBING',          label: 'Plumbing',         icon: '🔧', priority: 'HIGH' },
  { key: 'ELECTRICAL',        label: 'Electrical',       icon: '⚡', priority: 'HIGH' },
  { key: 'CLEANING',          label: 'Cleaning',         icon: '✨', priority: 'MEDIUM' },
  { key: 'SECURITY',          label: 'Security',         icon: '🔒', priority: 'URGENT' },
  { key: 'NOISE_COMPLAINT',   label: 'Noise',            icon: '🔇', priority: 'MEDIUM' },
  { key: 'OTHER',             label: 'Other',            icon: '📋', priority: 'MEDIUM' },
];

const STATUS_BADGE: Record<string, string> = {
  OPEN:        'bg-yellow-100 text-yellow-700',
  ASSIGNED:    'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  RESOLVED:    'bg-green-100 text-green-700',
  CLOSED:      'bg-gray-100 text-gray-500',
  REOPENED:    'bg-orange-100 text-orange-700',
  REJECTED:    'bg-red-100 text-red-600',
};

const PRIORITY_BADGE: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700',
  HIGH:   'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW:    'bg-gray-100 text-gray-500',
};

export default function ServiceRequestsPage() {
  const { ref } = useParams();
  const router = useRouter();
  const [token, setToken] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [creating, setCreating] = useState(false);

  // Detail modal
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  // Rating modal
  const [ratingTicket, setRatingTicket] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const t = localStorage.getItem('access_token') || '';
    if (!t) { router.push('/auth'); return; }
    setToken(t);

    api.getMyBookings(t)
      .then((bookings: Booking[]) => {
        const b = bookings.find((bk) => bk.bookingRef === ref);
        if (!b) { setError('Booking not found'); return; }
        setBooking(b);
        loadRequests(b.id, t);
      })
      .catch(() => setError('Failed to load booking'))
      .finally(() => setLoading(false));
  }, [ref]);

  const loadRequests = useCallback((bookingId: string, t: string) => {
    api.getServiceRequests(bookingId, t)
      .then((res: any) => setRequests(res.content || res || []))
      .catch(() => {});
  }, []);

  async function handleCreate() {
    if (!booking || !token || !selectedCategory || !title.trim()) return;
    setCreating(true);
    try {
      await api.createServiceRequest(booking.id, {
        category: selectedCategory,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
      }, token);
      setShowCreate(false);
      setSelectedCategory('');
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      loadRequests(booking.id, token);
    } catch (e: any) {
      alert(e.message || 'Failed to create request');
    } finally {
      setCreating(false);
    }
  }

  async function handleComment() {
    if (!booking || !token || !selectedTicket || !commentText.trim()) return;
    setSending(true);
    try {
      await api.addServiceRequestComment(booking.id, selectedTicket.id, commentText.trim(), token);
      setCommentText('');
      // Reload ticket detail
      const detail = await api.getServiceRequest(booking.id, selectedTicket.id, token);
      setSelectedTicket(detail);
    } catch (e: any) {
      alert(e.message || 'Failed to send comment');
    } finally {
      setSending(false);
    }
  }

  async function handleRate() {
    if (!booking || !token || !ratingTicket) return;
    try {
      await api.rateServiceRequest(booking.id, ratingTicket.id, rating, feedback, token);
      setRatingTicket(null);
      setRating(5);
      setFeedback('');
      loadRequests(booking.id, token);
    } catch (e: any) {
      alert(e.message || 'Failed to rate');
    }
  }

  async function openTicketDetail(sr: any) {
    if (!booking || !token) return;
    try {
      const detail = await api.getServiceRequest(booking.id, sr.id, token);
      setSelectedTicket(detail);
    } catch {
      setSelectedTicket(sr);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#003B95] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !booking) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border p-8 max-w-md w-full text-center">
        <p className="text-4xl mb-3">⚠️</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{error || 'Booking not found'}</h2>
        <Link href="/dashboard" className="mt-4 inline-block text-[#003B95] hover:underline font-medium">Back to Dashboard</Link>
      </div>
    </div>
  );

  const isActive = ['CONFIRMED', 'CHECKED_IN'].includes(booking.status);
  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <Link href={`/dashboard/bookings/${ref}`} className="text-sm text-[#003B95] hover:underline mb-4 inline-block">
          ← Back to Booking
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Service Requests</h1>
            <p className="text-sm text-gray-500">{booking.listingTitle} · {booking.bookingRef}</p>
          </div>
          {isActive && (
            <button onClick={() => setShowCreate(true)}
              className="px-4 py-2 rounded-xl bg-[#003B95] text-white text-sm font-semibold hover:bg-[#002d73] transition">
              + New Request
            </button>
          )}
        </div>

        {/* Quick service buttons */}
        {isActive && (
          <div className="bg-white rounded-2xl border p-5 mb-6">
            <p className="text-xs text-gray-400 font-medium mb-3">QUICK REQUESTS</p>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {SERVICE_CATEGORIES.slice(0, 7).map(cat => (
                <button key={cat.key}
                  onClick={() => { setSelectedCategory(cat.key); setTitle(cat.label); setPriority(cat.priority); setShowCreate(true); }}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-gray-50 transition border border-gray-100">
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-[10px] text-gray-600 font-medium text-center leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition ${filter === f ? 'bg-[#003B95] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
              {f.replace(/_/g, ' ')} {f === 'ALL' ? `(${requests.length})` : `(${requests.filter(r => r.status === f).length})`}
            </button>
          ))}
        </div>

        {/* Request list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border p-8 text-center">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-gray-500">No service requests {filter !== 'ALL' ? `with status "${filter.replace(/_/g, ' ')}"` : 'yet'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((sr: any) => {
              const cat = SERVICE_CATEGORIES.find(c => c.key === sr.category);
              const slaTime = sr.slaDeadlineAt ? new Date(sr.slaDeadlineAt) : null;
              const slaPast = slaTime && slaTime < new Date();
              const showRate = sr.status === 'RESOLVED' && !sr.tenantRating;

              return (
                <div key={sr.id}
                  className="bg-white rounded-2xl border p-4 hover:shadow-sm transition cursor-pointer"
                  onClick={() => openTicketDetail(sr)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-2xl shrink-0">{cat?.icon || '📋'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{sr.title}</p>
                        <p className="text-xs text-gray-400">{sr.requestNumber} · {sr.category?.replace(/_/g, ' ')}</p>
                        {sr.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{sr.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[sr.status] || 'bg-gray-100 text-gray-500'}`}>
                            {sr.status?.replace(/_/g, ' ')}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${PRIORITY_BADGE[sr.priority] || 'bg-gray-100'}`}>
                            {sr.priority}
                          </span>
                          {sr.slaBreached && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">SLA BREACHED</span>
                          )}
                          {slaTime && !slaPast && !['RESOLVED', 'CLOSED', 'REJECTED'].includes(sr.status) && (
                            <span className="text-[10px] text-gray-400">
                              ETA: {slaTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-gray-400">
                        {new Date(sr.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                      {showRate && (
                        <button onClick={e => { e.stopPropagation(); setRatingTicket(sr); }}
                          className="mt-1 text-[10px] px-2 py-1 rounded-lg bg-[#003B95] text-white font-medium">
                          Rate
                        </button>
                      )}
                      {sr.tenantRating && (
                        <p className="text-xs text-yellow-500 mt-1">{'★'.repeat(sr.tenantRating)}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900">New Service Request</h3>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>

              {/* Category grid */}
              <p className="text-xs text-gray-400 font-medium mb-2">SELECT CATEGORY</p>
              <div className="grid grid-cols-4 gap-2 mb-5">
                {SERVICE_CATEGORIES.map(cat => (
                  <button key={cat.key}
                    onClick={() => { setSelectedCategory(cat.key); if (!title || SERVICE_CATEGORIES.some(c => c.label === title)) setTitle(cat.label); setPriority(cat.priority); }}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition text-center ${selectedCategory === cat.key ? 'border-[#003B95] bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-[10px] text-gray-600 font-medium leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Title */}
              <label className="block text-xs text-gray-500 font-medium mb-1">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#003B95] mb-4"
                placeholder="e.g. Need extra towels" />

              {/* Description */}
              <label className="block text-xs text-gray-500 font-medium mb-1">Details (optional)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#003B95] resize-none mb-4"
                placeholder="Any additional details..." />

              {/* Priority */}
              <label className="block text-xs text-gray-500 font-medium mb-1">Priority</label>
              <div className="flex gap-2 mb-6">
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                  <button key={p} onClick={() => setPriority(p)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${priority === p ? 'bg-[#003B95] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {p}
                  </button>
                ))}
              </div>

              <button onClick={handleCreate} disabled={creating || !selectedCategory || !title.trim()}
                className="w-full py-3 rounded-xl bg-[#003B95] text-white font-semibold hover:bg-[#002d73] transition disabled:opacity-50">
                {creating ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedTicket(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedTicket.title}</h3>
                  <p className="text-xs text-gray-400">{selectedTicket.requestNumber} · {selectedTicket.category?.replace(/_/g, ' ')}</p>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>

              <div className="flex gap-2 mb-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[selectedTicket.status] || 'bg-gray-100'}`}>
                  {selectedTicket.status?.replace(/_/g, ' ')}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full ${PRIORITY_BADGE[selectedTicket.priority] || 'bg-gray-100'}`}>
                  {selectedTicket.priority}
                </span>
                {selectedTicket.slaBreached && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-600 font-semibold">SLA BREACHED</span>
                )}
              </div>

              {selectedTicket.description && (
                <p className="text-sm text-gray-700 mb-4">{selectedTicket.description}</p>
              )}

              {selectedTicket.assignedTo && (
                <p className="text-xs text-gray-500 mb-2">Assigned to: <span className="font-medium">{selectedTicket.assignedTo}</span></p>
              )}

              {selectedTicket.resolutionNotes && (
                <div className="bg-green-50 rounded-xl p-3 mb-4">
                  <p className="text-xs text-green-600 font-medium mb-1">Resolution</p>
                  <p className="text-sm text-green-800">{selectedTicket.resolutionNotes}</p>
                </div>
              )}

              {/* Comments / Activity */}
              <div className="border-t pt-4">
                <p className="text-xs text-gray-400 font-medium mb-3">ACTIVITY</p>
                <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                  {(selectedTicket.comments || []).map((c: any) => (
                    <div key={c.id} className={`p-3 rounded-xl text-sm ${c.systemNote ? 'bg-gray-50 text-gray-500 italic' : c.authorRole === 'GUEST' ? 'bg-blue-50 text-blue-800' : 'bg-gray-50 text-gray-700'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium">{c.systemNote ? 'System' : c.authorRole === 'GUEST' ? 'You' : c.authorRole || 'Staff'}</span>
                        <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p>{c.commentText}</p>
                    </div>
                  ))}
                </div>

                {/* Add comment */}
                {!['CLOSED', 'REJECTED'].includes(selectedTicket.status) && (
                  <div className="flex gap-2">
                    <input value={commentText} onChange={e => setCommentText(e.target.value)}
                      className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:border-[#003B95]"
                      placeholder="Add a message..."
                      onKeyDown={e => e.key === 'Enter' && handleComment()} />
                    <button onClick={handleComment} disabled={sending || !commentText.trim()}
                      className="px-4 py-2 rounded-xl bg-[#003B95] text-white text-sm font-medium hover:bg-[#002d73] disabled:opacity-50">
                      {sending ? '...' : 'Send'}
                    </button>
                  </div>
                )}

                {/* Rate button */}
                {selectedTicket.status === 'RESOLVED' && !selectedTicket.tenantRating && (
                  <button onClick={() => { setRatingTicket(selectedTicket); setSelectedTicket(null); }}
                    className="mt-3 w-full py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition">
                    Rate Resolution
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRatingTicket(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Rate Resolution</h3>
            <p className="text-sm text-gray-500 mb-4">How satisfied are you with the resolution of "{ratingTicket.title}"?</p>

            <div className="flex gap-2 justify-center mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setRating(star)}
                  className={`text-3xl transition hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}>
                  ★
                </button>
              ))}
            </div>

            <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={2}
              className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-[#003B95] resize-none mb-4"
              placeholder="Any feedback? (optional)" />

            <div className="flex gap-2">
              <button onClick={() => setRatingTicket(null)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleRate}
                className="flex-1 py-2.5 rounded-xl bg-[#003B95] text-white text-sm font-semibold hover:bg-[#002d73]">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
