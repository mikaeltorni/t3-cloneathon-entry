/**
 * ReasoningToggle.tsx
 * 
 * Reasoning toggle component for enabling/disabling AI reasoning
 * Enhanced with comprehensive dark mode support and self-contained implementation
 * 
 * Components:
 *   ReasoningToggle
 * 
 * Features:
 *   - Visual toggle with brain icon
 *   - Color-coded states (inactive/active/forced)
 *   - Tooltip explaining reasoning functionality
 *   - Disabled state for non-reasoning models
 *   - Complete dark mode support
 * 
 * Usage: <ReasoningToggle enabled={value} onChange={setValue} reasoningMode="optional" />
 */
import React from 'react';
import { cn } from '../../utils/cn';

interface ReasoningToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  reasoningMode: 'forced' | 'optional' | 'none';
  modelName?: string;
  className?: string;
}

/**
 * ReasoningToggle component for enabling/disabling AI reasoning
 * Enhanced with comprehensive dark mode support
 * 
 * @param enabled - Whether reasoning is currently enabled
 * @param onChange - Callback when toggle state changes
 * @param reasoningMode - The reasoning mode of the current model
 * @param modelName - Name of the current model for tooltip
 * @param className - Additional CSS classes
 * @returns React component
 */
export const ReasoningToggle: React.FC<ReasoningToggleProps> = ({
  enabled,
  onChange,
  reasoningMode,
  modelName,
  className
}) => {
  const isDisabled = reasoningMode === 'none';
  const isForced = reasoningMode === 'forced';
  
  // Get tooltip message
  const getTooltip = () => {
    if (isDisabled) {
      return `Reasoning not supported by ${modelName || 'this model'}`;
    }
    if (isForced) {
      return `Reasoning is always enabled for ${modelName || 'this model'}`;
    }
    return `${enabled ? 'Disable' : 'Enable'} reasoning for enhanced problem-solving`;
  };

  // Handle click
  const handleClick = () => {
    if (!isDisabled && !isForced) {
      onChange(!enabled);
    }
  };

  // Get button styles based on state
  const getButtonStyles = () => {
    if (isDisabled) {
      return cn(
        'bg-gray-50 border-gray-200 text-gray-400',
        'dark:bg-slate-800 dark:border-slate-600 dark:text-slate-500',
        'cursor-not-allowed opacity-60'
      );
    }
    
    if (isForced) {
      return cn(
        'bg-purple-50 border-purple-200 text-purple-700',
        'dark:bg-purple-900/30 dark:border-purple-600 dark:text-purple-300',
        'cursor-default shadow-sm'
      );
    }
    
    if (enabled) {
      return cn(
        'bg-blue-50 border-blue-200 text-blue-700',
        'dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300',
        'hover:bg-blue-100 hover:border-blue-300',
        'dark:hover:bg-blue-900/50 dark:hover:border-blue-500',
        'cursor-pointer shadow-sm'
      );
    }
    
    return cn(
      'bg-gray-50 border-gray-200 text-gray-600',
      'dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300',
      'hover:bg-gray-100 hover:border-gray-300',
      'dark:hover:bg-slate-600 dark:hover:border-slate-500',
      'cursor-pointer'
    );
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
      {/* Brain icon */}
      <span className="text-base" aria-hidden="true">
        🧠
      </span>
      
      {/* Label */}
      <span>
        {isForced ? 'Always On' : 'Reasoning'}
      </span>
      
      {/* Status indicator */}
      {!isDisabled && (
        <div className={cn(
          'w-2 h-2 rounded-full transition-colors duration-200',
          enabled || isForced
            ? isForced 
              ? 'bg-purple-500 dark:bg-purple-400' 
              : 'bg-blue-500 dark:bg-blue-400'
            : 'bg-gray-300 dark:bg-slate-500'
        )} />
      )}
    </button>
  );
}; 