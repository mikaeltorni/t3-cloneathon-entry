/**
 * BaseToggle.tsx
 * 
 * Base toggle component for reusable toggle functionality
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
  
  // Customizable colors
  enabledColors: {
    bg: string;
    border: string;
    text: string;
  };
  forcedColors: {
    bg: string;
    border: string;
    text: string;
  };
  disabledColors: {
    bg: string;
    border: string;
    text: string;
  };
}

/**
 * Base toggle component for reusable toggle functionality
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
    return disabledColors;
  };

  const colors = getCurrentColors();

  return (
    <div className={cn('relative group', className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-in-out',
          'border focus:outline-none focus:ring-2 focus:ring-offset-1',
          isTogglable && 'hover:scale-105 hover:shadow-md cursor-pointer',
          isForced && 'cursor-default',
          isDisabled && 'cursor-not-allowed opacity-60',
          !isDisabled && 'shadow-sm'
        )}
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border,
          color: colors.text,
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

        {/* Status indicator */}
        <div 
          className={cn(
            'w-2 h-2 rounded-full transition-colors duration-200'
          )}
          style={{
            backgroundColor: (enabled || isForced) && !isDisabled ? colors.text : '#d1d5db'
          }}
        />
      </button>

      {/* Tooltip */}
      <div className={cn(
        'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2',
        'bg-gray-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap',
        'opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10'
      )}>
        {getTooltipText()}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}; 