/**
 * ProgressBar.tsx
 * 
 * Reusable progress bar component for file uploads and other progress indicators
 * 
 * Components:
 *   ProgressBar
 * 
 * Usage: <ProgressBar progress={75} className="w-full" />
 */
import React from 'react';
import { cn } from '../../utils/cn';

interface ProgressBarProps {
  /** Progress value from 0 to 100 */
  progress: number;
  /** Color variant for the progress bar */
  variant?: 'default' | 'success' | 'warning' | 'error';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show percentage text */
  showPercentage?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether to animate the progress */
  animated?: boolean;
}

/**
 * Progress bar component
 * 
 * @param progress - Progress value (0-100)
 * @param variant - Color variant
 * @param size - Size variant
 * @param showPercentage - Whether to show percentage text
 * @param className - Additional CSS classes
 * @param animated - Whether to animate the progress
 * @returns React component
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  variant = 'default',
  size = 'md',
  showPercentage = false,
  className,
  animated = true
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };
  
  const variantClasses = {
    default: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  return (
    <div className={cn('w-full', className)}>
      {showPercentage && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600">Progress</span>
          <span className="text-xs text-gray-600">{Math.round(clampedProgress)}%</span>
        </div>
      )}
      
      <div className={cn(
        'w-full bg-gray-200 rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <div 
          className={cn(
            'h-full rounded-full',
            variantClasses[variant],
            animated && 'transition-all duration-300 ease-out'
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}; 