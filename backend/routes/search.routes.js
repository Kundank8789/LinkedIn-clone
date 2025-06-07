import express from 'express';
import {
    searchUsers,
    searchPosts,
    searchJobs,
    globalSearch
} from '../controllers/search.controllers.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

// Apply auth middleware to all routes (optional for search)
// router.use(isAuth);

// Search routes
router.get('/users', searchUsers);
router.get('/posts', searchPosts);
router.get('/jobs', searchJobs);
router.get('/global', globalSearch);

export default router;
