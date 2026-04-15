'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

// Fallback popular cities shown when input is empty
const POPULAR_CITIES = [
  'Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad',
  'Jaipur', 'Lucknow', 'Gurugram', 'Noida', 'Kochi', 'Goa', 'Chandigarh', 'Indore',
  'Bhopal', 'Nagpur', 'Surat', 'Vadodara', 'Visakhapatnam', 'Mysore', 'Coimbatore',
  'Thiruvananthapuram', 'Bhubaneswar', 'Patna', 'Ranchi', 'Dehradun', 'Shimla',
  'Varanasi', 'Agra', 'Amritsar', 'Udaipur', 'Jodhpur', 'Raipur', 'Ludhiana',
  'Jamshedpur', 'Guwahati', 'Madurai', 'Tirupati', 'Srinagar',
];

// Extended static list for offline/fallback matching (500+ cities & towns)
const ALL_CITIES = [
  ...POPULAR_CITIES,
  // Bihar
  'Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Purnia', 'Arrah', 'Begusarai',
  'Katihar', 'Munger', 'Chhapra', 'Saharsa', 'Sasaram', 'Hajipur', 'Dehri', 'Siwan',
  'Motihari', 'Nawada', 'Bagaha', 'Buxar', 'Kishanganj', 'Sitamarhi', 'Jamalpur',
  'Jehanabad', 'Aurangabad', 'Lakhisarai', 'Madhubani', 'Supaul', 'Bettiah', 'Samastipur',
  'Pipra', 'Raxaul', 'Rajgir', 'Nalanda', 'Bodhgaya',
  // UP
  'Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Ghaziabad',
  'Bareilly', 'Aligarh', 'Moradabad', 'Gorakhpur', 'Saharanpur', 'Noida', 'Firozabad',
  'Jhansi', 'Mathura', 'Ayodhya', 'Faizabad', 'Sultanpur', 'Mirzapur', 'Basti',
  // Rajasthan
  'Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Bhilwara',
  'Alwar', 'Bharatpur', 'Sikar', 'Pali', 'Sri Ganganagar', 'Jhunjhunu', 'Tonk',
  // MP
  'Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Rewa',
  'Satna', 'Dewas', 'Burhanpur', 'Khandwa', 'Morena', 'Chhindwara',
  // Maharashtra
  'Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur',
  'Kolhapur', 'Amravati', 'Nanded', 'Sangli', 'Jalgaon', 'Akola', 'Latur',
  'Dhule', 'Chandrapur', 'Parbhani', 'Satara', 'Ratnagiri', 'Alibaug', 'Lonavala',
  // Karnataka
  'Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Davangere', 'Bellary',
  'Gulbarga', 'Shimoga', 'Tumkur', 'Udupi', 'Hospet', 'Chikmagalur', 'Hassan',
  // Telangana
  'Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Mahbubnagar',
  'Nalgonda', 'Ramagundam', 'Suryapet', 'Siddipet', 'Mancherial',
  // Tamil Nadu
  'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli',
  'Erode', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Tiruppur', 'Hosur',
  // AP
  'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati',
  'Rajahmundry', 'Kakinada', 'Anantapur', 'Eluru', 'Ongole', 'Kadapa',
  // Gujarat
  'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar',
  'Junagadh', 'Gandhinagar', 'Anand', 'Nadiad', 'Morbi', 'Mehsana', 'Bharuch',
  // Kerala
  'Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kannur', 'Kollam',
  'Palakkad', 'Alappuzha', 'Kottayam', 'Malappuram', 'Munnar', 'Wayanad',
  // WB
  'Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman',
  'Malda', 'Baharampur', 'Habra', 'Kharagpur', 'Shantiniketan', 'Darjeeling',
  // Punjab & Haryana
  'Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda',
  'Gurugram', 'Faridabad', 'Panipat', 'Karnal', 'Ambala', 'Hisar', 'Rohtak',
  // Others
  'Dehradun', 'Haridwar', 'Rishikesh', 'Nainital', 'Mussoorie', 'Shimla', 'Manali',
  'Dharamshala', 'Srinagar', 'Jammu', 'Leh', 'Gangtok', 'Shillong', 'Guwahati',
  'Imphal', 'Agartala', 'Aizawl', 'Itanagar', 'Kohima', 'Port Blair', 'Pondicherry',
  'Raipur', 'Bilaspur', 'Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro',
  'Bhubaneswar', 'Cuttack', 'Rourkela', 'Puri', 'Sambalpur',
].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export default function CityAutocomplete({
  value, onChange, placeholder = 'Search any city or town...', label = 'City', className = '',
}: CityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [apiSuggestions, setApiSuggestions] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Fetch API suggestions for non-trivial queries
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) { setApiSuggestions([]); return; }
    try {
      const res = await api.autocompleteSaleProperties(query);
      const cities = (res || [])
        .map((r: any) => r.city)
        .filter((c: string) => c && c.toLowerCase().includes(query.toLowerCase()));
      // Deduplicate
      setApiSuggestions([...new Set(cities)] as string[]);
    } catch {
      setApiSuggestions([]);
    }
  }, []);

  function handleChange(val: string) {
    onChange(val);
    setOpen(true);
    // Debounce API call
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  }

  // Merge static + API results, deduplicate, prioritize matches
  const query = value.toLowerCase();
  const staticMatches = query
    ? ALL_CITIES.filter(c => c.toLowerCase().includes(query))
    : POPULAR_CITIES;
  const allMatches = [...new Set([...staticMatches, ...apiSuggestions])].slice(0, 20);

  return (
    <div ref={ref} className="relative">
      {label && <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:ring-1 focus:ring-orange-300 focus:border-orange-400 outline-none ${className}`}
      />
      {open && allMatches.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {allMatches.map(city => (
            <button key={city} type="button"
              onClick={() => { onChange(city); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-orange-50 transition">
              {city}
            </button>
          ))}
          {query && !allMatches.some(c => c.toLowerCase() === query) && (
            <button type="button"
              onClick={() => { onChange(value); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 transition border-t">
              Use &quot;{value}&quot; as-is
            </button>
          )}
        </div>
      )}
    </div>
  );
}
