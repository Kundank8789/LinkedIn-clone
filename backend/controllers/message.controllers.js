import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";

// Get or create conversation between two users
export const getOrCreateConversation = async (req, res) => {
    try {
        const { userId, recipientId } = req.body;
        
        // Validate input
        if (userId === recipientId) {
            return res.status(400).json({ message: "Cannot create conversation with yourself" });
        }
        
        // Check if both users exist
        const [user, recipient] = await Promise.all([
            User.findById(userId),
            User.findById(recipientId)
        ]);
        
        if (!user || !recipient) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Sort participant IDs to ensure consistent lookup
        const participants = [userId, recipientId].sort();
        
        // Find existing conversation or create new one
        let conversation = await Conversation.findOne({
            participants: { $all: participants }
        }).populate('participants', 'firstName lastName userName profileImage');
        
        if (!conversation) {
            // Create new conversation
            conversation = new Conversation({
                participants,
                unreadCount: new Map([[recipientId, 0], [userId, 0]])
            });
            
            await conversation.save();
            
            // Populate participant data
            await conversation.populate('participants', 'firstName lastName userName profileImage');
        }
        
        res.status(200).json(conversation);
    } catch (error) {
        console.error("Get/create conversation error:", error);
        res.status(500).json({ message: error.message || "Error with conversation" });
    }
};

// Get user's conversations
export const getUserConversations = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Find all conversations where user is a participant
        const conversations = await Conversation.find({
            participants: userId
        })
        .populate('participants', 'firstName lastName userName profileImage')
        .populate('lastMessage')
        .sort({ updatedAt: -1 });
        
        // Format response
        const formattedConversations = conversations.map(conv => {
            // Get the other participant
            const otherParticipant = conv.participants.find(
                p => p._id.toString() !== userId
            );
            
            return {
                _id: conv._id,
                participant: otherParticipant,
                lastMessage: conv.lastMessage,
                unreadCount: conv.unreadCount.get(userId) || 0,
                updatedAt: conv.updatedAt
            };
        });
        
        res.status(200).json(formattedConversations);
    } catch (error) {
        console.error("Get user conversations error:", error);
        res.status(500).json({ message: error.message || "Error fetching conversations" });
    }
};

// Send a message
export const sendMessage = async (req, res) => {
    try {
        const { conversationId, senderId, recipientId, text } = req.body;
        
        if (!text || !text.trim()) {
            return res.status(400).json({ message: "Message text is required" });
        }
        
        // Find conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        
        // Verify sender is a participant
        if (!conversation.participants.includes(senderId)) {
            return res.status(403).json({ message: "You are not part of this conversation" });
        }
        
        // Create new message
        const newMessage = new Message({
            sender: senderId,
            recipient: recipientId,
            conversation: conversationId,
            text: text.trim()
        });
        
        await newMessage.save();
        
        // Update conversation with last message and increment unread count
        conversation.lastMessage = newMessage._id;
        
        // Increment unread count for recipient
        const currentCount = conversation.unreadCount.get(recipientId) || 0;
        conversation.unreadCount.set(recipientId, currentCount + 1);
        
        await conversation.save();
        
        // Populate sender data
        await newMessage.populate('sender', 'firstName lastName userName profileImage');
        
        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({ message: error.message || "Error sending message" });
    }
};

// Get messages for a conversation
export const getConversationMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { userId } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        // Find conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        
        // Verify user is a participant
        if (!conversation.participants.includes(userId)) {
            return res.status(403).json({ message: "You are not part of this conversation" });
        }
        
        // Get messages with pagination, sorted by newest first
        const messages = await Message.find({ conversation: conversationId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender', 'firstName lastName userName profileImage');
        
        // Get total count for pagination
        const total = await Message.countDocuments({ conversation: conversationId });
        
        // Mark messages as read
        await Message.updateMany(
            { 
                conversation: conversationId,
                recipient: userId,
                read: false
            },
            { read: true }
        );
        
        // Reset unread count for this user
        conversation.unreadCount.set(userId, 0);
        await conversation.save();
        
        res.status(200).json({
            messages: messages.reverse(), // Reverse to get oldest first
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error("Get conversation messages error:", error);
        res.status(500).json({ message: error.message || "Error fetching messages" });
    }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { userId } = req.body;
        
        // Find conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        
        // Verify user is a participant
        if (!conversation.participants.includes(userId)) {
            return res.status(403).json({ message: "You are not part of this conversation" });
        }
        
        // Mark all messages as read
        await Message.updateMany(
            { 
                conversation: conversationId,
                recipient: userId,
                read: false
            },
            { read: true }
        );
        
        // Reset unread count for this user
        conversation.unreadCount.set(userId, 0);
        await conversation.save();
        
        res.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
        console.error("Mark messages as read error:", error);
        res.status(500).json({ message: error.message || "Error marking messages as read" });
    }
};
