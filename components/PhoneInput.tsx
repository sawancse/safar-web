'use client';

import { useState } from 'react';
import { sanitizePhone, phoneError } from '@/lib/phone';

interface Props {
  value: string;
  onChange: (digits: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** Optional aria-label / label for screen readers when no surrounding <label> exists. */
  ariaLabel?: string;
  /** Suppresses the inline error. Useful when the parent owns its own error UI. */
  hideError?: boolean;
  id?: string;
  name?: string;
  autoComplete?: string;
  onBlur?: () => void;
}

/**
 * Two-box phone input: read-only "+91" prefix + 10-digit number field.
 * Strips non-digits, caps at 10 digits, shows an inline error after the user has interacted.
 */
export default function PhoneInput({
  value,
  onChange,
  required = true,
  disabled = false,
  placeholder = '10-digit mobile number',
  className = '',
  ariaLabel,
  hideError = false,
  id,
  name,
  autoComplete = 'tel-national',
  onBlur,
}: Props) {
  const [touched, setTouched] = useState(false);
  const error = touched ? phoneError(value, required) : '';

  return (
    <div className={className}>
      <div className="flex">
        <span
          aria-hidden
          className={`inline-flex items-center px-3 rounded-l-xl border border-r-0 text-sm font-medium select-none ${
            disabled ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-gray-50 text-gray-700 border-gray-300'
          }`}
        >
          +91
        </span>
        <input
          id={id}
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete={autoComplete}
          maxLength={10}
          disabled={disabled}
          aria-label={ariaLabel || 'Mobile number'}
          aria-invalid={!!error}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(sanitizePhone(e.target.value))}
          onBlur={() => { setTouched(true); onBlur?.(); }}
          className={`flex-1 min-w-0 border rounded-r-xl px-3 py-2.5 text-sm outline-none focus:ring-2 ${
            error
              ? 'border-red-400 focus:ring-red-300'
              : 'border-gray-300 focus:ring-orange-400'
          }`}
        />
      </div>
      {!hideError && error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
