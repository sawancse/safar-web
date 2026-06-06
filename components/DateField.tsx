'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

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

// react-datepicker single month ≈ 290×340 incl. dropdown headers
const POPUP_W_PER_MONTH = 300;
const POPUP_H = 360;
const GAP = 8;

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
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  function updatePosition() {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const popW = POPUP_W_PER_MONTH * monthsShown + 16; // + p-2 padding
    let left = rect.left;
    let top = rect.bottom + GAP;
    if (left + popW > window.innerWidth - GAP) {
      left = Math.max(GAP, window.innerWidth - popW - GAP);
    }
    if (top + POPUP_H > window.innerHeight - GAP) {
      const flipped = rect.top - POPUP_H - GAP;
      if (flipped >= GAP) top = flipped;
    }
    setPos({ top, left });
  }

  useIsoLayoutEffect(() => {
    if (open) updatePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, monthsShown]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (popRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function onViewport() { updatePosition(); }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onViewport, true);
    window.addEventListener('resize', onViewport);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onViewport, true);
      window.removeEventListener('resize', onViewport);
    };
  }, [open]);

  const display = value ? formatDisplay(value) : placeholder;
  const isPlaceholder = !value;

  return (
    <>
      <button
        ref={btnRef}
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
      {mounted && open && !disabled && pos && createPortal(
        <div
          ref={popRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 1100 }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-2"
        >
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
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            yearDropdownItemNumber={120}
            scrollableYearDropdown
            inline
          />
        </div>,
        document.body
      )}
    </>
  );
}
