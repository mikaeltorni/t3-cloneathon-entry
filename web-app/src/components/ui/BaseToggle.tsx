/**
 * BaseToggle.tsx
 * 
 * Base toggle component for reusable toggle functionality
 * Enhanced with comprehensive dark mode support
 * 
 * Components:
 *   BaseToggle
 * 
 * Features:
 *   - Generic toggle interface with customizable icons and labels
 *   - Support for forced/optional/none modes
 *   - Tooltip functionality
 *   - Accessible keyboard navigation
 *   - Color-coded states with animations
 *   - Full dark mode support
 * 
 * Usage: <BaseToggle enabled={value} onChange={setValue} mode="optional" {...props} />
 */
import React from 'react';
import { cn } from '../../utils/cn';

export interface BaseToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  mode: 'forced' | 'optional' | 'none';
  modelName?: string;
  className?: string;
  
  // Customizable content
  icon: string | React.ReactNode;
  label: string;
  forcedLabel?: string;
  tooltipPrefix: string;
  
  // Customizable colors (with dark mode variants)
  enabledColors: {
    bg: string;
    bgDark?: string;
    border: string;
    borderDark?: string;
    text: string;
    textDark?: string;
  };
  forcedColors: {
    bg: string;
    bgDark?: string;
    border: string;
    borderDark?: string;
    text: string;
    textDark?: string;
  };
  disabledColors: {
    bg: string;
    bgDark?: string;
    border: string;
    borderDark?: string;
    text: string;
    textDark?: string;
  };
}

/**
 * Base toggle component for reusable toggle functionality
 * Enhanced with dark mode support
 * 
 * @param enabled - Whether toggle is currently enabled
 * @param onChange - Callback when toggle state changes
 * @param mode - The mode of the feature (forced/optional/none)
 * @param modelName - Name of the current model for tooltip
 * @param className - Additional CSS classes
 * @param icon - Icon to display
 * @param label - Label text
 * @param forcedLabel - Label text when forced
 * @param tooltipPrefix - Prefix for tooltip text
 * @param enabledColors - Colors when enabled
 * @param forcedColors - Colors when forced
 * @param disabledColors - Colors when disabled
 * @returns React component
 */
export const BaseToggle: React.FC<BaseToggleProps> = ({
  enabled,
  onChange,
  mode,
  modelName,
  className,
  icon,
  label,
  forcedLabel = 'Always On',
  tooltipPrefix,
  enabledColors,
  forcedColors,
  disabledColors
}) => {
  const isDisabled = mode === 'none';
  const isForced = mode === 'forced';
  const isTogglable = mode === 'optional';

  const handleClick = () => {
    if (isTogglable) {
      onChange(!enabled);
    }
  };

  const getTooltipText = () => {
    switch (mode) {
      case 'none':
        return `${modelName || 'This model'} does not support ${tooltipPrefix.toLowerCase()}`;
      case 'forced':
        return `${modelName || 'This model'} always uses ${tooltipPrefix.toLowerCase()} (cannot be disabled)`;
      case 'optional':
        return enabled 
          ? `${tooltipPrefix} enabled - Click to disable`
          : `${tooltipPrefix} disabled - Click to enable`;
      default:
        return '';
    }
  };

  const getCurrentColors = () => {
    if (isDisabled) return disabledColors;
    if (isForced) return forcedColors;
    if (enabled) return enabledColors;
    
    // For optional mode when disabled, use neutral inactive state
    return {
      bg: '#FFFFFF',
      bgDark: '#334155', // slate-700
      border: '#D1D5DB',
      borderDark: '#64748B', // slate-500
      text: '#9CA3AF',
      textDark: '#94A3B8' // slate-400
    };
  };

  const colors = getCurrentColors();

  return (
    <div className={cn('relative group', className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ease-in-out',
          'border-2 focus:outline-none focus:ring-2 focus:ring-offset-1',
          'dark:focus:ring-offset-slate-900',
          isTogglable && 'hover:scale-105 hover:shadow-lg cursor-pointer',
          isForced && 'cursor-default',
          isDisabled && 'cursor-not-allowed opacity-60',
          !isDisabled && 'shadow-sm',
          // Add visual feedback for enabled state
          (enabled || isForced) && !isDisabled && 'shadow-md'
        )}
        style={{
          backgroundColor: colors.bgDark ? `color-mix(in srgb, ${colors.bg} 100%, transparent 0%)` : colors.bg,
          borderColor: colors.borderDark ? `color-mix(in srgb, ${colors.border} 100%, transparent 0%)` : colors.border,
          color: colors.textDark ? `color-mix(in srgb, ${colors.text} 100%, transparent 0%)` : colors.text,
          borderWidth: '2px'
        }}
        title={getTooltipText()}
        aria-label={getTooltipText()}
      >
        {/* Icon with animation */}
        <span 
          className={cn(
            'text-base transition-transform duration-200',
            (enabled || isForced) && !isDisabled && 'scale-110',
            (enabled || isForced) && !isDisabled && 'animate-pulse'
          )}
        >
          {icon}
        </span>
        
        {/* Label text */}
        <span className="font-medium">
          {isForced ? forcedLabel : label}
        </span>

        {/* Status indicator - Enhanced for dark mode */}
        <div 
          className={cn(
            'w-3 h-3 rounded-full transition-all duration-200 flex items-center justify-center',
            (enabled || isForced) && !isDisabled && 'ring-2',
            // Light mode ring
            (enabled || isForced) && !isDisabled && 'ring-white',
            // Dark mode ring
            (enabled || isForced) && !isDisabled && 'dark:ring-slate-800'
          )}
          style={{
            backgroundColor: (enabled || isForced) && !isDisabled 
              ? (colors.textDark ? `color-mix(in srgb, ${colors.text} 100%, transparent 0%)` : colors.text)
              : '#d1d5db'
          }}
        >
          {/* Checkmark for enabled state */}
          {(enabled || isForced) && !isDisabled && (
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </button>

      {/* Enhanced Tooltip with Dark Mode */}
      <div className={cn(
        'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2',
        'bg-gray-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap',
        'dark:bg-slate-700 dark:text-slate-100',
        'opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10',
        'shadow-lg'
      )}>
        {getTooltipText()}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-slate-700" />
      </div>
    </div>
  );
}; 