/**
 * SearchEffortSelector.tsx
 * 
 * Web search effort level selector component for AI models that support search effort control
 * Enhanced with comprehensive dark mode support
 * 
 * Components:
 *   SearchEffortSelector
 * 
 * Features:
 *   - Dropdown selector for search effort levels (low, medium, high)
 *   - Model-aware display (only shows for supported models)
 *   - Beautiful UI with effort descriptions and pricing info
 *   - Accessible keyboard navigation
 *   - Performance indicators for each effort level
 *   - Pricing tier awareness (Perplexity vs OpenAI vs standard)
 *   - Complete dark mode support
 * 
 * Usage: <SearchEffortSelector value="high" onChange={setEffort} modelName="Sonar Reasoning" webSearchPricing="perplexity" />
 */
import React from 'react';
import { BaseSelector, type BaseSelectorOption } from './BaseSelector';

type SearchEffort = 'low' | 'medium' | 'high';

interface SearchEffortSelectorProps {
  value: SearchEffort;
  onChange: (effort: SearchEffort) => void;
  webSearchPricing?: 'standard' | 'perplexity' | 'openai';
  modelName?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Get search effort options with pricing-aware descriptions and performance indicators
 * Enhanced with dark mode compatible colors
 */
const getSearchEffortOptions = (pricingTier: 'standard' | 'perplexity' | 'openai'): BaseSelectorOption<SearchEffort>[] => {
  const basePricing = {
    standard: { low: '$4/1K', medium: '$6/1K', high: '$8/1K' },
    perplexity: { low: '$5/1K', medium: '$8/1K', high: '$12/1K' },
    openai: { low: '$25-30/1K', medium: '$27.5-35/1K', high: '$30-50/1K' }
  };

  const pricing = basePricing[pricingTier];

  return [
    {
      value: 'low',
      label: 'Low Context',
      description: `Minimal search context, suitable for basic queries (${pricing.low} requests)`,
      icon: '⚡',
      color: 'text-green-600 dark:text-green-400',
      performance: 'Fastest & Cheapest'
    },
    {
      value: 'medium',
      label: 'Medium Context',
      description: `Moderate search context, good for general queries (${pricing.medium} requests)`,
      icon: '⚖️',
      color: 'text-yellow-600 dark:text-yellow-400',
      performance: 'Balanced'
    },
    {
      value: 'high',
      label: 'High Context',
      description: `Extensive search context, ideal for detailed research (${pricing.high} requests)`,
      icon: '🔍',
      color: 'text-blue-600 dark:text-blue-400',
      performance: 'Most comprehensive'
    }
  ];
};

/**
 * Web search effort level selector component
 * Enhanced with comprehensive dark mode support
 * 
 * Provides a dropdown interface for selecting web search effort levels
 * with clear descriptions, pricing information, and visual indicators for each option.
 * 
 * @param value - Current effort level
 * @param onChange - Callback when effort level changes
 * @param webSearchPricing - Pricing tier for web search (affects descriptions and styling)
 * @param modelName - Name of the AI model (for display)
 * @param disabled - Whether the selector is disabled
 * @param className - Additional CSS classes
 * @returns React component
 */
export const SearchEffortSelector: React.FC<SearchEffortSelectorProps> = ({
  value,
  onChange,
  webSearchPricing = 'standard',
  modelName,
  disabled = false,
  className
}) => {
  const options = getSearchEffortOptions(webSearchPricing);

  return (
    <BaseSelector
      value={value}
      onChange={onChange}
      options={options}
      label="Search Context Size"
      modelName={modelName}
      disabled={disabled}
      className={className}
      placeholder="Select search context..."
    />
  );
}; 