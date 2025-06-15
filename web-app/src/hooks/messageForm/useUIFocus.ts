/**
 * useUIFocus.ts
 * 
 * Focused hook for UI focus management
 */
import { useRef, useCallback, useEffect } from 'react';

export interface UseUIFocusReturn {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  focusTextarea: () => void;
}

export function useUIFocus(loading: boolean): UseUIFocusReturn {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const focusTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = '48px';
        setTimeout(() => {
          textarea.focus();
        }, 100);
      }
    }
  }, [loading]);

  return {
    textareaRef,
    focusTextarea
  };
}
