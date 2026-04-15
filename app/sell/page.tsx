'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import LocalityAutocomplete from '@/components/LocalityAutocomplete';
import CityAutocomplete from '@/components/CityAutocomplete';
import MapLocationPicker from '@/components/MapLocationPicker';

/* ── Constants ─────────────────────────────────────────────── */

const STEP_LABELS = [
  'Property Type',
  'Location',
  'Details',
  'Area & Pricing',
  'Construction',
  'Features',
  'Photos',
  'Review',
];

const PROPERTY_TYPES = [
  // Residential
  { value: 'APARTMENT', label: 'Apartment', icon: '🏢' },
  { value: 'INDEPENDENT_HOUSE', label: 'Independent House', icon: '🏠' },
  { value: 'VILLA', label: 'Villa', icon: '🏡' },
  { value: 'PENTHOUSE', label: 'Penthouse', icon: '🌆' },
  { value: 'STUDIO', label: 'Studio', icon: '🛋️' },
  { value: 'BUILDER_FLOOR', label: 'Builder Floor', icon: '🏗️' },
  { value: 'FARM_HOUSE', label: 'Farm House', icon: '🌾' },
  { value: 'ROW_HOUSE', label: 'Row House', icon: '🏘️' },
  // Land & Plot
  { value: 'PLOT', label: 'Residential Plot', icon: '📐' },
  { value: 'RESIDENTIAL_PLOT', label: 'Plot / Land', icon: '🗺️' },
  { value: 'AGRICULTURAL_LAND', label: 'Agricultural Land', icon: '🌾' },
  { value: 'FARMING_LAND', label: 'Farming Land', icon: '🚜' },
  { value: 'COMMERCIAL_LAND', label: 'Commercial Land', icon: '🏗️' },
  { value: 'INDUSTRIAL_LAND', label: 'Industrial Land', icon: '🏭' },
  // Commercial
  { value: 'COMMERCIAL_OFFICE', label: 'Commercial Office', icon: '💼' },
  { value: 'COMMERCIAL_SHOP', label: 'Shop', icon: '🏪' },
  { value: 'COMMERCIAL_SHOWROOM', label: 'Showroom', icon: '🚗' },
  { value: 'COMMERCIAL_WAREHOUSE', label: 'Warehouse', icon: '📦' },
  { value: 'INDUSTRIAL', label: 'Industrial', icon: '🏭' },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry', 'Jammu and Kashmir', 'Ladakh',
  'Andaman and Nicobar', 'Dadra and Nagar Haveli', 'Lakshadweep',
];

const INDIAN_CITIES: Record<string, string[]> = {
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane', 'Navi Mumbai'],
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar'],
  'Delhi': ['New Delhi', 'Dwarka', 'Rohini', 'Saket', 'Janakpuri'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
  'West Bengal': ['Kolkata', 'Howrah', 'Siliguri', 'Durgapur', 'Asansol'],
  'Uttar Pradesh': ['Lucknow', 'Noida', 'Ghaziabad', 'Agra', 'Varanasi', 'Kanpur', 'Greater Noida'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain'],
  'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'],
  'Haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Karnal'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Tirupati'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur'],
  'Himachal Pradesh': ['Shimla', 'Manali', 'Dharamshala', 'Solan', 'Kullu'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Rishikesh', 'Nainital', 'Mussoorie'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon'],
  'Sikkim': ['Gangtok', 'Namchi', 'Pelling'],
};

const FACING_OPTIONS = [
  { value: 'NORTH', label: 'North' },
  { value: 'SOUTH', label: 'South' },
  { value: 'EAST', label: 'East' },
  { value: 'WEST', label: 'West' },
  { value: 'NORTH_EAST', label: 'North-East' },
  { value: 'NORTH_WEST', label: 'North-West' },
  { value: 'SOUTH_EAST', label: 'South-East' },
  { value: 'SOUTH_WEST', label: 'South-West' },
];

const AMENITIES = [
  'Gym', 'Swimming Pool', 'Club House', "Children's Play Area", 'Park', 'Lift',
  'Security', 'Power Backup', 'Rainwater Harvesting', 'EV Charging', 'Jogging Track',
  'Indoor Games', 'Party Hall', 'Yoga Room', 'Intercom',
];

const OVERLOOKING_OPTIONS = ['Garden', 'Pool', 'Main Road', 'Park', 'City View'];

/* ── State Autocomplete (inline) ─────────────────────────── */
function StateAutocomplete({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = query
    ? INDIAN_STATES.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    : INDIAN_STATES;

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange(''); }}
        onFocus={() => setOpen(true)}
        placeholder="Type to search state..."
        className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(s => (
            <button key={s} type="button"
              onClick={() => { onChange(s); setQuery(s); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-orange-50 transition">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Wizard State ─────────────────────────────────────────── */

interface SaleWizardData {
  // Step 0
  propertyType: string;
  // Step 1
  state: string;
  city: string;
  locality: string;
  pincode: string;
  address: string;
  lat: string;
  lng: string;
  // Step 2
  bhk: number;
  bathrooms: number;
  balconies: number;
  floorNumber: number;
  totalFloors: number;
  facing: string;
  ageYears: number;
  furnishing: string;
  coveredParking: number;
  openParking: number;
  // Step 3
  carpetAreaSqft: number;
  builtUpAreaSqft: number;
  superBuiltUpAreaSqft: number;
  plotAreaSqft: number;
  askingPriceRupees: number;
  negotiable: boolean;
  maintenancePerMonth: number;
  transactionType: string;
  // Step 4
  possessionStatus: string;
  possessionDate: string;
  reraId: string;
  builderName: string;
  projectName: string;
  // Step 5
  amenities: string[];
  waterSupply: string;
  powerBackup: string;
  gatedCommunity: boolean;
  cornerProperty: boolean;
  vastuCompliant: boolean;
  petAllowed: boolean;
  overlooking: string[];
  // Land-specific fields
  totalAcres: string;
  plotLengthFt: string;
  plotBreadthFt: string;
  boundaryWall: boolean;
  cornerPlot: boolean;
  roadAccess: string;
  roadWidthFt: string;
  zoneType: string;
  irrigationType: string;
  soilType: string;
  waterSource: string;
  borewellCount: number;
  currentCrop: string;
  organicCertified: boolean;
  ownershipType: string;
  titleClear: boolean;
  // Step 6
  photos: File[];
  floorPlan: File | null;
  videoTourUrl: string;
  brochureUrl: string;
}

const INITIAL_DATA: SaleWizardData = {
  propertyType: '',
  state: '', city: '', locality: '', pincode: '', address: '', lat: '', lng: '',
  bhk: 2, bathrooms: 2, balconies: 1, floorNumber: 0, totalFloors: 1,
  facing: '', ageYears: 0, furnishing: 'SEMI_FURNISHED', coveredParking: 0, openParking: 0,
  carpetAreaSqft: 0, builtUpAreaSqft: 0, superBuiltUpAreaSqft: 0, plotAreaSqft: 0,
  askingPriceRupees: 0, negotiable: false, maintenancePerMonth: 0, transactionType: 'RESALE',
  possessionStatus: 'READY_TO_MOVE', possessionDate: '', reraId: '', builderName: '', projectName: '',
  amenities: [], waterSupply: 'CORPORATION', powerBackup: 'FULL', gatedCommunity: false,
  cornerProperty: false, vastuCompliant: false, petAllowed: false, overlooking: [],
  totalAcres: '', plotLengthFt: '', plotBreadthFt: '', boundaryWall: false, cornerPlot: false,
  roadAccess: '', roadWidthFt: '', zoneType: '', irrigationType: '', soilType: '',
  waterSource: '', borewellCount: 0, currentCrop: '', organicCertified: false,
  ownershipType: 'FREEHOLD', titleClear: true,
  photos: [], floorPlan: null, videoTourUrl: '', brochureUrl: '',
};

/* ── Progress Bar ─────────────────────────────────────────── */

function ProgressBar({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto">
      {labels.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={i} className="flex-1 flex items-center min-w-[80px]">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                done ? 'bg-green-500 text-white' : active ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1 text-center whitespace-nowrap ${active ? 'text-orange-600 font-semibold' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`h-0.5 flex-1 -mt-4 ${done ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Wizard ──────────────────────────────────────────── */

function SellPropertyWizardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const [step, setStep] = useState(0);
  const [data, setData] = useState<SaleWizardData>(INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [floorPlanPreview, setFloorPlanPreview] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [editLoading, setEditLoading] = useState(!!editId);

  useEffect(() => {
    const t = localStorage.getItem('access_token') ?? '';
    if (!t) { router.push('/auth?redirect=/sell'); return; }
    setToken(t);

    if (editId) {
      api.getSaleProperty(editId).then((prop: any) => {
        setData({
          propertyType: prop.salePropertyType || prop.propertyType || '',
          state: prop.state || '', city: prop.city || '', locality: prop.locality || '',
          pincode: prop.pincode || '', address: prop.addressLine1 || '', lat: prop.lat?.toString() || '', lng: prop.lng?.toString() || '',
          bhk: prop.bedrooms || 0, bathrooms: prop.bathrooms || 0, balconies: prop.balconies || 0,
          floorNumber: prop.floorNumber || 0, totalFloors: prop.totalFloors || 0,
          facing: prop.facingDirection || '', ageYears: prop.propertyAge || 0,
          furnishing: prop.furnishing || 'SEMI_FURNISHED',
          coveredParking: prop.coveredParking || 0, openParking: prop.openParking || 0,
          carpetAreaSqft: prop.carpetAreaSqft || 0, builtUpAreaSqft: prop.builtUpAreaSqft || 0,
          superBuiltUpAreaSqft: prop.superBuiltUpAreaSqft || 0, plotAreaSqft: prop.plotAreaSqft || 0,
          askingPriceRupees: (prop.askingPricePaise || 0) / 100, negotiable: prop.negotiable || false,
          maintenancePerMonth: (prop.maintenancePerMonthPaise || 0) / 100,
          transactionType: prop.transactionType || 'RESALE',
          possessionStatus: prop.possessionStatus || 'READY_TO_MOVE',
          possessionDate: prop.possessionDate || '', reraId: prop.reraId || '',
          builderName: prop.builderName || '', projectName: prop.projectName || '',
          amenities: prop.amenities || [], waterSupply: prop.waterSupply || 'CORPORATION',
          powerBackup: prop.powerBackup || 'FULL', gatedCommunity: prop.gatedCommunity || false,
          cornerProperty: prop.cornerProperty || false, vastuCompliant: prop.vastuCompliant || false,
          petAllowed: prop.petAllowed || false, overlooking: prop.overlooking || [],
          photos: [], floorPlan: null, videoTourUrl: prop.videoTourUrl || '', brochureUrl: prop.brochureUrl || '',
        });
        if (prop.photoUrls?.length) setPhotoPreviews(prop.photoUrls);
        if (prop.floorPlanUrl) setFloorPlanPreview(prop.floorPlanUrl);
        setEditLoading(false);
      }).catch(() => { setError('Failed to load property for editing'); setEditLoading(false); });
    }
  }, [router, editId]);

  function update(partial: Partial<SaleWizardData>) {
    setData(prev => ({ ...prev, ...partial }));
  }

  function toggleAmenity(key: string) {
    setData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(key)
        ? prev.amenities.filter(a => a !== key)
        : [...prev.amenities, key],
    }));
  }

  function toggleOverlooking(key: string) {
    setData(prev => ({
      ...prev,
      overlooking: prev.overlooking.includes(key)
        ? prev.overlooking.filter(o => o !== key)
        : [...prev.overlooking, key],
    }));
  }

  function handlePhotoFiles(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const newPreviews = newFiles.map(f => URL.createObjectURL(f));
    setData(prev => ({ ...prev, photos: [...prev.photos, ...newFiles] }));
    setPhotoPreviews(prev => [...prev, ...newPreviews]);
  }

  function removePhoto(index: number) {
    setData(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  }

  function handleFloorPlan(files: FileList | null) {
    if (!files || !files[0]) return;
    const file = files[0];
    update({ floorPlan: file });
    setFloorPlanPreview(URL.createObjectURL(file));
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handlePhotoFiles(e.dataTransfer.files);
  }, []);

  const pricePerSqft = data.askingPriceRupees && data.carpetAreaSqft
    ? Math.round(data.askingPriceRupees / data.carpetAreaSqft)
    : 0;

  // City autocomplete handles city selection now

  function getStepErrors(): string[] {
    const errors: string[] = [];
    switch (step) {
      case 0:
        if (!data.propertyType) errors.push('Select a property type');
        break;
      case 1:
        if (!data.state) errors.push('State is required');
        if (!data.city) errors.push('City is required');
        if (!data.pincode || data.pincode.length !== 6) errors.push('Valid 6-digit pincode is required');
        if (!data.address) errors.push('Full address is required');
        break;
      case 2: {
        const isLandType = ['PLOT', 'RESIDENTIAL_PLOT', 'AGRICULTURAL_LAND', 'FARMING_LAND', 'COMMERCIAL_LAND', 'INDUSTRIAL_LAND'].includes(data.propertyType);
        if (!isLandType) {
          if (data.bhk < 1) errors.push('Select number of bedrooms');
          if (data.bathrooms < 1) errors.push('Select number of bathrooms');
          if (data.totalFloors < 1) errors.push('Total floors is required');
        }
        break;
      }
      case 3: {
        const isLandType3 = ['PLOT', 'RESIDENTIAL_PLOT', 'AGRICULTURAL_LAND', 'FARMING_LAND', 'COMMERCIAL_LAND', 'INDUSTRIAL_LAND'].includes(data.propertyType);
        if (data.askingPriceRupees <= 0) errors.push('Asking price is required');
        if (isLandType3) {
          if (data.plotAreaSqft <= 0) errors.push('Plot area is required');
        } else {
          if (data.carpetAreaSqft <= 0 && data.builtUpAreaSqft <= 0) errors.push('Carpet area or built-up area is required');
        }
        if (!data.transactionType) errors.push('Transaction type is required');
        break;
      }
      case 4:
        if (!data.possessionStatus) errors.push('Possession status is required');
        if ((data.possessionStatus === 'UNDER_CONSTRUCTION' || data.possessionStatus === 'NEW_LAUNCH') && !data.possessionDate) {
          errors.push('Expected possession date is required');
        }
        break;
      case 5:
        break; // amenities are optional
      case 6:
        if (data.photos.length === 0 && !['PLOT', 'RESIDENTIAL_PLOT', 'AGRICULTURAL_LAND', 'FARMING_LAND', 'COMMERCIAL_LAND', 'INDUSTRIAL_LAND'].includes(data.propertyType)) errors.push('At least one photo is required');
        break;
    }
    return errors;
  }

  function canProceed(): boolean {
    return getStepErrors().length === 0;
  }

  async function handleSubmit() {
    // Validate all required fields before submit
    if (!data.propertyType) { setError('Property type is required. Go back to Step 1.'); return; }
    if (!data.city || !data.state || !data.pincode || !data.address) { setError('Location details are incomplete. Go back to Step 2.'); return; }
    if (data.askingPriceRupees <= 0) { setError('Asking price is required. Go back to Step 4.'); return; }
    if (!data.possessionStatus) { setError('Possession status is required. Go back to Step 5.'); return; }

    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      if (!token) { setError('Please login to list your property.'); setSubmitting(false); return; }

      // Upload photos via presigned URL flow
      const photoUrls: string[] = [];
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      for (const file of data.photos) {
        try {
          const ct = file.type || 'image/jpeg';
          // Step 1: Get presigned upload URL
          const presignRes = await fetch(
            `${apiBase}/api/v1/media/upload/generic-presign?folder=sale-properties&contentType=${encodeURIComponent(ct)}`,
            { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
          );
          if (!presignRes.ok) { console.warn('Presign failed:', presignRes.status); continue; }
          const { uploadUrl, publicUrl } = await presignRes.json();

          // Step 2: Upload file directly to S3 via presigned URL
          const s3Res = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': ct },
            body: file,
          });
          if (s3Res.ok && publicUrl) {
            photoUrls.push(publicUrl);
          } else {
            console.warn('S3 upload failed:', s3Res.status);
          }
        } catch (e) {
          console.warn('Photo upload failed:', e);
        }
      }

      const typeLabel = PROPERTY_TYPES.find(p => p.value === data.propertyType)?.label || data.propertyType || 'Property';
      const location = data.locality || data.city || data.state || 'India';
      const isLandSubmit = ['PLOT', 'RESIDENTIAL_PLOT', 'AGRICULTURAL_LAND', 'FARMING_LAND', 'COMMERCIAL_LAND', 'INDUSTRIAL_LAND'].includes(data.propertyType);
      const sizePrefix = isLandSubmit
        ? (data.totalAcres ? data.totalAcres + ' Acres ' : data.plotAreaSqft ? data.plotAreaSqft + ' sqft ' : '')
        : (data.bhk > 0 ? data.bhk + ' BHK ' : '');
      const title = `${sizePrefix}${typeLabel} for Sale in ${location}`.trim();

      const payload = {
        title,
        description: `${typeLabel} for sale in ${[data.locality, data.city, data.state].filter(Boolean).join(', ')}`,
        salePropertyType: data.propertyType,
        transactionType: data.transactionType || 'RESALE',
        sellerType: 'OWNER',
        state: data.state,
        city: data.city,
        locality: data.locality,
        pincode: data.pincode,
        addressLine1: data.address,
        lat: data.lat ? parseFloat(data.lat) : null,
        lng: data.lng ? parseFloat(data.lng) : null,
        bedrooms: data.bhk || null,
        bathrooms: data.bathrooms || null,
        balconies: data.balconies || null,
        floorNumber: data.floorNumber || null,
        totalFloors: data.totalFloors || null,
        facing: data.facing || null,
        propertyAgeYears: data.ageYears || null,
        furnishing: data.furnishing || null,
        parkingCovered: data.coveredParking || null,
        parkingOpen: data.openParking || null,
        carpetAreaSqft: data.carpetAreaSqft || null,
        builtUpAreaSqft: data.builtUpAreaSqft || null,
        superBuiltUpAreaSqft: data.superBuiltUpAreaSqft || null,
        plotAreaSqft: data.plotAreaSqft || null,
        askingPricePaise: data.askingPriceRupees * 100,
        priceNegotiable: data.negotiable,
        maintenancePaise: data.maintenancePerMonth ? data.maintenancePerMonth * 100 : null,
        possessionStatus: data.possessionStatus,
        possessionDate: data.possessionDate || null,
        reraId: data.reraId || null,
        builderName: data.builderName || null,
        projectName: data.projectName || null,
        amenities: data.amenities.length > 0 ? data.amenities : null,
        waterSupply: data.waterSupply || null,
        powerBackup: data.powerBackup || null,
        gatedCommunity: data.gatedCommunity,
        cornerProperty: data.cornerProperty,
        vastuCompliant: data.vastuCompliant,
        petAllowed: data.petAllowed,
        overlooking: data.overlooking.length > 0 ? data.overlooking : null,
        videoTourUrl: data.videoTourUrl || null,
        brochureUrl: data.brochureUrl || null,
        photos: photoUrls.length > 0 ? photoUrls : null,
        // Land-specific fields
        totalAcres: data.totalAcres ? parseFloat(data.totalAcres) : null,
        plotLengthFt: data.plotLengthFt ? parseFloat(data.plotLengthFt) : null,
        plotBreadthFt: data.plotBreadthFt ? parseFloat(data.plotBreadthFt) : null,
        boundaryWall: data.boundaryWall || null,
        cornerPlot: data.cornerPlot || null,
        roadAccess: data.roadAccess || null,
        roadWidthFt: data.roadWidthFt ? parseFloat(data.roadWidthFt) : null,
        zoneType: data.zoneType || null,
        irrigationType: data.irrigationType || null,
        soilType: data.soilType || null,
        waterSource: data.waterSource || null,
        borewellCount: data.borewellCount || null,
        currentCrop: data.currentCrop || null,
        organicCertified: data.organicCertified || null,
        ownershipType: data.ownershipType || null,
        titleClear: data.titleClear,
      };
      if (editId) {
        await api.updateSaleProperty(editId, payload, token);
      } else {
        await api.createSaleProperty(payload, token);
        // Status stays NEW — admin reviews and activates
      }
      router.push('/host?tab=sales');
    } catch (e: any) {
      setError(e.message || 'Failed to publish property. Please try again.');
    }
    setSubmitting(false);
  }

  function formatPrice(value: number): string {
    if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `${(value / 100000).toFixed(2)} L`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)} K`;
    return value.toLocaleString('en-IN');
  }

  /* ── Step Renderers ─────────────────────────────────────── */

  function renderStep0() {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-2">What type of property are you selling?</h2>
        <p className="text-gray-500 mb-6">Select the category that best describes your property.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {PROPERTY_TYPES.map(pt => (
            <button
              key={pt.value}
              onClick={() => update({ propertyType: pt.value })}
              className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                data.propertyType === pt.value
                  ? 'border-orange-500 bg-orange-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-orange-300'
              }`}
            >
              <div className="text-3xl mb-2">{pt.icon}</div>
              <div className="font-semibold text-gray-800 text-sm">{pt.label}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderStep1() {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-2">Where is your property located?</h2>
        <p className="text-gray-500 mb-6">Help buyers find your property with accurate location details.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <StateAutocomplete
              value={data.state}
              onChange={(v: string) => update({ state: v, city: '' })}
            />
          </div>
          <div>
            <CityAutocomplete
              value={data.city}
              onChange={(v: string) => update({ city: v })}
              label="City *"
              placeholder="Type to search city..."
              className="border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>
          <div>
            <LocalityAutocomplete
              city={data.city}
              value={data.locality}
              onChange={(v: string) => update({ locality: v })}
              label="Locality / Area"
              placeholder="Type to search locality..."
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
            <input
              type="text"
              value={data.pincode}
              onChange={e => update({ pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              placeholder="6-digit pincode"
              maxLength={6}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Address *</label>
            <textarea
              value={data.address}
              onChange={e => update({ address: e.target.value })}
              placeholder="House/Flat no, Street, Landmark"
              rows={2}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pin Location on Map</label>
            <p className="text-xs text-gray-500 mb-2">Search, click the map, or drag the pin to set the exact property location.</p>
            <div className="h-72 rounded-xl overflow-hidden border border-gray-200">
              <MapLocationPicker
                lat={data.lat ? parseFloat(data.lat) : 0}
                lng={data.lng ? parseFloat(data.lng) : 0}
                onLocationChange={(loc) => {
                  const updates: Record<string, string> = { lat: String(loc.lat), lng: String(loc.lng) };
                  if (loc.city && !data.city) updates.city = loc.city;
                  if (loc.state && !data.state) updates.state = loc.state;
                  if (loc.pincode && !data.pincode) updates.pincode = loc.pincode;
                  if (loc.address && !data.address) updates.address = loc.address;
                  update(updates);
                }}
              />
            </div>
            {data.lat && data.lng && (
              <p className="text-xs text-gray-400 mt-1">
                Coordinates: {parseFloat(data.lat).toFixed(6)}, {parseFloat(data.lng).toFixed(6)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderStep2() {
    const isPlot = ['PLOT', 'RESIDENTIAL_PLOT', 'AGRICULTURAL_LAND', 'FARMING_LAND', 'COMMERCIAL_LAND', 'INDUSTRIAL_LAND'].includes(data.propertyType);
    return (
      <div>
        <h2 className="text-2xl font-bold mb-2">Property Details</h2>
        <p className="text-gray-500 mb-6">Tell buyers about your property configuration.</p>

        {/* Land-specific fields */}
        {isPlot && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Acres</label>
                <input type="number" step="0.01" value={data.totalAcres} onChange={e => update({ totalAcres: e.target.value })} placeholder="e.g. 2.5" className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plot Length (ft)</label>
                <input type="number" value={data.plotLengthFt} onChange={e => update({ plotLengthFt: e.target.value })} placeholder="e.g. 60" className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plot Breadth (ft)</label>
                <input type="number" value={data.plotBreadthFt} onChange={e => update({ plotBreadthFt: e.target.value })} placeholder="e.g. 40" className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Road Width (ft)</label>
                <input type="number" value={data.roadWidthFt} onChange={e => update({ roadWidthFt: e.target.value })} placeholder="e.g. 30" className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Road Access</label>
                <select value={data.roadAccess} onChange={e => update({ roadAccess: e.target.value })} className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none">
                  <option value="">Select</option>
                  <option value="MAIN_ROAD">Main Road</option>
                  <option value="INTERNAL">Internal Road</option>
                  <option value="NO_ROAD">No Road</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone Type</label>
                <select value={data.zoneType} onChange={e => update({ zoneType: e.target.value })} className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none">
                  <option value="">Select</option>
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="INDUSTRIAL">Industrial</option>
                  <option value="AGRICULTURAL">Agricultural</option>
                  <option value="MIXED">Mixed Use</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={data.boundaryWall} onChange={e => update({ boundaryWall: e.target.checked })} className="w-4 h-4 text-orange-500 rounded" />
                <span className="text-sm text-gray-700">Boundary Wall</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={data.cornerPlot} onChange={e => update({ cornerPlot: e.target.checked })} className="w-4 h-4 text-orange-500 rounded" />
                <span className="text-sm text-gray-700">Corner Plot</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={data.titleClear} onChange={e => update({ titleClear: e.target.checked })} className="w-4 h-4 text-orange-500 rounded" />
                <span className="text-sm text-gray-700">Clear Title</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ownership Type</label>
                <select value={data.ownershipType} onChange={e => update({ ownershipType: e.target.value })} className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none">
                  <option value="FREEHOLD">Freehold</option>
                  <option value="LEASEHOLD">Leasehold</option>
                  <option value="COOPERATIVE">Cooperative</option>
                  <option value="POWER_OF_ATTORNEY">Power of Attorney</option>
                </select>
              </div>
            </div>

            {/* Agriculture-specific (only for agricultural/farming land) */}
            {['AGRICULTURAL_LAND', 'FARMING_LAND'].includes(data.propertyType) && (
              <>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">Agriculture Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Irrigation Type</label>
                    <select value={data.irrigationType} onChange={e => update({ irrigationType: e.target.value })} className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none">
                      <option value="">Select</option>
                      <option value="BOREWELL">Borewell</option>
                      <option value="CANAL">Canal</option>
                      <option value="RIVER">River</option>
                      <option value="RAIN_FED">Rain Fed</option>
                      <option value="DRIP">Drip Irrigation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Soil Type</label>
                    <select value={data.soilType} onChange={e => update({ soilType: e.target.value })} className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none">
                      <option value="">Select</option>
                      <option value="BLACK">Black Cotton</option>
                      <option value="RED">Red</option>
                      <option value="ALLUVIAL">Alluvial</option>
                      <option value="LATERITE">Laterite</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Water Source</label>
                    <input value={data.waterSource} onChange={e => update({ waterSource: e.target.value })} placeholder="e.g. Borewell, River" className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Borewells</label>
                    <input type="number" value={data.borewellCount || ''} onChange={e => update({ borewellCount: parseInt(e.target.value) || 0 })} min={0} className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Crop</label>
                    <input value={data.currentCrop} onChange={e => update({ currentCrop: e.target.value })} placeholder="e.g. Rice, Sugarcane" className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer mb-6">
                  <input type="checkbox" checked={data.organicCertified} onChange={e => update({ organicCertified: e.target.checked })} className="w-4 h-4 text-orange-500 rounded" />
                  <span className="text-sm text-gray-700">Organic Certified</span>
                </label>
              </>
            )}
          </>
        )}

        {!isPlot && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">BHK *</label>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => update({ bhk: n })}
                    className={`px-5 py-2 rounded-xl border-2 font-medium transition-all ${
                      data.bhk === n
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {n}{n === 5 ? '+' : ''} BHK
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                <select
                  value={data.bathrooms}
                  onChange={e => update({ bathrooms: parseInt(e.target.value) })}
                  className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Balconies</label>
                <select
                  value={data.balconies}
                  onChange={e => update({ balconies: parseInt(e.target.value) })}
                  className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                >
                  {[0, 1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor Number</label>
                <input
                  type="number"
                  value={data.floorNumber || ''}
                  onChange={e => update({ floorNumber: parseInt(e.target.value) || 0 })}
                  placeholder="e.g. 3"
                  min={0}
                  className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Floors</label>
                <input
                  type="number"
                  value={data.totalFloors || ''}
                  onChange={e => update({ totalFloors: parseInt(e.target.value) || 1 })}
                  placeholder="e.g. 10"
                  min={1}
                  className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facing Direction</label>
                <select
                  value={data.facing}
                  onChange={e => update({ facing: e.target.value })}
                  className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                >
                  <option value="">Select</option>
                  {FACING_OPTIONS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Age (years)</label>
                <input
                  type="number"
                  value={data.ageYears || ''}
                  onChange={e => update({ ageYears: parseInt(e.target.value) || 0 })}
                  placeholder="e.g. 5"
                  min={0}
                  className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Furnishing</label>
              <div className="flex gap-3 flex-wrap">
                {[
                  { value: 'UNFURNISHED', label: 'Unfurnished' },
                  { value: 'SEMI_FURNISHED', label: 'Semi-Furnished' },
                  { value: 'FULLY_FURNISHED', label: 'Fully Furnished' },
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="furnishing"
                      value={opt.value}
                      checked={data.furnishing === opt.value}
                      onChange={() => update({ furnishing: opt.value })}
                      className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Covered Parking</label>
                <select
                  value={data.coveredParking}
                  onChange={e => update({ coveredParking: parseInt(e.target.value) })}
                  className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                >
                  {[0, 1, 2, 3, 4].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Open Parking</label>
                <select
                  value={data.openParking}
                  onChange={e => update({ openParking: parseInt(e.target.value) })}
                  className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                >
                  {[0, 1, 2, 3, 4].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {isPlot && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center text-gray-600">
            <p className="text-lg font-medium">Plot / Land</p>
            <p className="text-sm mt-1">Details like BHK, bathrooms and furnishing are not applicable for plots. Continue to the next step to enter area and pricing.</p>
          </div>
        )}
      </div>
    );
  }

  function renderStep3() {
    const isPlot = ['PLOT', 'RESIDENTIAL_PLOT', 'AGRICULTURAL_LAND', 'FARMING_LAND', 'COMMERCIAL_LAND', 'INDUSTRIAL_LAND'].includes(data.propertyType);
    return (
      <div>
        <h2 className="text-2xl font-bold mb-2">Area & Pricing</h2>
        <p className="text-gray-500 mb-6">Enter property area and your asking price.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {!isPlot && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carpet Area (sq.ft) *</label>
                <input
                  type="number"
                  value={data.carpetAreaSqft || ''}
                  onChange={e => update({ carpetAreaSqft: parseInt(e.target.value) || 0 })}
                  placeholder="e.g. 850"
                  min={0}
                  className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Built-up Area (sq.ft)</label>
                <input
                  type="number"
                  value={data.builtUpAreaSqft || ''}
                  onChange={e => update({ builtUpAreaSqft: parseInt(e.target.value) || 0 })}
                  placeholder="e.g. 1050"
                  min={0}
                  className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Super Built-up Area (sq.ft)</label>
                <input
                  type="number"
                  value={data.superBuiltUpAreaSqft || ''}
                  onChange={e => update({ superBuiltUpAreaSqft: parseInt(e.target.value) || 0 })}
                  placeholder="e.g. 1200"
                  min={0}
                  className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
            </>
          )}
          {isPlot && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plot Area (sq.ft) *</label>
              <input
                type="number"
                value={data.plotAreaSqft || ''}
                onChange={e => update({ plotAreaSqft: parseInt(e.target.value) || 0 })}
                placeholder="e.g. 2400"
                min={0}
                className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Asking Price (in Rupees) *</label>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-400">&#8377;</span>
            <input
              type="number"
              value={data.askingPriceRupees || ''}
              onChange={e => update({ askingPriceRupees: parseInt(e.target.value) || 0 })}
              placeholder="e.g. 7500000"
              min={0}
              className="w-full border rounded-xl px-4 py-3 text-xl font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>
          {data.askingPriceRupees > 0 && (
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                {formatPrice(data.askingPriceRupees)}
              </span>
              {pricePerSqft > 0 && (
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                  &#8377;{pricePerSqft.toLocaleString('en-IN')} / sq.ft
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.negotiable}
              onChange={e => update({ negotiable: e.target.checked })}
              className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Price is negotiable</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance / Month (Rupees)</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-bold">&#8377;</span>
              <input
                type="number"
                value={data.maintenancePerMonth || ''}
                onChange={e => update({ maintenancePerMonth: parseInt(e.target.value) || 0 })}
                placeholder="e.g. 5000"
                min={0}
                className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
            <div className="flex gap-4">
              {[
                { value: 'RESALE', label: 'Resale' },
                { value: 'NEW_BOOKING', label: 'New Booking' },
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="transactionType"
                    value={opt.value}
                    checked={data.transactionType === opt.value}
                    onChange={() => update({ transactionType: opt.value })}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderStep4() {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-2">Construction & Legal</h2>
        <p className="text-gray-500 mb-6">Provide construction status and legal information.</p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Possession Status *</label>
          <div className="flex gap-3 flex-wrap">
            {[
              { value: 'READY_TO_MOVE', label: 'Ready to Move' },
              { value: 'UNDER_CONSTRUCTION', label: 'Under Construction' },
              { value: 'NEW_LAUNCH', label: 'New Launch' },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="possessionStatus"
                  value={opt.value}
                  checked={data.possessionStatus === opt.value}
                  onChange={() => update({ possessionStatus: opt.value })}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {(data.possessionStatus === 'UNDER_CONSTRUCTION' || data.possessionStatus === 'NEW_LAUNCH') && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Possession Date</label>
            <input
              type="date"
              value={data.possessionDate}
              onChange={e => update({ possessionDate: e.target.value })}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RERA ID</label>
            <input
              type="text"
              value={data.reraId}
              onChange={e => update({ reraId: e.target.value })}
              placeholder="e.g. P52100028614"
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">RERA registration number (if applicable)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Builder Name</label>
            <input
              type="text"
              value={data.builderName}
              onChange={e => update({ builderName: e.target.value })}
              placeholder="e.g. Prestige Group"
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              type="text"
              value={data.projectName}
              onChange={e => update({ projectName: e.target.value })}
              placeholder="e.g. Prestige Lakeside Habitat"
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>
        </div>
      </div>
    );
  }

  function renderStep5() {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-2">Features & Amenities</h2>
        <p className="text-gray-500 mb-6">Highlight what makes your property attractive to buyers.</p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map(a => (
              <button
                key={a}
                onClick={() => toggleAmenity(a)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  data.amenities.includes(a)
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Water Supply</label>
            <div className="flex flex-col gap-2">
              {[
                { value: 'CORPORATION', label: 'Corporation / Municipal' },
                { value: 'BOREWELL', label: 'Borewell' },
                { value: 'BOTH', label: 'Both' },
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="waterSupply"
                    value={opt.value}
                    checked={data.waterSupply === opt.value}
                    onChange={() => update({ waterSupply: opt.value })}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Power Backup</label>
            <div className="flex flex-col gap-2">
              {[
                { value: 'FULL', label: 'Full Backup' },
                { value: 'PARTIAL', label: 'Partial / Lift & Common Areas' },
                { value: 'NONE', label: 'None' },
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="powerBackup"
                    value={opt.value}
                    checked={data.powerBackup === opt.value}
                    onChange={() => update({ powerBackup: opt.value })}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-xl hover:bg-gray-50">
            <input
              type="checkbox"
              checked={data.gatedCommunity}
              onChange={e => update({ gatedCommunity: e.target.checked })}
              className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Gated Community</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-xl hover:bg-gray-50">
            <input
              type="checkbox"
              checked={data.cornerProperty}
              onChange={e => update({ cornerProperty: e.target.checked })}
              className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Corner Property</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-xl hover:bg-gray-50">
            <input
              type="checkbox"
              checked={data.vastuCompliant}
              onChange={e => update({ vastuCompliant: e.target.checked })}
              className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Vastu Compliant</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-xl hover:bg-gray-50">
            <input
              type="checkbox"
              checked={data.petAllowed}
              onChange={e => update({ petAllowed: e.target.checked })}
              className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Pet Allowed</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Overlooking</label>
          <div className="flex flex-wrap gap-2">
            {OVERLOOKING_OPTIONS.map(o => (
              <button
                key={o}
                onClick={() => toggleOverlooking(o)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  data.overlooking.includes(o)
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderStep6() {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-2">Photos & Media</h2>
        <p className="text-gray-500 mb-6">Upload photos to attract more buyers. Properties with photos get 5x more views.</p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Property Photos *</label>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-400'
            }`}
            onClick={() => document.getElementById('photo-input')?.click()}
          >
            <div className="text-4xl mb-2">+</div>
            <p className="text-gray-600 font-medium">Drag & drop photos here</p>
            <p className="text-gray-400 text-sm mt-1">or click to browse (JPG, PNG, WebP)</p>
            <input
              id="photo-input"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => handlePhotoFiles(e.target.files)}
            />
          </div>
          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-4">
              {photoPreviews.map((src, i) => (
                <div key={i} className="relative group">
                  <img src={src} alt={`Photo ${i + 1}`} className="w-full h-24 object-cover rounded-xl" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">{photoPreviews.length} photo{photoPreviews.length !== 1 ? 's' : ''} selected</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Floor Plan</label>
          <div
            className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer border-gray-300 hover:border-orange-400 transition-colors"
            onClick={() => document.getElementById('floorplan-input')?.click()}
          >
            {floorPlanPreview ? (
              <img src={floorPlanPreview} alt="Floor plan" className="max-h-40 mx-auto rounded-lg" />
            ) : (
              <>
                <p className="text-gray-600 text-sm">Click to upload floor plan</p>
                <p className="text-gray-400 text-xs mt-1">Optional</p>
              </>
            )}
            <input
              id="floorplan-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleFloorPlan(e.target.files)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video Tour URL</label>
            <input
              type="url"
              value={data.videoTourUrl}
              onChange={e => update({ videoTourUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brochure URL</label>
            <input
              type="url"
              value={data.brochureUrl}
              onChange={e => update({ brochureUrl: e.target.value })}
              placeholder="https://drive.google.com/..."
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>
        </div>
      </div>
    );
  }

  function renderStep7() {
    const isPlot = ['PLOT', 'RESIDENTIAL_PLOT', 'AGRICULTURAL_LAND', 'FARMING_LAND', 'COMMERCIAL_LAND', 'INDUSTRIAL_LAND'].includes(data.propertyType);
    const typeLabel = PROPERTY_TYPES.find(p => p.value === data.propertyType)?.label || data.propertyType;

    const sections = [
      {
        title: 'Property Type',
        step: 0,
        items: [
          { label: 'Type', value: typeLabel },
        ],
      },
      {
        title: 'Location',
        step: 1,
        items: [
          { label: 'Address', value: data.address },
          { label: 'Locality', value: data.locality },
          { label: 'City', value: `${data.city}, ${data.state}` },
          { label: 'Pincode', value: data.pincode },
          ...(data.lat ? [{ label: 'Coordinates', value: `${data.lat}, ${data.lng}` }] : []),
        ],
      },
      ...(!isPlot ? [{
        title: 'Property Details',
        step: 2,
        items: [
          { label: 'Configuration', value: `${data.bhk} BHK` },
          { label: 'Bathrooms', value: `${data.bathrooms}` },
          { label: 'Balconies', value: `${data.balconies}` },
          { label: 'Floor', value: `${data.floorNumber} of ${data.totalFloors}` },
          ...(data.facing ? [{ label: 'Facing', value: FACING_OPTIONS.find(f => f.value === data.facing)?.label || data.facing }] : []),
          { label: 'Age', value: `${data.ageYears} years` },
          { label: 'Furnishing', value: data.furnishing.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase()) },
          { label: 'Parking', value: `${data.coveredParking} covered, ${data.openParking} open` },
        ],
      }] : []),
      {
        title: 'Area & Pricing',
        step: 3,
        items: [
          ...(!isPlot ? [
            { label: 'Carpet Area', value: `${data.carpetAreaSqft} sq.ft` },
            ...(data.builtUpAreaSqft ? [{ label: 'Built-up Area', value: `${data.builtUpAreaSqft} sq.ft` }] : []),
            ...(data.superBuiltUpAreaSqft ? [{ label: 'Super Built-up Area', value: `${data.superBuiltUpAreaSqft} sq.ft` }] : []),
          ] : [
            { label: 'Plot Area', value: `${data.plotAreaSqft} sq.ft` },
          ]),
          { label: 'Asking Price', value: `₹${formatPrice(data.askingPriceRupees)}` },
          { label: 'Negotiable', value: data.negotiable ? 'Yes' : 'No' },
          ...(data.maintenancePerMonth ? [{ label: 'Maintenance', value: `₹${data.maintenancePerMonth.toLocaleString('en-IN')}/month` }] : []),
          { label: 'Transaction', value: data.transactionType === 'RESALE' ? 'Resale' : 'New Booking' },
        ],
      },
      {
        title: 'Construction & Legal',
        step: 4,
        items: [
          { label: 'Possession', value: data.possessionStatus === 'READY_TO_MOVE' ? 'Ready to Move' : data.possessionStatus === 'UNDER_CONSTRUCTION' ? 'Under Construction' : 'New Launch' },
          ...(data.possessionDate ? [{ label: 'Possession Date', value: data.possessionDate }] : []),
          ...(data.reraId ? [{ label: 'RERA ID', value: data.reraId }] : []),
          ...(data.builderName ? [{ label: 'Builder', value: data.builderName }] : []),
          ...(data.projectName ? [{ label: 'Project', value: data.projectName }] : []),
        ],
      },
      {
        title: 'Features',
        step: 5,
        items: [
          ...(data.amenities.length ? [{ label: 'Amenities', value: data.amenities.join(', ') }] : []),
          { label: 'Water Supply', value: data.waterSupply.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase()) },
          { label: 'Power Backup', value: data.powerBackup.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase()) },
          ...(data.gatedCommunity ? [{ label: 'Gated Community', value: 'Yes' }] : []),
          ...(data.cornerProperty ? [{ label: 'Corner Property', value: 'Yes' }] : []),
          ...(data.vastuCompliant ? [{ label: 'Vastu Compliant', value: 'Yes' }] : []),
          ...(data.petAllowed ? [{ label: 'Pet Allowed', value: 'Yes' }] : []),
          ...(data.overlooking.length ? [{ label: 'Overlooking', value: data.overlooking.join(', ') }] : []),
        ],
      },
      {
        title: 'Photos & Media',
        step: 6,
        items: [
          { label: 'Photos', value: `${data.photos.length} uploaded` },
          { label: 'Floor Plan', value: data.floorPlan ? 'Uploaded' : 'Not uploaded' },
          ...(data.videoTourUrl ? [{ label: 'Video Tour', value: 'Provided' }] : []),
          ...(data.brochureUrl ? [{ label: 'Brochure', value: 'Provided' }] : []),
        ],
      },
    ];

    return (
      <div>
        <h2 className="text-2xl font-bold mb-2">Review & Publish</h2>
        <p className="text-gray-500 mb-6">Review all details before publishing your property listing.</p>

        <div className="space-y-4">
          {sections.map(section => (
            <div key={section.title} className="bg-white border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">{section.title}</h3>
                <button
                  onClick={() => setStep(section.step)}
                  className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                >
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {section.items.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-sm text-gray-500 min-w-[120px]">{item.label}:</span>
                    <span className="text-sm text-gray-800 font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (editId ? 'Saving...' : 'Publishing...') : (editId ? 'Save Changes' : 'Publish Property')}
          </button>
        </div>
      </div>
    );
  }

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6, renderStep7];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/host?tab=sales" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-lg font-bold text-gray-800">{editId ? 'Edit Property' : 'Sell Your Property'}</h1>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {editLoading ? (
          <div className="text-center py-20 text-gray-500">Loading property...</div>
        ) : (
        <>
        <ProgressBar step={step} labels={STEP_LABELS} />

        <div className="bg-white rounded-xl border p-6 md:p-8 mb-6">
          {stepRenderers[step]()}
        </div>

        {/* Navigation */}
        {/* Validation errors */}
        {getStepErrors().length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <p className="text-sm font-medium text-red-700 mb-1">Please fix the following:</p>
            <ul className="list-disc list-inside text-sm text-red-600 space-y-0.5">
              {getStepErrors().map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        {step < 7 && (
          <div className="flex justify-between">
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="px-6 py-3 border rounded-xl font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        )}
      </>
        )}
      </div>
    </div>
  );
}

export default function SellPropertyWizard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Loading...</div>}>
      <SellPropertyWizardInner />
    </Suspense>
  );
}