'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Listing = { id: string; title?: string };
type Coupon = {
  id: string; code: string; discountType: string;
  percentOff?: number; maxDiscountPaise?: number; flatOffPaise?: number;
  minBookingPaise?: number; validFrom?: string; validUntil?: string;
  usageLimit?: number; usedCount?: number; perUserLimit?: number;
  active?: boolean; listingId?: string; description?: string;
};

const inr = (p?: number) => p != null ? `₹${(p / 100).toLocaleString('en-IN')}` : '—';

const emptyForm = {
  code: '', discountType: 'PERCENT', percentOff: '', maxDiscountRupees: '', flatOffRupees: '',
  minBookingRupees: '', validFrom: '', validUntil: '', usageLimit: '', perUserLimit: '',
  listingId: '', description: '',
};

export default function HostCouponsTab({ token, listings }: { token: string; listings: Listing[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try { setCoupons(await api.listHostCoupons(token) || []); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const titleFor = (id?: string) => id ? (listings.find(l => l.id === id)?.title || 'A listing') : 'All my listings';

  async function create() {
    if (!form.code.trim()) { setError('Enter a coupon code'); return; }
    setSaving(true); setError('');
    try {
      const body: any = {
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        percentOff: form.discountType === 'PERCENT' && form.percentOff ? Number(form.percentOff) : undefined,
        maxDiscountPaise: form.discountType === 'PERCENT' && form.maxDiscountRupees ? Math.round(Number(form.maxDiscountRupees) * 100) : undefined,
        flatOffPaise: form.discountType === 'FLAT' && form.flatOffRupees ? Math.round(Number(form.flatOffRupees) * 100) : undefined,
        minBookingPaise: form.minBookingRupees ? Math.round(Number(form.minBookingRupees) * 100) : 0,
        validFrom: form.validFrom || undefined,
        validUntil: form.validUntil || undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : undefined,
        listingId: form.listingId || undefined,
        description: form.description || undefined,
      };
      await api.createHostCoupon(body, token);
      setForm({ ...emptyForm }); setShowForm(false); load();
    } catch (e: any) {
      setError(e?.message || 'Could not create coupon');
    } finally { setSaving(false); }
  }

  async function toggle(c: Coupon) {
    try { await api.setHostCouponActive(c.id, !c.active, token); load(); } catch { /* ignore */ }
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const input = 'border border-gray-300 rounded-lg px-3 py-2 text-sm w-full';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Coupons</h2>
          <p className="text-sm text-gray-500">Create promo codes for your listings. Guests apply them at checkout.</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-4 py-2 text-sm font-semibold">
          {showForm ? 'Close' : '+ New coupon'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Code *</label>
              <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="SUMMER15" className={`${input} uppercase`} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Applies to</label>
              <select value={form.listingId} onChange={e => set('listingId', e.target.value)} className={input}>
                <option value="">All my listings</option>
                {listings.map(l => <option key={l.id} value={l.id}>{l.title || l.id.slice(0, 8)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Discount type</label>
              <select value={form.discountType} onChange={e => set('discountType', e.target.value)} className={input}>
                <option value="PERCENT">Percent off</option>
                <option value="FLAT">Flat off (₹)</option>
              </select>
            </div>
            {form.discountType === 'PERCENT' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Percent</label>
                  <input type="number" value={form.percentOff} onChange={e => set('percentOff', e.target.value)} placeholder="15" className={input} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max ₹ (cap)</label>
                  <input type="number" value={form.maxDiscountRupees} onChange={e => set('maxDiscountRupees', e.target.value)} placeholder="2000" className={input} />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Flat off (₹)</label>
                <input type="number" value={form.flatOffRupees} onChange={e => set('flatOffRupees', e.target.value)} placeholder="500" className={input} />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Min booking (₹)</label>
              <input type="number" value={form.minBookingRupees} onChange={e => set('minBookingRupees', e.target.value)} placeholder="0" className={input} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Total uses</label>
                <input type="number" value={form.usageLimit} onChange={e => set('usageLimit', e.target.value)} placeholder="∞" className={input} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Per guest</label>
                <input type="number" value={form.perUserLimit} onChange={e => set('perUserLimit', e.target.value)} placeholder="∞" className={input} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valid from</label>
              <input type="date" value={form.validFrom} onChange={e => set('validFrom', e.target.value)} className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valid until</label>
              <input type="date" value={form.validUntil} onChange={e => set('validUntil', e.target.value)} className={input} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); setError(''); }} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700">Cancel</button>
            <button onClick={create} disabled={saving} className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold disabled:opacity-50">
              {saving ? 'Creating…' : 'Create coupon'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : coupons.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-500">
          No coupons yet. Create one to offer guests a discount.
        </div>
      ) : (
        <div className="space-y-2">
          {coupons.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{c.code}</span>
                  <span className="text-xs text-gray-500">
                    {c.discountType === 'PERCENT'
                      ? `${c.percentOff}% off${c.maxDiscountPaise ? ` (max ${inr(c.maxDiscountPaise)})` : ''}`
                      : `${inr(c.flatOffPaise)} off`}
                  </span>
                  {!c.active && <span className="text-[10px] font-semibold text-gray-400">PAUSED</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {titleFor(c.listingId)} · min {inr(c.minBookingPaise)} · used {c.usedCount ?? 0}{c.usageLimit ? `/${c.usageLimit}` : ''}
                  {c.validUntil ? ` · till ${c.validUntil}` : ''}
                </p>
              </div>
              <button onClick={() => toggle(c)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${c.active ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-orange-600 text-white hover:bg-orange-700'}`}>
                {c.active ? 'Pause' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
