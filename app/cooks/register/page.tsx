'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const CUISINES = ['SOUTH_INDIAN', 'NORTH_INDIAN', 'BENGALI', 'MAHARASHTRIAN', 'GUJARATI', 'PUNJABI', 'HYDERABADI', 'KERALA', 'CHINESE', 'CONTINENTAL', 'MUGHLAI', 'STREET_FOOD', 'DESSERTS', 'VEGAN', 'JAIN'];

const CITY_STATES: Record<string, string> = {
  'mumbai': 'Maharashtra', 'pune': 'Maharashtra', 'nashik': 'Maharashtra', 'nagpur': 'Maharashtra',
  'delhi': 'Delhi', 'new delhi': 'Delhi', 'noida': 'Uttar Pradesh', 'gurgaon': 'Haryana', 'gurugram': 'Haryana',
  'bangalore': 'Karnataka', 'bengaluru': 'Karnataka', 'mysore': 'Karnataka', 'mysuru': 'Karnataka',
  'hyderabad': 'Telangana', 'secunderabad': 'Telangana', 'warangal': 'Telangana',
  'chennai': 'Tamil Nadu', 'coimbatore': 'Tamil Nadu', 'madurai': 'Tamil Nadu',
  'kolkata': 'West Bengal', 'howrah': 'West Bengal',
  'ahmedabad': 'Gujarat', 'surat': 'Gujarat', 'vadodara': 'Gujarat', 'rajkot': 'Gujarat',
  'jaipur': 'Rajasthan', 'udaipur': 'Rajasthan', 'jodhpur': 'Rajasthan',
  'lucknow': 'Uttar Pradesh', 'kanpur': 'Uttar Pradesh', 'varanasi': 'Uttar Pradesh', 'agra': 'Uttar Pradesh',
  'chandigarh': 'Chandigarh', 'bhopal': 'Madhya Pradesh', 'indore': 'Madhya Pradesh',
  'kochi': 'Kerala', 'thiruvananthapuram': 'Kerala', 'trivandrum': 'Kerala',
  'goa': 'Goa', 'panaji': 'Goa', 'guwahati': 'Assam', 'patna': 'Bihar',
  'ranchi': 'Jharkhand', 'bhubaneswar': 'Odisha', 'visakhapatnam': 'Andhra Pradesh', 'vijayawada': 'Andhra Pradesh',
  'dehradun': 'Uttarakhand', 'shimla': 'Himachal Pradesh', 'dharamshala': 'Himachal Pradesh',
};

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
  const [selectedLocalities, setSelectedLocalities] = useState<string[]>([]);
  const [availableLocalities, setAvailableLocalities] = useState<string[]>([]);
  const [localitySearch, setLocalitySearch] = useState('');
  const [loadingLocalities, setLoadingLocalities] = useState(false);
  const [dailyRatePaise, setDailyRatePaise] = useState(0);
  const [monthlyRatePaise, setMonthlyRatePaise] = useState(0);
  const [eventMinPlatePaise, setEventMinPlatePaise] = useState(0);
  const [languages, setLanguages] = useState('Hindi, English');
  const [eventMinPax, setEventMinPax] = useState(20);
  const [eventMaxPax, setEventMaxPax] = useState(200);

  // Fetch localities when city changes
  useEffect(() => {
    if (!city || city.length < 3) { setAvailableLocalities([]); return; }
    setLoadingLocalities(true);
    api.getLocalitiesByCity(city)
      .then((data: any) => {
        const names = Array.isArray(data)
          ? data.map((l: any) => l.name || l.locality || l).filter(Boolean)
          : [];
        setAvailableLocalities(names);
      })
      .catch(() => setAvailableLocalities([]))
      .finally(() => setLoadingLocalities(false));
  }, [city]);

  // Keep localities string in sync with selectedLocalities
  useEffect(() => {
    setLocalities(selectedLocalities.join(', '));
  }, [selectedLocalities]);

  function toggleLocality(loc: string) {
    setSelectedLocalities(prev =>
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  }

  function addCustomLocality() {
    const trimmed = localitySearch.trim();
    if (trimmed && !selectedLocalities.includes(trimmed)) {
      setSelectedLocalities(prev => [...prev, trimmed]);
    }
    setLocalitySearch('');
  }

  const filteredLocalities = availableLocalities.filter(l =>
    l.toLowerCase().includes(localitySearch.toLowerCase()) && !selectedLocalities.includes(l)
  );

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
              <input value={city} onChange={e => {
                  const val = e.target.value;
                  setCity(val);
                  const mapped = CITY_STATES[val.toLowerCase().trim()];
                  if (mapped) setState(mapped);
                }}
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
            {/* Selected localities as chips */}
            {selectedLocalities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedLocalities.map(loc => (
                  <span key={loc} className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs font-medium px-2.5 py-1 rounded-full border border-orange-200">
                    {loc}
                    <button type="button" onClick={() => toggleLocality(loc)} className="text-orange-400 hover:text-orange-600 ml-0.5">&times;</button>
                  </span>
                ))}
              </div>
            )}
            {/* Search/add input */}
            <div className="relative">
              <input
                value={localitySearch}
                onChange={e => setLocalitySearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomLocality(); } }}
                className="w-full border rounded-lg px-3 py-2.5 text-sm"
                placeholder={availableLocalities.length > 0 ? 'Search or type a locality...' : city ? 'Type locality names...' : 'Enter city first'}
              />
              {loadingLocalities && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Loading...</span>
              )}
            </div>
            {/* Dropdown with available localities */}
            {localitySearch && filteredLocalities.length > 0 && (
              <div className="mt-1 border rounded-lg bg-white shadow-lg max-h-40 overflow-y-auto">
                {filteredLocalities.slice(0, 15).map(loc => (
                  <button key={loc} type="button" onClick={() => { toggleLocality(loc); setLocalitySearch(''); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 transition">
                    {loc}
                  </button>
                ))}
              </div>
            )}
            {/* Show all available localities as selectable pills when no search */}
            {!localitySearch && availableLocalities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {availableLocalities.filter(l => !selectedLocalities.includes(l)).slice(0, 20).map(loc => (
                  <button key={loc} type="button" onClick={() => toggleLocality(loc)}
                    className="px-2.5 py-1 rounded-full text-xs border border-gray-200 text-gray-600 hover:border-orange-400 hover:bg-orange-50 transition">
                    + {loc}
                  </button>
                ))}
                {availableLocalities.length > 20 && (
                  <span className="text-xs text-gray-400 self-center">+{availableLocalities.length - 20} more — search to find</span>
                )}
              </div>
            )}
            {city && availableLocalities.length === 0 && !loadingLocalities && (
              <p className="text-xs text-gray-400 mt-1">No pre-loaded localities for {city}. Type and press Enter to add manually.</p>
            )}
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
