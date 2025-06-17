/**
 * ReasoningEffortSelector.tsx
 * 
 * Reasoning effort level selector component for AI models that support reasoning effort control
 * Enhanced with comprehensive dark mode support
 * 
 * Components:
 *   ReasoningEffortSelector
 * 
 * Features:
 *   - Dropdown selector for effort levels (low, medium, high)
 *   - Model-aware display (only shows for supported models)
 *   - Beautiful UI with effort descriptions
 *   - Accessible keyboard navigation
 *   - Performance indicators for each effort level
 *   - Complete dark mode support
 * 
 * Usage: <ReasoningEffortSelector value="high" onChange={setEffort} modelName="Claude 3.7" />
 */
import React from 'react';
import { BaseSelector, type BaseSelectorOption } from './BaseSelector';

type ReasoningEffort = 'low' | 'medium' | 'high';

interface ReasoningEffortSelectorProps {
  value: ReasoningEffort;
  onChange: (effort: ReasoningEffort) => void;
  modelName?: string;
  disabled?: boolean;
  className?: string;
}

const REASONING_EFFORT_OPTIONS: BaseSelectorOption<ReasoningEffort>[] = [
  {
    value: 'low',
    label: 'Low Effort',
    description: 'Fast responses with basic reasoning',
    icon: '⚡',
    color: 'text-green-600 dark:text-green-400',
    performance: 'Fastest'
  },
  {
    value: 'medium',
    label: 'Medium Effort',
    description: 'Balanced reasoning and response time',
    icon: '⚖️',
    color: 'text-yellow-600 dark:text-yellow-400',
    performance: 'Balanced'
  },
  {
    value: 'high',
    label: 'High Effort',
    description: 'Deep reasoning with thorough analysis',
    icon: '🧠',
    color: 'text-blue-600 dark:text-blue-400',
    performance: 'Most thorough'
  }
];

/**
 * Reasoning effort level selector component
 * Enhanced with comprehensive dark mode support
 * 
 * Provides a dropdown interface for selecting reasoning effort levels
 * with clear descriptions and visual indicators for each option.
 * 
 * @param value - Current effort level
 * @param onChange - Callback when effort level changes
 * @param modelName - Name of the AI model (for display)
 * @param disabled - Whether the selector is disabled
 * @param className - Additional CSS classes
 * @returns React component
 */
export const ReasoningEffortSelector: React.FC<ReasoningEffortSelectorProps> = ({
  value,
  onChange,
  modelName,
  disabled = false,
  className
}) => {
  return (
    <BaseSelector
      value={value}
      onChange={onChange}
      options={REASONING_EFFORT_OPTIONS}
      label="Reasoning Effort"
      modelName={modelName}
      disabled={disabled}
      className={className}
      placeholder="Select reasoning effort..."
    />
  );
}; 