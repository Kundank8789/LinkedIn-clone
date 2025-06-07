import express from 'express';
import {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    createNotificationAPI
} from '../controllers/notification.controllers.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyToken);

// Notification routes
router.post('/', createNotificationAPI);
router.get('/:userId', getUserNotifications);
router.put('/:notificationId/read', markNotificationAsRead);
router.put('/read-all/:userId', markAllNotificationsAsRead);
router.delete('/:notificationId', deleteNotification);

export default router;
