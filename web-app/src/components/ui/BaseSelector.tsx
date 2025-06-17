/**
 * BaseSelector.tsx
 * 
 * Base selector component for reusable dropdown functionality
 * 
 * Components:
 *   BaseSelector
 * 
 * Features:
 *   - Generic dropdown interface with customizable options
 *   - Keyboard navigation support
 *   - Accessible ARIA attributes
 *   - Beautiful UI with option descriptions
 *   - Performance indicators for each option
 *   - Click outside to close functionality
 * 
 * Usage: <BaseSelector value="medium" onChange={setValue} options={options} {...props} />
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../../utils/cn';

export interface BaseSelectorOption<T = string> {
  value: T;
  label: string;
  description: string;
  icon: string;
  color: string;
  performance: string;
}

export interface BaseSelectorProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: BaseSelectorOption<T>[];
  label: string;
  modelName?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

/**
 * Base selector component for reusable dropdown functionality
 * 
 * Provides a dropdown interface for selecting from a list of options
 * with clear descriptions and visual indicators for each option.
 * 
 * @param value - Current selected value
 * @param onChange - Callback when value changes
 * @param options - Available options to choose from
 * @param label - Label for the selector
 * @param modelName - Name of the AI model (for display)
 * @param disabled - Whether the selector is disabled
 * @param className - Additional CSS classes
 * @param placeholder - Placeholder text when no value is selected
 * @returns React component
 */
export const BaseSelector = <T extends string = string>({
  value,
  onChange,
  options,
  label,
  modelName,
  disabled = false,
  className,
  placeholder = 'Select option...'
}: BaseSelectorProps<T>): React.ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(option => option.value === value);

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  /**
   * Handle option selection
   */
  const handleSelect = useCallback((optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
  }, [onChange]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case 'Space':
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const currentIndex = options.findIndex(opt => opt.value === value);
          const nextIndex = (currentIndex + 1) % options.length;
          onChange(options[nextIndex].value);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const currentIndex = options.findIndex(opt => opt.value === value);
          const prevIndex = currentIndex === 0 ? options.length - 1 : currentIndex - 1;
          onChange(options[prevIndex].value);
        }
        break;
    }
  }, [disabled, isOpen, value, onChange, options]);

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
        {label}
        {modelName && (
          <span className="text-gray-500 dark:text-slate-400 font-normal ml-1">for {modelName}</span>
        )}
      </label>

      {/* Selector Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white shadow-sm transition-all duration-200',
          'dark:bg-slate-800 dark:border-slate-600',
          disabled 
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60 dark:border-slate-600 dark:bg-slate-700'
            : isOpen
              ? 'border-blue-500 ring-2 ring-blue-200 dark:border-blue-400 dark:ring-blue-400/20'
              : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:hover:border-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={selectedOption ? `${label}: ${selectedOption.label}` : `${label}: ${placeholder}`}
      >
        <div className="flex items-center gap-2">
          {selectedOption ? (
            <>
              <span className="text-lg">{selectedOption.icon}</span>
              <div className="text-left">
                <div className={cn('font-medium', selectedOption.color)}>
                  {selectedOption.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-slate-400">
                  {selectedOption.performance}
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-500 dark:text-slate-400">{placeholder}</div>
          )}
        </div>
        
        <svg 
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            isOpen ? 'rotate-180' : '',
            disabled ? 'text-gray-300 dark:text-slate-500' : 'text-gray-400 dark:text-slate-400'
          )}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Options */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={cn(
                'w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-150 border-b border-gray-100 dark:border-slate-600 last:border-b-0',
                option.value === value && 'bg-blue-50 dark:bg-blue-950'
              )}
              role="option"
              aria-selected={option.value === value}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{option.icon}</span>
                <div className="flex-1">
                  <div className={cn('font-medium', option.color)}>
                    {option.label}
                    {option.value === value && (
                      <span className="ml-2 text-blue-600">✓</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    {option.description}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium">
                    {option.performance}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}; 