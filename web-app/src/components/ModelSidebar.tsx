/**
 * ModelSidebar.tsx
 * 
 * Right-side model selection sidebar with hover-to-reveal functionality
 * 
 * Components:
 *   ModelSidebar
 * 
 * Features:
 *   - Right-side positioned sidebar that slides out on hover
 *   - Vertical model selection with brand colors and icons
 *   - Brain emoji icons with smart opacity (full, half, very low)
 *   - One-click model switching with visual feedback
 *   - Selected model description in collapsed state
 *   - Automatic sorting by release date (newest first)
 *   - Smooth animations and transitions
 *   - Compact tab when collapsed, full sidebar when expanded
 * 
 * Usage: <ModelSidebar value={selectedModel} onChange={setSelectedModel} models={availableModels} />
 */
import React, { useState, useMemo } from 'react';
import { cn } from '../utils/cn';
import type { ModelConfig } from '../../../src/shared/types';

interface ModelSidebarProps {
  value: string;
  onChange: (modelId: string) => void;
  models: Record<string, ModelConfig>;
  loading?: boolean;
  className?: string;
}

/**
 * Right-side model selection sidebar with hover-to-reveal functionality
 * 
 * @param value - Currently selected model ID
 * @param onChange - Callback when model is selected
 * @param models - Available models configuration
 * @param loading - Loading state
 * @param className - Additional CSS classes
 * @returns React component
 */
export const ModelSidebar: React.FC<ModelSidebarProps> = ({
  value,
  onChange,
  models,
  loading = false,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
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
   * Get capability badges for a model (compact version)
   */
  const getCapabilityBadges = (model: ModelConfig): React.ReactNode[] => {
    const badges: React.ReactNode[] = [];

    // Release date badge
    badges.push(
      <span key="release" className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
        {formatReleaseDate(model.released)}
      </span>
    );

    // Reasoning badge (compact)
    if (model.hasReasoning) {
      badges.push(
        <span 
          key="reasoning"
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium"
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
          {model.reasoningMode === 'forced' ? 'Always' : 'Optional'}
        </span>
      );
    }

    // Web search badge - compact pricing tier info
    if (model.webSearchPricing === 'perplexity') {
      badges.push(
        <span 
          key="search"
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"
        >
          🔍 Cheap
        </span>
      );
    } else if (model.webSearchPricing === 'openai') {
      badges.push(
        <span 
          key="search"
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700"
        >
          🔍 Premium
        </span>
      );
    }

    return badges;
  };

  if (loading) {
    return (
      <div className={cn(
        'fixed right-0 top-0 h-full z-50 transition-all duration-300',
        isExpanded ? 'w-80' : 'w-16',
        className
      )}>
        <div className="bg-white border-l border-gray-200 shadow-lg h-full p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-12 bg-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'fixed right-0 top-0 h-full z-50 transition-all duration-300 ease-in-out',
        isExpanded ? 'w-80' : 'w-16',
        className
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="bg-white border-l border-gray-200 shadow-lg h-full overflow-hidden">
        {/* Collapsed Tab - Shows Current Model */}
        <div 
          className={cn(
            'transition-all duration-300',
            isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
          )}
        >
          <div className="p-2 border-b border-gray-100">
            <div className="flex flex-col items-center text-center">
              {/* Vertical "Models" Text */}
              <div className="writing-mode-vertical text-xs font-medium text-gray-500 mb-2 transform rotate-180">
                Models
              </div>
              
              {/* Current Model Indicator */}
              {currentModel && (
                <div className="flex flex-col items-center gap-1">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: currentModel.color }}
                  >
                    {currentModel.name.charAt(0)}
                  </div>
                  {getBrainIcon(currentModel)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Sidebar Content */}
        <div 
          className={cn(
            'transition-all duration-300 h-full',
            isExpanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          )}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Select Model</h3>
              <p className="text-sm text-gray-600">Choose your AI assistant</p>
            </div>

            {/* Model List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {sortedModels.map(([modelId, model]) => {
                const isSelected = value === modelId;
                
                return (
                  <button
                    key={modelId}
                    type="button"
                    onClick={() => onChange(modelId)}
                    disabled={loading}
                    className={cn(
                      'w-full flex flex-col p-3 rounded-lg font-medium transition-all duration-200',
                      'border-2 hover:scale-[1.02] hover:shadow-md text-left',
                      isSelected
                        ? 'shadow-lg transform scale-[1.02]'
                        : 'hover:shadow-sm bg-white',
                      loading && 'opacity-50 cursor-not-allowed'
                    )}
                    style={{
                      backgroundColor: isSelected ? model.bgColor : '#ffffff',
                      borderColor: isSelected ? model.color : '#e5e7eb',
                      color: isSelected ? model.textColor : '#374151',
                    }}
                  >
                    {/* Model Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {model.name}
                        </span>
                        {getBrainIcon(model)}
                      </div>
                      
                      {/* Active Indicator */}
                      {isSelected && (
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: model.color }}
                        />
                      )}
                    </div>

                    {/* Capability Badges */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {getCapabilityBadges(model)}
                    </div>

                    {/* Model Description (truncated) */}
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {model.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Footer - Current Model Details */}
            {currentModel && (
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentModel.color }}
                  />
                  <span className="font-semibold text-gray-900 text-sm">
                    Currently Selected
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {currentModel.name} - {currentModel.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 