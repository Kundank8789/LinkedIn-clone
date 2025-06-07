import express from 'express';
import { 
    getOrCreateConversation,
    getUserConversations,
    sendMessage,
    getConversationMessages,
    markMessagesAsRead
} from '../controllers/message.controllers.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyToken);

// Conversation routes
router.post('/conversation', getOrCreateConversation);
router.get('/conversations/:userId', getUserConversations);

// Message routes
router.post('/send', sendMessage);
router.get('/conversation/:conversationId', getConversationMessages);
router.put('/conversation/:conversationId/read', markMessagesAsRead);

export default router;
