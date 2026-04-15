'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

const SPECIALIZATIONS = [
  'Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Modular Kitchen',
  'Wardrobe & Storage', 'False Ceiling', 'Flooring', 'Painting & Wallpaper',
  'Pooja Room', 'Kids Room', 'Study Room', 'Balcony & Terrace',
  'Commercial Office', 'Retail & Showroom', 'Restaurant & Cafe',
  'Full Home Interiors', 'Renovation', 'Smart Home Integration',
];

export default function DesignerRegistrationPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: '', companyName: '', email: '', phone: '',
    address: '', city: '', state: '', experienceYears: '',
    specializations: [] as string[],
    consultationFeePaise: '', bio: '',
    iiidMembership: '', gstNumber: '',
    serviceAreas: '', minBudgetPaise: '',
  });

  useEffect(() => {
    const t = localStorage.getItem('access_token') ?? '';
    if (!t) { router.push('/auth?redirect=/services/interiors/register'); return; }
    setToken(t);
  }, [router]);

  function toggleSpec(item: string) {
    setForm(p => ({
      ...p,
      specializations: p.specializations.includes(item)
        ? p.specializations.filter(x => x !== item) : [...p.specializations, item]
    }));
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
        minBudgetPaise: form.minBudgetPaise ? parseInt(form.minBudgetPaise) * 100 : null,
        serviceAreas: form.serviceAreas || null,
      };
      await api.registerDesigner(payload, token);
      alert('Registration successful! Your profile is now live. Verification badge will be added after review.');
      router.push('/services/interiors/designers');
    } catch (e: any) {
      alert(e.message || 'Registration failed');
    } finally { setSubmitting(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/services/interiors/designers" className="text-sm text-orange-500 hover:underline mb-4 block">&larr; Back to Designers</Link>

        <div className="bg-white rounded-2xl border shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Register as an Interior Designer</h1>
          <p className="text-gray-500 mb-6">Join Safar's network of home interior professionals. Get clients, showcase your portfolio, and grow your business.</p>

          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? 'bg-orange-500' : 'bg-gray-200'}`} />
            ))}
          </div>

          {/* Step 1: Personal & Company */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Personal & Company Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input value={form.fullName} onChange={e => setForm(p => ({...p, fullName: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input value={form.companyName} onChange={e => setForm(p => ({...p, companyName: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input value={form.city} onChange={e => setForm(p => ({...p, city: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input value={form.state} onChange={e => setForm(p => ({...p, state: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Office/Studio Address</label>
                <input value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
              </div>
              <button onClick={() => setStep(2)} className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition">Next: Expertise & Portfolio</button>
            </div>
          )}

          {/* Step 2: Expertise */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Expertise & Pricing</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <input type="number" value={form.experienceYears} onChange={e => setForm(p => ({...p, experienceYears: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (INR)</label>
                  <input type="number" value={form.consultationFeePaise} onChange={e => setForm(p => ({...p, consultationFeePaise: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" placeholder="1000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Project Budget (INR)</label>
                  <input type="number" value={form.minBudgetPaise} onChange={e => setForm(p => ({...p, minBudgetPaise: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" placeholder="200000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IIID Membership (optional)</label>
                  <input value={form.iiidMembership} onChange={e => setForm(p => ({...p, iiidMembership: e.target.value}))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map(s => (
                    <button key={s} type="button" onClick={() => toggleSpec(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition ${form.specializations.includes(s) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 hover:border-orange-300'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About You & Your Work</label>
                <textarea value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))} rows={4} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 resize-none" placeholder="Your design philosophy, notable projects, certifications..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition">Next: Review & Submit</button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Review & Submit</h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <p><span className="text-gray-500">Name:</span> {form.fullName || '—'}{form.companyName ? ` (${form.companyName})` : ''}</p>
                <p><span className="text-gray-500">City:</span> {form.city || '—'}</p>
                <p><span className="text-gray-500">Experience:</span> {form.experienceYears ? `${form.experienceYears} years` : '—'}</p>
                <p><span className="text-gray-500">Specializations:</span> {form.specializations.length > 0 ? form.specializations.join(', ') : '—'}</p>
                <p><span className="text-gray-500">Consultation Fee:</span> {form.consultationFeePaise ? `INR ${form.consultationFeePaise}` : '—'}</p>
                <p><span className="text-gray-500">Min Budget:</span> {form.minBudgetPaise ? `INR ${parseInt(form.minBudgetPaise).toLocaleString('en-IN')}` : '—'}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800">
                <p className="font-semibold mb-1">After Registration</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Your profile goes live immediately (unverified badge)</li>
                  <li>Upload portfolio photos from your dashboard</li>
                  <li>Add ID proof and certifications for faster verification</li>
                  <li>Start receiving client inquiries and consultation bookings</li>
                </ul>
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
