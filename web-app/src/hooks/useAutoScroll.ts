/**
 * useAutoScroll.ts
 * 
 * OPTIMIZED: Custom hook for managing auto-scroll behavior in message lists
 * 
 * Hook:
 *   useAutoScroll
 * 
 * Features:
 *   - Intelligent scroll positioning
 *   - User scroll detection
 *   - Dynamic bottom padding support
 *   - Precise content anchoring
 *   - Performance optimized with memoization
 * 
 * Usage: const { containerRef, messagesEndRef, handleScroll } = useAutoScroll(options);
 */
import { useRef, useCallback, useEffect, useMemo } from 'react';

interface UseAutoScrollOptions {
  /** Dynamic bottom padding to account for fixed input bar */
  dynamicBottomPadding: number;
  /** Number of messages (triggers scroll on change) */
  messageCount: number;
  /** Content of last message (triggers scroll on streaming) */
  lastMessageContent?: string;
  /** Set of expanded reasoning IDs (triggers scroll on toggle) */
  expandedReasoningCount: number;
}

interface UseAutoScrollReturn {
  /** Ref for the scrollable container */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Ref for the scroll anchor element */
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  /** Scroll event handler */
  handleScroll: () => void;
}

/**
 * Custom hook for managing auto-scroll behavior in message lists
 * 
 * @param options - Configuration options for auto-scroll behavior
 * @returns Object containing refs and handlers for scroll management
 */
export function useAutoScroll({
  dynamicBottomPadding,
  messageCount,
  lastMessageContent,
  expandedReasoningCount
}: UseAutoScrollOptions): UseAutoScrollReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * OPTIMIZED: Memoized PRECISE scroll calculation to anchor content to model selector position
   * Mathematical approach: position messagesEnd exactly above the fixed input bar
   */
  const scrollToBottom = useCallback((force = false) => {
    const container = containerRef.current;
    const messagesEnd = messagesEndRef.current;
    
    if (!container) return;

    // If user is actively scrolling, don't auto-scroll (unless forced)
    if (isUserScrolling.current && !force) return;

    // Smart scroll: only scroll if content overflows, position optimally if it does
    setTimeout(() => {
      if (container && messagesEnd) {
        const containerHeight = container.clientHeight;
        const containerScrollHeight = container.scrollHeight;
        const messagesEndOffsetTop = messagesEnd.offsetTop;
        
        // Check if content actually overflows (needs scrolling)
        const contentOverflows = containerScrollHeight > containerHeight;
        
        if (!contentOverflows) {
          // Content fits in viewport - just scroll to the very end to show everything
          const finalScrollPosition = containerScrollHeight - containerHeight;
          
          console.log('📏 SHORT CONTENT - scroll to show all:', {
            containerHeight,
            containerScrollHeight,
            finalScrollPosition,
            reason: 'Content fits in viewport'
          });
          
          container.scrollTo({
            top: Math.max(0, finalScrollPosition),
            behavior: 'smooth'
          });
        } else {
          // Content overflows - position messagesEnd above the input bar area
          // Account for the input bar by using the dynamicBottomPadding
          const spaceForInputBar = dynamicBottomPadding;
          const targetScrollPosition = messagesEndOffsetTop - containerHeight + spaceForInputBar;
          const finalScrollPosition = Math.max(0, targetScrollPosition);
          
          console.log('📜 LONG CONTENT - anchor to input bar:', {
            messagesEndOffsetTop,
            containerHeight,
            spaceForInputBar,
            targetScrollPosition,
            finalScrollPosition,
            reason: 'Content overflows viewport'
          });
          
          container.scrollTo({
            top: finalScrollPosition,
            behavior: 'smooth'
          });
        }
      }
    }, 150);
  }, [dynamicBottomPadding]); // FIXED: Only depend on dynamicBottomPadding

  /**
   * OPTIMIZED: Memoized detect if user is manually scrolling
   */
  const handleScroll = useCallback(() => {
    isUserScrolling.current = true;
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Reset scrolling flag after 1 second of no scroll activity
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, 1000);
  }, []);

  /**
   * OPTIMIZED: Memoize scroll timers to prevent recreation
   */
  const scrollTimers = useMemo(() => ({
    messageScrollDelay: 100,
    preciseScrollDelay: 500,
    streamingScrollDelay: 300,
    paddingScrollDelay: 200,
    reasoningScrollDelay: 300
  }), []);

  /**
   * FIXED: Precise auto-scroll: new messages get precise positioning
   */
  useEffect(() => {
    // Gentle scroll when new messages arrive
    const timeoutId = setTimeout(() => {
      scrollToBottom(false); // Don't force during initial load
    }, scrollTimers.messageScrollDelay);

    // Final precise scroll after content renders
    const secondTimeout = setTimeout(() => {
      scrollToBottom(true); // Force precise positioning
    }, scrollTimers.preciseScrollDelay);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(secondTimeout);
    };
  }, [messageCount, scrollToBottom, scrollTimers.messageScrollDelay, scrollTimers.preciseScrollDelay]);

  /**
   * FIXED: Gentle scroll during streaming updates (less aggressive)
   */
  useEffect(() => {
    if (lastMessageContent) {
      // Very gentle scroll during streaming - only if user isn't scrolling
      const timeoutId = setTimeout(() => {
        scrollToBottom(false); // Never force during streaming
      }, scrollTimers.streamingScrollDelay);

      return () => clearTimeout(timeoutId);
    }
  }, [lastMessageContent, scrollToBottom, scrollTimers.streamingScrollDelay]);

  /**
   * FIXED: Re-scroll when padding changes to maintain bottom position
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, scrollTimers.paddingScrollDelay);

    return () => clearTimeout(timeoutId);
  }, [dynamicBottomPadding, scrollToBottom, scrollTimers.paddingScrollDelay]);

  /**
   * FIXED: Re-scroll when reasoning is toggled (changes content height)
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, scrollTimers.reasoningScrollDelay); // Longer delay for animation completion

    return () => clearTimeout(timeoutId);
  }, [expandedReasoningCount, scrollToBottom, scrollTimers.reasoningScrollDelay]);

  /**
   * OPTIMIZED: Cleanup scroll timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    containerRef,
    messagesEndRef,
    handleScroll
  };
} 