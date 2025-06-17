/**
 * ColorPicker.tsx
 * 
 * RGB color picker component with sliders and editable fields
 * 
 * Components:
 *   ColorPicker - Color selection component with RGB controls
 * 
 * Usage: <ColorPicker color={color} onChange={handleColorChange} />
 */
import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface ColorPickerProps {
  color: { r: number; g: number; b: number };
  onChange: (color: { r: number; g: number; b: number }) => void;
  className?: string;
}

/**
 * RGB color picker with sliders and editable input fields
 * 
 * @param color - Current RGB color value
 * @param onChange - Callback when color changes
 * @param className - Additional CSS classes
 * @returns React component
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  className
}) => {
  const [localColor, setLocalColor] = useState(color);

  useEffect(() => {
    setLocalColor(color);
  }, [color]);

  const handleSliderChange = (component: 'r' | 'g' | 'b', value: number) => {
    const newColor = { ...localColor, [component]: value };
    setLocalColor(newColor);
    onChange(newColor);
  };

  const handleInputChange = (component: 'r' | 'g' | 'b', value: string) => {
    const numValue = Math.max(0, Math.min(255, parseInt(value) || 0));
    const newColor = { ...localColor, [component]: numValue };
    setLocalColor(newColor);
    onChange(newColor);
  };

  const previewColor = `rgb(${localColor.r}, ${localColor.g}, ${localColor.b})`;
  
  // Calculate brightness for text color
  const brightness = (localColor.r * 299 + localColor.g * 587 + localColor.b * 114) / 1000;
  const textColor = brightness > 125 ? '#000000' : '#ffffff';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Color Preview */}
      <div className="flex items-center space-x-3">
        <div
          className="w-16 h-16 rounded-lg border-2 border-gray-200 dark:border-slate-600 shadow-sm flex items-center justify-center text-sm font-medium"
          style={{ backgroundColor: previewColor, color: textColor }}
        >
          Preview
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700 dark:text-slate-300">RGB Color</div>
          <div className="text-xs text-gray-500 dark:text-slate-400 font-mono">
            rgb({localColor.r}, {localColor.g}, {localColor.b})
          </div>
        </div>
      </div>

      {/* RGB Sliders */}
      <div className="space-y-3">
        {/* Red Slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-red-600 dark:text-red-400">Red</label>
            <input
              type="number"
              min="0"
              max="255"
              value={localColor.r}
              onChange={(e) => handleInputChange('r', e.target.value)}
              className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <input
            type="range"
            min="0"
            max="255"
            value={localColor.r}
            onChange={(e) => handleSliderChange('r', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider-red"
            style={{
              background: `linear-gradient(to right, rgb(0, ${localColor.g}, ${localColor.b}), rgb(255, ${localColor.g}, ${localColor.b}))`
            }}
          />
        </div>

        {/* Green Slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-green-600 dark:text-green-400">Green</label>
            <input
              type="number"
              min="0"
              max="255"
              value={localColor.g}
              onChange={(e) => handleInputChange('g', e.target.value)}
              className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <input
            type="range"
            min="0"
            max="255"
            value={localColor.g}
            onChange={(e) => handleSliderChange('g', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider-green"
            style={{
              background: `linear-gradient(to right, rgb(${localColor.r}, 0, ${localColor.b}), rgb(${localColor.r}, 255, ${localColor.b}))`
            }}
          />
        </div>

        {/* Blue Slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-blue-600 dark:text-blue-400">Blue</label>
            <input
              type="number"
              min="0"
              max="255"
              value={localColor.b}
              onChange={(e) => handleInputChange('b', e.target.value)}
              className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <input
            type="range"
            min="0"
            max="255"
            value={localColor.b}
            onChange={(e) => handleSliderChange('b', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider-blue"
            style={{
              background: `linear-gradient(to right, rgb(${localColor.r}, ${localColor.g}, 0), rgb(${localColor.r}, ${localColor.g}, 255))`
            }}
          />
        </div>
      </div>

      {/* Preset Colors */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700 dark:text-slate-300">Quick Presets</div>
        <div className="flex flex-wrap gap-2">
          {[
            { name: 'Red', color: { r: 239, g: 68, b: 68 } },
            { name: 'Orange', color: { r: 251, g: 146, b: 60 } },
            { name: 'Yellow', color: { r: 245, g: 208, b: 45 } },
            { name: 'Green', color: { r: 34, g: 197, b: 94 } },
            { name: 'Blue', color: { r: 59, g: 130, b: 246 } },
            { name: 'Purple', color: { r: 168, g: 85, b: 247 } },
            { name: 'Pink', color: { r: 236, g: 72, b: 153 } },
            { name: 'Gray', color: { r: 107, g: 114, b: 128 } }
          ].map((preset) => (
            <button
              key={preset.name}
              onClick={() => onChange(preset.color)}
              className="w-8 h-8 rounded-md border-2 border-gray-200 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-400 transition-colors"
              style={{ backgroundColor: `rgb(${preset.color.r}, ${preset.color.g}, ${preset.color.b})` }}
              title={preset.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}; 