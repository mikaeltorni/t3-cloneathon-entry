/**
 * InlineEdit.tsx
 * 
 * Component for inline editing of text values
 * 
 * Components:
 *   InlineEdit - Editable text component with save/cancel functionality
 * 
 * Usage: <InlineEdit value={value} onSave={onSave} />
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

/**
 * Props for the InlineEdit component
 */
interface InlineEditProps {
  /** Current value to edit */
  value: string;
  /** Callback when value is saved */
  onSave: (newValue: string) => Promise<void> | void;
  /** Callback when editing is cancelled */
  onCancel?: () => void;
  /** Whether editing is disabled */
  disabled?: boolean;
  /** Whether the component is in editing mode initially */
  isEditing?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum length for the input */
  maxLength?: number;
  /** Custom validation function */
  validate?: (value: string) => string | null;
  /** CSS classes for the container */
  className?: string;
  /** CSS classes for the input */
  inputClassName?: string;
  /** CSS classes for the display text */
  textClassName?: string;
}

/**
 * Inline edit component for text values
 * 
 * @param value - Current value to edit
 * @param onSave - Callback when value is saved
 * @param onCancel - Callback when editing is cancelled
 * @param disabled - Whether editing is disabled
 * @param isEditing - Whether in editing mode initially
 * @param placeholder - Placeholder text
 * @param maxLength - Maximum length for the input
 * @param validate - Custom validation function
 * @param className - CSS classes for the container
 * @param inputClassName - CSS classes for the input
 * @param textClassName - CSS classes for the display text
 * @returns JSX element containing the inline edit component
 */
export const InlineEdit: React.FC<InlineEditProps> = ({
  value,
  onSave,
  onCancel,
  disabled = false,
  isEditing: initialIsEditing = false,
  placeholder = 'Enter text...',
  maxLength = 100,
  validate,
  className,
  inputClassName,
  textClassName
}) => {
  const [isEditing, setIsEditing] = useState(initialIsEditing);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset edit value when value prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  /**
   * Start editing mode
   */
  const handleStartEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setEditValue(value);
    setError(null);
  };

  /**
   * Cancel editing
   */
  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
    setError(null);
    onCancel?.();
  };

  /**
   * Save the edited value
   */
  const handleSave = async () => {
    if (isSaving) return;

    const trimmedValue = editValue.trim();
    
    // Validate the value
    if (validate) {
      const validationError = validate(trimmedValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Don't save if value hasn't changed
    if (trimmedValue === value.trim()) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave(trimmedValue);
      setIsEditing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle key press events
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  /**
   * Handle input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
    if (error) setError(null);
  };

  if (isEditing) {
    return (
      <div className={cn('relative', className)}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          onBlur={handleSave}
          disabled={isSaving}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            'w-full px-2 py-1 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            isSaving && 'opacity-50 cursor-not-allowed',
            error && 'border-red-300 focus:ring-red-500',
            inputClassName
          )}
        />
        {error && (
          <div className="absolute top-full left-0 mt-1 text-xs text-red-600 bg-white px-2 py-1 rounded shadow-lg border z-10">
            {error}
          </div>
        )}
        {isSaving && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={handleStartEdit}
      className={cn(
        'cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 rounded px-1 py-0.5 transition-colors',
        disabled && 'cursor-not-allowed opacity-50',
        textClassName,
        className
      )}
      title={disabled ? undefined : "Click to edit"}
    >
      {value || placeholder}
    </div>
  );
}; 