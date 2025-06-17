/**
 * useMobileScrollState.ts
 * 
 * Custom hook for managing mobile input focus state
 * Handles showing/hiding UI controls based on chat input focus on mobile devices
 * 
 * Hook:
 *   useMobileScrollState
 * 
 * Features:
 *   - Detects mobile devices using deviceUtils
 *   - Tracks input focus state
 *   - Determines when to show/hide controls based on focus
 * 
 * Usage: const { shouldShowControls, handleInputFocus, handleInputBlur } = useMobileScrollState();
 */
import { useState, useCallback, useEffect } from 'react';
import { isMobileScreen } from '../utils/deviceUtils';
import { useLogger } from './useLogger';

interface UseMobileScrollStateReturn {
  /** Whether to show additional controls (reasoning, search, etc.) */
  shouldShowControls: boolean;
  /** Handler for input focus events */
  handleInputFocus: () => void;
  /** Handler for input blur events */
  handleInputBlur: () => void;
  /** Whether user is currently focused on input */
  isInputFocused: boolean;
  /** Whether this is a mobile device */
  isMobile: boolean;
}

/**
 * Custom hook for managing mobile focus state and UI control visibility
 * 
 * On mobile devices:
 * - Shows all controls when input is focused (user is typing)
 * - Hides non-essential controls when input is not focused
 * - Always shows controls on desktop devices
 * 
 * @returns Object containing state and handlers for mobile focus management
 */
export function useMobileScrollState(): UseMobileScrollStateReturn {
  const { debug } = useLogger('useMobileScrollState');
  
  // Track mobile device state
  const [isMobile, setIsMobile] = useState(() => isMobileScreen());
  
  // Track input focus state
  const [isInputFocused, setIsInputFocused] = useState(false);

  /**
   * Handle window resize to update mobile state
   */
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = isMobileScreen();
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
        debug('Mobile state changed:', newIsMobile);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, debug]);

  /**
   * Handle input focus - user is actively interacting with input
   */
  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true);
    debug('User focused on input');
  }, [debug]);

  /**
   * Handle input blur - user stopped interacting with input
   */
  const handleInputBlur = useCallback(() => {
    setIsInputFocused(false);
    debug('User blurred input');
  }, [debug]);

  /**
   * Determine whether to show controls based on current state
   * 
   * Logic:
   * - Desktop: Always show controls
   * - Mobile + Input Focused: Show controls
   * - Mobile + Input Not Focused: Hide controls
   */
  const shouldShowControls = !isMobile || isInputFocused;

  debug('Mobile focus state:', {
    isMobile,
    isInputFocused,
    shouldShowControls
  });

  return {
    shouldShowControls,
    handleInputFocus,
    handleInputBlur,
    isInputFocused,
    isMobile
  };
} 