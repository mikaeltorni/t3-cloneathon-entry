/**
 * SearchToggle.tsx
 * 
 * Search toggle component for enabling/disabling web search
 * Enhanced with comprehensive dark mode support
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
 * Usage: <SearchToggle enabled={value} onChange={setValue} webSearchMode="optional" />
 */
import React from 'react';
import { BaseToggle, type BaseToggleProps } from './BaseToggle';

interface SearchToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  webSearchMode: 'forced' | 'optional' | 'none';
  webSearchPricing?: 'standard' | 'perplexity' | 'openai';
  modelName?: string;
  className?: string;
}

/**
 * SearchToggle component for enabling/disabling web search
 * Enhanced with dark mode support
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
  // Different colors based on pricing tier with dark mode support
  const getColors = () => {
    switch (webSearchPricing) {
      case 'perplexity':
        return {
          enabledColors: {
            bg: '#F0FDF4', // Green-50 (cheaper pricing)
            bgDark: '#14532d', // Green-900
            border: '#BBF7D0', // Green-200
            borderDark: '#22c55e', // Green-500
            text: '#166534', // Green-800
            textDark: '#4ade80' // Green-400
          },
          forcedColors: {
            bg: '#F0FDF4', // Green-50
            bgDark: '#14532d', // Green-900
            border: '#86EFAC', // Green-300
            borderDark: '#16a34a', // Green-600
            text: '#15803D', // Green-700
            textDark: '#22c55e' // Green-500
          }
        };
      case 'openai':
        return {
          enabledColors: {
            bg: '#FEF3C7', // Amber-100 (premium pricing)
            bgDark: '#92400e', // Amber-800
            border: '#FCD34D', // Amber-300
            borderDark: '#f59e0b', // Amber-500
            text: '#D97706', // Amber-600
            textDark: '#fbbf24' // Amber-400
          },
          forcedColors: {
            bg: '#FEF3C7', // Amber-100
            bgDark: '#92400e', // Amber-800
            border: '#F59E0B', // Amber-500
            borderDark: '#d97706', // Amber-600
            text: '#D97706', // Amber-600
            textDark: '#f59e0b' // Amber-500
          }
        };
      default: // standard
        return {
          enabledColors: {
            bg: '#EFF6FF', // Blue-50
            bgDark: '#1e3a8a', // Blue-900
            border: '#DBEAFE', // Blue-200
            borderDark: '#3b82f6', // Blue-500
            text: '#1D4ED8', // Blue-700
            textDark: '#60a5fa' // Blue-400
          },
          forcedColors: {
            bg: '#F0F9FF', // Sky-50
            bgDark: '#0c4a6e', // Sky-900
            border: '#BAE6FD', // Sky-200
            borderDark: '#0ea5e9', // Sky-500
            text: '#0284C7', // Sky-600
            textDark: '#38bdf8' // Sky-400
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
      bgDark: '#374151', // Gray-700
      border: '#E5E7EB', // Gray-200
      borderDark: '#6b7280', // Gray-500
      text: '#9CA3AF', // Gray-400
      textDark: '#9ca3af' // Gray-400
    }
  };

  return <BaseToggle {...baseToggleProps} />;
}; 