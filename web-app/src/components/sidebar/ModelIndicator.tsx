/**
 * ModelIndicator.tsx
 * 
 * Component for displaying model information in threads
 * 
 * Components:
 *   ModelIndicator - Model display with color coding and name
 * 
 * Usage: <ModelIndicator model={modelConfig} isSelected={isSelected} />
 */

import React from 'react';
import { cn } from '../../utils/cn';
import type { ModelConfig } from '../../../../src/shared/types';

/**
 * Props for the ModelIndicator component
 */
interface ModelIndicatorProps {
  /** Model configuration */
  model: ModelConfig;
  /** Whether the thread is selected */
  isSelected?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Component for displaying model information with color coding
 * 
 * @param model - Model configuration object
 * @param isSelected - Whether the parent thread is selected
 * @param size - Size variant for the indicator
 * @param className - Additional CSS classes
 * @returns JSX element containing the model indicator
 */
export const ModelIndicator: React.FC<ModelIndicatorProps> = ({
  model,
  isSelected = false,
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: {
      dot: 'w-2 h-2',
      container: 'text-xs px-2 py-0.5',
      spacing: 'mr-1.5'
    },
    md: {
      dot: 'w-2.5 h-2.5',
      container: 'text-xs px-2.5 py-1',
      spacing: 'mr-2'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className={cn('flex items-center', className)}>
      <div 
        className={cn(
          'rounded-full flex-shrink-0 shadow-sm',
          classes.dot,
          classes.spacing
        )}
        style={{ backgroundColor: model.color }}
        aria-hidden="true"
      />
      <span 
        className={cn(
          'font-medium rounded-full truncate transition-colors duration-200 border',
          classes.container,
          isSelected 
            ? 'shadow-sm' 
            : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700'
        )}
        style={{
          backgroundColor: isSelected ? model.bgColor : undefined,
          color: isSelected ? model.textColor : undefined,
          borderColor: isSelected ? model.color : undefined
        }}
        title={`Model: ${model.name}`}
      >
        {model.name}
      </span>
    </div>
  );
}; 