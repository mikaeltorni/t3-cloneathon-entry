/**
 * ReasoningToggle.tsx
 * 
 * Intuitive toggle component for enabling/disabling AI reasoning
 * 
 * Components:
 *   ReasoningToggle
 * 
 * Features:
 *   - Visual toggle with brain icon
 *   - Color-coded states (inactive/active)
 *   - Tooltip explaining reasoning functionality
 *   - Disabled state for non-reasoning models
 * 
 * Usage: <ReasoningToggle enabled={useReasoning} onChange={setUseReasoning} disabled={!hasReasoning} />
 */
import React from 'react';
import { cn } from '../../utils/cn';

interface ReasoningToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  modelName?: string;
  className?: string;
}

/**
 * ReasoningToggle component for enabling/disabling AI reasoning
 * 
 * @param enabled - Whether reasoning is currently enabled
 * @param onChange - Callback when toggle state changes
 * @param disabled - Whether the toggle is disabled (model doesn't support reasoning)
 * @param modelName - Name of the current model for tooltip
 * @param className - Additional CSS classes
 * @returns React component
 */
export const ReasoningToggle: React.FC<ReasoningToggleProps> = ({
  enabled,
  onChange,
  disabled = false,
  modelName,
  className
}) => {
  const handleClick = () => {
    if (!disabled) {
      onChange(!enabled);
    }
  };

  const getTooltipText = () => {
    if (disabled) {
      return `${modelName || 'This model'} does not support reasoning`;
    }
    return enabled 
      ? 'Reasoning enabled - AI will show its thinking process'
      : 'Reasoning disabled - Click to enable AI reasoning';
  };

  return (
    <div className={cn('relative group', className)}>
      <button
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-in-out',
          'border focus:outline-none focus:ring-2 focus:ring-offset-1',
          // Enabled state
          enabled && !disabled && [
            'bg-blue-50 border-blue-200 text-blue-700',
            'hover:bg-blue-100 hover:border-blue-300',
            'focus:ring-blue-500',
            'shadow-sm'
          ],
          // Disabled/inactive state
          (!enabled || disabled) && [
            'bg-gray-50 border-gray-200 text-gray-500',
            !disabled && 'hover:bg-gray-100 hover:border-gray-300 hover:text-gray-600',
            'focus:ring-gray-500'
          ],
          // Disabled cursor
          disabled && 'cursor-not-allowed opacity-60',
          !disabled && 'cursor-pointer'
        )}
        title={getTooltipText()}
        aria-label={getTooltipText()}
      >
        {/* Brain icon with animation */}
        <span 
          className={cn(
            'text-base transition-transform duration-200',
            enabled && !disabled && 'scale-110',
            enabled && !disabled && 'animate-pulse'
          )}
        >
          🧠
        </span>
        
        {/* Label text */}
        <span className={cn(
          'font-medium',
          enabled && !disabled && 'text-blue-700',
          (!enabled || disabled) && 'text-gray-500'
        )}>
          {enabled ? 'Reasoning' : 'Reasoning'}
        </span>

        {/* Status indicator */}
        <div 
          className={cn(
            'w-2 h-2 rounded-full transition-colors duration-200',
            enabled && !disabled && 'bg-blue-500',
            (!enabled || disabled) && 'bg-gray-300'
          )}
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