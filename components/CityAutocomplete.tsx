'use client';

import { useState, useRef, useEffect } from 'react';

const INDIAN_CITIES = [
  'Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad',
  'Jaipur', 'Lucknow', 'Gurugram', 'Noida', 'Kochi', 'Goa', 'Chandigarh', 'Indore',
  'Bhopal', 'Nagpur', 'Surat', 'Vadodara', 'Visakhapatnam', 'Mysore', 'Coimbatore',
  'Thiruvananthapuram', 'Bhubaneswar', 'Patna', 'Ranchi', 'Dehradun', 'Shimla', 'Manali',
  'Rishikesh', 'Varanasi', 'Agra', 'Amritsar', 'Udaipur', 'Jodhpur', 'Jaisalmer',
  'Darjeeling', 'Gangtok', 'Shillong', 'Guwahati', 'Pondicherry', 'Madurai', 'Tirupati',
  'Srinagar', 'Leh', 'Dharamshala', 'Mussoorie', 'Nainital', 'Haridwar',
  'Port Blair', 'Raipur', 'Ludhiana', 'Jamshedpur',
];

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export default function CityAutocomplete({
  value, onChange, placeholder = 'e.g. Hyderabad', label = 'City', className = '',
}: CityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = value
    ? INDIAN_CITIES.filter(c => c.toLowerCase().includes(value.toLowerCase()))
    : INDIAN_CITIES;

  return (
    <div ref={ref} className="relative">
      {label && <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-orange-300 focus:border-orange-400 outline-none ${className}`}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.slice(0, 15).map(city => (
            <button key={city} type="button"
              onClick={() => { onChange(city); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 transition">
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
