/**
 * ThreadTag.tsx
 * 
 * Individual thread tag component with self-managed debounced operations
 * 
 * Components:
 *   ThreadTag - Tag component that handles its own assignment/removal operations
 * 
 * Features:
 *   - Self-contained debouncing for each tag operation
 *   - Optimistic UI updates with error handling
 *   - Loading states and visual feedback
 *   - Extends base Tag component functionality
 * 
 * Usage: <ThreadTag tag={tag} threadId={threadId} onUpdate={onUpdate} />
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Tag } from './Tag';
import { useLogger } from '../../hooks/useLogger';
import { cn } from '../../utils/cn';
import type { ChatTag, ChatThread } from '../../../../src/shared/types';

interface ThreadTagProps {
  /** Tag object */
  tag: ChatTag;
  /** Thread ID this tag is associated with */
  threadId: string;
  /** Whether this tag is currently assigned to the thread */
  isAssigned: boolean;
  /** Callback to update thread with new tags */
  onThreadUpdate?: (threadId: string, updates: Partial<ChatThread>) => Promise<void>;
  /** Current thread tags for optimistic updates */
  currentThreadTags: string[];
  /** Optional click handler for selection/filtering */
  onClick?: (tag: ChatTag) => void;
  /** Optional right-click handler */
  onRightClick?: (e: React.MouseEvent, tag: ChatTag) => void;
  /** Whether the tag is selected for filtering */
  selected?: boolean;
  /** Tag size */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Debounce delay in milliseconds */
  debounceDelay?: number;
}

/**
 * Thread tag component with self-managed operations
 * 
 * Each instance handles its own debounced add/remove operations to prevent
 * rapid-fire requests while maintaining instant UI feedback
 * 
 * @param props - Component props
 * @returns React component
 */
export const ThreadTag: React.FC<ThreadTagProps> = ({
  tag,
  threadId,
  isAssigned,
  onThreadUpdate,
  currentThreadTags,
  onClick,
  onRightClick,
  selected = false,
  size = 'md',
  className,
  debounceDelay = 300
}) => {
  // Local state for optimistic updates
  const [optimisticState, setOptimisticState] = useState<'assigned' | 'removed' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Debounce management
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { debug, log, error: logError } = useLogger(`ThreadTag-${tag.id}`);

  /**
   * Clear any pending timeout
   */
  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /**
   * Get current effective state (optimistic or real)
   */
  const effectivelyAssigned = optimisticState === 'assigned' 
    ? true 
    : optimisticState === 'removed' 
    ? false 
    : isAssigned;

  /**
   * Perform the actual API operation
   */
  const performOperation = useCallback(async (shouldAssign: boolean) => {
    if (!onThreadUpdate) {
      debug('No onThreadUpdate callback provided');
      return;
    }

    try {
      setIsLoading(true);
      
      let updatedTags: string[];
      
      if (shouldAssign) {
        // Add tag if not already present
        if (!currentThreadTags.includes(tag.id)) {
          updatedTags = [...currentThreadTags, tag.id];
          debug(`Adding tag ${tag.id} to thread ${threadId}`);
        } else {
          debug(`Tag ${tag.id} already exists on thread ${threadId}`);
          return;
        }
      } else {
        // Remove tag if present
        updatedTags = currentThreadTags.filter(id => id !== tag.id);
        debug(`Removing tag ${tag.id} from thread ${threadId}`);
      }

      await onThreadUpdate(threadId, { tags: updatedTags });
      
      log(`Successfully ${shouldAssign ? 'added' : 'removed'} tag ${tag.id} ${shouldAssign ? 'to' : 'from'} thread ${threadId}`);
      
      // Clear optimistic state after successful operation
      setOptimisticState(null);
      
    } catch (error) {
      logError(`Failed to ${shouldAssign ? 'add' : 'remove'} tag:`, error as Error);
      
      // Revert optimistic state on error
      setOptimisticState(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [onThreadUpdate, threadId, tag.id, currentThreadTags, debug, log, logError]);

  /**
   * Handle tag toggle with debouncing
   */
  const handleToggle = useCallback(async () => {
    const targetState = !effectivelyAssigned;
    
    // Set optimistic state immediately for instant feedback
    setOptimisticState(targetState ? 'assigned' : 'removed');
    debug(`Setting optimistic state: ${targetState ? 'assigned' : 'removed'}`);
    
    // Clear any existing timeout
    clearPendingTimeout();
    
    // Schedule the actual operation
    timeoutRef.current = setTimeout(async () => {
      try {
        await performOperation(targetState);
      } catch (error) {
        // Error handling is done in performOperation
      } finally {
        timeoutRef.current = null;
      }
    }, debounceDelay);
    
  }, [effectivelyAssigned, clearPendingTimeout, performOperation, debounceDelay, debug]);

  /**
   * Handle tag click - either toggle assignment or call external onClick
   */
  const handleClick = useCallback((clickedTag: ChatTag) => {
    if (onClick) {
      // External click handler (e.g., for filtering)
      onClick(clickedTag);
    } else {
      // Default behavior: toggle assignment
      handleToggle();
    }
  }, [onClick, handleToggle]);

  /**
   * Handle tag removal (when removable)
   */
  const handleRemove = useCallback(() => {
    if (effectivelyAssigned) {
      handleToggle();
    }
  }, [effectivelyAssigned, handleToggle]);

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      clearPendingTimeout();
    };
  }, [clearPendingTimeout]);

  return (
    <div className={cn('relative', className)}>
      <Tag
        tag={tag}
        onClick={handleClick}
        onRemove={effectivelyAssigned ? handleRemove : undefined}
        onRightClick={onRightClick}
        selected={selected}
        removable={effectivelyAssigned}
        size={size}
        className={cn(
          // Base styling
          'transition-all duration-200',
          // Loading state
          isLoading && 'opacity-70',
          // Assignment state styling
          effectivelyAssigned 
            ? 'ring-2 ring-green-400 ring-offset-1 shadow-md' 
            : 'opacity-60 hover:opacity-80',
          // Optimistic state styling
          optimisticState === 'assigned' && 'ring-blue-400',
          optimisticState === 'removed' && 'ring-red-400'
        )}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
        </div>
      )}
      
      {/* Assignment status indicator */}
      {effectivelyAssigned && !isLoading && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm">
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white fill-current" viewBox="0 0 20 20">
              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}; 