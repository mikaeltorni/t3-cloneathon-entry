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
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useLogger } from '../hooks/useLogger';
import type { ModelConfig } from '../../../src/shared/types';

interface ModelSidebarProps {
  value: string;
  onChange: (modelId: string) => void;
  models: Record<string, ModelConfig>;
  loading?: boolean;
  className?: string;
  inputBarHeight?: number; // Height of the input bar to avoid overlap
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
  className,
  inputBarHeight = 300 // Default fallback height
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pinningModel, setPinningModel] = useState<string | null>(null);
  
  const { pinnedModels, toggleModelPin } = useUserPreferences();
  const { debug, warn } = useLogger('ModelSidebar');

  /**
   * Handle model pin toggle
   */
  const handleTogglePin = async (modelId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent model selection
    
    try {
      setPinningModel(modelId);
      debug(`Toggling pin for model: ${modelId}`);
      await toggleModelPin(modelId);
    } catch (error) {
      warn(`Failed to toggle pin for model ${modelId}`, error as Error);
    } finally {
      setPinningModel(null);
    }
  };

  /**
   * Sort models with pinned models first, then by release date
   */
  const sortedModels = useMemo(() => {
    return Object.entries(models).sort(([aId, a], [bId, b]) => {
      const aIsPinned = pinnedModels.includes(aId);
      const bIsPinned = pinnedModels.includes(bId);
      
      // First, sort by pinned status (pinned models first)
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      
      // Then sort by release date descending (newest first)
      return new Date(b.released).getTime() - new Date(a.released).getTime();
    });
  }, [models, pinnedModels]);

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
      <div 
        className={cn(
          'fixed right-0 top-0 z-50 transition-all duration-300',
          isExpanded ? 'w-80' : 'w-16',
          className
        )}
        style={{
          // Dynamic height that scales with screen size (70% of available height)
          height: `calc(70vh - ${Math.floor(inputBarHeight * 0.3)}px)`,
          maxHeight: '600px' // Prevent it from getting too tall on large screens
        }}
      >
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
        'fixed right-0 z-50 transition-all duration-300 ease-in-out',
        isExpanded ? 'w-80' : 'w-16',
        className
      )}
      style={{
        // Dynamic height that scales with screen size (70% of available height)
        height: `calc(70vh - ${Math.floor(inputBarHeight * 0.3)}px)`,
        maxHeight: '600px', // Prevent it from getting too tall on large screens
        top: '5vh', // Start 5% from the top of the screen
        bottom: 'auto' // Allow it to be positioned from top
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="bg-white border-l border-gray-200 shadow-lg h-full overflow-hidden">
        {/* Collapsed Tab - Clean blank bar */}
        <div 
          className={cn(
            'transition-all duration-300',
            isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
          )}
        >
          {/* Empty div for clean blank appearance */}
          <div className="h-full"></div>
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
                const isPinned = pinnedModels.includes(modelId);
                const isPinning = pinningModel === modelId;
                
                return (
                  <div key={modelId} className="relative group">
                    <button
                      type="button"
                      onClick={() => onChange(modelId)}
                      disabled={loading}
                      className={cn(
                        'w-full flex flex-col p-3 rounded-lg font-medium transition-all duration-200',
                        'border-2 hover:scale-[1.02] hover:shadow-md text-left',
                        isSelected
                          ? 'shadow-lg transform scale-[1.02]'
                          : 'hover:shadow-sm bg-white',
                        isPinned && 'ring-2 ring-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50',
                        loading && 'opacity-50 cursor-not-allowed'
                      )}
                      style={{
                        backgroundColor: isSelected ? model.bgColor : (isPinned ? undefined : '#ffffff'),
                        borderColor: isSelected ? model.color : (isPinned ? '#f59e0b' : '#e5e7eb'),
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

                    {/* Pin Button - Appears on hover */}
                    <button
                      onClick={(e) => handleTogglePin(modelId, e)}
                      disabled={isPinning}
                      className={cn(
                        'absolute top-2 right-2 p-1.5 rounded-lg transition-all duration-200',
                        isPinned
                          ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-100 opacity-100'
                          : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-amber-600 hover:bg-amber-50',
                        'z-10'
                      )}
                      title={isPinned ? 'Unpin model' : 'Pin to top'}
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
                  </div>
                );
              })}
            </div>

            {/* Footer - Model Stats Only */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="text-xs text-gray-500 text-center">
                {Object.keys(models).length} models available
                {pinnedModels.length > 0 && (
                  <span className="text-amber-600 ml-1">
                    • {pinnedModels.length} pinned
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 