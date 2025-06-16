/**
 * deviceUtils.ts
 * 
 * Utilities for device and screen size detection
 * 
 * Functions:
 *   isMobileScreen - Detect if current viewport is mobile size
 * 
 * Usage: import { isMobileScreen } from './utils/deviceUtils'
 */

/**
 * Check if current viewport is mobile screen size
 * 
 * Uses the same breakpoint as Tailwind CSS md breakpoint (768px)
 * 
 * @returns true if screen width is less than 768px
 */
export function isMobileScreen(): boolean {
  if (typeof window === 'undefined') {
    // Server-side rendering or Node.js environment
    return false;
  }
  
  return window.innerWidth < 768;
}

/**
 * Check if current viewport is tablet or larger
 * 
 * @returns true if screen width is 768px or larger
 */
export function isTabletOrLarger(): boolean {
  return !isMobileScreen();
}

/**
 * Get current screen breakpoint category
 * 
 * @returns Breakpoint category string
 */
export function getScreenBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') {
    return 'desktop';
  }
  
  const width = window.innerWidth;
  
  if (width < 768) {
    return 'mobile';
  } else if (width < 1024) {
    return 'tablet';
  } else {
    return 'desktop';
  }
} 