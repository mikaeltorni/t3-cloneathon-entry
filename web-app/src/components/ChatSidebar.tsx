import { useState } from 'react';
import type { ChatThread } from '../../../src/shared/types';

interface ChatSidebarProps {
  threads: ChatThread[];
  currentThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  onNewChat: () => void;
  onDeleteThread: (threadId: string) => void;
  loading: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  threads,
  currentThreadId,
  onThreadSelect,
  onNewChat,
  onDeleteThread,
  loading
}) => {
  const [deletingThread, setDeletingThread] = useState<string | null>(null);

  const handleDeleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingThread(threadId);
    try {
      await onDeleteThread(threadId);
    } finally {
      setDeletingThread(null);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return d.toLocaleDateString();
    }
  };

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewChat}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          <span className="mr-2">💬</span>
          New Chat
        </button>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-2xl block mb-2">💭</span>
            No chats yet
          </div>
        ) : (
          <div className="p-2">
            {threads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => onThreadSelect(thread.id)}
                className={`group p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                  currentThreadId === thread.id
                    ? 'bg-blue-100 border border-blue-200'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {thread.title}
                    </h3>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <span>{formatDate(thread.updatedAt)}</span>
                      <span className="mx-1">•</span>
                      <span>{thread.messages.length} messages</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteThread(thread.id, e)}
                    disabled={deletingThread === thread.id}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-700 transition-all ml-2"
                  >
                    {deletingThread === thread.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <span className="text-sm">🗑️</span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 text-xs text-gray-500 text-center">
        <span className="flex items-center justify-center">
          <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
          Chat data is automatically saved
        </span>
      </div>
    </div>
  );
}; 