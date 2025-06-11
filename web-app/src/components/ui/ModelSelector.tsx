/**
 * ModelSelector.tsx
 * 
 * AI model selection component with descriptions and indicators
 * 
 * Components:
 *   ModelSelector
 * 
 * Features:
 *   - Dropdown selection of available AI models
 *   - Model descriptions and type indicators
 *   - Reasoning model badges
 * 
 * Usage: <ModelSelector value={selectedModel} onChange={handleModelChange} models={availableModels} />
 */
import React from 'react';
import { cn } from '../../utils/cn';
import type { ModelConfig } from '../../../../src/shared/types';

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  models: Record<string, ModelConfig>;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * AI model selector component
 * 
 * @param value - Currently selected model ID
 * @param onChange - Callback when model selection changes
 * @param models - Available models configuration
 * @param loading - Loading state
 * @param disabled - Disabled state
 * @param className - Additional CSS classes
 * @returns React component
 */
export const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  models,
  loading = false,
  disabled = false,
  className
}) => {
  /**
   * Get model type badge color
   * 
   * @param type - Model type
   * @returns CSS classes for badge color
   */
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reasoning':
        return 'bg-purple-100 text-purple-800';
      case 'general':
        return 'bg-blue-100 text-blue-800';
      case 'creative':
        return 'bg-green-100 text-green-800';
      case 'coding':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };



  if (loading) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-500">Loading models...</span>
      </div>
    );
  }

  const selectedModel = models[value];

  return (
    <div className={cn('relative', className)}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        AI Model
      </label>
      
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className={cn(
          'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          'transition-colors duration-200'
        )}
      >
        {Object.entries(models).map(([modelId, config]) => (
          <option key={modelId} value={modelId}>
            {config.name} - {config.type}
          </option>
        ))}
      </select>

      {/* Selected model info */}
      {selectedModel && (
        <div className="mt-2 p-2 bg-gray-50 rounded-md">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-900">
              {selectedModel.name}
            </span>
            <span className={cn(
              'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
              getTypeColor(selectedModel.type)
            )}>
              {selectedModel.type.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            {selectedModel.description}
          </p>
        </div>
      )}
    </div>
  );
}; 