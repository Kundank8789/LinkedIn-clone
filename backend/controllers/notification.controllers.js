import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

// Create a notification
export const createNotification = async (notificationData) => {
    try {
        const notification = new Notification(notificationData);
        await notification.save();

        // Populate sender information for real-time notifications
        if (notificationData.sender) {
            const populatedNotification = await Notification.findById(notification._id)
                .populate('sender', 'firstName lastName userName profileImage')
                .populate('relatedId');
            return populatedNotification;
        }

        return notification;
    } catch (error) {
        console.error("Create notification error:", error);
        return null;
    }
};

// Create notification via API
export const createNotificationAPI = async (req, res) => {
    try {
        const { recipient, type, content, relatedId } = req.body;
        const sender = req.userId;

        if (!recipient || !type || !content) {
            return res.status(400).json({ message: "Recipient, type, and content are required" });
        }

        // Create notification
        const notificationData = {
            recipient,
            sender,
            type,
            content,
            relatedId,
            read: false,
            createdAt: new Date()
        };

        const notification = await createNotification(notificationData);

        if (!notification) {
            return res.status(500).json({ message: "Failed to create notification" });
        }

        // Get the populated notification for response
        const populatedNotification = await Notification.findById(notification._id)
            .populate('sender', 'firstName lastName userName profileImage')
            .populate('relatedId');

        res.status(201).json(populatedNotification);

        // Emit socket event if socket.io is available
        const io = req.app.get('io');
        if (io) {
            io.to(recipient).emit('notification', populatedNotification);
        }
    } catch (error) {
        console.error("Create notification API error:", error);
        res.status(500).json({ message: error.message || "Error creating notification" });
    }
};

// Get user's notifications
export const getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const { type, read, startDate, endDate } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = { recipient: userId };

        // Add type filter if provided
        if (type) {
            filter.type = type;
        }

        // Add read status filter if provided
        if (read !== undefined) {
            filter.read = read === 'true';
        }

        // Add date range filter if provided
        if (startDate || endDate) {
            filter.createdAt = {};

            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }

            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }

        // Get notifications with pagination, sorted by newest first
        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender', 'firstName lastName userName profileImage')
            .populate('relatedId');

        // Get total count for pagination
        const total = await Notification.countDocuments(filter);

        // Get unread count
        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            read: false
        });

        // Get notification counts by type
        const typeCounts = await Notification.aggregate([
            { $match: { recipient: userId } },
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        // Format type counts as an object
        const typeCountsObj = {};
        typeCounts.forEach(item => {
            typeCountsObj[item._id] = item.count;
        });

        res.status(200).json({
            notifications,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
            unreadCount,
            typeCounts: typeCountsObj
        });
    } catch (error) {
        console.error("Get user notifications error:", error);
        res.status(500).json({ message: error.message || "Error fetching notifications" });
    }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        // Find and update notification
        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json(notification);
    } catch (error) {
        console.error("Mark notification as read error:", error);
        res.status(500).json({ message: error.message || "Error marking notification as read" });
    }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
    try {
        const { userId } = req.params;

        // Update all unread notifications for user
        await Notification.updateMany(
            { recipient: userId, read: false },
            { read: true }
        );

        res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Mark all notifications as read error:", error);
        res.status(500).json({ message: error.message || "Error marking notifications as read" });
    }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;

        // Find and delete notification
        const notification = await Notification.findByIdAndDelete(notificationId);

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.error("Delete notification error:", error);
        res.status(500).json({ message: error.message || "Error deleting notification" });
    }
};
