/**
 * TokenizerInput.tsx
 * 
 * Component for text input with character count display
 * 
 * Components:
 *   TokenizerInput - Text input area with validation and character counting
 * 
 * Usage: <TokenizerInput value={text} onChange={setText} disabled={isLoading} />
 */

import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Props for the TokenizerInput component
 */
interface TokenizerInputProps {
  /** Current text value */
  value: string;
  /** Callback when text changes */
  onChange: (value: string) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Maximum character limit */
  maxLength?: number;
  /** Input height in Tailwind classes */
  height?: string;
}

/**
 * Text input component with character count display
 * 
 * @param value - Current text value
 * @param onChange - Callback when text changes
 * @param disabled - Whether the input is disabled
 * @param placeholder - Placeholder text
 * @param className - Additional CSS classes
 * @param maxLength - Maximum character limit
 * @param height - Input height in Tailwind classes
 * @returns JSX element containing the input area
 */
export const TokenizerInput: React.FC<TokenizerInputProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Enter text to tokenize...",
  className,
  maxLength,
  height = "h-32"
}) => {
  return (
    <div className={cn('bg-white rounded-lg border p-6', className)}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Input Text
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={cn(
          'w-full px-3 py-2 border border-gray-300 rounded-md transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
          'resize-none',
          height
        )}
        disabled={disabled}
        aria-describedby="character-count"
      />
      <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
        <span id="character-count">
          {value.length} characters
        </span>
        {maxLength && (
          <span className={cn(
            'text-xs',
            value.length > maxLength * 0.9 ? 'text-orange-600' : 'text-gray-400',
            value.length >= maxLength ? 'text-red-600 font-medium' : ''
          )}>
            {maxLength - value.length} remaining
          </span>
        )}
      </div>
    </div>
  );
}; 