/**
 * AppModal.tsx
 * 
 * Modal component for creating and editing apps
 * Enhanced with comprehensive dark mode support
 * 
 * Components:
 *   AppModal
 * 
 * Usage: <AppModal isOpen={isOpen} onClose={onClose} onSave={onSave} />
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { cn } from '../../utils/cn';

interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, systemPrompt: string) => void;
  title?: string;
  submitLabel?: string;
  initialName?: string;
  initialSystemPrompt?: string;
}

/**
 * Modal for creating and editing apps
 * 
 * @param {boolean} isOpen - Whether modal is open
 * @param {Function} onClose - Callback to close modal
 * @param {Function} onSubmit - Callback when form is submitted
 * @param {string} title - Modal title
 * @param {string} submitLabel - Submit button label
 * @param {string} initialName - Initial app name for editing
 * @param {string} initialSystemPrompt - Initial system prompt for editing
 * @returns {JSX.Element} AppModal component
 */
export const AppModal: React.FC<AppModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = 'Create App',
  submitLabel = 'Create',
  initialName = '',
  initialSystemPrompt = ''
}) => {
  const [name, setName] = useState(initialName);
  const [systemPrompt, setSystemPrompt] = useState(initialSystemPrompt);
  const [hasOpened, setHasOpened] = useState(false);

  // Reset form only when modal first opens, not when initial values change
  useEffect(() => {
    if (isOpen && !hasOpened) {
      setName(initialName);
      setSystemPrompt(initialSystemPrompt);
      setHasOpened(true);
    } else if (!isOpen) {
      setHasOpened(false);
    }
  }, [isOpen, hasOpened, initialName, initialSystemPrompt]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        onClose();
      }
    };

    if (isOpen) {
      // Add event listener with capture to intercept before it bubbles
      document.addEventListener('keydown', handleKeyDown, { capture: true });
      return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
    }
  }, [isOpen, onClose]);

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && systemPrompt.trim()) {
      onSubmit(name.trim(), systemPrompt.trim());
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-20" 
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-full max-w-2xl mx-4 shadow-2xl border dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{title}</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* App Name */}
          <div>
            <label htmlFor="app-name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              App Name
            </label>
            <input
              id="app-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter app name..."
              className={cn(
                'w-full px-3 py-2 border rounded-md shadow-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
                'dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500',
                'dark:focus:ring-blue-400 dark:focus:border-blue-400'
              )}
            />
          </div>

          {/* System Prompt */}
          <div>
            <label htmlFor="system-prompt" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              System Prompt
            </label>
            <textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Enter system prompt that defines how your app should behave..."
              rows={8}
              className={cn(
                'w-full px-3 py-2 border rounded-md shadow-sm resize-y',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
                'dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500',
                'dark:focus:ring-blue-400 dark:focus:border-blue-400'
              )}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              This prompt will guide the AI's behavior and responses for this app.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                'text-gray-700 bg-gray-100 hover:bg-gray-200',
                'dark:text-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600',
                'focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800'
              )}
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={!name.trim() || !systemPrompt.trim()}
              variant="primary"
            >
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}; 