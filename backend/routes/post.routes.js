import express from 'express';
import { 
    createPost, 
    getPosts, 
    getUserPosts, 
    getPost, 
    updatePost, 
    deletePost, 
    likePost, 
    addComment, 
    deleteComment 
} from '../controllers/post.controllers.js';
import upload from '../middlewares/postUpload.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyToken);

// Post CRUD routes
router.post('/', upload.single('image'), createPost);
router.get('/', getPosts);
router.get('/user/:userId', getUserPosts);
router.get('/:postId', getPost);
router.put('/:postId', upload.single('image'), updatePost);
router.delete('/:postId', deletePost);

// Like/Unlike a post
router.post('/:postId/like', likePost);

// Comment routes
router.post('/:postId/comments', addComment);
router.delete('/:postId/comments/:commentId', deleteComment);

export default router;
