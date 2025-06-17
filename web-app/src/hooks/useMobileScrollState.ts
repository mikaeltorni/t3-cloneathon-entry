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

interface UseMobileScrollStateOptions {
  /** Whether the model sidebar is open */
  modelSidebarOpen?: boolean;
}

interface UseMobileScrollStateReturn {
  /** Whether to show additional controls (reasoning, search, etc.) */
  shouldShowControls: boolean;
  /** Handler for container focus events (any element within input area) */
  handleContainerFocus: () => void;
  /** Handler for container blur events (user clicked outside input area) */
  handleContainerBlur: () => void;
  /** Whether user is currently focused within the input container */
  isContainerFocused: boolean;
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
export function useMobileScrollState(options: UseMobileScrollStateOptions = {}): UseMobileScrollStateReturn {
  const { debug } = useLogger('useMobileScrollState');
  const { modelSidebarOpen = false } = options;
  
  // Track mobile device state
  const [isMobile, setIsMobile] = useState(() => isMobileScreen());
  
  // Track focus state for the entire input container
  const [isContainerFocused, setIsContainerFocused] = useState(false);

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
   * Handle container focus - user is interacting with any element in the input area
   */
  const handleContainerFocus = useCallback(() => {
    setIsContainerFocused(true);
    debug('User focused within input container');
  }, [debug]);

  /**
   * Handle container blur - user clicked outside the input area
   */
  const handleContainerBlur = useCallback(() => {
    setIsContainerFocused(false);
    debug('User blurred input container');
  }, [debug]);

  /**
   * Determine whether to show controls based on current state
   * 
   * Logic:
   * - Desktop: Always show controls
   * - Mobile + Container Focused: Show controls
   * - Mobile + Model Sidebar Open: Show controls
   * - Mobile + Nothing Focused: Hide controls
   */
  const shouldShowControls = !isMobile || isContainerFocused || modelSidebarOpen;

  debug('Mobile focus state:', {
    isMobile,
    isContainerFocused,
    modelSidebarOpen,
    shouldShowControls
  });

  return {
    shouldShowControls,
    handleContainerFocus,
    handleContainerBlur,
    isContainerFocused,
    isMobile
  };
} 