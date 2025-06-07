import express from 'express';
import {
    trackView,
    updateEngagement,
    getEntityAnalytics,
    getProfileViewers,
    getUserDashboardAnalytics
} from '../controllers/analytics.controllers.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

// Track a view
router.post('/view', trackView);

// Update engagement metrics
router.post('/engagement', updateEngagement);

// Get analytics for an entity
router.get('/:entityType/:entityId', isAuth, getEntityAnalytics);

// Get profile viewers
router.get('/profile/viewers/:profileId', isAuth, getProfileViewers);

// Get user's dashboard analytics
router.get('/dashboard/user', isAuth, getUserDashboardAnalytics);

export default router;
