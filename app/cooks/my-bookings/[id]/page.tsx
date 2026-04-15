'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import type { ChatMessage } from '@/types';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_COLORS: Record<string, { label: string; color: string }> = {
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-700' },
  IN_PROGRESS: { label: 'Chef En Route', color: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Completed', color: 'bg-gray-100 text-gray-600' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-600' },
};

interface TrackingInfo {
  bookingId: string;
  status: string;
  chefLat: number;
  chefLng: number;
  etaMinutes: number;
  locationUpdatedAt: string;
}

export default function ChefBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = localStorage.getItem('access_token') ?? '';
    const uid = localStorage.getItem('userId') ?? '';
    if (!t) { router.push('/auth?redirect=/cooks/my-bookings/' + bookingId); return; }
    setToken(t);
    setUserId(uid);
    loadBooking(t);
  }, [bookingId]);

  // Poll tracking + messages every 10s
  useEffect(() => {
    if (!token || !bookingId) return;
    const interval = setInterval(() => {
      loadTracking();
      if (conversationId) loadMessages(conversationId);
    }, 10000);
    return () => clearInterval(interval);
  }, [token, bookingId, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadBooking(t: string) {
    setLoading(true);
    try {
      // Load booking and tracking in parallel
      const [bk, convos] = await Promise.all([
        api.getBookingTracking(bookingId).catch(() => null),
        api.getConversations(t).catch(() => []),
      ]);
      if (bk) {
        setBooking(bk);
        setTracking(bk);
      }
      // Find conversation linked to this booking
      const conv = (convos || []).find((c: any) => c.bookingId === bookingId);
      if (conv) {
        setConversationId(conv.id);
        await loadMessages(conv.id);
      }
    } catch {} finally { setLoading(false); }
  }

  async function loadTracking() {
    try {
      const t = await api.getBookingTracking(bookingId);
      if (t) setTracking(t);
    } catch {}
  }

  async function loadMessages(convId: string) {
    try {
      const res = await api.getMessages(convId, token, 0);
      const list = res?.content ?? res ?? [];
      setMessages(Array.isArray(list) ? list : []);
    } catch {}
  }

  async function handleSend() {
    if (!newMessage.trim() || !token || sending) return;
    setSending(true);
    try {
      // If no conversation yet, create one by sending first message
      const chefId = booking?.chefId || tracking?.bookingId || '';
      await api.sendMessage({
        listingId: bookingId, // use booking as context
        recipientId: chefId,
        bookingId: bookingId,
        content: newMessage.trim(),
      }, token);
      setNewMessage('');
      if (conversationId) await loadMessages(conversationId);
    } catch (e: any) {
      alert(e.message || 'Failed to send');
    } finally { setSending(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const status = STATUS_COLORS[tracking?.status || ''] || { label: tracking?.status || 'Unknown', color: 'bg-gray-100 text-gray-600' };
  const hasLocation = tracking && tracking.chefLat && tracking.chefLng && tracking.chefLat !== 0;
  const isActive = tracking?.status === 'CONFIRMED' || tracking?.status === 'IN_PROGRESS';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/cooks/my-bookings" className="text-sm text-orange-500 hover:underline mb-1 block">&larr; My Bookings</Link>
            <h1 className="text-xl font-bold text-gray-900">Chef Booking</h1>
          </div>
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${status.color}`}>{status.label}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Location Map */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Live Location</h2>
              {tracking?.etaMinutes != null && tracking.etaMinutes > 0 && (
                <span className="text-sm font-semibold text-orange-600">ETA: {tracking.etaMinutes} min</span>
              )}
            </div>

            {hasLocation ? (
              <div className="relative">
                <iframe
                  src={`https://www.google.com/maps?q=${tracking.chefLat},${tracking.chefLng}&z=15&output=embed`}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                {tracking.locationUpdatedAt && (
                  <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur rounded-lg px-2 py-1 text-xs text-gray-500">
                    Updated: {formatTime(tracking.locationUpdatedAt)}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm">{isActive ? 'Waiting for chef to share location...' : 'Location not available'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="bg-white rounded-xl border flex flex-col" style={{ height: '400px' }}>
            <div className="px-4 py-3 border-b">
              <h2 className="text-sm font-bold text-gray-900">Chat with Chef</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {messages.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No messages yet. Say hello!</p>
              ) : messages.map(msg => {
                const isMine = msg.senderId === userId;
                const isLocation = msg.messageType === 'LOCATION';

                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                      isMine ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}>
                      {isLocation && msg.latitude && msg.longitude ? (
                        <a href={`https://www.google.com/maps?q=${msg.latitude},${msg.longitude}`} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
                          </svg>
                          <span className="text-sm">{msg.locationLabel || msg.content || 'View Location'}</span>
                        </a>
                      ) : msg.messageType === 'FILE' && msg.attachmentUrl ? (
                        <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm">{msg.attachmentName || 'Document'}</span>
                        </a>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                      <p className={`text-[10px] mt-0.5 ${isMine ? 'text-orange-200' : 'text-gray-400'}`}>{formatTime(msg.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-2 border-t flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type a message..."
                className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                className="bg-orange-500 text-white rounded-xl p-2.5 hover:bg-orange-600 transition disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
