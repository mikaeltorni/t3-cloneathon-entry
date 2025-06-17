/**
 * SearchControls.tsx
 * 
 * Component for managing web search options and effort levels
 * 
 * Components:
 *   SearchControls
 * 
 * Usage: <SearchControls useWebSearch={useWebSearch} webSearchEffort={webSearchEffort} ... />
 */
import React from 'react';
import { SearchToggle } from '../ui/SearchToggle';
import { cn } from '../../utils/cn';
import type { ModelConfig } from '../../../../src/shared/types';

interface SearchControlsProps {
  selectedModel: string;
  availableModels: Record<string, ModelConfig>;
  useWebSearch: boolean;
  webSearchEffort: 'low' | 'medium' | 'high';
  onUseWebSearchChange: (value: boolean) => void;
  onWebSearchEffortChange: (value: 'low' | 'medium' | 'high') => void;
  supportsWebEffortControl: () => boolean;
}

/**
 * Web search controls for models that support search
 * 
 * @param selectedModel - Currently selected model ID
 * @param availableModels - Available model configurations
 * @param useWebSearch - Whether web search is enabled
 * @param webSearchEffort - Current web search effort level
 * @param onUseWebSearchChange - Callback for search toggle
 * @param onWebSearchEffortChange - Callback for effort level change
 * @param supportsWebEffortControl - Function to check if model supports search effort control
 * @returns React component
 */
export const SearchControls: React.FC<SearchControlsProps> = ({
  selectedModel,
  availableModels,
  useWebSearch,
  webSearchEffort,
  onUseWebSearchChange,
  onWebSearchEffortChange,
  supportsWebEffortControl
}) => {
  const model = availableModels[selectedModel];

  if (!model) {
    return null;
  }

  const handleEffortDecrease = (e: React.MouseEvent) => {
    e.preventDefault();
    const levels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    const currentIndex = levels.indexOf(webSearchEffort);
    const prevIndex = currentIndex === 0 ? levels.length - 1 : currentIndex - 1;
    onWebSearchEffortChange(levels[prevIndex]);
  };

  const handleEffortIncrease = (e: React.MouseEvent) => {
    e.preventDefault();
    const levels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    const currentIndex = levels.indexOf(webSearchEffort);
    const nextIndex = (currentIndex + 1) % levels.length;
    onWebSearchEffortChange(levels[nextIndex]);
  };

  return (
    <div 
      className="flex items-center flex-wrap gap-3 mb-3"
    >
      {/* Web Search Toggle */}
      <SearchToggle
        enabled={useWebSearch}
        onChange={onUseWebSearchChange}
        webSearchMode={
          model.webSearchMode === 'none' 
            ? 'optional' 
            : model.webSearchMode as 'forced' | 'optional'
        }
        webSearchPricing={model?.webSearchPricing}
        modelName={model?.name}
      />

      {/* Inline Web Search Effort Level Display */}
      {supportsWebEffortControl() && (
        <div className={cn(
          'flex items-center space-x-2 px-2 py-1 rounded-md text-sm transition-all duration-200',
          useWebSearch 
            ? 'opacity-100 bg-green-50 border border-green-200' 
            : 'opacity-30 bg-gray-50 border border-gray-200'
        )}>
          <span className="text-xs font-medium text-gray-600">search:</span>
          <div className="flex items-center space-x-1">
            <span className="text-base">
              {webSearchEffort === 'low' ? '⚡' : webSearchEffort === 'medium' ? '⚖️' : '🔍'}
            </span>
            <span className={cn(
              'text-xs font-medium',
              webSearchEffort === 'low' && 'text-green-600',
              webSearchEffort === 'medium' && 'text-yellow-600',
              webSearchEffort === 'high' && 'text-blue-600'
            )}>
              {webSearchEffort}
            </span>
          </div>
          
          {/* Left/Right arrows to adjust effort level */}
          {useWebSearch && (
            <div className="flex items-center space-x-0.5 ml-1">
              <button
                type="button"
                onClick={handleEffortDecrease}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-150 p-0.5"
                title="Decrease search context size"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                type="button"
                onClick={handleEffortIncrease}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-150 p-0.5"
                title="Increase search context size"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 