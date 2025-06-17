/**
 * SearchToggle.tsx
 * 
 * Search toggle component for enabling/disabling web search
 * Enhanced with comprehensive dark mode support and self-contained implementation
 * 
 * Components:
 *   SearchToggle
 * 
 * Features:
 *   - Visual toggle with search icon
 *   - Color-coded states (inactive/active/forced)
 *   - Tooltip explaining search functionality
 *   - Support for forced and optional modes
 *   - Pricing tier awareness (Perplexity models get different styling)
 *   - Complete dark mode support
 * 
 * Usage: <SearchToggle enabled={value} onChange={setValue} webSearchMode="optional" />
 */
import React from 'react';
import { cn } from '../../utils/cn';

interface SearchToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  webSearchMode: 'forced' | 'optional' | 'none';
  webSearchPricing?: 'standard' | 'perplexity' | 'openai';
  modelName?: string;
  className?: string;
}

/**
 * SearchToggle component for enabling/disabling web search
 * Enhanced with comprehensive dark mode support and pricing-tier aware styling
 * 
 * @param enabled - Whether search is currently enabled
 * @param onChange - Callback when toggle state changes
 * @param webSearchMode - The web search mode of the current model ('forced' or 'optional')
 * @param webSearchPricing - Pricing tier for web search (affects styling)
 * @param modelName - Name of the current model for tooltip
 * @param className - Additional CSS classes
 * @returns React component
 */
export const SearchToggle: React.FC<SearchToggleProps> = ({
  enabled,
  onChange,
  webSearchMode,
  webSearchPricing = 'standard',
  modelName,
  className
}) => {
  const isDisabled = webSearchMode === 'none';
  const isForced = webSearchMode === 'forced';
  
  // Get tooltip message
  const getTooltip = () => {
    if (isDisabled) {
      return `Web search not supported by ${modelName || 'this model'}`;
    }
    if (isForced) {
      return `Web search is always enabled for ${modelName || 'this model'}`;
    }
    return `${enabled ? 'Disable' : 'Enable'} web search for real-time information`;
  };

  // Handle click
  const handleClick = () => {
    if (!isDisabled && !isForced) {
      onChange(!enabled);
    }
  };

  // Get button styles based on state and pricing tier
  const getButtonStyles = () => {
    if (isDisabled) {
      return cn(
        'bg-gray-50 border-gray-200 text-gray-400',
        'dark:bg-slate-800 dark:border-slate-600 dark:text-slate-500',
        'cursor-not-allowed opacity-60'
      );
    }
    
    if (isForced) {
      // Forced state with pricing-tier specific colors
      switch (webSearchPricing) {
        case 'perplexity':
          return cn(
            'bg-green-50 border-green-200 text-green-700',
            'dark:bg-green-900/30 dark:border-green-600 dark:text-green-300',
            'cursor-default shadow-sm'
          );
        case 'openai':
          return cn(
            'bg-amber-50 border-amber-200 text-amber-700',
            'dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-300',
            'cursor-default shadow-sm'
          );
        default:
          return cn(
            'bg-sky-50 border-sky-200 text-sky-700',
            'dark:bg-sky-900/30 dark:border-sky-600 dark:text-sky-300',
            'cursor-default shadow-sm'
          );
      }
    }
    
    if (enabled) {
      // Enabled state with pricing-tier specific colors
      switch (webSearchPricing) {
        case 'perplexity':
          return cn(
            'bg-green-50 border-green-200 text-green-700',
            'dark:bg-green-900/30 dark:border-green-600 dark:text-green-300',
            'hover:bg-green-100 hover:border-green-300',
            'dark:hover:bg-green-900/50 dark:hover:border-green-500',
            'cursor-pointer shadow-sm'
          );
        case 'openai':
          return cn(
            'bg-amber-50 border-amber-200 text-amber-700',
            'dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-300',
            'hover:bg-amber-100 hover:border-amber-300',
            'dark:hover:bg-amber-900/50 dark:hover:border-amber-500',
            'cursor-pointer shadow-sm'
          );
        default:
          return cn(
            'bg-blue-50 border-blue-200 text-blue-700',
            'dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300',
            'hover:bg-blue-100 hover:border-blue-300',
            'dark:hover:bg-blue-900/50 dark:hover:border-blue-500',
            'cursor-pointer shadow-sm'
          );
      }
    }
    
    // Default disabled state
    return cn(
      'bg-gray-50 border-gray-200 text-gray-600',
      'dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300',
      'hover:bg-gray-100 hover:border-gray-300',
      'dark:hover:bg-slate-600 dark:hover:border-slate-500',
      'cursor-pointer'
    );
  };

  // Get status indicator color based on pricing tier
  const getStatusIndicatorColor = () => {
    if (!enabled && !isForced) {
      return 'bg-gray-300 dark:bg-slate-500';
    }
    
    switch (webSearchPricing) {
      case 'perplexity':
        return 'bg-green-500 dark:bg-green-400';
      case 'openai':
        return 'bg-amber-500 dark:bg-amber-400';
      default:
        return 'bg-blue-500 dark:bg-blue-400';
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled || isForced}
      title={getTooltip()}
      className={cn(
        // Base styles
        'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium',
        'border rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'dark:focus:ring-blue-400 dark:focus:ring-offset-slate-900',
        // State-specific styles
        getButtonStyles(),
        className
      )}
      aria-label={getTooltip()}
      aria-pressed={enabled}
    >
      {/* Search icon */}
      <span className="text-base" aria-hidden="true">
        🔍
      </span>
      
      {/* Label */}
      <span>
        {isForced ? 'Always On' : 'Web Search'}
      </span>
      
      {/* Pricing tier indicator */}
      {webSearchPricing === 'perplexity' && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
          Cheap
        </span>
      )}
      {webSearchPricing === 'openai' && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
          Premium
        </span>
      )}
      
      {/* Status indicator */}
      {!isDisabled && (
        <div className={cn(
          'w-2 h-2 rounded-full transition-colors duration-200',
          getStatusIndicatorColor()
        )} />
      )}
    </button>
  );
}; 