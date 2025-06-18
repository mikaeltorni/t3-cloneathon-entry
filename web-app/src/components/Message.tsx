/**
 * Message.tsx
 * 
 * Individual message component - refactored with extracted components
 * Enhanced with comprehensive dark mode support
 * 
 * Components:
 *   Message
 * 
 * Features:
 *   - Composed of smaller, focused components
 *   - User and assistant message styling with dark mode
 *   - Image rendering with responsive grid
 *   - Reasoning toggle and collapsible display
 *   - Inline bracketed source citations
 *   - Timestamp and copy functionality
 *   - Performance optimized with React.memo
 *   - Markdown rendering
 *   - Enhanced dark mode styling
 * 
 * Usage: <Message message={message} showReasoning={showReasoning} onToggleReasoning={handleToggle} />
 */
import React from 'react';
import { MessageImageGrid } from './message/MessageImageGrid';
import { MessageDocumentGrid } from './message/MessageDocumentGrid';
import { MessageReasoning } from './message/MessageReasoning';
import { MessageContent } from './message/MessageContent';
import { MessageMeta } from './message/MessageMeta';
import type { ChatMessage } from '../../../src/shared/types';

interface MessageProps {
  message: ChatMessage;
  showReasoning: boolean;
  onToggleReasoning: () => void;
}

/**
 * Individual message display component - refactored with extracted components
 * Enhanced with comprehensive dark mode support
 * 
 * @param message - Message data
 * @param showReasoning - Whether reasoning is currently shown
 * @param onToggleReasoning - Toggle reasoning visibility
 * @returns React component
 */
const Message: React.FC<MessageProps> = React.memo(({ 
  message, 
  showReasoning, 
  onToggleReasoning 
}) => {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-4 group">
        <div className="max-w-[80%] sm:max-w-[70%]">
          <div className="bg-blue-600 dark:bg-blue-700 text-white p-3 rounded-lg rounded-br-sm shadow-sm dark:shadow-slate-900/50">
            <MessageImageGrid 
              images={message.images}
              imageUrl={message.imageUrl}
            />
            <MessageDocumentGrid 
              documents={message.documents}
              isUserMessage={true}
            />
            <MessageContent 
              content={message.content}
              annotations={message.annotations}
              isUserMessage={true}
            />
          </div>
          <MessageMeta 
            timestamp={message.timestamp}
            content={message.content}
            isUserMessage={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4 group">
      <div className="max-w-[85%] sm:max-w-[75%]">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 p-3 rounded-lg rounded-bl-sm shadow-sm dark:shadow-slate-900/50">
          <MessageReasoning 
            reasoning={message.reasoning}
            messageId={message.id}
            showReasoning={showReasoning}
            onToggleReasoning={onToggleReasoning}
            message={message}
          />
          <MessageImageGrid 
            images={message.images}
            imageUrl={message.imageUrl}
          />
          <MessageDocumentGrid 
            documents={message.documents}
            isUserMessage={false}
          />
          <MessageContent 
            content={message.content}
            annotations={message.annotations}
            isUserMessage={false}
            hasReasoning={!!message.reasoning}
          />
        </div>
        <MessageMeta 
          timestamp={message.timestamp}
          content={message.content}
          isUserMessage={false}
        />
      </div>
    </div>
  );
});

Message.displayName = 'Message';

export { Message }; 