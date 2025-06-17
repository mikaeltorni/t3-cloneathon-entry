/**
 * ModelIndicator.tsx
 * 
 * Clickable component for displaying currently selected model information and opening model selector
 * Enhanced with comprehensive dark mode support
 * 
 * Components:
 *   ModelIndicator
 * 
 * Usage: <ModelIndicator selectedModel={selectedModel} availableModels={availableModels} onClick={openModelSidebar} />
 */
import React from 'react';
import { cn } from '../../utils/cn';
import type { ModelConfig } from '../../../../src/shared/types';

interface ModelIndicatorProps {
  selectedModel: string;
  availableModels: Record<string, ModelConfig>;
  onClick: () => void;
  loading?: boolean;
  className?: string;
  disabled?: boolean;
}

/**
 * Clickable component that displays the currently selected model and opens the model selector
 * Enhanced with comprehensive dark mode support
 * 
 * @param selectedModel - Currently selected model ID
 * @param availableModels - Available model configurations
 * @param onClick - Callback to open the model selector/sidebar
 * @param loading - Loading state
 * @param className - Additional CSS classes
 * @param disabled - Whether the button is disabled
 * @returns React component
 */
export const ModelIndicator: React.FC<ModelIndicatorProps> = ({
  selectedModel,
  availableModels,
  onClick,
  loading = false,
  className,
  disabled = false
}) => {
  const model = availableModels[selectedModel];

  if (!model) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        // Base button styles with dark mode support
        'w-full p-3 rounded-lg mb-3 text-left transition-all duration-200',
        'bg-gray-50 border border-gray-200 dark:bg-slate-800 dark:border-slate-600',
        // Hover states with dark mode
        'hover:bg-gray-100 hover:border-gray-300 hover:shadow-sm',
        'dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:shadow-lg',
        // Focus states with dark mode
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'dark:focus:ring-primary-400 dark:focus:ring-offset-slate-900',
        // Active states with dark mode
        'active:bg-gray-200 active:scale-[0.98]',
        'dark:active:bg-slate-600',
        // Disabled state with dark mode
        disabled || loading 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer',
        className
      )}
      aria-label={`Current model: ${model.name}. Click to change model.`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: model.color }}
            aria-hidden="true"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-slate-200 truncate">
            Current Model: {model.name}
          </span>
        </div>
        
        {/* Dropdown arrow and click hint with dark mode */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-500 dark:text-slate-400 hidden sm:inline">
            Click to change
          </span>
          <svg
            className={cn(
              'w-4 h-4 text-gray-400 dark:text-slate-500 transition-transform duration-200',
              loading && 'animate-spin'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {loading ? (
              // Loading spinner
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            ) : (
              // Dropdown arrow
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            )}
          </svg>
        </div>
      </div>
      
      {/* Model Description with dark mode */}
      <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed pr-8">
        {model.description}
      </p>
    </button>
  );
}; 