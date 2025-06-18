/**
 * TagModal.tsx
 * 
 * Modal component for creating and editing tags
 * Enhanced with comprehensive dark mode support
 * 
 * Components:
 *   TagModal
 * 
 * Usage: <TagModal isOpen={isOpen} onClose={onClose} onSave={onSave} />
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ColorPicker } from './ColorPicker';
import { Button } from './Button';
import { cn } from '../../utils/cn';
// Remove TagColor import as it's not used directly

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, color: { r: number; g: number; b: number }) => void;
  title?: string;
  submitLabel?: string;
  initialName?: string;
  initialColor?: { r: number; g: number; b: number };
}

/**
 * Modal for creating and editing tags
 * 
 * @param {boolean} isOpen - Whether modal is open
 * @param {Function} onClose - Callback to close modal
 * @param {Function} onSubmit - Callback when form is submitted
 * @param {string} title - Modal title
 * @param {string} submitLabel - Submit button label
 * @param {string} initialName - Initial tag name for editing
 * @param {object} initialColor - Initial tag color for editing
 * @returns {JSX.Element} TagModal component
 */
export const TagModal: React.FC<TagModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = 'Create Tag',
  submitLabel = 'Create',
  initialName = '',
  initialColor = { r: 59, g: 130, b: 246 }
}) => {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [hasOpened, setHasOpened] = useState(false);

  // Reset form only when modal first opens, not when initial values change
  useEffect(() => {
    if (isOpen && !hasOpened) {
      setName(initialName);
      setColor(initialColor);
      setHasOpened(true);
    } else if (!isOpen) {
      setHasOpened(false);
    }
  }, [isOpen, hasOpened, initialName, initialColor]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      // Add event listener without capture to avoid conflicts
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), color);
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
      <div className="relative bg-white dark:bg-slate-900 rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border dark:border-slate-700 z-10">
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
          {/* Tag Name */}
          <div>
            <label htmlFor="tag-name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Tag Name
            </label>
            <input
              id="tag-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter tag name..."
              className={cn(
                'w-full px-3 py-2 border rounded-md shadow-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
                'dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500',
                'dark:focus:ring-blue-400 dark:focus:border-blue-400'
              )}
            />
          </div>

          {/* Color Selection - Enhanced with dark mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Tag Color
            </label>
            <ColorPicker 
              color={color} 
              onChange={setColor}
              className="mb-4"
            />
          </div>

          {/* RGB Sliders - Enhanced with dark mode */}
          <div className="space-y-3">
            {/* Red Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Red</label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={color.r}
                  onChange={(e) => setColor(prev => ({ ...prev, r: parseInt(e.target.value) || 0 }))}
                  className={cn(
                    'w-16 px-2 py-1 text-xs border rounded',
                    'bg-white border-gray-300 text-gray-900',
                    'dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100'
                  )}
                />
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={color.r}
                onChange={(e) => setColor(prev => ({ ...prev, r: parseInt(e.target.value) }))}
                className={cn(
                  'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer',
                  'dark:bg-slate-700',
                  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4',
                  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg',
                  '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full',
                  '[&::-moz-range-thumb]:bg-red-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-lg'
                )}
              />
            </div>

            {/* Green Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Green</label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={color.g}
                  onChange={(e) => setColor(prev => ({ ...prev, g: parseInt(e.target.value) || 0 }))}
                  className={cn(
                    'w-16 px-2 py-1 text-xs border rounded',
                    'bg-white border-gray-300 text-gray-900',
                    'dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100'
                  )}
                />
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={color.g}
                onChange={(e) => setColor(prev => ({ ...prev, g: parseInt(e.target.value) }))}
                className={cn(
                  'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer',
                  'dark:bg-slate-700',
                  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4',
                  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg',
                  '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full',
                  '[&::-moz-range-thumb]:bg-green-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-lg'
                )}
              />
            </div>

            {/* Blue Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Blue</label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={color.b}
                  onChange={(e) => setColor(prev => ({ ...prev, b: parseInt(e.target.value) || 0 }))}
                  className={cn(
                    'w-16 px-2 py-1 text-xs border rounded',
                    'bg-white border-gray-300 text-gray-900',
                    'dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100'
                  )}
                />
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={color.b}
                onChange={(e) => setColor(prev => ({ ...prev, b: parseInt(e.target.value) }))}
                className={cn(
                  'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer',
                  'dark:bg-slate-700',
                  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4',
                  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg',
                  '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full',
                  '[&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-lg'
                )}
              />
            </div>

            {/* Color Presets - Enhanced for dark mode */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-slate-400 mb-2">Presets</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Red', color: { r: 255, g: 100, b: 100 } },
                  { name: 'Orange', color: { r: 255, g: 180, b: 80 } },
                  { name: 'Yellow', color: { r: 255, g: 230, b: 80 } },
                  { name: 'Green', color: { r: 80, g: 220, b: 120 } },
                  { name: 'Blue', color: { r: 100, g: 180, b: 255 } },
                  { name: 'Purple', color: { r: 200, g: 120, b: 255 } },
                  { name: 'Pink', color: { r: 255, g: 120, b: 200 } },
                  { name: 'Cyan', color: { r: 80, g: 220, b: 240 } }
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setColor(preset.color)}
                    className="w-8 h-8 rounded-md border-2 border-gray-200 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-400 hover:scale-110 transition-all duration-200 shadow-md hover:shadow-lg"
                    style={{ backgroundColor: `rgb(${preset.color.r}, ${preset.color.g}, ${preset.color.b})` }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
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
              disabled={!name.trim()}
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