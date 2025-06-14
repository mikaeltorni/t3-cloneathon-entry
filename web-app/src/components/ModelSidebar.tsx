/**
 * ModelSidebar.tsx
 * 
 * Right-side model selection sidebar with hover-to-reveal functionality
 * Now refactored with smaller, focused sub-components
 * 
 * Components:
 *   ModelSidebar - Main sidebar container using sub-components
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
import React, { useState } from 'react';
import { cn } from '../utils/cn';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useLogger } from '../hooks/useLogger';
import { ModelSidebarStates } from './model/ModelSidebarStates';
import { ModelList } from './model/ModelList';
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

  if (loading) {
    return (
      <div 
        className={cn(
          'fixed right-0 top-0 z-50 transition-all duration-300',
          isExpanded ? 'w-80' : 'w-16',
          className
        )}
        style={{
          top: '0',
          height: `calc(100vh - ${inputBarHeight + 20}px)`,
          bottom: 'auto'
        }}
      >
        <ModelSidebarStates.Loading />
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
        top: '0',
        height: `calc(100vh - ${inputBarHeight + 20}px)`,
        bottom: 'auto'
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
            <ModelSidebarStates.Header />

            {/* Model List */}
            <ModelList
              models={models}
              value={value}
              pinnedModels={pinnedModels}
              pinningModel={pinningModel}
              loading={loading}
              onChange={onChange}
              onTogglePin={handleTogglePin}
            />

            {/* Footer */}
            <ModelSidebarStates.Footer
              modelCount={Object.keys(models).length}
              pinnedCount={pinnedModels.length}
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 