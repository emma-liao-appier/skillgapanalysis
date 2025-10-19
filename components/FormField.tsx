import React, { useState, useRef, useEffect } from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  maxLength?: number;
  className?: string;
  labelClassName?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
  disabled = false,
  error,
  helpText,
  maxLength,
  className = '',
  labelClassName = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const showError = error && (hasInteracted || value.length > 0);
  const isInvalid = showError;

  useEffect(() => {
    if (value.length > 0) {
      setHasInteracted(true);
    }
  }, [value]);

  const handleFocus = () => {
    setIsFocused(true);
    setHasInteracted(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Enter key for multi-line input
    if (e.key === 'Enter' && !e.shiftKey) {
      // Don't prevent default - allow normal textarea behavior
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <label 
        htmlFor={id} 
        className={`block text-sm font-medium text-gray-700 mb-2 ${labelClassName}`}
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      <div className="relative">
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          maxLength={maxLength}
          aria-describedby={
            showError 
              ? `${id}-error` 
              : helpText 
                ? `${id}-help` 
                : undefined
          }
          aria-invalid={isInvalid}
          aria-required={required}
          className={`
            w-full px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-all duration-200 resize-none
            ${isInvalid 
              ? 'border-red-300 bg-red-50' 
              : isFocused 
                ? 'border-primary-300 bg-white' 
                : 'border-gray-300 bg-white hover:border-gray-400'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}
          `}
        />
        
        {/* Character count */}
        {maxLength && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-500">
            <span className={value.length > maxLength * 0.9 ? 'text-orange-500' : ''}>
              {value.length}
            </span>
            /{maxLength}
          </div>
        )}
      </div>
      
      {/* Help text */}
      {helpText && !showError && (
        <p 
          id={`${id}-help`}
          className="mt-2 text-sm text-gray-600"
        >
          {helpText}
        </p>
      )}
      
      {/* Error message */}
      {showError && (
        <div 
          id={`${id}-error`}
          className="mt-2 flex items-center text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          <svg 
            className="w-4 h-4 mr-1 flex-shrink-0" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default FormField;
