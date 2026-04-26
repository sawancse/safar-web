'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import CityAutocomplete from '@/components/CityAutocomplete';
import DateField from '@/components/DateField';
import type { Listing } from '@/types';

interface Props {
  listing: Listing;
  onClose: () => void;
  onSaved: () => void;
  token: string;
}

const BED_TYPES = ['Single', 'Double', 'Queen', 'King', 'Sofa Bed', 'Bunk Bed', 'Floor Mattress'];
const ACCESSIBILITY = ['Wheelchair accessible', 'Step-free access', 'Wide doorways', 'Accessible bathroom', 'Grab bars', 'Roll-in shower', 'Elevator', 'Braille signage'];
const MEAL_PLANS = [
  { value: 'NONE', label: 'No meals' },
  { value: 'BREAKFAST', label: 'Breakfast included' },
  { value: 'HALF_BOARD', label: 'Half board (breakfast + dinner)' },
  { value: 'FULL_BOARD', label: 'Full board (all meals)' },
  { value: 'ALL_INCLUSIVE', label: 'All inclusive' },
];

export default function EditListingModal({ listing, onClose, onSaved, token }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('basic');

  // Form state -- initialized from listing
  const [title, setTitle] = useState(listing.title || '');
  const [description, setDescription] = useState(listing.description || '');
  const [price, setPrice] = useState(listing.basePricePaise || 0);
  const [pricingUnit, setPricingUnit] = useState(listing.pricingUnit || 'NIGHT');
  const [maxGuests, setMaxGuests] = useState(listing.maxGuests || 2);
  const [bedrooms, setBedrooms] = useState(listing.bedrooms || 0);
  const [bathrooms, setBathrooms] = useState(listing.bathrooms || 0);
  const [bedTypes, setBedTypes] = useState<string[]>(listing.bedTypes || []);
  const [accessibilityFeatures, setAccessibilityFeatures] = useState<string[]>(listing.accessibilityFeatures || []);
  const [mealPlan, setMealPlan] = useState(listing.mealPlan || 'NONE');
  const [cancellationPolicy, setCancellationPolicy] = useState(listing.cancellationPolicy || 'MODERATE');
  const [instantBook, setInstantBook] = useState(listing.instantBook || false);
  const [petFriendly, setPetFriendly] = useState(listing.petFriendly || false);
  const [maxPets, setMaxPets] = useState(listing.maxPets || 0);
  const [checkInFrom, setCheckInFrom] = useState(listing.checkInFrom || '14:00');
  const [checkInUntil, setCheckInUntil] = useState(listing.checkInUntil || '23:00');
  const [checkOutFrom, setCheckOutFrom] = useState(listing.checkOutFrom || '06:00');
  const [checkOutUntil, setCheckOutUntil] = useState(listing.checkOutUntil || '11:00');
  const [childrenAllowed, setChildrenAllowed] = useState(listing.childrenAllowed !== false);
  const [longTermMonthlyPaise, setLongTermMonthlyPaise] = useState(listing.longTermMonthlyPaise || 0);
  const [breakfastIncluded, setBreakfastIncluded] = useState(listing.breakfastIncluded || false);
  const [securityDepositPaise, setSecurityDepositPaise] = useState(listing.securityDepositPaise || 0);
  const [depositType, setDepositType] = useState(listing.depositType || 'REFUNDABLE');
  const [depositTerms, setDepositTerms] = useState(listing.depositTerms || '');
  // Location fields
  const [addressLine1, setAddressLine1] = useState(listing.addressLine1 || '');
  const [city, setCity] = useState(listing.city || '');
  const [state, setState] = useState(listing.state || '');
  const [pincode, setPincode] = useState(listing.pincode || '');
  const [lat, setLat] = useState(listing.lat || 0);
  const [lng, setLng] = useState(listing.lng || 0);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.updateListing(listing.id, {
        title, description,
        basePricePaise: price,
        pricingUnit,
        maxGuests, bedrooms, bathrooms,
        bedTypes, accessibilityFeatures,
        mealPlan, cancellationPolicy,
        instantBook, petFriendly, maxPets,
        checkInFrom, checkInUntil, checkOutFrom, checkOutUntil,
        childrenAllowed, longTermMonthlyPaise,
        breakfastIncluded,
        addressLine1, city, state, pincode,
        lat: lat || null, lng: lng || null,
        // Rental fields
        // Insurance
        securityDepositPaise: securityDepositPaise > 0 ? securityDepositPaise : null,
        depositType: securityDepositPaise > 0 ? depositType : null,
        depositTerms: depositTerms || null,
        insuranceEnabled,
        insuranceAmountPaise: insuranceEnabled && insuranceAmountPaise > 0 ? insuranceAmountPaise : null,
        insuranceType: insuranceEnabled ? insuranceType : null,
        ...(isRental ? {
          apartmentName: apartmentName || null, apartmentType: apartmentType || null,
          floorNumber: floorNumber || null, totalFloors: totalFloors || null,
          propertyAge: propertyAge || null, facing: facing || null,
          builtUpAreaSqft: builtUpAreaSqft || null, rentalType,
          rentNegotiable, preferredTenants: preferredTenants || null,
          propertyCondition: propertyCondition || null, availableFrom: availableFrom || null,
        } : {}),
      }, token);
      onSaved();
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    }
    setSaving(false);
  };

  const isRental = ['HOME', 'APARTMENT', 'ROOM', 'VILLA', 'PG', 'COLIVING', 'FARMSTAY', 'BNB'].includes(listing.type);

  // Rental state
  const [apartmentName, setApartmentName] = useState(listing.apartmentName || '');
  const [apartmentType, setApartmentType] = useState(listing.apartmentType || '');
  const [floorNumber, setFloorNumber] = useState(listing.floorNumber || 0);
  const [totalFloors, setTotalFloors] = useState(listing.totalFloors || 0);
  const [propertyAge, setPropertyAge] = useState(listing.propertyAge || '');
  const [facing, setFacing] = useState(listing.facing || '');
  const [builtUpAreaSqft, setBuiltUpAreaSqft] = useState(listing.builtUpAreaSqft || 0);
  const [rentalType, setRentalType] = useState(listing.rentalType || 'RENT');
  const [rentNegotiable, setRentNegotiable] = useState(listing.rentNegotiable || false);
  const [preferredTenants, setPreferredTenants] = useState(listing.preferredTenants || '');
  const [propertyCondition, setPropertyCondition] = useState(listing.propertyCondition || '');
  const [availableFrom, setAvailableFrom] = useState(listing.availableFrom || '');
  // Insurance
  const [insuranceEnabled, setInsuranceEnabled] = useState(listing.insuranceEnabled || false);
  const [insuranceAmountPaise, setInsuranceAmountPaise] = useState(listing.insuranceAmountPaise || 0);
  const [insuranceType, setInsuranceType] = useState(listing.insuranceType || 'BASIC');

  const SECTIONS = [
    { key: 'basic', label: 'Basic Info' },
    { key: 'location', label: 'Location' },
    ...(isRental ? [{ key: 'rental', label: 'Rental Details' }] : []),
    { key: 'rooms', label: 'Rooms & Beds' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'facilities', label: 'Facilities' },
    { key: 'rules', label: 'House Rules' },
    { key: 'accessibility', label: 'Accessibility' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Edit: {listing.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        {/* Section tabs */}
        <div className="border-b px-6 py-2 flex gap-1 overflow-x-auto">
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => setActiveSection(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeSection === s.key ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-100'
              }`}>{s.label}</button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2">{error}</div>}

          {activeSection === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  rows={4} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Guests</label>
                  <input type="number" value={maxGuests} onChange={e => setMaxGuests(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" min={1} />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'location' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input value={addressLine1} onChange={e => setAddressLine1(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Street address, area, landmark" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <CityAutocomplete
                    value={city}
                    onChange={setCity}
                    label="City"
                    placeholder="e.g. Hyderabad"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input value={state} onChange={e => setState(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Telangana" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input value={pincode} onChange={e => setPincode(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm" maxLength={6} placeholder="500001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input type="number" step="any" value={lat || ''} onChange={e => setLat(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="17.385" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input type="number" step="any" value={lng || ''} onChange={e => setLng(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="78.4867" />
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Updating the city or pincode will re-geocode the listing for map and search accuracy.
              </p>
            </div>
          )}

          {activeSection === 'rental' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Society / Building</label>
                  <input value={apartmentName} onChange={e => setApartmentName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Prestige Lakeside" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apartment Type</label>
                  <select value={apartmentType} onChange={e => setApartmentType(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select</option>
                    <option value="GATED_COMMUNITY">Gated Community</option>
                    <option value="STANDALONE">Standalone</option>
                    <option value="VILLA">Villa</option>
                    <option value="BUILDER_FLOOR">Builder Floor</option>
                    <option value="PENTHOUSE">Penthouse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor / Total Floors</label>
                  <div className="flex gap-2">
                    <input type="number" min={0} value={floorNumber || ''} onChange={e => setFloorNumber(Number(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Floor" />
                    <input type="number" min={1} value={totalFloors || ''} onChange={e => setTotalFloors(Number(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Total" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Age</label>
                  <select value={propertyAge} onChange={e => setPropertyAge(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select</option>
                    <option value="NEW">New</option>
                    <option value="1_TO_3">1-3 yrs</option>
                    <option value="3_TO_5">3-5 yrs</option>
                    <option value="5_TO_10">5-10 yrs</option>
                    <option value="10_PLUS">10+ yrs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facing</label>
                  <select value={facing} onChange={e => setFacing(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select</option>
                    {['NORTH','SOUTH','EAST','WEST','NORTH_EAST','SOUTH_EAST'].map(f =>
                      <option key={f} value={f}>{f.replace(/_/g,'-')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Built-up Area (sqft)</label>
                  <input type="number" min={0} value={builtUpAreaSqft || ''} onChange={e => setBuiltUpAreaSqft(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available for</label>
                  <select value={rentalType} onChange={e => setRentalType(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="RENT">Rent</option>
                    <option value="LEASE">Lease</option>
                    <option value="RENT_OR_LEASE">Rent or Lease</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available From</label>
                  <DateField value={availableFrom} onChange={e => setAvailableFrom(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Condition</label>
                  <select value={propertyCondition} onChange={e => setPropertyCondition(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select</option>
                    <option value="VACANT">Vacant</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="UNDER_RENOVATION">Under Renovation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Tenants</label>
                  <input value={preferredTenants} onChange={e => setPreferredTenants(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="ANYONE, FAMILY, BACHELOR_MALE" />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={rentNegotiable} onChange={e => setRentNegotiable(e.target.checked)} className="rounded" />
                <span className="text-sm font-medium">Rent Negotiable</span>
              </label>
            </div>
          )}

          {activeSection === 'rooms' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                  <input type="number" value={bedrooms} onChange={e => setBedrooms(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" min={0} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                  <input type="number" value={bathrooms} onChange={e => setBathrooms(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" min={0} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bed Types</label>
                <div className="flex flex-wrap gap-2">
                  {BED_TYPES.map(bt => (
                    <button key={bt} type="button" onClick={() => setBedTypes(prev => prev.includes(bt) ? prev.filter(b => b !== bt) : [...prev, bt])}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                        bedTypes.includes(bt) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                      }`}>{bt}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'pricing' && (
            <div className="space-y-4">
              {/* Pricing Unit Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pricing basis</label>
                <div className="flex gap-2">
                  {[
                    { value: 'NIGHT', label: 'Per Night', hint: 'Standard stays' },
                    { value: 'MONTH', label: 'Per Month', hint: 'PG / Co-living / Long-term' },
                    { value: 'HOUR', label: 'Per Hour', hint: 'Hotels / Meeting rooms' },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setPricingUnit(opt.value as 'NIGHT' | 'HOUR' | 'MONTH')}
                      className={`flex-1 p-3 rounded-lg border text-sm text-left transition ${
                        pricingUnit === opt.value
                          ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{opt.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Base Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base price (₹ / {pricingUnit === 'MONTH' ? 'month' : pricingUnit === 'HOUR' ? 'hour' : 'night'})
                </label>
                <input type="number" value={price / 100} onChange={e => setPrice(Number(e.target.value) * 100)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" min={1}
                  placeholder={pricingUnit === 'MONTH' ? 'e.g. 8000' : pricingUnit === 'HOUR' ? 'e.g. 500' : 'e.g. 2000'} />
                <p className="text-xs text-gray-400 mt-1">
                  {pricingUnit === 'MONTH' && 'Guests will be charged this amount per month. Partial months are prorated daily.'}
                  {pricingUnit === 'HOUR' && 'Guests will be charged this amount per hour of stay.'}
                  {pricingUnit === 'NIGHT' && 'Guests will be charged this amount per night.'}
                </p>
              </div>

              {/* Long-term monthly rate (only for nightly-priced listings) */}
              {pricingUnit === 'NIGHT' && listing.type !== 'COMMERCIAL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Long-term monthly rate (₹, optional)</label>
                  <input type="number" value={(longTermMonthlyPaise || 0) / 100}
                    onChange={e => setLongTermMonthlyPaise(Number(e.target.value) * 100)}
                    className="w-full border rounded-lg px-3 py-2 text-sm" min={0}
                    placeholder="Discounted rate for 30+ day stays" />
                  <p className="text-xs text-gray-400 mt-1">If set, guests booking 30+ nights will see this monthly rate instead.</p>
                </div>
              )}

              {/* Insurance */}
              <div className="border-t pt-3 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={insuranceEnabled}
                    onChange={e => setInsuranceEnabled(e.target.checked)} className="rounded" />
                  <span className="text-sm font-medium">Enable guest protection / micro-insurance</span>
                </label>
              </div>
              {insuranceEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                    <input type="number" min={0} value={(insuranceAmountPaise || 0) / 100}
                      onChange={e => setInsuranceAmountPaise(Number(e.target.value) * 100)}
                      className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select value={insuranceType} onChange={e => setInsuranceType(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="BASIC">Basic</option>
                      <option value="PREMIUM">Premium</option>
                      <option value="DAMAGE_PROTECTION">Damage Protection</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Security Deposit */}
              <div className="border-t pt-3 mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Security Deposit</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Amount (₹)</label>
                    <input type="number" min={0} value={securityDepositPaise > 0 ? securityDepositPaise / 100 : ''}
                      onChange={e => setSecurityDepositPaise(Math.round(Number(e.target.value) * 100))}
                      className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 5000" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Deposit Type</label>
                    <select value={depositType} onChange={e => setDepositType(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="REFUNDABLE">Fully Refundable</option>
                      <option value="PARTIAL_REFUNDABLE">Partially Refundable</option>
                      <option value="NON_REFUNDABLE">Non-Refundable</option>
                    </select>
                  </div>
                </div>
                <input type="text" value={depositTerms}
                  onChange={e => setDepositTerms(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-2"
                  placeholder="Deposit terms (e.g. Refunded within 7 days after checkout minus damages)" />
              </div>
            </div>
          )}

          {activeSection === 'facilities' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meal Plan</label>
                <div className="space-y-2">
                  {MEAL_PLANS.map(mp => (
                    <label key={mp.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="mealPlan" value={mp.value} checked={mealPlan === mp.value}
                        onChange={() => setMealPlan(mp.value as any)} className="text-orange-500" />
                      <span className="text-sm">{mp.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Policy</label>
                {['FREE', 'MODERATE', 'STRICT'].map(cp => (
                  <label key={cp} className="flex items-center gap-2 cursor-pointer mb-1">
                    <input type="radio" name="cancellation" value={cp} checked={cancellationPolicy === cp}
                      onChange={() => setCancellationPolicy(cp as any)} className="text-orange-500" />
                    <span className="text-sm">{cp === 'FREE' ? 'Free cancellation (48h before)' : cp === 'MODERATE' ? 'Moderate (50% refund 24-48h)' : 'Strict (no refund <24h)'}</span>
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={instantBook} onChange={e => setInstantBook(e.target.checked)} className="rounded" />
                <span className="text-sm font-medium">Instant Book</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={breakfastIncluded} onChange={e => setBreakfastIncluded(e.target.checked)} className="rounded" />
                <span className="text-sm font-medium">Breakfast included</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={petFriendly} onChange={e => setPetFriendly(e.target.checked)} className="rounded" />
                <span className="text-sm font-medium">Pet friendly</span>
              </label>
              {petFriendly && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Max pets</label>
                  <input type="number" value={maxPets} onChange={e => setMaxPets(Number(e.target.value))}
                    className="w-24 border rounded-lg px-3 py-2 text-sm" min={1} max={5} />
                </div>
              )}
            </div>
          )}

          {activeSection === 'rules' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-in from</label>
                  <input type="time" value={checkInFrom} onChange={e => setCheckInFrom(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-in until</label>
                  <input type="time" value={checkInUntil} onChange={e => setCheckInUntil(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-out from</label>
                  <input type="time" value={checkOutFrom} onChange={e => setCheckOutFrom(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-out until</label>
                  <input type="time" value={checkOutUntil} onChange={e => setCheckOutUntil(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={childrenAllowed} onChange={e => setChildrenAllowed(e.target.checked)} className="rounded" />
                <span className="text-sm font-medium">Children allowed</span>
              </label>
            </div>
          )}

          {activeSection === 'accessibility' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accessibility Features</label>
              <div className="grid grid-cols-2 gap-2">
                {ACCESSIBILITY.map(af => (
                  <label key={af} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                    <input type="checkbox" checked={accessibilityFeatures.includes(af)}
                      onChange={() => setAccessibilityFeatures(prev => prev.includes(af) ? prev.filter(a => a !== af) : [...prev, af])}
                      className="rounded text-orange-500" />
                    <span className="text-sm">{af}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
