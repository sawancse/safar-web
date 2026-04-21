'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import type { ChatMessage } from '@/types';

type TabKey = 'ingredients' | 'chef' | 'otp' | 'pay' | 'rating';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'ingredients', label: 'Ingredients', icon: '🛒' },
  { key: 'chef',        label: 'Chef',        icon: '👨‍🍳' },
  { key: 'otp',         label: 'Start OTP',   icon: '🔑' },
  { key: 'pay',         label: 'Pay Balance', icon: '💳' },
  { key: 'rating',      label: 'Rate',        icon: '⭐' },
];

const STATUS_COLORS: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: 'Awaiting Payment', color: 'bg-yellow-100 text-yellow-700' },
  PENDING:         { label: 'Pending Chef',     color: 'bg-yellow-100 text-yellow-700' },
  QUOTED:          { label: 'Quote Received',   color: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED:       { label: 'Confirmed',        color: 'bg-green-100 text-green-700' },
  ADVANCE_PAID:    { label: 'Advance Paid',     color: 'bg-green-100 text-green-700' },
  IN_PROGRESS:     { label: 'In Progress',      color: 'bg-blue-100 text-blue-700' },
  COMPLETED:       { label: 'Completed',        color: 'bg-gray-100 text-gray-600' },
  CANCELLED:       { label: 'Cancelled',        color: 'bg-red-100 text-red-600' },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function ChefBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const bookingId = params.id as string;
  const eventParam = (search.get('event') as TabKey | null) || 'ingredients';

  const [booking, setBooking] = useState<any>(null);
  const [bookingKind, setBookingKind] = useState<'chef' | 'event' | null>(null);
  const [chef, setChef] = useState<any>(null);
  const [shoppingList, setShoppingList] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [tab, setTab] = useState<TabKey>(eventParam);

  // Secondary panel (chat + tracking)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showSecondary, setShowSecondary] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keep tab in sync with ?event= and vice versa
  useEffect(() => {
    if (eventParam && eventParam !== tab) setTab(eventParam);
  }, [eventParam]);

  function switchTab(key: TabKey) {
    setTab(key);
    router.replace(`/cooks/my-bookings/${bookingId}?event=${key}`, { scroll: false });
  }

  useEffect(() => {
    const t = localStorage.getItem('access_token') ?? '';
    const uid = localStorage.getItem('userId') ?? '';
    if (!t) { router.push('/auth?redirect=/cooks/my-bookings/' + bookingId); return; }
    setToken(t);
    setUserId(uid);
    load(t);
  }, [bookingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function load(t: string) {
    setLoading(true);
    try {
      // Try chef-booking first, fall back to event-booking
      let bk: any = null;
      let kind: 'chef' | 'event' | null = null;
      try {
        bk = await api.getChefBookingById(bookingId);
        kind = 'chef';
      } catch {
        try {
          bk = await api.getEventBookingById(bookingId);
          kind = 'event';
        } catch {}
      }
      if (!bk) { setLoading(false); return; }
      setBooking(bk);
      setBookingKind(kind);

      // Parallel secondary fetches
      const chefId = bk.chefId;
      const menuId = bk.menuId || bk.menuPackageId;
      const guests = bk.guestsCount || bk.guestCount || 4;
      const [chefRes, shopRes, itemsRes, convos] = await Promise.all([
        chefId ? api.getChef(chefId).catch(() => null) : Promise.resolve(null),
        menuId ? api.getShoppingList(menuId, guests).catch(() => null) : Promise.resolve(null),
        menuId ? api.getMenuItems(menuId).catch(() => []) : Promise.resolve([]),
        api.getConversations(t).catch(() => []),
      ]);
      setChef(chefRes);
      setShoppingList(shopRes);
      setMenuItems(Array.isArray(itemsRes) ? itemsRes : []);

      const conv = (convos || []).find((c: any) => c.bookingId === bookingId);
      if (conv) {
        setConversationId(conv.id);
        const res = await api.getMessages(conv.id, t, 0).catch(() => null);
        const list = res?.content ?? res ?? [];
        setMessages(Array.isArray(list) ? list : []);
      }
    } finally { setLoading(false); }
  }

  async function handleSend() {
    if (!newMessage.trim() || !token || sending) return;
    setSending(true);
    try {
      const chefId = booking?.chefId || '';
      await api.sendMessage({
        listingId: bookingId,
        recipientId: chefId,
        bookingId: bookingId,
        content: newMessage.trim(),
      }, token);
      setNewMessage('');
      if (conversationId) {
        const res = await api.getMessages(conversationId, token, 0).catch(() => null);
        const list = res?.content ?? res ?? [];
        setMessages(Array.isArray(list) ? list : []);
      }
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

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Booking not found.</p>
          <Link href="/cooks/my-bookings" className="text-orange-500 hover:underline">← Back to my bookings</Link>
        </div>
      </div>
    );
  }

  const status = STATUS_COLORS[booking.status || ''] || { label: booking.status || 'Unknown', color: 'bg-gray-100 text-gray-600' };
  const totalPaise   = booking.totalAmountPaise   ?? 0;
  const advancePaise = booking.advanceAmountPaise ?? 0;
  const balancePaise = booking.balanceAmountPaise ?? (totalPaise - advancePaise);
  const isChef = bookingKind === 'chef';
  const menuId = booking.menuId || booking.menuPackageId;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div>
            <Link href="/cooks/my-bookings" className="text-sm text-orange-500 hover:underline mb-1 inline-block">← My Bookings</Link>
            <h1 className="text-2xl font-bold text-gray-900">{isChef ? 'Chef Booking' : 'Event Booking'}</h1>
            {booking.bookingRef && <p className="text-xs text-gray-500 mt-1">Ref: {booking.bookingRef}</p>}
          </div>
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${status.color}`}>{status.label}</span>
        </div>

        {/* Swiggy-style tracking — visible while the booking is active */}
        {['CONFIRMED', 'ADVANCE_PAID', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) && (
          <TrackingPanel
            bookingId={bookingId}
            booking={booking}
            chef={chef}
            onBookingUpdated={(bk) => setBooking((prev: any) => ({ ...prev, ...bk }))}
          />
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl border overflow-hidden mb-6">
          <div className="flex overflow-x-auto border-b">
            {TABS.map(t => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => switchTab(t.key)}
                  className={`flex-1 min-w-[120px] px-4 py-3 text-sm font-semibold transition whitespace-nowrap ${
                    active ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-1">{t.icon}</span>{t.label}
                </button>
              );
            })}
          </div>

          <div className="p-5 sm:p-6">
            {tab === 'ingredients' && (
              <IngredientsTab
                menuItems={menuItems}
                shoppingList={shoppingList}
                guests={booking.guestsCount || booking.guestCount || 0}
                menuName={booking.menuName || shoppingList?.menuName}
                menuDescription={booking.menuDescription}
                addonsJson={booking.addonsJson}
                appliancesJson={booking.appliancesJson}
                crockeryJson={booking.crockeryJson}
                servicesJson={booking.servicesJson}
              />
            )}
            {tab === 'chef'        && <ChefTab chef={chef} booking={booking} />}
            {tab === 'otp'         && <OtpTab booking={booking} />}
            {tab === 'pay'         && <PayTab
                                        booking={booking}
                                        bookingKind={bookingKind}
                                        token={token}
                                        totalPaise={totalPaise}
                                        advancePaise={advancePaise}
                                        balancePaise={balancePaise}
                                        onRefresh={() => load(token)}
                                      />}
            {tab === 'rating'      && <RatingTab
                                        booking={booking}
                                        bookingKind={bookingKind}
                                        token={token}
                                        onRefresh={() => load(token)}
                                      />}
          </div>
        </div>

        {/* Collapsible chat panel (map now lives in the TrackingPanel above) */}
        <div className="bg-white rounded-xl border">
          <button
            onClick={() => setShowSecondary(s => !s)}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50"
          >
            <span className="text-sm font-bold text-gray-900">💬 Chat with chef</span>
            <span className="text-gray-400 text-xs">{showSecondary ? 'Hide' : 'Show'}</span>
          </button>
          {showSecondary && (
            <div className="border-t flex flex-col" style={{ height: '340px' }}>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">No messages yet. Say hello!</p>
                ) : messages.map(msg => {
                  const isMine = msg.senderId === userId;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                        isMine ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-[10px] mt-0.5 ${isMine ? 'text-orange-200' : 'text-gray-400'}`}>{formatTime(msg.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
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
                  className="bg-orange-500 text-white rounded-xl px-4 py-2 hover:bg-orange-600 transition disabled:opacity-50 text-sm font-semibold"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────── Tab: Ingredients ────── */
function IngredientsTab({ menuItems, shoppingList, guests, menuName, menuDescription, addonsJson, appliancesJson, crockeryJson, servicesJson }: {
  menuItems: any[]; shoppingList: any; guests: number; menuName?: string; menuDescription?: string;
  addonsJson?: string; appliancesJson?: string; crockeryJson?: string; servicesJson?: string;
}) {
  let services: Array<{ key: string; label: string; range?: string; notes?: string }> = [];
  try { if (servicesJson) services = JSON.parse(servicesJson); } catch {}
  const categories = shoppingList?.categories ?? [];

  // Chef bookings store appliances_json / crockery_json as JSON arrays of strings.
  // Event bookings still use addons_json { appliances, crockery }.
  let addons: any = null;
  try { if (addonsJson) addons = JSON.parse(addonsJson); } catch {}
  let chefApp: string[] = [];
  let chefCro: string[] = [];
  try { if (appliancesJson) chefApp = JSON.parse(appliancesJson); } catch {}
  try { if (crockeryJson)   chefCro = JSON.parse(crockeryJson);   } catch {}

  const appliances: string[] = chefApp.length ? chefApp : (addons?.appliances || []);
  const crockery: string[]   = chefCro.length ? chefCro : (addons?.crockery   || (guests ? [`${guests} × plates`, `${guests} × tumblers`, `${guests} × cutlery set`] : []));

  const Section = ({ title, icon, children }: { title: string; icon: string; children: any }) => (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
        <span>{icon}</span>{title}
      </h3>
      {children}
    </div>
  );

  return (
    <div>
      <Section title="Menu" icon="🍽️">
        {menuName && <p className="font-semibold text-gray-800 mb-2">{menuName}</p>}
        {menuDescription && <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{menuDescription}</p>}
        {menuItems.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {menuItems.map((m: any) => (
              <li key={m.id} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                {m.name || m.dishName || m.itemName}
                {m.category && <span className="text-xs text-gray-400">({m.category})</span>}
              </li>
            ))}
          </ul>
        ) : (!menuDescription && !menuName) && (
          <p className="text-sm text-gray-400">Menu details not available.</p>
        )}
      </Section>

      <Section title="Appliances" icon="🔥">
        {appliances.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {appliances.map((a, i) => (
              <li key={i} className="text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{a}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">Standard kitchen setup expected (gas stove, utensils, basic tools).</p>
        )}
      </Section>

      <Section title="Crockery" icon="🍽">
        {crockery.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {crockery.map((c, i) => (
              <li key={i} className="text-xs px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">{c}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">Crockery list not specified.</p>
        )}
      </Section>

      {services.length > 0 && (
        <Section title="Additional Services" icon="✨">
          <ul className="space-y-2">
            {services.map((s, i) => (
              <li key={i} className="flex items-start justify-between border rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{s.label}</p>
                  {s.notes && <p className="text-xs text-gray-500 mt-0.5">{s.notes}</p>}
                </div>
                {s.range && <span className="text-[11px] text-gray-500 font-semibold whitespace-nowrap">{s.range}</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Ingredients" icon="🛒">
        {categories.length === 0 ? (
          <p className="text-sm text-gray-400">Shopping list unavailable. The chef will handle procurement.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">Estimated for {shoppingList?.guestCount || guests} guests</p>
            {categories.map((cat: any, ci: number) => (
              <div key={ci} className="border rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b text-xs font-semibold uppercase tracking-wide text-gray-700">{cat.category}</div>
                <ul className="divide-y">
                  {cat.items.map((it: any, i: number) => (
                    <li key={i} className="px-3 py-2 flex items-center justify-between text-sm">
                      <span className="text-gray-800">
                        {it.name}
                        {it.isOptional && <span className="ml-2 text-[10px] text-gray-400 uppercase">optional</span>}
                      </span>
                      <span className="text-gray-600 font-mono text-xs">
                        {it.totalQuantity} {it.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

/* ────── Tab: Chef profile ────── */
function ChefTab({ chef, booking }: { chef: any; booking: any }) {
  if (!chef) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-3">Chef profile not available yet.</p>
        {booking.chefName && <p className="text-sm text-gray-700">Assigned: <strong>{booking.chefName}</strong></p>}
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-start gap-4 mb-5">
        {chef.profilePhotoUrl ? (
          <img src={chef.profilePhotoUrl} alt={chef.name} className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-2xl font-bold text-orange-600">
            {(chef.name || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{chef.name}</h3>
          {chef.bio && <p className="text-sm text-gray-600 mt-1">{chef.bio}</p>}
          <div className="flex items-center gap-4 mt-2 text-sm">
            {chef.rating != null && <span className="font-semibold text-gray-800">⭐ {Number(chef.rating).toFixed(1)}</span>}
            {chef.reviewCount != null && <span className="text-gray-500">({chef.reviewCount} reviews)</span>}
            {chef.totalBookings != null && <span className="text-gray-500">• {chef.totalBookings} bookings</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 text-sm">
        {chef.yearsExperience != null && (
          <div className="border rounded-lg p-3"><p className="text-xs text-gray-500">Experience</p><p className="font-semibold text-gray-800">{chef.yearsExperience} yrs</p></div>
        )}
        {chef.city && (
          <div className="border rounded-lg p-3"><p className="text-xs text-gray-500">City</p><p className="font-semibold text-gray-800">{chef.city}</p></div>
        )}
        {chef.specialties && (
          <div className="border rounded-lg p-3 col-span-2"><p className="text-xs text-gray-500">Specialties</p><p className="font-semibold text-gray-800 text-sm">{chef.specialties}</p></div>
        )}
      </div>

      <Link href={`/cooks/${chef.id}`} className="inline-block text-sm text-orange-600 font-semibold hover:underline">
        View full profile →
      </Link>
    </div>
  );
}

/* ────── Tab: Start-Job OTP ────── */
function OtpTab({ booking }: { booking: any }) {
  const [copied, setCopied] = useState(false);
  const otp = booking.startJobOtp;
  const jobStarted = booking.jobStartedAt;

  function copy() {
    if (!otp) return;
    navigator.clipboard?.writeText(otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (jobStarted) {
    return (
      <div className="text-center py-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 text-3xl mb-3">✓</div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Job started</h3>
        <p className="text-sm text-gray-500">Chef began work at {new Date(jobStarted).toLocaleString('en-IN')}</p>
      </div>
    );
  }

  if (!otp) {
    return <p className="text-sm text-gray-500 text-center py-8">OTP will be generated once the booking is confirmed.</p>;
  }

  return (
    <div className="text-center py-6">
      <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Start-Job OTP</p>
      <p className="text-sm text-gray-600 mb-5">Share this with your chef when they arrive.<br />They'll enter it to begin the job.</p>
      <div className="inline-flex items-center gap-3 mb-4">
        <div className="text-6xl font-black tracking-[0.3em] text-orange-600 font-mono bg-orange-50 px-6 py-4 rounded-2xl border-2 border-orange-200">
          {otp}
        </div>
      </div>
      <div>
        <button
          onClick={copy}
          className="bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition"
        >
          {copied ? 'Copied ✓' : 'Copy OTP'}
        </button>
      </div>
    </div>
  );
}

/* ────── Tab: Pay balance ────── */
function PayTab({ booking, bookingKind, token, totalPaise, advancePaise, balancePaise, onRefresh }: {
  booking: any; bookingKind: 'chef' | 'event' | null; token: string;
  totalPaise: number; advancePaise: number; balancePaise: number; onRefresh: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const paid = !!booking.balancePaidAt;
  const bookingId = booking.id;

  async function handlePay() {
    if (!bookingKind || submitting) return;
    setSubmitting(true);
    try {
      if (bookingKind === 'chef') await api.payChefBookingBalance(bookingId, token);
      else                        await api.payEventBookingBalance(bookingId, token);
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Payment failed');
    } finally { setSubmitting(false); }
  }

  if (paid) {
    return (
      <div className="text-center py-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 text-3xl mb-3">✓</div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Balance paid</h3>
        <p className="text-sm text-gray-500">on {new Date(booking.balancePaidAt).toLocaleString('en-IN')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-4">
      <div className="border rounded-xl divide-y">
        <div className="flex justify-between px-4 py-3 text-sm">
          <span className="text-gray-600">Total</span>
          <span className="font-semibold text-gray-900">{formatPaise(totalPaise)}</span>
        </div>
        <div className="flex justify-between px-4 py-3 text-sm">
          <span className="text-gray-600">Advance paid</span>
          <span className="font-semibold text-green-600">− {formatPaise(advancePaise)}</span>
        </div>
        <div className="flex justify-between px-4 py-3 bg-orange-50">
          <span className="font-bold text-gray-900">Balance due</span>
          <span className="font-bold text-orange-600 text-lg">{formatPaise(balancePaise)}</span>
        </div>
      </div>

      <button
        onClick={handlePay}
        disabled={submitting || balancePaise <= 0}
        className="w-full mt-5 bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition"
      >
        {submitting ? 'Processing...' : balancePaise <= 0 ? 'Nothing to pay' : `Pay ${formatPaise(balancePaise)}`}
      </button>
      <p className="text-[11px] text-gray-400 text-center mt-3">Secure payment via Razorpay</p>
    </div>
  );
}

/* ────── Tab: Rating ────── */
function RatingTab({ booking, bookingKind, token, onRefresh }: {
  booking: any; bookingKind: 'chef' | 'event' | null; token: string; onRefresh: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const bookingId = booking.id;
  const existing = booking.ratingGiven;

  async function submit() {
    if (!bookingKind || submitting) return;
    setSubmitting(true);
    try {
      if (bookingKind === 'chef') await api.rateChefBooking(bookingId, rating, comment, token);
      else                        await api.rateEventBooking(bookingId, rating, comment, token);
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Rating failed');
    } finally { setSubmitting(false); }
  }

  if (existing) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500 mb-2">You rated this booking</p>
        <div className="text-4xl mb-3">{'⭐'.repeat(existing)}{'☆'.repeat(5 - existing)}</div>
        {booking.reviewComment && <p className="text-sm text-gray-700 italic max-w-md mx-auto">"{booking.reviewComment}"</p>}
      </div>
    );
  }

  if (booking.status !== 'COMPLETED') {
    return <p className="text-sm text-gray-500 text-center py-10">Rating unlocks after the booking is completed.</p>;
  }

  return (
    <div className="max-w-md mx-auto py-4">
      <p className="text-center text-sm text-gray-600 mb-3">How was your experience?</p>
      <div className="flex items-center justify-center gap-2 mb-5">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => setRating(n)}
            className={`text-4xl transition ${n <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Share a few words about your chef..."
        rows={4}
        className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none"
      />
      <button
        onClick={submit}
        disabled={submitting}
        className="w-full mt-4 bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition"
      >
        {submitting ? 'Submitting...' : 'Submit rating'}
      </button>
    </div>
  );
}

/* ────── Swiggy-style Tracking panel ────── */

type TrackingStage = 'confirmed' | 'enroute' | 'arrived' | 'started' | 'done';

function TrackingPanel({ bookingId, booking, chef, onBookingUpdated }: {
  bookingId: string; booking: any; chef: any; onBookingUpdated: (bk: any) => void;
}) {
  const [tracking, setTracking] = useState<any>(booking);
  const [tick, setTick] = useState(0);

  // Refresh freshness pill each minute
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // Active polling while the booking is en route / in progress
  useEffect(() => {
    const isLive = booking.status === 'CONFIRMED' || booking.status === 'ADVANCE_PAID' || booking.status === 'IN_PROGRESS';
    if (!isLive) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const t = await api.getBookingTracking(bookingId);
        if (!cancelled && t) { setTracking((prev: any) => ({ ...prev, ...t })); onBookingUpdated(t); }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 15_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [bookingId, booking.status]);

  const chefLat = tracking.chefLat;
  const chefLng = tracking.chefLng;
  const hasLoc = chefLat && chefLng;
  const eta = tracking.etaMinutes;
  const updatedAt = tracking.locationUpdatedAt;
  const ageSec = updatedAt ? Math.max(0, Math.round((Date.now() - new Date(updatedAt).getTime()) / 1000)) : null;

  const current: TrackingStage =
    booking.status === 'COMPLETED' ? 'done' :
    booking.status === 'IN_PROGRESS' ? 'started' :
    (hasLoc && (eta != null && eta <= 2)) ? 'arrived' :
    hasLoc ? 'enroute' : 'confirmed';

  const stages: { key: TrackingStage; label: string; icon: string }[] = [
    { key: 'confirmed', label: 'Confirmed',   icon: '✓' },
    { key: 'enroute',   label: 'On the way',  icon: '🛵' },
    { key: 'arrived',   label: 'Arrived',     icon: '📍' },
    { key: 'started',   label: 'Cooking',     icon: '🔥' },
    { key: 'done',      label: 'Completed',   icon: '🎉' },
  ];
  const currentIdx = stages.findIndex(s => s.key === current);

  const chefPhone = chef?.phone || booking.chefPhone;
  const directionsHref = hasLoc ? `https://www.google.com/maps/dir/?api=1&destination=${chefLat},${chefLng}` : null;

  const subtitle =
    current === 'done'     ? 'Thank you for booking with Safar Cooks.' :
    current === 'started'  ? `${chef?.name || 'Your chef'} has started the job.` :
    current === 'arrived'  ? `${chef?.name || 'Your chef'} has arrived. Share the start-job OTP from the OTP tab.` :
    current === 'enroute'  ? `${chef?.name || 'Your chef'} is on the way${eta ? ` · ETA ${eta} min` : ''}.` :
                             `${chef?.name || 'Your chef'} will share location shortly.`;

  return (
    <div className="bg-white border rounded-2xl overflow-hidden mb-5 shadow-sm">
      {/* Heading */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-bold text-gray-900">Live tracking</h2>
          {ageSec != null && current !== 'done' && (
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
              ageSec < 60 ? 'bg-green-50 text-green-700' : ageSec < 300 ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle ${ageSec < 60 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              Updated {ageSec < 60 ? 'just now' : ageSec < 300 ? `${Math.round(ageSec/60)} min ago` : `${Math.round(ageSec/60)} min ago`}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
      </div>

      {/* Stage stepper */}
      <div className="px-5 pb-3">
        <div className="flex items-center">
          {stages.map((s, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={s.key} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    done ? 'bg-green-500 text-white' :
                    active ? 'bg-orange-500 text-white ring-4 ring-orange-100 animate-pulse' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {done ? '✓' : s.icon}
                  </div>
                  <span className={`text-[10px] mt-1 text-center whitespace-nowrap font-medium ${
                    active ? 'text-orange-600' : done ? 'text-gray-700' : 'text-gray-400'
                  }`}>{s.label}</span>
                </div>
                {i < stages.length - 1 && (
                  <div className={`h-0.5 flex-1 -mt-4 transition-colors ${i < currentIdx ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Map + ETA */}
      {current !== 'done' && (
        <div className="border-t grid grid-cols-1 md:grid-cols-3 gap-0">
          <div className="md:col-span-2">
            {hasLoc ? (
              <iframe
                key={`${chefLat}-${chefLng}`}
                src={`https://www.google.com/maps?q=${chefLat},${chefLng}&z=15&output=embed`}
                width="100%"
                height="280"
                style={{ border: 0, display: 'block' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm bg-gray-50">
                Waiting for chef to share location
              </div>
            )}
          </div>
          <div className="p-4 flex flex-col gap-3 border-l bg-gray-50/50">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-1">ETA</p>
              <p className="text-3xl font-black text-gray-900">{eta != null && eta > 0 ? `${eta}` : '—'}<span className="text-sm font-semibold text-gray-500 ml-1">min</span></p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-1">Booking ref</p>
              <p className="text-sm font-mono text-gray-800">{booking.bookingRef || booking.id?.slice(0, 8)}</p>
            </div>
            <div className="flex flex-col gap-2 mt-auto">
              {chefPhone && (
                <a href={`tel:${chefPhone}`} className="bg-green-500 text-white text-sm font-semibold px-3 py-2 rounded-lg text-center hover:bg-green-600 transition">
                  📞 Call chef
                </a>
              )}
              {directionsHref && (
                <a href={directionsHref} target="_blank" rel="noopener noreferrer"
                   className="bg-white border border-gray-300 text-gray-800 text-sm font-semibold px-3 py-2 rounded-lg text-center hover:bg-gray-50 transition">
                  🗺️ Directions
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
