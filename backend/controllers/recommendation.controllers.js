import Recommendation from "../models/recommendation.model.js";
import User from "../models/user.model.js";
import { createNotification } from "./notification.controllers.js";

// Create a recommendation
export const createRecommendation = async (req, res) => {
    try {
        const { recipientId, relationship, position, content } = req.body;
        const authorId = req.userId;

        // Validate input
        if (!recipientId || !relationship || !position || !content) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ message: "Recipient not found" });
        }

        // Check if author exists
        const author = await User.findById(authorId);
        if (!author) {
            return res.status(404).json({ message: "Author not found" });
        }

        // Create recommendation
        const recommendation = new Recommendation({
            recipient: recipientId,
            author: authorId,
            relationship,
            position,
            content,
            status: 'pending',
            isPublic: false
        });

        await recommendation.save();

        // Create notification
        const notificationData = {
            recipient: recipientId,
            sender: authorId,
            type: 'recommendation_received',
            content: `${author.firstName} ${author.lastName} wrote you a recommendation`,
            relatedId: recommendation._id,
            onModel: 'Recommendation',
            read: false
        };

        await createNotification(notificationData);

        // Get the populated recommendation
        const populatedRecommendation = await Recommendation.findById(recommendation._id)
            .populate('author', 'firstName lastName userName profileImage headline')
            .populate('recipient', 'firstName lastName userName profileImage headline');

        res.status(201).json({
            message: "Recommendation created successfully",
            recommendation: populatedRecommendation
        });
    } catch (error) {
        console.error("Create recommendation error:", error);
        res.status(500).json({ message: error.message || "Error creating recommendation" });
    }
};

// Update recommendation status (approve/reject)
export const updateRecommendationStatus = async (req, res) => {
    try {
        const { recommendationId, status, isPublic } = req.body;
        const userId = req.userId;

        // Validate input
        if (!recommendationId || !status) {
            return res.status(400).json({ message: "Recommendation ID and status are required" });
        }

        // Check if status is valid
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
        }

        // Find recommendation
        const recommendation = await Recommendation.findById(recommendationId);
        if (!recommendation) {
            return res.status(404).json({ message: "Recommendation not found" });
        }

        // Check if user is the recipient
        if (recommendation.recipient.toString() !== userId) {
            return res.status(403).json({ message: "You can only update recommendations you received" });
        }

        // Update recommendation
        recommendation.status = status;
        if (isPublic !== undefined) {
            recommendation.isPublic = isPublic;
        }

        await recommendation.save();

        // Get the populated recommendation
        const populatedRecommendation = await Recommendation.findById(recommendation._id)
            .populate('author', 'firstName lastName userName profileImage headline')
            .populate('recipient', 'firstName lastName userName profileImage headline');

        res.status(200).json({
            message: `Recommendation ${status}`,
            recommendation: populatedRecommendation
        });
    } catch (error) {
        console.error("Update recommendation status error:", error);
        res.status(500).json({ message: error.message || "Error updating recommendation status" });
    }
};

// Get recommendations for a user
export const getUserRecommendations = async (req, res) => {
    try {
        const { userId } = req.params;
        const requesterId = req.userId;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Build query
        const query = { recipient: userId };

        // If requester is not the profile owner, only show approved and public recommendations
        if (requesterId !== userId) {
            query.status = 'approved';
            query.isPublic = true;
        }

        // Get recommendations
        const recommendations = await Recommendation.find(query)
            .populate('author', 'firstName lastName userName profileImage headline')
            .sort({ createdAt: -1 });

        res.status(200).json(recommendations);
    } catch (error) {
        console.error("Get user recommendations error:", error);
        res.status(500).json({ message: error.message || "Error getting recommendations" });
    }
};

// Get recommendations written by a user
export const getRecommendationsWritten = async (req, res) => {
    try {
        const { userId } = req.params;
        const requesterId = req.userId;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Build query
        const query = { author: userId };

        // If requester is not the author, only show approved and public recommendations
        if (requesterId !== userId) {
            query.status = 'approved';
            query.isPublic = true;
        }

        // Get recommendations
        const recommendations = await Recommendation.find(query)
            .populate('recipient', 'firstName lastName userName profileImage headline')
            .sort({ createdAt: -1 });

        res.status(200).json(recommendations);
    } catch (error) {
        console.error("Get recommendations written error:", error);
        res.status(500).json({ message: error.message || "Error getting recommendations" });
    }
};

// Delete a recommendation
export const deleteRecommendation = async (req, res) => {
    try {
        const { recommendationId } = req.params;
        const userId = req.userId;

        // Find recommendation
        const recommendation = await Recommendation.findById(recommendationId);
        if (!recommendation) {
            return res.status(404).json({ message: "Recommendation not found" });
        }

        // Check if user is the author or recipient
        if (recommendation.author.toString() !== userId && recommendation.recipient.toString() !== userId) {
            return res.status(403).json({ message: "You can only delete recommendations you wrote or received" });
        }

        // Delete recommendation
        await Recommendation.findByIdAndDelete(recommendationId);

        res.status(200).json({ message: "Recommendation deleted successfully" });
    } catch (error) {
        console.error("Delete recommendation error:", error);
        res.status(500).json({ message: error.message || "Error deleting recommendation" });
    }
};
