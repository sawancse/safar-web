'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

const SPECIALIZATIONS = [
  'Property Law', 'Title Verification', 'RERA Compliance', 'Due Diligence',
  'Sale Agreements', 'Lease Agreements', 'Landlord-Tenant Disputes', 'Property Registration',
  'Stamp Duty & Taxation', 'Construction Law', 'Encumbrance Check', 'Family Property Law',
  'NRI Property Law', 'Agricultural Land Law', 'Commercial Property Law', 'Litigation',
];

const LANGUAGES = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Marathi', 'Bengali', 'Gujarati', 'Malayalam', 'Punjabi'];

export default function LawyerRegistrationPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: '', barCouncilId: '', email: '', phone: '',
    address: '', city: '', state: '', experienceYears: '',
    specializations: [] as string[], languages: [] as string[],
    consultationFeePaise: '', bio: '',
    availableDays: 'MON-FRI', availableHours: '10:00-18:00',
    idProofUrl: '', licenseUrl: '',
  });

  useEffect(() => {
    const t = localStorage.getItem('access_token') ?? '';
    if (!t) { router.push('/auth?redirect=/services/legal/register'); return; }
    setToken(t);
  }, [router]);

  function toggleItem(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
  }

  async function handleSubmit() {
    if (!form.fullName || !form.phone || !form.city) {
      alert('Please fill in required fields: Name, Phone, City');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        experienceYears: form.experienceYears ? parseInt(form.experienceYears) : null,
        consultationFeePaise: form.consultationFeePaise ? parseInt(form.consultationFeePaise) * 100 : null,
        languages: JSON.stringify(form.languages),
      };
      await api.registerAdvocate(payload, token);
      alert('Registration successful! Your profile is now live. You will receive a verified badge once our team reviews your credentials.');
      router.push('/services/legal/lawyers');
    } catch (e: any) {
      alert(e.message || 'Registration failed');
    } finally { setSubmitting(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/services/legal/lawyers" className="text-sm text-orange-500 hover:underline mb-4 block">&larr; Back to Lawyers</Link>

        <div className="bg-white rounded-2xl border shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Register as a Legal Professional</h1>
          <p className="text-gray-500 mb-6">Join Safar's network of property lawyers. Your profile goes live immediately — verification badge added after review.</p>

          {/* Step indicator */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? 'bg-orange-500' : 'bg-gray-200'}`} />
            ))}
          </div>

          {/* Step 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Personal Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input value={form.fullName} onChange={e => setForm(p => ({...p, fullName: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" placeholder="Adv. Rajesh Kumar" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bar Council Number</label>
                  <input value={form.barCouncilId} onChange={e => setForm(p => ({...p, barCouncilId: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" placeholder="MH/12345/2015" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" placeholder="9876543210" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input value={form.city} onChange={e => setForm(p => ({...p, city: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" placeholder="Mumbai" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input value={form.state} onChange={e => setForm(p => ({...p, state: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" placeholder="Maharashtra" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Office Address</label>
                <input value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
              </div>
              <button onClick={() => setStep(2)} className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition">Next: Experience & Specializations</button>
            </div>
          )}

          {/* Step 2: Experience & Specializations */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Experience & Expertise</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <input type="number" value={form.experienceYears} onChange={e => setForm(p => ({...p, experienceYears: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (INR)</label>
                  <input type="number" value={form.consultationFeePaise} onChange={e => setForm(p => ({...p, consultationFeePaise: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" placeholder="500" min="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specializations (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map(s => (
                    <button key={s} type="button" onClick={() => setForm(p => ({...p, specializations: toggleItem(p.specializations, s)}))}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition ${form.specializations.includes(s) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 hover:border-orange-300'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => (
                    <button key={l} type="button" onClick={() => setForm(p => ({...p, languages: toggleItem(p.languages, l)}))}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition ${form.languages.includes(l) ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 hover:border-blue-300'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About You</label>
                <textarea value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))} rows={4} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 resize-none" placeholder="Brief about your practice, notable cases, approach..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition">Next: Availability</button>
              </div>
            </div>
          )}

          {/* Step 3: Availability & Submit */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Availability & Documents</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Days</label>
                  <select value={form.availableDays} onChange={e => setForm(p => ({...p, availableDays: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400">
                    <option value="MON-FRI">Monday - Friday</option>
                    <option value="MON-SAT">Monday - Saturday</option>
                    <option value="ALL">All Days</option>
                    <option value="WEEKENDS">Weekends Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Hours</label>
                  <select value={form.availableHours} onChange={e => setForm(p => ({...p, availableHours: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400">
                    <option value="10:00-18:00">10 AM - 6 PM</option>
                    <option value="09:00-17:00">9 AM - 5 PM</option>
                    <option value="09:00-21:00">9 AM - 9 PM</option>
                    <option value="FLEXIBLE">Flexible</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Documents (Optional — speeds up verification)</h3>
                <p className="text-xs text-blue-600 mb-3">Upload your Bar Council certificate, ID proof, and any other credentials. You can add these later from your dashboard.</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Bar Council Certificate, Aadhaar/PAN, Practice License — upload from your professional dashboard after registration.</p>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <h3 className="font-semibold text-gray-800">Registration Summary</h3>
                <p><span className="text-gray-500">Name:</span> {form.fullName || '—'}</p>
                <p><span className="text-gray-500">City:</span> {form.city || '—'}</p>
                <p><span className="text-gray-500">Experience:</span> {form.experienceYears ? `${form.experienceYears} years` : '—'}</p>
                <p><span className="text-gray-500">Specializations:</span> {form.specializations.length > 0 ? form.specializations.join(', ') : '—'}</p>
                <p><span className="text-gray-500">Fee:</span> {form.consultationFeePaise ? `INR ${form.consultationFeePaise}` : '—'}</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <p className="text-xs text-yellow-800">Your profile will be visible immediately with an "Unverified" tag. Once our team verifies your credentials, you'll receive a green "Verified" badge.</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">Back</button>
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50">
                  {submitting ? 'Registering...' : 'Register & Go Live'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
