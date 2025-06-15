/**
 * TagModal.tsx
 * 
 * Modal component for creating and editing tags
 * 
 * Components:
 *   TagModal
 * 
 * Usage: <TagModal isOpen={true} onClose={handleClose} onSubmit={handleSubmit} />
 */

import React, { useState, useEffect } from 'react';

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tag Name Input */}
          <div className="mb-4">
            <label htmlFor="tag-name" className="block text-sm font-medium text-gray-700 mb-2">
              Tag Name
            </label>
            <input
              id="tag-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter tag name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              required
            />
          </div>

          {/* Color Preview */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Preview
            </label>
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
              />
              <div
                className="px-3 py-1 rounded-full text-white text-sm font-medium"
                style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
              >
                {name || 'Tag Preview'}
              </div>
            </div>
          </div>

          {/* Color Picker */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="space-y-3">
              {/* Red Channel */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-600">Red</label>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={color.r}
                    onChange={(e) => setColor(prev => ({ ...prev, r: parseInt(e.target.value) || 0 }))}
                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={color.r}
                  onChange={(e) => setColor(prev => ({ ...prev, r: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer slider-red"
                />
              </div>

              {/* Green Channel */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-600">Green</label>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={color.g}
                    onChange={(e) => setColor(prev => ({ ...prev, g: parseInt(e.target.value) || 0 }))}
                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={color.g}
                  onChange={(e) => setColor(prev => ({ ...prev, g: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer slider-green"
                />
              </div>

              {/* Blue Channel */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-600">Blue</label>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={color.b}
                    onChange={(e) => setColor(prev => ({ ...prev, b: parseInt(e.target.value) || 0 }))}
                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={color.b}
                  onChange={(e) => setColor(prev => ({ ...prev, b: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider-blue"
                />
              </div>
            </div>

            {/* Color Presets */}
            <div className="mt-4">
              <label className="block text-xs text-gray-600 mb-2">Presets</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { r: 239, g: 68, b: 68 },   // Red
                  { r: 245, g: 158, b: 11 },  // Orange
                  { r: 250, g: 204, b: 21 },  // Yellow
                  { r: 34, g: 197, b: 94 },   // Green
                  { r: 59, g: 130, b: 246 },  // Blue
                  { r: 147, g: 51, b: 234 },  // Purple
                  { r: 236, g: 72, b: 153 },  // Pink
                  { r: 107, g: 114, b: 128 }  // Gray
                ].map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setColor(preset)}
                    className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors"
                    style={{ backgroundColor: `rgb(${preset.r}, ${preset.g}, ${preset.b})` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 