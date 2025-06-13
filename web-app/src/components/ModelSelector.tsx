/**
 * ModelSelector.tsx
 * 
 * Beautiful horizontal model selection with brain and search icons
 * 
 * Components:
 *   ModelSelector
 * 
 * Features:
 *   - Horizontal model buttons with brand colors
 *   - Brain emoji icons with smart opacity (full, half, very low)
 *   - Search emoji icons for web search capabilities
 *   - One-click model switching with visual feedback
 *   - Selected model description below with capabilities
 *   - Automatic sorting by release date (newest first)
 * 
 * Usage: <ModelSelector value={selectedModel} onChange={setSelectedModel} models={availableModels} />
 */
import React, { useMemo } from 'react';
import { cn } from '../utils/cn';
import type { ModelConfig } from '../../../src/shared/types';

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  models: Record<string, ModelConfig>;
  loading?: boolean;
}

/**
 * Horizontal model selector with brain and search icons and beautiful design
 * 
 * @param value - Currently selected model ID
 * @param onChange - Callback when model is selected
 * @param models - Available models configuration
 * @param loading - Loading state
 * @returns React component
 */
export const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  models,
  loading = false
}) => {
  const currentModel = models[value];

  /**
   * Sort models by release date (newest first)
   */
  const sortedModels = useMemo(() => {
    return Object.entries(models).sort(([, a], [, b]) => {
      // Sort by release date descending (newest first)
      return new Date(b.released).getTime() - new Date(a.released).getTime();
    });
  }, [models]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 w-32 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
        <div className="h-6 bg-gray-200 rounded animate-pulse w-64" />
      </div>
    );
  }

  /**
   * Get brain emoji with proper opacity based on reasoning capability
   */
  const getBrainIcon = (model: ModelConfig): React.ReactNode => {
    if (!model.hasReasoning) {
      // Very subtle for no reasoning
      return <span className="opacity-30 text-gray-400">🧠</span>;
    }
    if (model.reasoningMode === 'forced') {
      // Full opacity for forced reasoning
      return <span className="opacity-100 text-purple-600">🧠</span>;
    }
    // Half opacity for optional reasoning
    return <span className="opacity-60 text-blue-600">🧠</span>;
  };

  /**
   * Get search emoji with proper opacity and color based on web search capability
   */
  const getSearchIcon = (model: ModelConfig): React.ReactNode => {
    if (!model.hasWebSearch) {
      // Very subtle for no web search
      return <span className="opacity-30 text-gray-400">🔍</span>;
    }
    
    // Color based on pricing tier
    const colorClass = model.webSearchPricing === 'perplexity' 
      ? 'text-green-600' // Green for cheaper Perplexity pricing
      : model.webSearchPricing === 'openai'
        ? 'text-amber-600' // Amber for premium OpenAI pricing
        : 'text-blue-600'; // Blue for standard pricing

    if (model.webSearchMode === 'forced') {
      // Full opacity for forced web search (like Perplexity models)
      return <span className={cn('opacity-100', colorClass)}>🔍</span>;
    }
    // Half opacity for optional web search
    return <span className={cn('opacity-60', colorClass)}>🔍</span>;
  };

  /**
   * Format release date for display
   */
  const formatReleaseDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  /**
   * Get capability badges for the selected model
   */
  const getCapabilityBadges = (model: ModelConfig): React.ReactNode[] => {
    const badges: React.ReactNode[] = [];

    // Release date badge
    badges.push(
      <span key="release" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
        Released {formatReleaseDate(model.released)}
      </span>
    );

    // Reasoning badge
    if (model.hasReasoning) {
      badges.push(
        <span 
          key="reasoning"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: model.reasoningMode === 'forced' 
              ? '#F3E8FF' // Purple background for forced
              : '#EFF6FF', // Blue background for optional
            color: model.reasoningMode === 'forced'
              ? '#7C3AED' // Purple text for forced
              : '#2563EB' // Blue text for optional
          }}
        >
          🧠 
          {model.reasoningMode === 'forced' ? 'Always Reasoning' : 'Supports Reasoning'}
        </span>
      );
    }

    // Web search badge
    if (model.hasWebSearch) {
      const searchColors = model.webSearchPricing === 'perplexity'
        ? { bg: '#F0FDF4', text: '#166534' } // Green for Perplexity
        : model.webSearchPricing === 'openai'
          ? { bg: '#FEF3C7', text: '#D97706' } // Amber for OpenAI
          : { bg: '#EFF6FF', text: '#2563EB' }; // Blue for standard

      badges.push(
        <span 
          key="search"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: searchColors.bg,
            color: searchColors.text
          }}
        >
          🔍 
          {model.webSearchMode === 'forced' 
            ? 'Built-in Web Search' 
            : 'Web Search Available'}
          {model.webSearchPricing === 'perplexity' && ' (Cheaper)'}
          {model.webSearchPricing === 'openai' && ' (Premium)'}
        </span>
      );
    }

    return badges;
  };

  return (
    <div className="space-y-3">
      {/* Horizontal Model Buttons - Sorted by Release Date */}
      <div className="flex flex-wrap gap-2">
        {sortedModels.map(([modelId, model]) => {
          const isSelected = value === modelId;
          
          return (
            <button
              key={modelId}
              type="button"
              onClick={() => onChange(modelId)}
              disabled={loading}
              className={cn(
                'flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200',
                'border-2 hover:scale-105 hover:shadow-md',
                isSelected
                  ? 'shadow-lg transform scale-105'
                  : 'hover:shadow-sm bg-white',
                loading && 'opacity-50 cursor-not-allowed'
              )}
              style={{
                backgroundColor: isSelected ? model.bgColor : '#ffffff',
                borderColor: isSelected ? model.color : '#e5e7eb',
                color: isSelected ? model.textColor : '#374151',
              }}
            >
              {/* Model Name */}
              <span className="text-sm font-semibold">
                {model.name}
              </span>
              
              {/* Icons: Brain and Search */}
              <div className="flex items-center gap-1">
                {getBrainIcon(model)}
                {getSearchIcon(model)}
              </div>

              {/* Active Indicator Dot */}
              {isSelected && (
                <div 
                  className="w-2 h-2 rounded-full ml-1"
                  style={{ backgroundColor: model.color }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Model Description & Info */}
      {currentModel && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-start justify-between">
            {/* Left: Description */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: currentModel.color }}
                />
                <span className="font-semibold text-gray-900">
                  {currentModel.name}
                </span>
              </div>
              
              {/* Capability Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {getCapabilityBadges(currentModel)}
              </div>
              
              <p className="text-sm text-gray-600">
                {currentModel.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 