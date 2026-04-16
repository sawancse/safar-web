'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import CityAutocomplete from '@/components/CityAutocomplete';
import LocalityAutocomplete from '@/components/LocalityAutocomplete';
import MapLocationPicker from '@/components/MapLocationPicker';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry', 'Jammu and Kashmir', 'Ladakh',
  'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep',
];

const ALL_AMENITIES = [
  'Swimming Pool', 'Gym', 'Club House', 'Children\'s Play Area', 'Landscaped Gardens',
  'Jogging Track', 'Indoor Games', 'Party Hall', 'Yoga Room', 'Amphitheatre',
  'Sports Court', 'Power Backup', 'Rainwater Harvesting', 'EV Charging', 'Smart Home',
  'Concierge', 'Co-working Space', 'Library', 'Pet Park', 'Infinity Pool',
  'SPA', 'Multipurpose Hall', 'Mini Theatre', 'Creche', 'Visitor Parking',
  'CCTV', 'Intercom', 'Fire Safety', 'Vastu', 'Senior Citizen Area',
];

const PROJECT_STATUSES = [
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'UNDER_CONSTRUCTION', label: 'Under Construction' },
  { value: 'READY_TO_MOVE', label: 'Ready to Move' },
];

const FURNISHING_OPTIONS = [
  { value: 'UNFURNISHED', label: 'Unfurnished' },
  { value: 'SEMI_FURNISHED', label: 'Semi-Furnished' },
  { value: 'FURNISHED', label: 'Fully Furnished' },
];

const STEP_LABELS = [
  'Builder Info',
  'Project Info',
  'Location',
  'Unit Types',
  'Amenities & Features',
  'Media & Review',
];

interface UnitTypeForm {
  id: string;
  name: string;
  bhk: string;
  superBuiltUpAreaSqft: string;
  carpetAreaSqft: string;
  basePricePaise: string;
  floorRisePaise: string;
  facingPremiumPaise: string;
  totalUnits: string;
  bathrooms: string;
  balconies: string;
  furnishing: string;
  floorPlanFile: File | null;
  floorPlanPreview: string;
}

interface PaymentPlan {
  milestone: string;
  percentage: string;
  description: string;
}

function createEmptyUnit(): UnitTypeForm {
  return {
    id: crypto.randomUUID(),
    name: '',
    bhk: '2',
    superBuiltUpAreaSqft: '',
    carpetAreaSqft: '',
    basePricePaise: '',
    floorRisePaise: '',
    facingPremiumPaise: '',
    totalUnits: '',
    bathrooms: '2',
    balconies: '1',
    furnishing: 'UNFURNISHED',
    floorPlanFile: null,
    floorPlanPreview: '',
  };
}

export default function BuilderNewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEdit = !!editId;
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  /* Step 0: Builder Info */
  const [builderName, setBuilderName] = useState('');
  const [builderLogoFile, setBuilderLogoFile] = useState<File | null>(null);
  const [builderLogoPreview, setBuilderLogoPreview] = useState('');
  const [reraId, setReraId] = useState('');

  /* Step 1: Project Info */
  const [projectName, setProjectName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [projectStatus, setProjectStatus] = useState('UNDER_CONSTRUCTION');
  const [launchDate, setLaunchDate] = useState('');
  const [possessionDate, setPossessionDate] = useState('');
  const [totalTowers, setTotalTowers] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [landAreaAcres, setLandAreaAcres] = useState('');

  /* Step 2: Location */
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [locality, setLocality] = useState('');
  const [pincode, setPincode] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  /* Step 3: Unit Types */
  const [unitTypes, setUnitTypes] = useState<UnitTypeForm[]>([createEmptyUnit()]);
  const [deletedUnitTypeIds, setDeletedUnitTypeIds] = useState<string[]>([]);
  const [existingUnitTypeIds, setExistingUnitTypeIds] = useState<Set<string>>(new Set());

  /* Step 4: Amenities & Features */
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [bankApprovals, setBankApprovals] = useState<string[]>([]);
  const [bankInput, setBankInput] = useState('');
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([
    { milestone: 'On Booking', percentage: '10', description: 'Booking amount' },
  ]);

  /* Step 5: Media */
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [masterPlanFile, setMasterPlanFile] = useState<File | null>(null);
  const [masterPlanPreview, setMasterPlanPreview] = useState('');
  const [brochureUrl, setBrochureUrl] = useState('');
  const [walkthroughUrl, setWalkthroughUrl] = useState('');

  // Load existing project data in edit mode
  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    api.getBuilderProject(editId).then((p: any) => {
      setBuilderName(p.builderName || '');
      setBuilderLogoPreview(p.builderLogoUrl || '');
      setReraId(p.reraId || '');
      setProjectName(p.projectName || '');
      setTagline(p.tagline || '');
      setDescription(p.description || '');
      setProjectStatus(p.projectStatus || 'UNDER_CONSTRUCTION');
      setLaunchDate(p.launchDate || '');
      setPossessionDate(p.possessionDate || '');
      setTotalTowers(p.totalTowers?.toString() || '');
      setTotalFloors(p.totalFloors?.toString() || '');
      setLandAreaAcres(p.landAreaAcres?.toString() || '');
      setCity(p.city || '');
      setState(p.state || '');
      setLocality(p.locality || '');
      setPincode(p.pincode || '');
      setAddress(p.address || '');
      setLatitude(p.latitude?.toString() || '');
      setLongitude(p.longitude?.toString() || '');
      setSelectedAmenities(p.amenities || []);
      setBankApprovals(p.bankApprovals || []);
      if (p.paymentPlansJson) {
        try { setPaymentPlans(JSON.parse(p.paymentPlansJson)); } catch {}
      }
      setBrochureUrl(p.brochureUrl || '');
      setWalkthroughUrl(p.walkthroughUrl || p.walkthroughVideoUrl || '');
      setMasterPlanPreview(p.masterPlanUrl || '');
      setPhotoPreviews(p.photos || p.photoUrls || []);
      if (p.unitTypes?.length) {
        const serverIds = new Set<string>(p.unitTypes.map((u: any) => u.id).filter(Boolean));
        setExistingUnitTypeIds(serverIds);
        setUnitTypes(p.unitTypes.map((u: any) => ({
          id: u.id || crypto.randomUUID(),
          name: u.name || '',
          bhk: u.bhk?.toString() || '2',
          superBuiltUpAreaSqft: u.superBuiltUpAreaSqft?.toString() || '',
          carpetAreaSqft: u.carpetAreaSqft?.toString() || '',
          basePricePaise: u.basePricePaise ? (u.basePricePaise / 100).toString() : '',
          floorRisePaise: u.floorRisePaise ? (u.floorRisePaise / 100).toString() : '',
          facingPremiumPaise: u.facingPremiumPaise ? (u.facingPremiumPaise / 100).toString() : '',
          totalUnits: u.totalUnits?.toString() || '',
          bathrooms: u.bathrooms?.toString() || '2',
          balconies: u.balconies?.toString() || '1',
          furnishing: u.furnishing || 'UNFURNISHED',
          floorPlanFile: null,
          floorPlanPreview: u.floorPlanUrl || '',
        })));
      }
    }).catch(() => {
      alert('Failed to load project');
      router.push('/dashboard?tab=builder');
    }).finally(() => setLoading(false));
  }, [editId]);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setBuilderLogoFile(file);
      setBuilderLogoPreview(URL.createObjectURL(file));
    }
  }

  function handlePhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setPhotoFiles(prev => [...prev, ...files]);
    setPhotoPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  }

  function removePhoto(idx: number) {
    setPhotoFiles(prev => prev.filter((_, i) => i !== idx));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
  }

  function handleMasterPlanChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setMasterPlanFile(file);
      setMasterPlanPreview(URL.createObjectURL(file));
    }
  }

  function toggleAmenity(amenity: string) {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  }

  function addBank() {
    const trimmed = bankInput.trim();
    if (trimmed && !bankApprovals.includes(trimmed)) {
      setBankApprovals(prev => [...prev, trimmed]);
      setBankInput('');
    }
  }

  function removeBank(bank: string) {
    setBankApprovals(prev => prev.filter(b => b !== bank));
  }

  function addPaymentPlan() {
    setPaymentPlans(prev => [...prev, { milestone: '', percentage: '', description: '' }]);
  }

  function updatePaymentPlan(idx: number, field: keyof PaymentPlan, value: string) {
    setPaymentPlans(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  }

  function removePaymentPlan(idx: number) {
    setPaymentPlans(prev => prev.filter((_, i) => i !== idx));
  }

  function addUnitType() {
    setUnitTypes(prev => [...prev, createEmptyUnit()]);
  }

  function removeUnitType(id: string) {
    if (unitTypes.length <= 1) return;
    // Track server-side unit types that need deletion
    if (existingUnitTypeIds.has(id)) {
      setDeletedUnitTypeIds(prev => [...prev, id]);
    }
    setUnitTypes(prev => prev.filter(u => u.id !== id));
  }

  function updateUnit(id: string, field: keyof UnitTypeForm, value: any) {
    setUnitTypes(prev => prev.map(u => u.id === id ? { ...u, [field]: value } : u));
  }

  function handleUnitFloorPlan(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      updateUnit(id, 'floorPlanFile', file);
      updateUnit(id, 'floorPlanPreview', URL.createObjectURL(file));
    }
  }

  function canProceed(): boolean {
    switch (step) {
      case 0: return builderName.trim().length > 0;
      case 1: return projectName.trim().length > 0 && !!projectStatus;
      case 2: return city.trim().length > 0;
      case 3: return unitTypes.every(u => u.name.trim() && u.superBuiltUpAreaSqft && u.basePricePaise && u.totalUnits);
      case 4: return true;
      case 5: return true;
      default: return true;
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        alert('Please sign in to create a project.');
        router.push('/auth');
        return;
      }

      // Upload files to S3 before building project data
      let uploadedLogoUrl = builderLogoPreview?.startsWith('blob:') ? undefined : builderLogoPreview;
      let uploadedMasterPlanUrl = masterPlanPreview?.startsWith('blob:') ? undefined : masterPlanPreview;
      const uploadedPhotoUrls: string[] = [];

      if (builderLogoFile) {
        try {
          uploadedLogoUrl = await api.uploadGenericFile(builderLogoFile, 'builder-logos', token);
        } catch (e) { console.warn('Logo upload failed, continuing without logo'); }
      }

      if (masterPlanFile) {
        try {
          uploadedMasterPlanUrl = await api.uploadGenericFile(masterPlanFile, 'builder-masterplans', token);
        } catch (e) { console.warn('Master plan upload failed'); }
      }

      for (const file of photoFiles) {
        try {
          const url = await api.uploadGenericFile(file, 'builder-photos', token);
          uploadedPhotoUrls.push(url);
        } catch (e) { console.warn('Photo upload failed for', file.name); }
      }
      // Keep any existing non-blob URLs (from edit mode)
      for (const url of photoPreviews) {
        if (!url.startsWith('blob:') && !uploadedPhotoUrls.includes(url)) {
          uploadedPhotoUrls.push(url);
        }
      }

      // Build the project data
      const projectData: any = {
        builderName,
        builderLogoUrl: uploadedLogoUrl || undefined,
        reraId: reraId || undefined,
        projectName,
        tagline: tagline || undefined,
        description: description || undefined,
        projectStatus,
        launchDate: launchDate || undefined,
        possessionDate: possessionDate || undefined,
        totalTowers: totalTowers ? Number(totalTowers) : undefined,
        totalFloors: totalFloors ? Number(totalFloors) : undefined,
        landAreaAcres: landAreaAcres ? Number(landAreaAcres) : undefined,
        city,
        state: state || undefined,
        locality: locality || undefined,
        pincode: pincode || undefined,
        address: address || undefined,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
        bankApprovals: bankApprovals.length > 0 ? bankApprovals : undefined,
        paymentPlansJson: paymentPlans.length > 0 ? JSON.stringify(paymentPlans) : undefined,
        brochureUrl: brochureUrl || undefined,
        walkthroughUrl: walkthroughUrl || undefined,
        photos: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : undefined,
        masterPlanUrl: uploadedMasterPlanUrl || undefined,
      };

      const result = isEdit
        ? await api.updateBuilderProject(editId!, projectData, token)
        : await api.createBuilderProject(projectData, token);
      const projectId = result.id || editId;

      const freshToken = localStorage.getItem('access_token') || token;

      // Delete removed unit types (edit mode)
      if (isEdit) {
        for (const delId of deletedUnitTypeIds) {
          try { await api.deleteUnitType(delId, freshToken); } catch (e) { console.warn('Failed to delete unit type:', delId); }
        }
      }

      // Add only NEW unit types (skip existing server-side ones in edit mode)
      for (const unit of unitTypes) {
        if (!unit.name.trim()) continue;
        // Skip existing unit types that haven't changed
        if (isEdit && existingUnitTypeIds.has(unit.id)) continue;

        const unitData: any = {
          name: unit.name,
          bhk: Number(unit.bhk),
          superBuiltUpAreaSqft: Number(unit.superBuiltUpAreaSqft),
          carpetAreaSqft: unit.carpetAreaSqft ? Number(unit.carpetAreaSqft) : undefined,
          basePricePaise: Math.round(Number(unit.basePricePaise) * 100),
          floorRisePaise: unit.floorRisePaise ? Math.round(Number(unit.floorRisePaise) * 100) : undefined,
          facingPremiumPaise: unit.facingPremiumPaise ? Math.round(Number(unit.facingPremiumPaise) * 100) : undefined,
          totalUnits: Number(unit.totalUnits),
          bathrooms: unit.bathrooms ? Number(unit.bathrooms) : undefined,
          balconies: unit.balconies ? Number(unit.balconies) : undefined,
          furnishing: unit.furnishing || undefined,
          floorPlanUrl: unit.floorPlanPreview || undefined,
        };
        await api.addUnitType(projectId, unitData, freshToken);
      }

      router.push(`/projects/${projectId}`);
    } catch (err: any) {
      alert(err?.message || 'Failed to create project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading project...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Project' : 'Create New Project'}</h1>
            <p className="text-sm text-gray-500">{STEP_LABELS[step]} (Step {step + 1} of {STEP_LABELS.length})</p>
          </div>
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">Cancel</button>
        </div>
        {/* Progress */}
        <div className="max-w-4xl mx-auto px-4 pb-4">
          <div className="flex gap-1">
            {STEP_LABELS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ── Step 0: Builder Info ── */}
        {step === 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Builder Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Builder / Developer Name *</label>
              <input
                type="text"
                value={builderName}
                onChange={e => setBuilderName(e.target.value)}
                placeholder="e.g. Prestige Group, Lodha Developers"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Builder Logo</label>
              <div className="flex items-center gap-4">
                {builderLogoPreview ? (
                  <img src={builderLogoPreview} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div>
                  <button
                    type="button"
                    onClick={() => document.getElementById('builder-logo-input')?.click()}
                    className="text-sm text-orange-500 hover:text-orange-600 font-medium cursor-pointer"
                  >
                    {builderLogoPreview ? 'Change Logo' : 'Upload Logo'}
                  </button>
                  <input id="builder-logo-input" type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RERA Registration ID</label>
              <input
                type="text"
                value={reraId}
                onChange={e => setReraId(e.target.value)}
                placeholder="e.g. P52100012345"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <p className="text-xs text-gray-400 mt-1">Enter the RERA registration number for this project</p>
            </div>
          </div>
        )}

        {/* ── Step 1: Project Info ── */}
        {step === 1 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Project Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
              <input
                type="text"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="e.g. Prestige Lakeside Habitat"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                placeholder="e.g. Where Luxury Meets Nature"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe your project in detail..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Status *</label>
                <select
                  value={projectStatus}
                  onChange={e => setProjectStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {PROJECT_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Launch Date</label>
                <input
                  type="date"
                  value={launchDate}
                  onChange={e => setLaunchDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Possession Date</label>
                <input
                  type="date"
                  value={possessionDate}
                  onChange={e => setPossessionDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Towers</label>
                <input
                  type="number"
                  min="1"
                  value={totalTowers}
                  onChange={e => setTotalTowers(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Floors per Tower</label>
                <input
                  type="number"
                  min="1"
                  value={totalFloors}
                  onChange={e => setTotalFloors(e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Land Area (Acres)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={landAreaAcres}
                  onChange={e => setLandAreaAcres(e.target.value)}
                  placeholder="e.g. 12.5"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Location ── */}
        {step === 2 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Project Location</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <CityAutocomplete
                  value={city}
                  onChange={setCity}
                  label="City *"
                  placeholder="e.g. Hyderabad"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <LocalityAutocomplete
                  city={city}
                  value={locality}
                  onChange={setLocality}
                  label="Locality / Area"
                  placeholder="e.g. Whitefield"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={e => setPincode(e.target.value)}
                  placeholder="e.g. 500081"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Complete project address..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pin Location on Map</label>
              <p className="text-xs text-gray-500 mb-2">
                Search, click the map, or drag the pin to set the exact project location.
              </p>
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <MapLocationPicker
                  lat={latitude ? parseFloat(latitude) : 0}
                  lng={longitude ? parseFloat(longitude) : 0}
                  className="h-72"
                  onLocationChange={(loc) => {
                    setLatitude(String(loc.lat));
                    setLongitude(String(loc.lng));
                    if (loc.city && !city) setCity(loc.city);
                    if (loc.state && !state) setState(loc.state);
                    if (loc.pincode && !pincode) setPincode(loc.pincode);
                    if (loc.address && !address) setAddress(loc.address);
                  }}
                />
              </div>
              {latitude && longitude && (
                <p className="text-xs text-gray-400 mt-1">
                  Coordinates: {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Unit Types ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Unit Types</h2>
              <button
                onClick={addUnitType}
                className="text-sm font-medium text-orange-500 hover:text-orange-600 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Unit Type
              </button>
            </div>

            {unitTypes.map((unit, idx) => (
              <div key={unit.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Unit Type #{idx + 1}</h3>
                  {unitTypes.length > 1 && (
                    <button onClick={() => removeUnitType(unit.id)} className="text-red-400 hover:text-red-600 text-sm">Remove</button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Unit Name *</label>
                    <input
                      type="text"
                      value={unit.name}
                      onChange={e => updateUnit(unit.id, 'name', e.target.value)}
                      placeholder="e.g. Type A - 2 BHK"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">BHK *</label>
                    <select
                      value={unit.bhk}
                      onChange={e => updateUnit(unit.id, 'bhk', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      {['1', '2', '3', '4', '5', '6'].map(b => (
                        <option key={b} value={b}>{b} BHK</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Super Built-Up Area (sqft) *</label>
                    <input
                      type="number"
                      value={unit.superBuiltUpAreaSqft}
                      onChange={e => updateUnit(unit.id, 'superBuiltUpAreaSqft', e.target.value)}
                      placeholder="e.g. 1250"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Carpet Area (sqft)</label>
                    <input
                      type="number"
                      value={unit.carpetAreaSqft}
                      onChange={e => updateUnit(unit.id, 'carpetAreaSqft', e.target.value)}
                      placeholder="e.g. 950"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Base Price (₹) *</label>
                    <input
                      type="number"
                      value={unit.basePricePaise}
                      onChange={e => updateUnit(unit.id, 'basePricePaise', e.target.value)}
                      placeholder="e.g. 9000000 (= ₹90 Lakh)"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Total Units *</label>
                    <input
                      type="number"
                      value={unit.totalUnits}
                      onChange={e => updateUnit(unit.id, 'totalUnits', e.target.value)}
                      placeholder="e.g. 120"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Floor Rise (₹/floor)</label>
                    <input
                      type="number"
                      value={unit.floorRisePaise}
                      onChange={e => updateUnit(unit.id, 'floorRisePaise', e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Facing Premium (₹)</label>
                    <input
                      type="number"
                      value={unit.facingPremiumPaise}
                      onChange={e => updateUnit(unit.id, 'facingPremiumPaise', e.target.value)}
                      placeholder="e.g. 100000"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Furnishing</label>
                    <select
                      value={unit.furnishing}
                      onChange={e => updateUnit(unit.id, 'furnishing', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      {FURNISHING_OPTIONS.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Bathrooms</label>
                    <input
                      type="number"
                      min="1"
                      value={unit.bathrooms}
                      onChange={e => updateUnit(unit.id, 'bathrooms', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Balconies</label>
                    <input
                      type="number"
                      min="0"
                      value={unit.balconies}
                      onChange={e => updateUnit(unit.id, 'balconies', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Floor Plan</label>
                    <label className="cursor-pointer inline-flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium border border-orange-200 rounded-xl px-3 py-2 hover:bg-orange-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {unit.floorPlanFile ? 'Change' : 'Upload'}
                      <input type="file" accept="image/*" onChange={e => handleUnitFloorPlan(unit.id, e)} className="hidden" />
                    </label>
                    {unit.floorPlanPreview && (
                      <img src={unit.floorPlanPreview} alt="Floor plan" className="mt-2 h-16 rounded-lg object-contain" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Step 4: Amenities & Features ── */}
        {step === 4 && (
          <div className="space-y-6">
            {/* Amenities */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {ALL_AMENITIES.map(amenity => (
                  <button
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      selectedAmenities.includes(amenity)
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">{selectedAmenities.length} amenities selected</p>
            </div>

            {/* Bank Approvals */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bank Approvals</h2>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={bankInput}
                  onChange={e => setBankInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addBank()}
                  placeholder="e.g. SBI, HDFC, ICICI"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <button
                  onClick={addBank}
                  className="px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  Add
                </button>
              </div>
              {bankApprovals.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {bankApprovals.map(bank => (
                    <span key={bank} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                      {bank}
                      <button onClick={() => removeBank(bank)} className="text-blue-400 hover:text-blue-600">&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Plans */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Payment Plan</h2>
                <button onClick={addPaymentPlan} className="text-sm text-orange-500 hover:text-orange-600 font-medium">+ Add Milestone</button>
              </div>
              <div className="space-y-3">
                {paymentPlans.map((plan, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={plan.milestone}
                        onChange={e => updatePaymentPlan(idx, 'milestone', e.target.value)}
                        placeholder="Milestone name"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                    <div className="w-24">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={plan.percentage}
                          onChange={e => updatePaymentPlan(idx, 'percentage', e.target.value)}
                          placeholder="%"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 pr-7"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={plan.description}
                        onChange={e => updatePaymentPlan(idx, 'description', e.target.value)}
                        placeholder="Description"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                    <button
                      onClick={() => removePaymentPlan(idx)}
                      className="text-red-400 hover:text-red-600 mt-2 text-sm"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Total: {paymentPlans.reduce((sum, p) => sum + (Number(p.percentage) || 0), 0)}% of 100%
              </p>
            </div>
          </div>
        )}

        {/* ── Step 5: Media & Review ── */}
        {step === 5 && (
          <div className="space-y-6">
            {/* Photos */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Photos</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                {photoPreviews.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-24 rounded-lg object-cover" />
                    <button
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <label className="w-full h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-orange-400 transition-colors">
                  <div className="text-center">
                    <svg className="w-6 h-6 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs text-gray-400">Add</span>
                  </div>
                  <input type="file" accept="image/*" multiple onChange={handlePhotosChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* Master Plan */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Master Plan</h2>
              <div className="flex items-center gap-4">
                {masterPlanPreview ? (
                  <img src={masterPlanPreview} alt="Master Plan" className="h-32 rounded-xl object-contain border border-gray-200" />
                ) : (
                  <div className="h-32 w-48 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                    <span className="text-xs">No master plan</span>
                  </div>
                )}
                <label className="cursor-pointer text-sm text-orange-500 hover:text-orange-600 font-medium">
                  {masterPlanFile ? 'Change Master Plan' : 'Upload Master Plan'}
                  <input type="file" accept="image/*" onChange={handleMasterPlanChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* URLs */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Links</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brochure URL</label>
                <input
                  type="url"
                  value={brochureUrl}
                  onChange={e => setBrochureUrl(e.target.value)}
                  placeholder="https://example.com/brochure.pdf"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Walkthrough Video URL</label>
                <input
                  type="url"
                  value={walkthroughUrl}
                  onChange={e => setWalkthroughUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Review Summary</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Builder:</span> <span className="font-medium">{builderName || '-'}</span></div>
                <div><span className="text-gray-500">Project:</span> <span className="font-medium">{projectName || '-'}</span></div>
                <div><span className="text-gray-500">City:</span> <span className="font-medium">{city || '-'}</span></div>
                <div><span className="text-gray-500">Status:</span> <span className="font-medium">{projectStatus?.replace(/_/g, ' ') || '-'}</span></div>
                <div><span className="text-gray-500">Unit Types:</span> <span className="font-medium">{unitTypes.filter(u => u.name.trim()).length}</span></div>
                <div><span className="text-gray-500">Amenities:</span> <span className="font-medium">{selectedAmenities.length}</span></div>
                <div><span className="text-gray-500">Photos:</span> <span className="font-medium">{photoPreviews.length}</span></div>
                <div><span className="text-gray-500">RERA:</span> <span className="font-medium">{reraId || 'Not provided'}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation Buttons ── */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setStep(prev => Math.max(0, prev - 1))}
            disabled={step === 0}
            className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>

          {step < STEP_LABELS.length - 1 ? (
            <button
              onClick={() => setStep(prev => prev + 1)}
              disabled={!canProceed()}
              className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isEdit ? 'Updating...' : 'Publishing...'}
                </>
              ) : (
                isEdit ? 'Update Project' : 'Publish Project'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
