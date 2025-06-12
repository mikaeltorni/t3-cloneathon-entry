/**
 * useInputBarHeight.ts
 * 
 * Custom hook for managing input bar height and dynamic spacing
 * Extracted to improve component organization and reusability
 * 
 * Hook:
 *   useInputBarHeight
 * 
 * Features:
 *   - Input bar height tracking
 *   - Dynamic spacing calculations
 *   - Performance optimized measurements
 *   - Responsive to window resize
 * 
 * Usage: const { inputBarHeight, updateHeight, measureElement } = useInputBarHeight();
 */
import { useState, useCallback, useEffect } from 'react';
import { useLogger } from './useLogger';

/**
 * Input bar height hook return interface
 */
interface UseInputBarHeightReturn {
  inputBarHeight: number;
  updateHeight: (height: number) => void;
  measureElement: (element: HTMLElement | null) => void;
  getCalculatedHeight: (baseHeight: number, paddingBuffer?: number) => number;
}

/**
 * Custom hook for managing input bar height
 * 
 * Provides:
 * - Height state management
 * - Element measurement utilities
 * - Responsive height calculations
 * 
 * @param defaultHeight - Default height value (default: 200)
 * @returns Height state and measurement operations
 */
export const useInputBarHeight = (defaultHeight: number = 200): UseInputBarHeightReturn => {
  const [inputBarHeight, setInputBarHeight] = useState<number>(defaultHeight);
  const { debug } = useLogger('useInputBarHeight');

  /**
   * Update the input bar height
   * 
   * @param height - New height value
   */
  const updateHeight = useCallback((height: number) => {
    if (height !== inputBarHeight) {
      setInputBarHeight(height);
      debug('Input bar height updated:', height);
    }
  }, [inputBarHeight, debug]);

  /**
   * Measure an element and update height
   * 
   * @param element - HTML element to measure
   * @param paddingBuffer - Additional padding to add (default: 20)
   */
  const measureElement = useCallback((element: HTMLElement | null, paddingBuffer: number = 20) => {
    if (element) {
      const height = element.offsetHeight;
      const calculatedHeight = height + paddingBuffer;
      updateHeight(calculatedHeight);
      debug('Element measured:', { elementHeight: height, paddingBuffer, calculatedHeight });
    }
  }, [updateHeight, debug]);

  /**
   * Get calculated height with padding buffer
   * 
   * @param baseHeight - Base height value
   * @param paddingBuffer - Padding buffer to add (default: 20)
   * @returns Calculated height with buffer
   */
  const getCalculatedHeight = useCallback((baseHeight: number, paddingBuffer: number = 20): number => {
    return baseHeight + paddingBuffer;
  }, []);

  /**
   * Handle window resize events
   */
  useEffect(() => {
    const handleResize = () => {
      debug('Window resize detected, height may need remeasurement');
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [debug]);

  return {
    inputBarHeight,
    updateHeight,
    measureElement,
    getCalculatedHeight
  };
}; 