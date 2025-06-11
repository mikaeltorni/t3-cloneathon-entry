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
 * Usage: <ReasoningToggle enabled={useReasoning} onChange={setUseReasoning} reasoningMode={model.reasoningMode} />
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
  const isTogglable = reasoningMode === 'optional';

  const handleClick = () => {
    if (isTogglable) {
      onChange(!enabled);
    }
  };

  const getTooltipText = () => {
    switch (reasoningMode) {
      case 'none':
        return `${modelName || 'This model'} does not support reasoning`;
      case 'forced':
        return `${modelName || 'This model'} always uses reasoning (cannot be disabled)`;
      case 'optional':
        return enabled 
          ? 'Reasoning enabled - AI will show its thinking process'
          : 'Reasoning disabled - Click to enable AI reasoning';
      default:
        return '';
    }
  };

  return (
    <div className={cn('relative group', className)}>
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-in-out',
          'border focus:outline-none focus:ring-2 focus:ring-offset-1',
          // Active reasoning (enabled optional or forced)
          (enabled || isForced) && !isDisabled && [
            'bg-blue-50 border-blue-200 text-blue-700',
            isTogglable && 'hover:bg-blue-100 hover:border-blue-300',
            'focus:ring-blue-500',
            'shadow-sm'
          ],
          // Forced reasoning (always on, different styling)
          isForced && [
            'bg-purple-50 border-purple-200 text-purple-700',
            'cursor-default'
          ],
          // Inactive optional reasoning
          !enabled && isTogglable && [
            'bg-gray-50 border-gray-200 text-gray-500',
            'hover:bg-gray-100 hover:border-gray-300 hover:text-gray-600',
            'focus:ring-gray-500',
            'cursor-pointer'
          ],
          // Disabled (no reasoning support)
          isDisabled && [
            'bg-gray-50 border-gray-200 text-gray-400',
            'cursor-not-allowed opacity-60'
          ]
        )}
        title={getTooltipText()}
        aria-label={getTooltipText()}
      >
        {/* Brain icon with animation */}
        <span 
          className={cn(
            'text-base transition-transform duration-200',
            (enabled || isForced) && !isDisabled && 'scale-110',
            (enabled || isForced) && !isDisabled && 'animate-pulse'
          )}
        >
          🧠
        </span>
        
        {/* Label text */}
        <span className={cn(
          'font-medium',
          (enabled || isForced) && !isDisabled && (isForced ? 'text-purple-700' : 'text-blue-700'),
          (!enabled && !isForced) && 'text-gray-500'
        )}>
          {isForced ? 'Always On' : (enabled ? 'Reasoning' : 'Reasoning')}
        </span>

        {/* Status indicator */}
        <div 
          className={cn(
            'w-2 h-2 rounded-full transition-colors duration-200',
            (enabled || isForced) && !isDisabled && (isForced ? 'bg-purple-500' : 'bg-blue-500'),
            (!enabled && !isForced) && 'bg-gray-300'
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