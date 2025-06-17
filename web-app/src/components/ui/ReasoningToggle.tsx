/**
 * ReasoningToggle.tsx
 * 
 * Reasoning toggle component for enabling/disabling AI reasoning
 * Enhanced with comprehensive dark mode support
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
 * Usage: <ReasoningToggle enabled={value} onChange={setValue} reasoningMode="optional" />
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
 * Enhanced with dark mode support
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
      bgDark: '#1e3a8a', // Blue-900
      border: '#DBEAFE', // Blue-200
      borderDark: '#3b82f6', // Blue-500
      text: '#1D4ED8', // Blue-700
      textDark: '#60a5fa' // Blue-400
    },
    forcedColors: {
      bg: '#F3E8FF', // Purple-50
      bgDark: '#581c87', // Purple-900
      border: '#E9D5FF', // Purple-200
      borderDark: '#8b5cf6', // Purple-500
      text: '#7C3AED', // Purple-600
      textDark: '#a78bfa' // Purple-400
    },
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