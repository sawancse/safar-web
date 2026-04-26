'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

type Item = {
  id: string;
  title: string;
  heroPhotoUrl?: string;
  basePricePaise: number;
  occasionTags?: string[];
  leadTimeHours?: number;
  status: 'ACTIVE' | 'PAUSED';
  displayOrder: number;
};

type FormState = {
  title: string; heroPhotoUrl: string; descriptionMd: string;
  basePriceRupees: string; leadTimeHours: string;
  occasionTags: string;  // comma-separated
};

const empty: FormState = {
  title: '', heroPhotoUrl: '', descriptionMd: '',
  basePriceRupees: '', leadTimeHours: '', occasionTags: '',
};

export default function VendorItemsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const listingId = String(params?.id ?? '');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);

  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null) || '';

  async function load() {
    setLoading(true);
    try {
      const data = await api.listMyServiceItems(listingId, token());
      setItems(data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('access_token')) {
      router.push(`/auth?next=/vendor/listings/${listingId}/items`);
      return;
    }
    load();
    /* eslint-disable-next-line */
  }, [listingId]);

  async function save() {
    if (!form.title.trim()) { setError('Title required'); return; }
    if (!form.basePriceRupees || Number.isNaN(Number(form.basePriceRupees))) {
      setError('Price required'); return;
    }
    setSaving(true); setError(null);
    try {
      const body = {
        title: form.title.trim(),
        heroPhotoUrl: form.heroPhotoUrl.trim() || null,
        descriptionMd: form.descriptionMd.trim() || null,
        basePricePaise: Math.round(Number(form.basePriceRupees) * 100),
        leadTimeHours: form.leadTimeHours ? Number(form.leadTimeHours) : null,
        occasionTags: form.occasionTags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (editing) {
        await api.updateServiceItem(editing, body, token());
      } else {
        await api.createServiceItem(listingId, body, token());
      }
      setForm(empty); setEditing(null);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    } finally { setSaving(false); }
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    try { await api.deleteServiceItem(id, token()); await load(); }
    catch (e: any) { setError(e?.message || 'Delete failed'); }
  }

  async function togglePause(item: Item) {
    try {
      if (item.status === 'ACTIVE') await api.pauseServiceItem(item.id, token());
      else await api.activateServiceItem(item.id, token());
      await load();
    } catch (e: any) { setError(e?.message || 'Status change failed'); }
  }

  function startEdit(item: Item) {
    setEditing(item.id);
    setForm({
      title: item.title,
      heroPhotoUrl: item.heroPhotoUrl ?? '',
      descriptionMd: '',
      basePriceRupees: String(item.basePricePaise / 100),
      leadTimeHours: item.leadTimeHours ? String(item.leadTimeHours) : '',
      occasionTags: (item.occasionTags ?? []).join(', '),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/vendor/dashboard" className="text-sm text-orange-500 hover:underline">← My listings</Link>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mt-1">Service items</h1>
        <p className="text-sm text-gray-500">
          Each item appears on your storefront with its own photo, price, and options. Customers
          book a specific item and the booking page deep-links back here.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-4">
          {editing ? 'Edit item' : 'Add a new item'}
        </h2>
        <div className="space-y-3">
          <Input label="Title" value={form.title} onChange={v => setForm(s => ({ ...s, title: v }))} placeholder='e.g. "3-tier Chocolate Truffle Birthday Cake"' />
          <Input label="Hero photo URL" value={form.heroPhotoUrl} onChange={v => setForm(s => ({ ...s, heroPhotoUrl: v }))} placeholder="S3 URL" />
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Description</label>
            <textarea
              value={form.descriptionMd}
              onChange={e => setForm(s => ({ ...s, descriptionMd: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="What makes this item special?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price (₹)" value={form.basePriceRupees} onChange={v => setForm(s => ({ ...s, basePriceRupees: v }))} placeholder="2499" type="number" />
            <Input label="Lead time (hours)" value={form.leadTimeHours} onChange={v => setForm(s => ({ ...s, leadTimeHours: v }))} placeholder="48" type="number" />
          </div>
          <Input label="Occasion tags (comma-separated)" value={form.occasionTags} onChange={v => setForm(s => ({ ...s, occasionTags: v }))} placeholder="BIRTHDAY, ANNIVERSARY, WEDDING" />
        </div>

        {error && <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

        <div className="mt-4 flex gap-2 justify-end">
          {editing && (
            <button onClick={() => { setEditing(null); setForm(empty); setError(null); }}
              className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
          )}
          <button onClick={save} disabled={saving}
            className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-50">
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add item'}
          </button>
        </div>
      </div>

      {/* List */}
      <h2 className="text-base font-bold text-gray-900 mb-3">My items ({items.length})</h2>
      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {!loading && items.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-500">
          No items yet. Use the form above to add your first item.
        </div>
      )}
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
            {item.heroPhotoUrl && (
              <img src={item.heroPhotoUrl} alt={item.title} className="w-16 h-16 object-cover rounded-lg shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{item.title}</p>
              <p className="text-xs text-gray-500">
                ₹{(item.basePricePaise / 100).toLocaleString('en-IN')}
                {item.leadTimeHours && ` · ${item.leadTimeHours}h lead`}
                {item.occasionTags && item.occasionTags.length > 0 && ` · ${item.occasionTags.slice(0,3).join(', ')}`}
              </p>
              {item.status === 'PAUSED' && <span className="text-[11px] text-yellow-700">⏸ Paused (not visible to customers)</span>}
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button onClick={() => startEdit(item)} className="text-xs text-orange-500 hover:underline">Edit</button>
              <button onClick={() => togglePause(item)} className="text-xs text-gray-600 hover:underline">
                {item.status === 'ACTIVE' ? 'Pause' : 'Activate'}
              </button>
              <button onClick={() => deleteItem(item.id)} className="text-xs text-red-600 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-800 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none"
      />
    </div>
  );
}
