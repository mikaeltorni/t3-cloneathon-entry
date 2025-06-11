import express from 'express';
import cors from 'cors';
import path from 'path';
import { chatStorage } from './chatStorage';
import { createOpenRouterService } from './openRouterService';
import { CreateMessageRequest, CreateMessageResponse, GetChatsResponse } from '../shared/types';

const app = express();
const PORT = process.env.PORT || 3001;

// Get API key from environment
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY environment variable is required');
  process.exit(1);
}

const openRouterService = createOpenRouterService(OPENROUTER_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from web-app dist
app.use(express.static(path.join(__dirname, '../../web-app/dist')));

// API Routes

// Get all chat threads
app.get('/api/chats', (req, res) => {
  try {
    const threads = chatStorage.getAllThreads();
    const response: GetChatsResponse = { threads };
    res.json(response);
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

// Get specific thread
app.get('/api/chats/:threadId', (req, res) => {
  try {
    const { threadId } = req.params;
    const thread = chatStorage.getThread(threadId);
    
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    res.json(thread);
  } catch (error) {
    console.error('Error getting thread:', error);
    res.status(500).json({ error: 'Failed to get thread' });
  }
});

// Create new message (and thread if needed)
app.post('/api/chats/message', async (req, res) => {
  try {
    const { threadId, content, imageUrl }: CreateMessageRequest = req.body;
    
    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    let thread;
    let currentThreadId = threadId;

    // Create new thread if none provided
    if (!currentThreadId) {
      const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
      thread = chatStorage.createThread(title);
      currentThreadId = thread.id;
    } else {
      thread = chatStorage.getThread(currentThreadId);
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
    }

    // Create user message
    const userMessage = chatStorage.createMessage(content, 'user', imageUrl);
    chatStorage.addMessageToThread(currentThreadId, userMessage);

    // Get conversation history for context
    const conversationHistory = thread.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      imageUrl: msg.imageUrl
    }));

    // Add the new user message to history
    conversationHistory.push({
      role: 'user',
      content,
      imageUrl
    });

    // Get AI response
    const aiResponse = await openRouterService.sendMessage(conversationHistory);
    
    // Create assistant message
    const assistantMessage = chatStorage.createMessage(aiResponse, 'assistant');
    chatStorage.addMessageToThread(currentThreadId, assistantMessage);

    const response: CreateMessageResponse = {
      threadId: currentThreadId,
      message: userMessage,
      assistantResponse: assistantMessage
    };

    res.json(response);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// Delete thread
app.delete('/api/chats/:threadId', (req, res) => {
  try {
    const { threadId } = req.params;
    const success = chatStorage.deleteThread(threadId);
    
    if (!success) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting thread:', error);
    res.status(500).json({ error: 'Failed to delete thread' });
  }
});

// Update thread title
app.put('/api/chats/:threadId/title', (req, res) => {
  try {
    const { threadId } = req.params;
    const { title } = req.body;
    
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const thread = chatStorage.updateThreadTitle(threadId, title.trim());
    
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    res.json(thread);
  } catch (error) {
    console.error('Error updating thread title:', error);
    res.status(500).json({ error: 'Failed to update thread title' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../web-app/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Chat server running on http://localhost:${PORT}`);
  console.log(`📁 Chat data will be saved to: ${path.join(process.cwd(), 'data', 'userChats.json')}`);
}); 