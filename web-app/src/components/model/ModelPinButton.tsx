/**
 * ModelPinButton.tsx
 * 
 * Component for model pin/unpin button with loading states
 * 
 * Components:
 *   ModelPinButton - Pin button with loading states and hover behavior
 * 
 * Usage: <ModelPinButton modelId={modelId} isPinned={isPinned} onToggle={onToggle} />
 */

import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Props for the ModelPinButton component
 */
interface ModelPinButtonProps {
  /** Model ID */
  modelId: string;
  /** Whether the model is pinned */
  isPinned: boolean;
  /** Whether the model is being pinned/unpinned */
  isPinning: boolean;
  /** Callback for pin toggle */
  onToggle: (modelId: string, event: React.MouseEvent) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Model pin/unpin button component with loading states
 * 
 * @param modelId - Model ID
 * @param isPinned - Whether the model is pinned
 * @param isPinning - Whether the model is being pinned/unpinned
 * @param onToggle - Callback for pin toggle
 * @param className - Additional CSS classes
 * @returns JSX element containing the pin button
 */
export const ModelPinButton: React.FC<ModelPinButtonProps> = ({
  modelId,
  isPinned,
  isPinning,
  onToggle,
  className
}) => {
  return (
    <button
      onClick={(e) => onToggle(modelId, e)}
      disabled={isPinning}
      className={cn(
        'absolute top-2 right-2 p-1.5 rounded-lg transition-all duration-200',
        isPinned
          ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-100 opacity-100'
          : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-amber-600 hover:bg-amber-50',
        'z-10',
        className
      )}
      title={isPinned ? 'Unpin model' : 'Pin to top'}
      aria-label={isPinned ? 'Unpin model' : 'Pin model to top'}
    >
      {isPinning ? (
        <div className="animate-spin h-3 w-3 border border-amber-600 border-t-transparent rounded-full" />
      ) : isPinned ? (
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,4V2H10V4H4V6H5.5L6.5,17H17.5L18.5,6H20V4H14M12,7.1L16.05,11.5L15.6,12.5L12,10.4L8.4,12.5L7.95,11.5L12,7.1Z" />
        </svg>
      ) : (
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )}
    </button>
  );
}; 