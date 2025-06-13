/**
 * SearchToggle.tsx
 * 
 * Intuitive toggle component for enabling/disabling web search
 * 
 * Components:
 *   SearchToggle
 * 
 * Features:
 *   - Visual toggle with search icon
 *   - Color-coded states (inactive/active)
 *   - Tooltip explaining search functionality
 *   - Support for forced and optional modes (all models now support search)
 *   - Pricing tier awareness (Perplexity models get different styling)
 * 
 * Usage: <SearchToggle enabled={useSearch} onChange={setUseSearch} webSearchMode={model.webSearchMode} />
 */
import React from 'react';
import { BaseToggle, type BaseToggleProps } from './BaseToggle';

interface SearchToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  webSearchMode: 'forced' | 'optional'; // Removed 'none' since all models now support search
  webSearchPricing?: 'standard' | 'perplexity' | 'openai';
  modelName?: string;
  className?: string;
}

/**
 * SearchToggle component for enabling/disabling web search
 * 
 * @param enabled - Whether search is currently enabled
 * @param onChange - Callback when toggle state changes
 * @param webSearchMode - The web search mode of the current model ('forced' or 'optional')
 * @param webSearchPricing - Pricing tier for web search (affects styling)
 * @param modelName - Name of the current model for tooltip
 * @param className - Additional CSS classes
 * @returns React component
 */
export const SearchToggle: React.FC<SearchToggleProps> = ({
  enabled,
  onChange,
  webSearchMode,
  webSearchPricing = 'standard',
  modelName,
  className
}) => {
  // Different colors based on pricing tier
  const getColors = () => {
    switch (webSearchPricing) {
      case 'perplexity':
        return {
          enabledColors: {
            bg: '#F0FDF4', // Green-50 (cheaper pricing)
            border: '#BBF7D0', // Green-200
            text: '#166534' // Green-800
          },
          forcedColors: {
            bg: '#F0FDF4', // Green-50
            border: '#86EFAC', // Green-300
            text: '#15803D' // Green-700
          }
        };
      case 'openai':
        return {
          enabledColors: {
            bg: '#FEF3C7', // Amber-100 (premium pricing)
            border: '#FCD34D', // Amber-300
            text: '#D97706' // Amber-600
          },
          forcedColors: {
            bg: '#FEF3C7', // Amber-100
            border: '#F59E0B', // Amber-500
            text: '#D97706' // Amber-600
          }
        };
      default: // standard
        return {
          enabledColors: {
            bg: '#EFF6FF', // Blue-50
            border: '#DBEAFE', // Blue-200
            text: '#1D4ED8' // Blue-700
          },
          forcedColors: {
            bg: '#F0F9FF', // Sky-50
            border: '#BAE6FD', // Sky-200
            text: '#0284C7' // Sky-600
          }
        };
    }
  };

  const colors = getColors();

  const baseToggleProps: BaseToggleProps = {
    enabled,
    onChange,
    mode: webSearchMode,
    modelName,
    className,
    icon: '🔍',
    label: 'Web Search',
    forcedLabel: 'Always On',
    tooltipPrefix: 'Web Search',
    enabledColors: colors.enabledColors,
    forcedColors: colors.forcedColors,
    disabledColors: {
      bg: '#F9FAFB', // Gray-50
      border: '#E5E7EB', // Gray-200
      text: '#9CA3AF' // Gray-400
    }
  };

  return <BaseToggle {...baseToggleProps} />;
}; 