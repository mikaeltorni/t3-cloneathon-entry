/**
 * ThreadTagForMenu.tsx
 * 
 * Specialized thread tag component for use in menus with TagSystem context
 * 
 * Components:
 *   ThreadTagForMenu - Tag component that uses TagSystem context methods
 * 
 * Features:
 *   - Connects to TagSystem context methods
 *   - Self-contained debouncing for each tag operation
 *   - Optimistic UI updates with TagSystem integration
 *   - Loading states and visual feedback
 * 
 * Usage: <ThreadTagForMenu tag={tag} threadId={threadId} />
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Tag } from './Tag';
import { useTagSystemContext } from '../TagSystem';
import { useLogger } from '../../hooks/useLogger';
import { cn } from '../../utils/cn';
import type { ChatTag } from '../../../../src/shared/types';

interface ThreadTagForMenuProps {
  /** Tag object */
  tag: ChatTag;
  /** Thread ID this tag is associated with */
  threadId: string;
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
 * Thread tag component for menu usage with TagSystem context
 * 
 * Each instance handles its own debounced add/remove operations using
 * TagSystem context methods to prevent rapid-fire requests
 * 
 * @param props - Component props
 * @returns React component
 */
export const ThreadTagForMenu: React.FC<ThreadTagForMenuProps> = ({
  tag,
  threadId,
  onClick,
  onRightClick,
  selected = false,
  size = 'md',
  className,
  debounceDelay = 300
}) => {
  // Local state for optimistic updates
  const [isLoading, setIsLoading] = useState(false);
  
  // Debounce management
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { debug, log, error: logError } = useLogger(`ThreadTagForMenu-${tag.id}`);
  
  // Get TagSystem context
  const tagSystem = useTagSystemContext();

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
   * Get current effective state using TagSystem optimistic updates
   */
  const optimisticTags = tagSystem.getOptimisticThreadTags(threadId);
  const effectivelyAssigned = optimisticTags.some(t => t.id === tag.id);

  /**
   * Perform the actual API operation using TagSystem methods
   */
  const performOperation = useCallback(async (shouldAssign: boolean) => {
    const operationId = `${shouldAssign ? 'ADD' : 'REMOVE'}-${threadId}-${tag.id}-${Date.now()}`;
    
    try {
      setIsLoading(true);
      
      debug(`🚀 [${operationId}] Starting operation: ${shouldAssign ? 'ADD' : 'REMOVE'} tag ${tag.id} to/from thread ${threadId}`);
      debug(`🚀 [${operationId}] Current effective state: ${effectivelyAssigned ? 'ASSIGNED' : 'UNASSIGNED'}`);
      
      if (shouldAssign) {
        debug(`➕ [${operationId}] Calling tagSystem.addTagToThread(${threadId}, ${tag.id})`);
        await tagSystem.addTagToThread(threadId, tag.id);
        debug(`✅ [${operationId}] Successfully called addTagToThread`);
      } else {
        debug(`➖ [${operationId}] Calling tagSystem.removeTagFromThread(${threadId}, ${tag.id})`);
        await tagSystem.removeTagFromThread(threadId, tag.id);
        debug(`✅ [${operationId}] Successfully called removeTagFromThread`);
      }
      
      log(`🎉 [${operationId}] Operation completed: ${shouldAssign ? 'added' : 'removed'} tag ${tag.id} ${shouldAssign ? 'to' : 'from'} thread ${threadId}`);
      
    } catch (error) {
      logError(`❌ [${operationId}] Operation failed:`, error as Error);
      throw error;
    } finally {
      setIsLoading(false);
      debug(`🏁 [${operationId}] Operation finished, loading set to false`);
    }
  }, [threadId, tag.id, tagSystem, debug, log, logError, effectivelyAssigned]);

  /**
   * Handle tag toggle with debouncing and optimistic updates
   */
  const handleToggle = useCallback(async () => {
    const targetState = !effectivelyAssigned;
    const toggleId = `TOGGLE-${threadId}-${tag.id}-${Date.now()}`;
    
    debug(`🎯 [${toggleId}] Toggle initiated: current=${effectivelyAssigned ? 'ASSIGNED' : 'UNASSIGNED'} → target=${targetState ? 'ASSIGNED' : 'UNASSIGNED'}`);
    debug(`🎯 [${toggleId}] Has pending timeout: ${timeoutRef.current !== null}`);
    
    // Set optimistic state immediately for instant feedback using TagSystem
    if (targetState) {
      debug(`🔵 [${toggleId}] Setting optimistic ASSIGNED state`);
      tagSystem.setOptimisticAssigned(threadId, tag.id);
    } else {
      debug(`🔴 [${toggleId}] Setting optimistic REMOVED state`);
      tagSystem.setOptimisticRemoved(threadId, tag.id);
    }
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      debug(`⏹️ [${toggleId}] Clearing existing timeout`);
      clearPendingTimeout();
    } else {
      debug(`✨ [${toggleId}] No existing timeout to clear`);
    }
    
    // Schedule the actual operation
    debug(`⏰ [${toggleId}] Scheduling operation with ${debounceDelay}ms delay`);
    timeoutRef.current = setTimeout(async () => {
      debug(`🎬 [${toggleId}] Timeout fired, executing operation`);
      try {
        await performOperation(targetState);
        
        debug(`🧹 [${toggleId}] Clearing optimistic state after successful operation`);
        tagSystem.clearOptimistic(threadId, tag.id);
      } catch {
        debug(`🚨 [${toggleId}] Operation failed, reverting optimistic state`);
        tagSystem.clearOptimistic(threadId, tag.id);
      } finally {
        timeoutRef.current = null;
        debug(`🎬 [${toggleId}] Timeout completed, ref cleared`);
      }
    }, debounceDelay);
    
  }, [effectivelyAssigned, clearPendingTimeout, performOperation, debounceDelay, debug, tagSystem, threadId, tag.id]);

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
            : 'opacity-60 hover:opacity-80'
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