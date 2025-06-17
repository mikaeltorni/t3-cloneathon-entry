/**
 * ThreadTagList.tsx
 * 
 * Component for rendering a list of tags for thread assignment management
 * 
 * Components:
 *   ThreadTagList - Renders all available tags with individual management
 * 
 * Features:
 *   - Uses ThreadTag components for individual tag management
 *   - Shows assigned and unassigned tags
 *   - Each tag handles its own debouncing and optimistic updates
 *   - Responsive grid layout
 * 
 * Usage: <ThreadTagList threadId={threadId} availableTags={tags} threadTags={threadTags} onThreadUpdate={onUpdate} />
 */
import React from 'react';
import { ThreadTag } from './ThreadTag';
import { cn } from '../../utils/cn';
import type { ChatTag, ChatThread } from '../../../../src/shared/types';

interface ThreadTagListProps {
  /** Thread ID */
  threadId: string;
  /** All available tags */
  availableTags: ChatTag[];
  /** Current thread tag IDs */
  threadTags: string[];
  /** Callback to update thread */
  onThreadUpdate?: (threadId: string, updates: Partial<ChatThread>) => Promise<void>;
  /** Optional click handler for tag selection/filtering */
  onTagClick?: (tag: ChatTag) => void;
  /** Optional right-click handler */
  onTagRightClick?: (e: React.MouseEvent, tag: ChatTag) => void;
  /** Selected tag IDs for filtering highlight */
  selectedTagIds?: string[];
  /** Tag size */
  size?: 'sm' | 'md' | 'lg';
  /** Maximum number of tags to show (0 = show all) */
  maxTags?: number;
  /** Whether to show unassigned tags */
  showUnassigned?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Thread tag list component
 * 
 * Renders all available tags with individual debounced management.
 * Each tag component handles its own state and API calls.
 * 
 * @param props - Component props
 * @returns React component
 */
export const ThreadTagList: React.FC<ThreadTagListProps> = ({
  threadId,
  availableTags,
  threadTags,
  onThreadUpdate,
  onTagClick,
  onTagRightClick,
  selectedTagIds = [],
  size = 'md',
  maxTags = 0,
  showUnassigned = true,
  className
}) => {
  // Separate assigned and unassigned tags
  const assignedTags = availableTags.filter(tag => threadTags.includes(tag.id));
  const unassignedTags = availableTags.filter(tag => !threadTags.includes(tag.id));
  
  // Determine which tags to show
  let tagsToShow = showUnassigned ? availableTags : assignedTags;
  
  // Apply max tags limit if specified
  if (maxTags > 0) {
    tagsToShow = tagsToShow.slice(0, maxTags);
  }

  // Sort tags: assigned first, then by name
  const sortedTags = [...tagsToShow].sort((a, b) => {
    const aAssigned = threadTags.includes(a.id);
    const bAssigned = threadTags.includes(b.id);
    
    if (aAssigned && !bAssigned) return -1;
    if (!aAssigned && bAssigned) return 1;
    
    return a.name.localeCompare(b.name);
  });

  if (sortedTags.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Assigned tags section */}
      {assignedTags.length > 0 && showUnassigned && (
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-1">Assigned Tags</h4>
          <div className="flex flex-wrap gap-1">
            {assignedTags.map(tag => (
              <ThreadTag
                key={`${threadId}-${tag.id}`}
                tag={tag}
                threadId={threadId}
                isAssigned={true}
                onThreadUpdate={onThreadUpdate}
                currentThreadTags={threadTags}
                onClick={onTagClick}
                onRightClick={onTagRightClick}
                selected={selectedTagIds.includes(tag.id)}
                size={size}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* All tags or unassigned tags section */}
      {showUnassigned && unassignedTags.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-1">Available Tags</h4>
          <div className="flex flex-wrap gap-1">
            {unassignedTags.slice(0, maxTags > 0 ? maxTags - assignedTags.length : undefined).map(tag => (
              <ThreadTag
                key={`${threadId}-${tag.id}`}
                tag={tag}
                threadId={threadId}
                isAssigned={false}
                onThreadUpdate={onThreadUpdate}
                currentThreadTags={threadTags}
                onClick={onTagClick}
                onRightClick={onTagRightClick}
                selected={selectedTagIds.includes(tag.id)}
                size={size}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Simple flat list when not showing unassigned separately */}
      {!showUnassigned && (
        <div className="flex flex-wrap gap-1">
          {sortedTags.map(tag => (
            <ThreadTag
              key={`${threadId}-${tag.id}`}
              tag={tag}
              threadId={threadId}
              isAssigned={threadTags.includes(tag.id)}
              onThreadUpdate={onThreadUpdate}
              currentThreadTags={threadTags}
              onClick={onTagClick}
              onRightClick={onTagRightClick}
              selected={selectedTagIds.includes(tag.id)}
              size={size}
            />
          ))}
        </div>
      )}
    </div>
  );
}; 