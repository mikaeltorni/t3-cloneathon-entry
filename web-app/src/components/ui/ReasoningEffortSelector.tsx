/**
 * ReasoningEffortSelector.tsx
 * 
 * Reasoning effort level selector component for AI models that support reasoning effort control
 * 
 * Components:
 *   ReasoningEffortSelector
 * 
 * Features:
 *   - Dropdown selector for effort levels (low, medium, high)
 *   - Model-aware display (only shows for supported models)
 *   - Beautiful UI with effort descriptions
 *   - Accessible keyboard navigation
 *   - Performance indicators for each effort level
 * 
 * Usage: <ReasoningEffortSelector value="high" onChange={setEffort} modelName="Claude 3.7" />
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../../utils/cn';

type ReasoningEffort = 'low' | 'medium' | 'high';

interface ReasoningEffortSelectorProps {
  value: ReasoningEffort;
  onChange: (effort: ReasoningEffort) => void;
  modelName?: string;
  disabled?: boolean;
  className?: string;
}

interface EffortOption {
  value: ReasoningEffort;
  label: string;
  description: string;
  icon: string;
  color: string;
  performance: string;
}

const EFFORT_OPTIONS: EffortOption[] = [
  {
    value: 'low',
    label: 'Low Effort',
    description: 'Fast responses with basic reasoning',
    icon: '⚡',
    color: 'text-green-600',
    performance: 'Fastest'
  },
  {
    value: 'medium',
    label: 'Medium Effort',
    description: 'Balanced reasoning and response time',
    icon: '⚖️',
    color: 'text-yellow-600',
    performance: 'Balanced'
  },
  {
    value: 'high',
    label: 'High Effort',
    description: 'Deep reasoning with thorough analysis',
    icon: '🧠',
    color: 'text-blue-600',
    performance: 'Most thorough'
  }
];

/**
 * Reasoning effort level selector component
 * 
 * Provides a dropdown interface for selecting reasoning effort levels
 * with clear descriptions and visual indicators for each option.
 * 
 * @param value - Current effort level
 * @param onChange - Callback when effort level changes
 * @param modelName - Name of the AI model (for display)
 * @param disabled - Whether the selector is disabled
 * @param className - Additional CSS classes
 * @returns React component
 */
export const ReasoningEffortSelector: React.FC<ReasoningEffortSelectorProps> = ({
  value,
  onChange,
  modelName,
  disabled = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = EFFORT_OPTIONS.find(option => option.value === value) || EFFORT_OPTIONS[2];

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
   * Handle effort selection
   */
  const handleSelect = useCallback((effort: ReasoningEffort) => {
    onChange(effort);
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
          const currentIndex = EFFORT_OPTIONS.findIndex(opt => opt.value === value);
          const nextIndex = (currentIndex + 1) % EFFORT_OPTIONS.length;
          onChange(EFFORT_OPTIONS[nextIndex].value);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const currentIndex = EFFORT_OPTIONS.findIndex(opt => opt.value === value);
          const prevIndex = currentIndex === 0 ? EFFORT_OPTIONS.length - 1 : currentIndex - 1;
          onChange(EFFORT_OPTIONS[prevIndex].value);
        }
        break;
    }
  }, [disabled, isOpen, value, onChange]);

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Reasoning Effort
        {modelName && (
          <span className="text-gray-500 font-normal ml-1">for {modelName}</span>
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
          disabled 
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
            : isOpen
              ? 'border-blue-500 ring-2 ring-blue-200'
              : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Reasoning effort: ${selectedOption.label}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{selectedOption.icon}</span>
          <div className="text-left">
            <div className={cn('font-medium', selectedOption.color)}>
              {selectedOption.label}
            </div>
            <div className="text-xs text-gray-500">
              {selectedOption.performance}
            </div>
          </div>
        </div>
        
        <svg 
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            isOpen ? 'rotate-180' : '',
            disabled ? 'text-gray-300' : 'text-gray-400'
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
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {EFFORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={cn(
                'w-full px-3 py-3 text-left hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0',
                option.value === value && 'bg-blue-50'
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
                  <div className="text-xs text-gray-500 mt-1">
                    {option.description}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 font-medium">
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