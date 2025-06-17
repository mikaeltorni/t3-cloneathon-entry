/**
 * ReasoningControls.tsx
 * 
 * Component for managing reasoning options and effort levels
 * Enhanced with comprehensive dark mode support and improved layout consistency
 * 
 * Components:
 *   ReasoningControls
 * 
 * Usage: <ReasoningControls useReasoning={useReasoning} reasoningEffort={reasoningEffort} ... />
 */
import React from 'react';
import { ReasoningToggle } from '../ui/ReasoningToggle';
import { cn } from '../../utils/cn';
import type { ModelConfig } from '../../../../src/shared/types';

interface ReasoningControlsProps {
  selectedModel: string;
  availableModels: Record<string, ModelConfig>;
  useReasoning: boolean;
  reasoningEffort: 'low' | 'medium' | 'high';
  onUseReasoningChange: (value: boolean) => void;
  onReasoningEffortChange: (value: 'low' | 'medium' | 'high') => void;
  isReasoningModel: () => boolean;
  supportsEffortControl: () => boolean;
}

/**
 * Reasoning controls for reasoning models
 * Enhanced with comprehensive dark mode support and improved layout consistency
 * 
 * @param selectedModel - Currently selected model ID
 * @param availableModels - Available model configurations
 * @param useReasoning - Whether reasoning is enabled
 * @param reasoningEffort - Current reasoning effort level
 * @param onUseReasoningChange - Callback for reasoning toggle
 * @param onReasoningEffortChange - Callback for effort level change
 * @param isReasoningModel - Function to check if current model supports reasoning
 * @param supportsEffortControl - Function to check if model supports effort control
 * @returns React component
 */
export const ReasoningControls: React.FC<ReasoningControlsProps> = ({
  selectedModel,
  availableModels,
  useReasoning,
  reasoningEffort,
  onUseReasoningChange,
  onReasoningEffortChange,
  isReasoningModel,
  supportsEffortControl
}) => {
  if (!isReasoningModel()) {
    return null;
  }

  const model = availableModels[selectedModel];

  const handleEffortDecrease = (e: React.MouseEvent) => {
    e.preventDefault();
    const levels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    const currentIndex = levels.indexOf(reasoningEffort);
    const prevIndex = currentIndex === 0 ? levels.length - 1 : currentIndex - 1;
    onReasoningEffortChange(levels[prevIndex]);
  };

  const handleEffortIncrease = (e: React.MouseEvent) => {
    e.preventDefault();
    const levels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    const currentIndex = levels.indexOf(reasoningEffort);
    const nextIndex = (currentIndex + 1) % levels.length;
    onReasoningEffortChange(levels[nextIndex]);
  };

  return (
    <div className="flex items-center justify-start flex-wrap gap-3 mb-3">
      {/* Reasoning Toggle - ONLY for Models with Optional Reasoning */}
      {model?.reasoningMode === 'optional' && (
        <div className="flex-shrink-0">
          <ReasoningToggle
            enabled={useReasoning}
            onChange={onUseReasoningChange}
            reasoningMode={model.reasoningMode}
            modelName={model.name}
          />
        </div>
      )}
      
      {/* Inline Reasoning Effort Level Display - Styled to match search controls */}
      {supportsEffortControl() && (
        <div className={cn(
          'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 flex-shrink-0',
          'border shadow-sm',
          // Use grey styling to match search controls instead of blue
          useReasoning 
            ? 'opacity-100 bg-gray-50 border-gray-200 dark:bg-slate-700 dark:border-slate-600' 
            : 'opacity-40 bg-gray-50 border-gray-200 dark:bg-slate-700 dark:border-slate-600'
        )}>
          <span className="text-xs font-medium text-gray-600 dark:text-slate-300">
            reasoning:
          </span>
          <div className="flex items-center space-x-1">
            <span className="text-base">
              {reasoningEffort === 'low' ? '⚡' : reasoningEffort === 'medium' ? '⚖️' : '🧠'}
            </span>
            <span className={cn(
              'text-xs font-medium',
              reasoningEffort === 'low' && 'text-green-600 dark:text-green-400',
              reasoningEffort === 'medium' && 'text-yellow-600 dark:text-yellow-400',
              reasoningEffort === 'high' && 'text-blue-600 dark:text-blue-400'
            )}>
              {reasoningEffort}
            </span>
          </div>
          
          {/* Left/Right arrows to adjust effort level - Enhanced with dark mode */}
          <div className="flex items-center space-x-0.5 ml-1">
            <button
              type="button"
              onClick={handleEffortDecrease}
              className={cn(
                'text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200',
                'transition-colors duration-150 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-slate-600'
              )}
              title="Decrease reasoning effort"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              type="button"
              onClick={handleEffortIncrease}
              className={cn(
                'text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200',
                'transition-colors duration-150 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-slate-600'
              )}
              title="Increase reasoning effort"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 