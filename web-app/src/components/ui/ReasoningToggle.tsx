/**
 * ReasoningToggle.tsx
 * 
 * Intuitive toggle component for enabling/disabling AI reasoning
 * 
 * Components:
 *   ReasoningToggle
 * 
 * Features:
 *   - Visual toggle with brain icon
 *   - Color-coded states (inactive/active)
 *   - Tooltip explaining reasoning functionality
 *   - Disabled state for non-reasoning models
 * 
 * Usage: <ReasoningToggle enabled={useReasoning} onChange={setUseReasoning} reasoningMode={model.reasoningMode} />
 */
import React from 'react';
import { BaseToggle, type BaseToggleProps } from './BaseToggle';

interface ReasoningToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  reasoningMode: 'forced' | 'optional' | 'none';
  modelName?: string;
  className?: string;
}

/**
 * ReasoningToggle component for enabling/disabling AI reasoning
 * 
 * @param enabled - Whether reasoning is currently enabled
 * @param onChange - Callback when toggle state changes
 * @param reasoningMode - The reasoning mode of the current model
 * @param modelName - Name of the current model for tooltip
 * @param className - Additional CSS classes
 * @returns React component
 */
export const ReasoningToggle: React.FC<ReasoningToggleProps> = ({
  enabled,
  onChange,
  reasoningMode,
  modelName,
  className
}) => {
  const baseToggleProps: BaseToggleProps = {
    enabled,
    onChange,
    mode: reasoningMode,
    modelName,
    className,
    icon: '🧠',
    label: 'Reasoning',
    forcedLabel: 'Always On',
    tooltipPrefix: 'Reasoning',
    enabledColors: {
      bg: '#EFF6FF', // Blue-50
      border: '#DBEAFE', // Blue-200
      text: '#1D4ED8' // Blue-700
    },
    forcedColors: {
      bg: '#F3E8FF', // Purple-50
      border: '#E9D5FF', // Purple-200
      text: '#7C3AED' // Purple-600
    },
    disabledColors: {
      bg: '#F9FAFB', // Gray-50
      border: '#E5E7EB', // Gray-200
      text: '#9CA3AF' // Gray-400
    }
  };

  return <BaseToggle {...baseToggleProps} />;
}; 