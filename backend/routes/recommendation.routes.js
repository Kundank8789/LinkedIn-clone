import express from 'express';
import {
    createRecommendation,
    updateRecommendationStatus,
    getUserRecommendations,
    getRecommendationsWritten,
    deleteRecommendation
} from '../controllers/recommendation.controllers.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

// Create a recommendation
router.post('/', isAuth, createRecommendation);

// Update recommendation status
router.put('/status', isAuth, updateRecommendationStatus);

// Get recommendations for a user
router.get('/received/:userId', isAuth, getUserRecommendations);

// Get recommendations written by a user
router.get('/written/:userId', isAuth, getRecommendationsWritten);

// Delete a recommendation
router.delete('/:recommendationId', isAuth, deleteRecommendation);

export default router;
