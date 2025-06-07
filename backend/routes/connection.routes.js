import express from 'express';
import {
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    removeConnection,
    getConnectionRequests,
    getConnections,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getConnectionStatus,
    getConnectionSuggestions,
    getMutualConnections
} from '../controllers/connection.controllers.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyToken);

// Connection request routes
router.post('/request', sendConnectionRequest);
router.post('/accept', acceptConnectionRequest);
router.post('/reject', rejectConnectionRequest);
router.post('/remove', removeConnection);
router.get('/requests/:userId', getConnectionRequests);
router.get('/:userId', getConnections);

// Follow/Unfollow routes
router.post('/follow', followUser);
router.post('/unfollow', unfollowUser);
router.get('/followers/:userId', getFollowers);
router.get('/following/:userId', getFollowing);

// Connection status and suggestions
router.get('/status/:userId/:targetUserId', getConnectionStatus);
router.get('/suggestions/:userId', getConnectionSuggestions);
router.get('/mutual/:userId/:targetUserId', getMutualConnections);

export default router;
