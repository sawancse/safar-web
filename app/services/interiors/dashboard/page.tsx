'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: 'Verified', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-600' },
};

export default function DesignerDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    const t = localStorage.getItem('access_token') ?? '';
    if (!t) { router.push('/auth?redirect=/services/interiors/dashboard'); return; }
    setToken(t);
    loadProfile(t);
  }, [router]);

  async function loadProfile(t: string) {
    setLoading(true);
    try {
      const p = await api.getMyDesignerProfile(t);
      setProfile(p);
      setEditForm(p);
      const pj = await api.getMyInteriorProjects(t).catch(() => ({ content: [] }));
      setProjects(pj?.content ?? pj ?? []);
    } catch { setProfile(null); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.updateMyDesignerProfile(editForm, token);
      await loadProfile(token);
      setEditing(false);
    } catch (e: any) { alert(e.message || 'Failed to save'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">No Designer Profile</h2>
        <p className="text-gray-500 mb-4">You haven't registered as an interior designer yet.</p>
        <Link href="/services/interiors/register" className="inline-block px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition">Register Now</Link>
      </div>
    </div>
  );

  const status = STATUS_BADGE[profile.verificationStatus] || { label: profile.verificationStatus, color: 'bg-gray-100 text-gray-600' };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Design Practice</h1>

        {profile.verificationStatus === 'REJECTED' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-red-700">Application rejected</p>
            {profile.rejectionReason && <p className="text-sm text-red-600 mt-1">Reason: {profile.rejectionReason}</p>}
          </div>
        )}

        {profile.verificationStatus === 'PENDING' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-yellow-700">Profile is live with "Unverified" badge. Verification in progress.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xl">
                    {profile.fullName?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{profile.fullName}</h2>
                    {profile.companyName && <p className="text-sm text-gray-500">{profile.companyName}</p>}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                  </div>
                </div>
                <button onClick={() => setEditing(!editing)} className="text-sm text-orange-500 hover:underline">
                  {editing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              {!editing ? (
                <div className="space-y-3 text-sm">
                  <p><span className="text-gray-500 w-32 inline-block">City:</span> {profile.city}{profile.state ? `, ${profile.state}` : ''}</p>
                  {profile.experienceYears && <p><span className="text-gray-500 w-32 inline-block">Experience:</span> {profile.experienceYears} years</p>}
                  {profile.consultationFeePaise && <p><span className="text-gray-500 w-32 inline-block">Fee:</span> {formatPaise(profile.consultationFeePaise)}</p>}
                  {profile.minBudgetPaise && <p><span className="text-gray-500 w-32 inline-block">Min Budget:</span> {formatPaise(profile.minBudgetPaise)}</p>}
                  {profile.iiidMembership && <p><span className="text-gray-500 w-32 inline-block">IIID:</span> {profile.iiidMembership}</p>}
                  {profile.gstNumber && <p><span className="text-gray-500 w-32 inline-block">GST:</span> {profile.gstNumber}</p>}
                  {profile.bio && <div className="pt-3 border-t mt-3"><p className="text-gray-600">{profile.bio}</p></div>}
                  {profile.specializations && profile.specializations.length > 0 && (
                    <div className="pt-3 border-t">
                      <div className="flex flex-wrap gap-1">{profile.specializations.map((s: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-pink-50 text-pink-600 rounded text-xs">{s}</span>
                      ))}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input value={editForm.fullName || ''} onChange={e => setEditForm((p: any) => ({...p, fullName: e.target.value}))} placeholder="Full Name" className="border rounded-lg px-3 py-2 text-sm" />
                    <input value={editForm.companyName || ''} onChange={e => setEditForm((p: any) => ({...p, companyName: e.target.value}))} placeholder="Company" className="border rounded-lg px-3 py-2 text-sm" />
                    <input value={editForm.email || ''} onChange={e => setEditForm((p: any) => ({...p, email: e.target.value}))} placeholder="Email" className="border rounded-lg px-3 py-2 text-sm" />
                    <input value={editForm.phone || ''} onChange={e => setEditForm((p: any) => ({...p, phone: e.target.value}))} placeholder="Phone" className="border rounded-lg px-3 py-2 text-sm" />
                    <input value={editForm.city || ''} onChange={e => setEditForm((p: any) => ({...p, city: e.target.value}))} placeholder="City" className="border rounded-lg px-3 py-2 text-sm" />
                    <input type="number" value={editForm.experienceYears || ''} onChange={e => setEditForm((p: any) => ({...p, experienceYears: e.target.value ? parseInt(e.target.value) : null}))} placeholder="Exp Years" className="border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <textarea value={editForm.bio || ''} onChange={e => setEditForm((p: any) => ({...p, bio: e.target.value}))} placeholder="Bio" rows={3} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
                  <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Total Projects</span><span className="font-semibold">{profile.totalProjects || 0}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Completed</span><span className="font-semibold text-green-600">{profile.completedProjects || 0}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Rating</span><span className="font-semibold text-yellow-600">{profile.rating || '—'} / 5</span></div>
              </div>
            </div>
            <Link href={`/services/interiors/designers/${profile.id}`} className="block bg-white rounded-xl border p-5 hover:border-orange-200 transition">
              <p className="text-sm font-semibold text-gray-900 mb-1">View Public Profile</p>
              <p className="text-xs text-gray-400">See how clients see your profile</p>
            </Link>
          </div>
        </div>

        {/* Projects */}
        <div className="bg-white rounded-xl border p-6 mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">My Projects ({projects.length})</h2>
          {projects.length === 0 ? (
            <p className="text-gray-400 text-sm">No projects assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {projects.map((p: any) => (
                <Link key={p.id} href={`/services/interiors/${p.id}`} className="flex items-center justify-between p-4 border rounded-xl hover:border-orange-200 transition">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.propertyAddress || 'Project'}</p>
                    <p className="text-xs text-gray-500">{p.projectType} &middot; {p.status}</p>
                  </div>
                  {p.quotedAmountPaise && <span className="text-sm font-semibold text-orange-600">{formatPaise(p.quotedAmountPaise)}</span>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
