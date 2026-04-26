'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatPaise } from '@/lib/utils';
import CityAutocomplete from '@/components/CityAutocomplete';
import DateField from '@/components/DateField';
import type { Experience, ExperienceCategory } from '@/types';

const CATEGORIES: ExperienceCategory[] = ['CULINARY', 'CULTURAL', 'WELLNESS', 'ADVENTURE', 'CREATIVE'];

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100 text-red-600',
};

interface FormData {
  title: string;
  description: string;
  category: ExperienceCategory;
  city: string;
  locationName: string;
  durationHours: string;
  maxGuests: string;
  pricePaise: string;
  languagesSpoken: string;
  whatsIncluded: string;
  whatsNotIncluded: string;
  itinerary: string;
  meetingPoint: string;
  accessibility: string;
  cancellationPolicy: string;
  minAge: string;
  groupDiscountPct: string;
}

const EMPTY_FORM: FormData = {
  title: '', description: '', category: 'CULINARY', city: '', locationName: '',
  durationHours: '2', maxGuests: '10', pricePaise: '', languagesSpoken: 'English',
  whatsIncluded: '', whatsNotIncluded: '', itinerary: '', meetingPoint: '',
  accessibility: '', cancellationPolicy: 'FLEXIBLE', minAge: '', groupDiscountPct: '',
};

interface SessionForm {
  sessionDate: string;
  startTime: string;
  endTime: string;
  availableSpots: string;
}

export default function HostExperiencesTab() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [sessionPanel, setSessionPanel] = useState<string | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionForm>({ sessionDate: '', startTime: '10:00', endTime: '12:00', availableSpots: '10' });

  useEffect(() => {
    loadExperiences();
  }, []);

  async function loadExperiences() {
    setLoading(true);
    try {
      const data = await api.getHostExperiences();
      setExperiences(data ?? []);
    } catch {
      setExperiences([]);
    } finally {
      setLoading(false);
    }
  }

  function editExperience(exp: Experience) {
    setEditingId(exp.id);
    setForm({
      title: exp.title,
      description: exp.description,
      category: exp.category,
      city: exp.city,
      locationName: exp.locationName ?? '',
      durationHours: String(exp.durationMinutes / 60),
      maxGuests: String(exp.maxGuests),
      pricePaise: String(exp.pricePaise / 100),
      languagesSpoken: exp.languagesSpoken ?? 'English',
      whatsIncluded: exp.whatsIncluded ?? '',
      whatsNotIncluded: exp.whatsNotIncluded ?? '',
      itinerary: exp.itinerary ?? '',
      meetingPoint: exp.meetingPoint ?? '',
      accessibility: exp.accessibility ?? '',
      cancellationPolicy: exp.cancellationPolicy ?? 'FLEXIBLE',
      minAge: exp.minAge ? String(exp.minAge) : '',
      groupDiscountPct: exp.groupDiscountPct ? String(exp.groupDiscountPct) : '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        city: form.city,
        locationName: form.locationName || null,
        durationHours: parseFloat(form.durationHours),
        maxGuests: parseInt(form.maxGuests),
        pricePaise: Math.round(parseFloat(form.pricePaise) * 100),
        languagesSpoken: form.languagesSpoken,
        whatsIncluded: form.whatsIncluded || null,
        whatsNotIncluded: form.whatsNotIncluded || null,
        itinerary: form.itinerary || null,
        meetingPoint: form.meetingPoint || null,
        accessibility: form.accessibility || null,
        cancellationPolicy: form.cancellationPolicy,
        minAge: form.minAge ? parseInt(form.minAge) : null,
        groupDiscountPct: form.groupDiscountPct ? parseInt(form.groupDiscountPct) : null,
      };

      if (editingId) {
        await api.updateExperience(editingId, payload);
      } else {
        await api.createExperience(payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      loadExperiences();
    } catch (err: any) {
      alert(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(exp: Experience) {
    const newStatus = exp.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await api.updateExperienceStatus(exp.id, newStatus);
      loadExperiences();
    } catch (err: any) {
      alert(err?.message || 'Failed to update status');
    }
  }

  async function handleAddSession(experienceId: string) {
    try {
      await api.addExperienceSession(experienceId, {
        sessionDate: sessionForm.sessionDate,
        startTime: sessionForm.startTime + ':00',
        endTime: sessionForm.endTime + ':00',
        availableSpots: parseInt(sessionForm.availableSpots),
      });
      setSessionPanel(null);
      setSessionForm({ sessionDate: '', startTime: '10:00', endTime: '12:00', availableSpots: '10' });
      loadExperiences();
    } catch (err: any) {
      alert(err?.message || 'Failed to add session');
    }
  }

  function formatDuration(mins: number) {
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h`;
  }

  if (loading) {
    return <div className="animate-pulse space-y-4 mt-6">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>;
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Experiences</h2>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
        >
          + New Experience
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-lg font-bold">{editingId ? 'Edit Experience' : 'Create Experience'}</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium">Title *</label>
                <input required className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">Description *</label>
                <textarea required rows={3} className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium">Category *</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  value={form.category} onChange={e => setForm({ ...form, category: e.target.value as ExperienceCategory })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <CityAutocomplete
                  value={form.city}
                  onChange={(v: string) => setForm({ ...form, city: v })}
                  label="City *"
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Location Name</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  value={form.locationName} onChange={e => setForm({ ...form, locationName: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium">Duration (hours) *</label>
                <input required type="number" step="0.5" min="0.5" className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  value={form.durationHours} onChange={e => setForm({ ...form, durationHours: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium">Max Guests</label>
                <input type="number" min="1" className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  value={form.maxGuests} onChange={e => setForm({ ...form, maxGuests: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium">Price (INR) *</label>
                <input required type="number" min="1" className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  placeholder="e.g. 1500"
                  value={form.pricePaise} onChange={e => setForm({ ...form, pricePaise: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium">Languages</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  placeholder="English, Hindi"
                  value={form.languagesSpoken} onChange={e => setForm({ ...form, languagesSpoken: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium">Cancellation Policy</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  value={form.cancellationPolicy} onChange={e => setForm({ ...form, cancellationPolicy: e.target.value })}>
                  <option value="FLEXIBLE">Flexible (24h)</option>
                  <option value="MODERATE">Moderate (5 days)</option>
                  <option value="STRICT">Strict (non-refundable)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Min Age</label>
                <input type="number" min="0" className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  value={form.minAge} onChange={e => setForm({ ...form, minAge: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium">Group Discount %</label>
                <input type="number" min="0" max="50" className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  placeholder="e.g. 10"
                  value={form.groupDiscountPct} onChange={e => setForm({ ...form, groupDiscountPct: e.target.value })} />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">What&apos;s Included</label>
                <textarea rows={2} className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  placeholder="One item per line"
                  value={form.whatsIncluded} onChange={e => setForm({ ...form, whatsIncluded: e.target.value })} />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">What&apos;s Not Included</label>
                <textarea rows={2} className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  placeholder="One item per line"
                  value={form.whatsNotIncluded} onChange={e => setForm({ ...form, whatsNotIncluded: e.target.value })} />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">Itinerary</label>
                <textarea rows={3} className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  placeholder="Describe the step-by-step experience"
                  value={form.itinerary} onChange={e => setForm({ ...form, itinerary: e.target.value })} />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">Meeting Point</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  placeholder="Address or landmark"
                  value={form.meetingPoint} onChange={e => setForm({ ...form, meetingPoint: e.target.value })} />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">Accessibility</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  placeholder="e.g. Wheelchair accessible, stroller-friendly"
                  value={form.accessibility} onChange={e => setForm({ ...form, accessibility: e.target.value })} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50">
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-6 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Experience List */}
      {experiences.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🎭</p>
          <p>No experiences yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {experiences.map((exp) => (
            <div key={exp.id} className="border rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{exp.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLE[exp.status] ?? 'bg-gray-100'}`}>
                      {exp.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {exp.category} &middot; {exp.city} &middot; {formatDuration(exp.durationMinutes)} &middot; {formatPaise(exp.pricePaise)}/person
                  </p>
                  {exp.avgRating != null && exp.avgRating > 0 && (
                    <p className="text-sm mt-1">
                      <span className="text-orange-500">★ {exp.avgRating.toFixed(1)}</span>
                      <span className="text-gray-400 ml-1">({exp.reviewCount} reviews)</span>
                    </p>
                  )}
                  {exp.upcomingSessions && exp.upcomingSessions.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      {exp.upcomingSessions.length} upcoming session{exp.upcomingSessions.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <button onClick={() => editExperience(exp)}
                    className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Edit</button>
                  <button onClick={() => toggleStatus(exp)}
                    className={`px-3 py-1.5 text-sm rounded-lg ${
                      exp.status === 'ACTIVE'
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}>
                    {exp.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                  </button>
                  <button onClick={() => setSessionPanel(sessionPanel === exp.id ? null : exp.id)}
                    className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">
                    + Session
                  </button>
                </div>
              </div>

              {/* Add Session Panel */}
              {sessionPanel === exp.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold mb-3">Add Session</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">Date</label>
                      <DateField className="w-full border rounded px-2 py-1.5 text-sm"
                        value={sessionForm.sessionDate}
                        onChange={e => setSessionForm({ ...sessionForm, sessionDate: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Start</label>
                      <input type="time" className="w-full border rounded px-2 py-1.5 text-sm"
                        value={sessionForm.startTime}
                        onChange={e => setSessionForm({ ...sessionForm, startTime: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">End</label>
                      <input type="time" className="w-full border rounded px-2 py-1.5 text-sm"
                        value={sessionForm.endTime}
                        onChange={e => setSessionForm({ ...sessionForm, endTime: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Spots</label>
                      <input type="number" min="1" className="w-full border rounded px-2 py-1.5 text-sm"
                        value={sessionForm.availableSpots}
                        onChange={e => setSessionForm({ ...sessionForm, availableSpots: e.target.value })} />
                    </div>
                  </div>
                  <button onClick={() => handleAddSession(exp.id)}
                    className="mt-3 px-4 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600">
                    Add Session
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
