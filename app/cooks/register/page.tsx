'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const CUISINES = ['SOUTH_INDIAN', 'NORTH_INDIAN', 'BENGALI', 'MAHARASHTRIAN', 'GUJARATI', 'PUNJABI', 'HYDERABADI', 'KERALA', 'CHINESE', 'CONTINENTAL', 'MUGHLAI', 'STREET_FOOD', 'DESSERTS', 'VEGAN', 'JAIN'];

export default function RegisterCookPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [chefType, setChefType] = useState('DOMESTIC');
  const [experienceYears, setExperienceYears] = useState(1);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState('');
  const [localities, setLocalities] = useState('');
  const [dailyRatePaise, setDailyRatePaise] = useState(0);
  const [monthlyRatePaise, setMonthlyRatePaise] = useState(0);
  const [eventMinPlatePaise, setEventMinPlatePaise] = useState(0);
  const [languages, setLanguages] = useState('Hindi, English');
  const [eventMinPax, setEventMinPax] = useState(20);
  const [eventMaxPax, setEventMaxPax] = useState(200);

  function toggleCuisine(c: string) {
    setSelectedCuisines(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }

  async function handleSubmit() {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/auth'); return; }
    setSaving(true); setError('');
    try {
      await api.registerChef({
        name, phone, email, bio, chefType, experienceYears,
        city, state, pincode, cuisines: selectedCuisines.join(','),
        specialties, localities, dailyRatePaise, monthlyRatePaise,
        eventMinPlatePaise, languages, eventMinPax, eventMaxPax,
      }, token);
      router.push('/cooks/my-bookings');
    } catch (e: any) {
      setError(e.message || 'Registration failed');
    }
    setSaving(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Register as a Cook</h1>
      <p className="text-gray-500 mb-6">Join Safar Cooks and start earning by cooking for guests</p>

      {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

      {/* Step indicator */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition ${s <= step ? 'bg-orange-500' : 'bg-gray-200'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Basic Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="+91..." />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Tell guests about yourself, your cooking style..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Chef Type *</label>
            <div className="flex gap-3">
              {[
                { key: 'DOMESTIC', label: 'Home Cook', icon: '🏠' },
                { key: 'PROFESSIONAL', label: 'Professional', icon: '👨‍🍳' },
                { key: 'EVENT_SPECIALIST', label: 'Event Caterer', icon: '🎉' },
              ].map(t => (
                <button key={t.key} type="button" onClick={() => setChefType(t.key)}
                  className={`flex-1 p-3 border-2 rounded-xl text-center transition
                    ${chefType === t.key ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <span className="text-2xl block">{t.icon}</span>
                  <span className="text-xs font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Experience (years)</label>
              <input type="number" min={0} value={experienceYears} onChange={e => setExperienceYears(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Languages</label>
              <input value={languages} onChange={e => setLanguages(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm" />
            </div>
          </div>
          <button onClick={() => setStep(2)} disabled={!name || !phone}
            className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition">
            Next: Location & Cuisines
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Location & Cuisines</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">City *</label>
              <input value={city} onChange={e => setCity(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Mumbai" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
              <input value={state} onChange={e => setState(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Maharashtra" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pincode</label>
              <input value={pincode} onChange={e => setPincode(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm" maxLength={6} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Serving Areas</label>
            <input value={localities} onChange={e => setLocalities(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Bandra, Andheri, Juhu..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Cuisines *</label>
            <div className="flex flex-wrap gap-2">
              {CUISINES.map(c => (
                <button key={c} type="button" onClick={() => toggleCuisine(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition
                    ${selectedCuisines.includes(c) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-300'}`}>
                  {c.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Specialties</label>
            <input value={specialties} onChange={e => setSpecialties(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Biryani, Thali, Desserts..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 border rounded-xl py-3 text-sm font-medium">Back</button>
            <button onClick={() => setStep(3)} disabled={!city || selectedCuisines.length === 0}
              className="flex-1 bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition">
              Next: Pricing
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Pricing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border rounded-xl p-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Daily Rate (INR)</label>
              <input type="number" min={0} value={dailyRatePaise / 100 || ''}
                onChange={e => setDailyRatePaise(Number(e.target.value) * 100)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="800" />
              <p className="text-[10px] text-gray-400 mt-1">Per day cooking charge</p>
            </div>
            <div className="border rounded-xl p-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Monthly Rate (INR)</label>
              <input type="number" min={0} value={monthlyRatePaise / 100 || ''}
                onChange={e => setMonthlyRatePaise(Number(e.target.value) * 100)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="12000" />
              <p className="text-[10px] text-gray-400 mt-1">For monthly subscriptions</p>
            </div>
            <div className="border rounded-xl p-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Event Price/Plate (INR)</label>
              <input type="number" min={0} value={eventMinPlatePaise / 100 || ''}
                onChange={e => setEventMinPlatePaise(Number(e.target.value) * 100)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="250" />
              <p className="text-[10px] text-gray-400 mt-1">Minimum per plate for events</p>
            </div>
          </div>
          {chefType === 'EVENT_SPECIALIST' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Min Guests (events)</label>
                <input type="number" value={eventMinPax} onChange={e => setEventMinPax(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max Guests (events)</label>
                <input type="number" value={eventMaxPax} onChange={e => setEventMaxPax(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" />
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 border rounded-xl py-3 text-sm font-medium">Back</button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition">
              {saving ? 'Registering...' : 'Register as Cook'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
