/**
 * useSidebarToggle.ts
 * 
 * Custom hook for managing sidebar toggle state
 * 
 * Hook:
 *   useSidebarToggle
 * 
 * Features:
 *   - Toggle state management
 *   - Responsive behavior
 *   - Auto-close on window resize
 * 
 * Usage: const { isOpen, toggle, close } = useSidebarToggle();
 */
import { useState, useCallback, useEffect } from 'react';

export function useSidebarToggle() {
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Toggle sidebar open/closed
   */
  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  /**
   * Close sidebar
   */
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Open sidebar
   */
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  /**
   * Handle window resize - close sidebar on larger screens
   */
  useEffect(() => {
    const handleResize = () => {
      // Close mobile sidebar when screen becomes large enough
      if (window.innerWidth >= 768) { // md breakpoint
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Handle escape key to close sidebar
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return {
    isOpen,
    toggle,
    close,
    open
  };
} 