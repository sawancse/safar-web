'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';

interface LocalityAutocompleteProps {
  city: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  /** multi-select mode: returns comma-separated localities */
  multi?: boolean;
  className?: string;
}

export default function LocalityAutocomplete({
  city, value, onChange, placeholder = 'e.g. Koramangala, Banjara Hills',
  label = 'Locality / Area', multi = false, className = '',
}: LocalityAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // Parse initial value for multi mode
  useEffect(() => {
    if (multi && value) {
      setSelected(value.split(',').map(s => s.trim()).filter(Boolean));
    }
  }, []);

  // Fetch localities when city changes
  useEffect(() => {
    if (!city || city.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    api.getLocalitiesByCity(city)
      .then((data: any) => {
        const names = Array.isArray(data)
          ? data.map((l: any) => l.name || l.locality || l).filter(Boolean)
          : [];
        setSuggestions(names);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, [city]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = suggestions.filter(s =>
    s.toLowerCase().includes((multi ? search : value).toLowerCase())
    && (!multi || !selected.includes(s))
  );

  function handleSelect(loc: string) {
    if (multi) {
      const next = [...selected, loc];
      setSelected(next);
      onChange(next.join(', '));
      setSearch('');
    } else {
      onChange(loc);
      setOpen(false);
    }
  }

  function handleRemove(loc: string) {
    const next = selected.filter(s => s !== loc);
    setSelected(next);
    onChange(next.join(', '));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && multi) {
      e.preventDefault();
      const trimmed = search.trim();
      if (trimmed && !selected.includes(trimmed)) {
        const next = [...selected, trimmed];
        setSelected(next);
        onChange(next.join(', '));
      }
      setSearch('');
    }
  }

  const inputCls = `w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-orange-300 focus:border-orange-400 outline-none ${className}`;

  return (
    <div ref={ref} className="relative">
      {label && <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>}

      {/* Multi: show selected pills */}
      {multi && selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(s => (
            <span key={s} className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs px-2.5 py-1 rounded-full">
              {s}
              <button onClick={() => handleRemove(s)} className="hover:text-red-600 font-bold">&times;</button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={multi ? search : value}
        onChange={e => {
          if (multi) { setSearch(e.target.value); } else { onChange(e.target.value); }
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={multi && selected.length > 0 ? 'Add more...' : placeholder}
        className={inputCls}
      />

      {/* Dropdown */}
      {open && (value || search) && (filtered.length > 0 || loading) && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {loading && (
            <div className="px-3 py-2 text-xs text-gray-400">Loading localities...</div>
          )}
          {filtered.slice(0, 15).map(loc => (
            <button key={loc} type="button"
              onClick={() => handleSelect(loc)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 transition flex items-center gap-2">
              <span className="text-orange-400 text-xs">📍</span>
              <span>{loc}</span>
              <span className="text-xs text-gray-400 ml-auto">{city}</span>
            </button>
          ))}
          {!loading && filtered.length === 0 && (multi ? search : value).length > 0 && (
            <div className="px-3 py-2 text-xs text-gray-400">
              No matching localities{city ? ` in ${city}` : ''}. {multi ? 'Press Enter to add custom.' : 'Type to use as-is.'}
            </div>
          )}
        </div>
      )}

      {/* Quick suggestions when focused but empty */}
      {open && !(multi ? search : value) && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] text-gray-400 uppercase font-medium border-b">
            Popular in {city}
          </div>
          {suggestions.slice(0, 12).map(loc => (
            <button key={loc} type="button"
              onClick={() => handleSelect(loc)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 transition flex items-center gap-2">
              <span className="text-orange-400 text-xs">📍</span>
              <span>{loc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
