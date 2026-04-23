'use client';

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  variant?: 'default' | 'light';
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  variant?: 'default' | 'light';
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

const baseInputStyles = `
  h-12 px-[18px]
  border border-transparent
  rounded-[9px]
  bg-[#2f2c250f]
  text-[#000]
  placeholder:text-[#00000080]
  transition-colors duration-200
  focus:border-transparent focus:bg-[#2f2c251f] focus:outline-none
  disabled:opacity-50 disabled:cursor-not-allowed
  w-full
`;

const lightVariantStyles = `
  bg-[#fefaf31a]
  text-[#fefaf3]
  placeholder:text-[#fefaf380]
`;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, variant = 'default', className = '', ...props }, ref) => {
    const inputClassName = `${baseInputStyles} ${variant === 'light' ? lightVariantStyles : ''} ${className}`;

    return (
      <div className="flex flex-col gap-3">
        {label && (
          <label className="text-[11px] leading-[1.4] font-medium">
            {label}
          </label>
        )}
        <input ref={ref} className={inputClassName} {...props} />
        {error && (
          <span className="text-[11px] text-[#ea384c]">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, variant = 'default', className = '', ...props }, ref) => {
    const textareaClassName = `
      ${baseInputStyles}
      min-h-[200px] py-[18px]
      ${variant === 'light' ? lightVariantStyles : ''}
      ${className}
    `;

    return (
      <div className="flex flex-col gap-3">
        {label && (
          <label className="text-[11px] leading-[1.4] font-medium">
            {label}
          </label>
        )}
        <textarea ref={ref} className={textareaClassName} {...props} />
        {error && (
          <span className="text-[11px] text-[#ea384c]">{error}</span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-3">
        {label && (
          <label className="text-[11px] leading-[1.4] font-medium">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              ${baseInputStyles}
              cursor-pointer
              appearance-none
              pr-10
              ${className}
            `}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        {error && (
          <span className="text-[11px] text-[#ea384c]">{error}</span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export function Checkbox({
  label,
  checked,
  onChange,
  name,
  disabled,
}: {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  name?: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer -ml-3">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
        className={`
          w-[18px] h-[18px]
          bg-[#2f2c251f]
          border-none
          rounded-sm
          cursor-pointer
          checked:bg-[#2f2c251f]
          checked:bg-[url('/images/icon-interface-checkbox-check.svg')]
          checked:bg-center checked:bg-[length:12px]
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      />
      <span className="text-sm leading-[1.4]">{label}</span>
    </label>
  );
}

export function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label?: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {label && (
        <label className="text-[11px] leading-[1.4] font-medium">
          {label}
        </label>
      )}
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-3 cursor-pointer -ml-3">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange?.(option.value)}
              className={`
                w-[18px] h-[18px]
                bg-[#2f2c251f]
                border-none
                rounded-full
                cursor-pointer
                checked:border-4 checked:border-solid checked:border-[#000]
                checked:bg-[#fefaf3]
              `}
            />
            <span className="text-sm leading-[1.4]">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default Input;
