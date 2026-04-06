'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

function formatPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
}

const SERVICE_PACKAGES = [
  { name: 'Modular Kitchen', range: '1.5L - 5L', desc: 'Complete kitchen with cabinets, countertop, appliances & fittings' },
  { name: 'Wardrobe', range: '80K - 3L', desc: 'Sliding or hinged wardrobes with internals, mirror, and accessories' },
  { name: 'Full Room', range: '2L - 6L', desc: 'Bedroom or living room with furniture, lighting, and decor' },
  { name: 'Full Home', range: '5L - 20L', desc: 'Complete home interior with all rooms, kitchen, and bathrooms' },
  { name: 'Renovation', range: '8L - 30L', desc: 'Full renovation including civil work, electrical, plumbing, and interiors' },
];

const HOW_IT_WORKS = [
  { title: 'Book', desc: 'Schedule a free consultation with our design experts' },
  { title: 'Measure', desc: 'Our team visits your property for precise measurements' },
  { title: 'Design', desc: '3D designs and floor plans created for your approval' },
  { title: 'Approve', desc: 'Review designs, materials, and finalized quote' },
  { title: 'Execute', desc: 'Professional execution with quality checkpoints' },
  { title: 'Handover', desc: 'Final QC, walkthrough, and 10-year warranty handover' },
];

const MATERIAL_CATEGORIES = ['FLOORING', 'WALL', 'COUNTERTOP', 'CABINET', 'PAINT', 'LIGHTING', 'HARDWARE'];
const CATEGORY_LABEL: Record<string, string> = {
  FLOORING: 'Flooring', WALL: 'Wall', COUNTERTOP: 'Countertop',
  CABINET: 'Cabinet', PAINT: 'Paint', LIGHTING: 'Lighting', HARDWARE: 'Hardware',
};

const CITIES = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];

const BUDGET_RANGES = ['Under 5L', '5L - 10L', '10L - 20L', '20L - 50L', 'Above 50L'];

const STATUS_COLORS: Record<string, string> = {
  CONSULTATION: 'bg-blue-100 text-blue-700',
  MEASUREMENT: 'bg-indigo-100 text-indigo-700',
  DESIGNING: 'bg-orange-100 text-orange-700',
  QUOTE_SENT: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  IN_PROGRESS: 'bg-orange-100 text-orange-700',
  QUALITY_CHECK: 'bg-teal-100 text-teal-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

export default function InteriorsPage() {
  const [token, setToken] = useState('');

  // Consultation form
  const [formCity, setFormCity] = useState('');
  const [formPropertyType, setFormPropertyType] = useState('APARTMENT');
  const [formRooms, setFormRooms] = useState('2');
  const [formBudget, setFormBudget] = useState('5L - 10L');
  const [formDate, setFormDate] = useState('');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Designers
  const [designers, setDesigners] = useState<any[]>([]);
  const [designersLoading, setDesignersLoading] = useState(true);
  const [designerCity, setDesignerCity] = useState('');

  // Projects
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Materials
  const [materials, setMaterials] = useState<any[]>([]);
  const [materialCategory, setMaterialCategory] = useState('FLOORING');
  const [materialsLoading, setMaterialsLoading] = useState(false);

  function loadProjects() {
    setProjectsLoading(true);
    api.getMyInteriorProjects()
      .then((res: any) => {
        setProjects(Array.isArray(res) ? res : res?.content || []);
        setToken('loaded');
      })
      .catch(() => setProjects([]))
      .finally(() => setProjectsLoading(false));
  }

  useEffect(() => {
    const t = localStorage.getItem('access_token') || '';
    setToken(t);

    api.getInteriorDesigners()
      .then((res) => setDesigners(Array.isArray(res) ? res : []))
      .catch(() => setDesigners([]))
      .finally(() => setDesignersLoading(false));

    loadProjects();
  }, []);

  useEffect(() => {
    setMaterialsLoading(true);
    api.getMaterialCatalog(materialCategory)
      .then((res) => setMaterials(Array.isArray(res) ? res : []))
      .catch(() => setMaterials([]))
      .finally(() => setMaterialsLoading(false));
  }, [materialCategory]);

  useEffect(() => {
    setDesignersLoading(true);
    api.getInteriorDesigners(designerCity || undefined)
      .then((res) => setDesigners(Array.isArray(res) ? res : []))
      .catch(() => setDesigners([]))
      .finally(() => setDesignersLoading(false));
  }, [designerCity]);

  async function bookConsultation() {
    const freshToken = localStorage.getItem('access_token') || token;
    if (!freshToken) return;
    setBookingSubmitting(true);
    setBookingError('');
    try {
      // Parse budget range to paise
      const budgetMap: Record<string, [number, number]> = {
        'Under 5L': [0, 500000_00],
        '5L - 10L': [500000_00, 1000000_00],
        '10L - 20L': [1000000_00, 2000000_00],
        '20L - 50L': [2000000_00, 5000000_00],
        'Above 50L': [5000000_00, 10000000_00],
      };
      const [minPaise, maxPaise] = budgetMap[formBudget] || [0, 0];
      await api.bookInteriorConsultation({
        projectType: 'FULL_HOME',
        propertyType: formPropertyType,
        city: formCity,
        roomCount: parseInt(formRooms),
        budgetMinPaise: minPaise,
        budgetMaxPaise: maxPaise,
        consultationDate: formDate || null,
      }, freshToken);
      setBookingSuccess(true);
      loadProjects();
    } catch (err: any) {
      setBookingError(err?.message || 'Failed to book consultation. Please try again.');
    } finally {
      setBookingSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-[#003B95] text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Link href="/services" className="text-white/70 hover:text-white text-sm mb-3 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            All Services
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Transform Your Space</h1>
          <p className="text-orange-100 max-w-xl mb-8">End-to-end interior design and execution with 3D visualization, quality materials, and a 10-year warranty.</p>

          {/* Consultation Form */}
          {bookingSuccess ? (
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 max-w-3xl">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div>
                  <h3 className="font-semibold">Consultation Booked!</h3>
                  <p className="text-sm text-orange-100">Our design expert will contact you within 24 hours.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 max-w-3xl">
              <h3 className="font-semibold mb-4">Book a Free Consultation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <select value={formCity} onChange={(e) => setFormCity(e.target.value)} className="bg-white/20 border border-white/30 rounded-lg px-3 py-2.5 text-sm text-white placeholder-orange-200 [&>option]:text-gray-900">
                  <option value="">Select City</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={formPropertyType} onChange={(e) => setFormPropertyType(e.target.value)} className="bg-white/20 border border-white/30 rounded-lg px-3 py-2.5 text-sm text-white [&>option]:text-gray-900">
                  <option value="APARTMENT">Apartment</option>
                  <option value="VILLA">Villa</option>
                  <option value="INDEPENDENT_HOUSE">Independent House</option>
                  <option value="PENTHOUSE">Penthouse</option>
                </select>
                <select value={formRooms} onChange={(e) => setFormRooms(e.target.value)} className="bg-white/20 border border-white/30 rounded-lg px-3 py-2.5 text-sm text-white [&>option]:text-gray-900">
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={String(n)}>{n} {n === 1 ? 'Room' : 'Rooms'}</option>)}
                </select>
                <select value={formBudget} onChange={(e) => setFormBudget(e.target.value)} className="bg-white/20 border border-white/30 rounded-lg px-3 py-2.5 text-sm text-white [&>option]:text-gray-900">
                  {BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="bg-white/20 border border-white/30 rounded-lg px-3 py-2.5 text-sm text-white" />
                <input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="bg-white/20 border border-white/30 rounded-lg px-3 py-2.5 text-sm text-white placeholder-orange-200" placeholder="Phone Number" />
              </div>
              {!token ? (
                <Link href="/auth" className="inline-flex bg-white text-orange-600 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors">
                  Sign in to Book
                </Link>
              ) : (
                <button onClick={bookConsultation} disabled={bookingSubmitting || !formCity || !formPhone}
                  className="bg-white text-orange-600 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors disabled:opacity-50">
                  {bookingSubmitting ? 'Booking...' : 'Book Free Consultation'}
                </button>
              )}
              {bookingError && <p className="text-red-200 text-sm mt-2">{bookingError}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* Designer Showcase */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-slate-900">Our Designers</h2>
            <select value={designerCity} onChange={(e) => setDesignerCity(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm max-w-xs">
              <option value="">All Cities</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {designersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3" />
                  <div className="h-5 bg-gray-200 rounded w-32 mx-auto mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-24 mx-auto" />
                </div>
              ))}
            </div>
          ) : designers.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500">No designers available for the selected city.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {designers.map((d, idx) => (
                <div key={d.id || idx} className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 font-bold text-2xl mx-auto mb-3">
                    {(d.name || 'D')[0]}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{d.name}</h3>
                  <p className="text-sm text-gray-500 mb-1">{d.city || 'India'}</p>
                  {d.experience && <p className="text-xs text-gray-400 mb-2">{d.experience} years experience</p>}
                  {d.rating && (
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      <span className="text-sm font-medium text-slate-900">{d.rating}</span>
                    </div>
                  )}
                  {d.specializations && (
                    <div className="flex flex-wrap gap-1 justify-center mb-2">
                      {(d.specializations || []).slice(0, 3).map((s: string) => (
                        <span key={s} className="text-[10px] bg-orange-50 text-orange-500 px-2 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  )}
                  {d.projectsCompleted != null && (
                    <p className="text-xs text-gray-400">{d.projectsCompleted} projects completed</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Service Packages */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-6">Service Packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICE_PACKAGES.map((pkg) => (
              <div key={pkg.name} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-slate-900 mb-1">{pkg.name}</h3>
                <div className="text-lg font-bold text-orange-500 mb-2">{pkg.range}</div>
                <p className="text-sm text-gray-500">{pkg.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-6">How It Works</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 font-bold flex items-center justify-center mx-auto mb-3">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* My Projects */}
        {token && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-6">My Projects</h2>
            {projectsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-64" />
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500 mb-2">No interior projects yet.</p>
                <p className="text-sm text-gray-400">Book a free consultation to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((p: any) => {
                  const progress = p.progressPercent || 0;
                  return (
                    <Link key={p.id} href={`/services/interiors/${p.id}`}
                      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow block">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">{p.projectType || p.name || 'Interior Project'}</h3>
                          <p className="text-sm text-gray-500">{p.designerName || 'Designer TBA'}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-700'}`}>
                          {(p.status || '').replace(/_/g, ' ')}
                        </span>
                      </div>
                      {p.nextMilestone && (
                        <p className="text-xs text-gray-400 mb-2">Next: {p.nextMilestone}</p>
                      )}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{progress}% complete</p>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Material Catalog */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-6">Material Catalog</h2>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {MATERIAL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setMaterialCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  materialCategory === cat ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {CATEGORY_LABEL[cat] || cat}
              </button>
            ))}
          </div>
          {materialsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                  <div className="w-full h-32 bg-gray-200 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
              ))}
            </div>
          ) : materials.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500">No materials in this category yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {materials.map((m, idx) => (
                <div key={m.id || idx} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-300">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5V19.5a1.5 1.5 0 001.5 1.5z" /></svg>
                  </div>
                  <h4 className="font-medium text-slate-900 text-sm mb-0.5">{m.name || 'Material'}</h4>
                  {m.brand && <p className="text-xs text-gray-500">{m.brand}</p>}
                  {(m.unitPricePaise ?? m.pricePerUnitPaise) != null && (
                    <p className="text-sm font-semibold text-orange-500 mt-1">{formatPaise(m.unitPricePaise ?? m.pricePerUnitPaise)}/{m.unit || 'sqft'}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
