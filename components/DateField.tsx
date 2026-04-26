'use client';

import { useEffect, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

type ChangeEvent = { target: { value: string } };

interface Props {
  value?: string;
  onChange?: (e: ChangeEvent) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  monthsShown?: number;
}

function isoToDate(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dateToIso(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().split('T')[0];
}

function formatDisplay(iso?: string): string {
  if (!iso) return '';
  const d = isoToDate(iso);
  if (!d) return iso;
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DateField({
  value = '',
  onChange,
  min,
  max,
  required,
  disabled,
  placeholder = 'Select date',
  className = '',
  id,
  monthsShown = 1,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const display = value ? formatDisplay(value) : placeholder;
  const isPlaceholder = !value;

  return (
    <div ref={wrapRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-required={required}
        onClick={() => !disabled && setOpen(s => !s)}
        className={`${className} text-left flex items-center justify-between gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={isPlaceholder ? 'opacity-60' : ''}>{display}</span>
        <svg className="w-4 h-4 opacity-60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      </button>
      {open && !disabled && (
        <div className="absolute z-50 mt-2 left-0 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2">
          <DatePicker
            selected={isoToDate(value)}
            onChange={(d) => {
              if (!d) return;
              onChange?.({ target: { value: dateToIso(d) } });
              setOpen(false);
            }}
            minDate={isoToDate(min) ?? undefined}
            maxDate={isoToDate(max) ?? undefined}
            monthsShown={monthsShown}
            inline
          />
        </div>
      )}
    </div>
  );
}
