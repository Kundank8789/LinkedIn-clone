import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new post
export const createPost = async (req, res) => {
    try {
        const { userId, text } = req.body;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Create post object
        const postData = {
            user: userId,
            text
        };

        // If image is uploaded, add it to the post
        if (req.file) {
            postData.image = `/uploads/posts/${req.file.filename}`;
        }

        // Create and save the post
        const newPost = new Post(postData);
        await newPost.save();

        // Populate user data
        await newPost.populate('user', 'firstName lastName userName profileImage');

        // Get io instance and emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('post_created', newPost);
        }

        res.status(201).json(newPost);
    } catch (error) {
        console.error("Create post error:", error);
        res.status(500).json({ message: error.message || "Error creating post" });
    }
};

// Get all posts (feed)
export const getPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get posts with pagination, sorted by newest first
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'firstName lastName userName profileImage headline')
            .populate('comments.user', 'firstName lastName userName profileImage');

        // Get total count for pagination
        const total = await Post.countDocuments();

        res.status(200).json({
            posts,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        console.error("Get posts error:", error);
        res.status(500).json({ message: error.message || "Error fetching posts" });
    }
};

// Get posts by user ID
export const getUserPosts = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get user's posts
        const posts = await Post.find({ user: userId })
            .sort({ createdAt: -1 })
            .populate('user', 'firstName lastName userName profileImage headline')
            .populate('comments.user', 'firstName lastName userName profileImage');

        res.status(200).json(posts);
    } catch (error) {
        console.error("Get user posts error:", error);
        res.status(500).json({ message: error.message || "Error fetching user posts" });
    }
};

// Get a single post by ID
export const getPost = async (req, res) => {
    try {
        const { postId } = req.params;

        // Find post and populate user data
        const post = await Post.findById(postId)
            .populate('user', 'firstName lastName userName profileImage headline')
            .populate('comments.user', 'firstName lastName userName profileImage')
            .populate('likes', 'firstName lastName userName profileImage');

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        res.status(200).json(post);
    } catch (error) {
        console.error("Get post error:", error);
        res.status(500).json({ message: error.message || "Error fetching post" });
    }
};

// Update a post
export const updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { text } = req.body;

        // Find post
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if user is the post owner
        if (post.user.toString() !== req.body.userId) {
            return res.status(403).json({ message: "You can only update your own posts" });
        }

        // Update post text
        post.text = text;

        // If new image is uploaded
        if (req.file) {
            // Delete old image if exists
            if (post.image && post.image.startsWith('/uploads/')) {
                const oldImagePath = path.join(__dirname, '..', 'public', post.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            // Set new image
            post.image = `/uploads/posts/${req.file.filename}`;
        }

        // Save updated post
        await post.save();

        // Populate user data
        await post.populate('user', 'firstName lastName userName profileImage headline');

        // Get io instance and emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('post_updated', post);
        }

        res.status(200).json(post);
    } catch (error) {
        console.error("Update post error:", error);
        res.status(500).json({ message: error.message || "Error updating post" });
    }
};

// Delete a post
export const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId } = req.body;

        // Find post
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if user is the post owner
        if (post.user.toString() !== userId) {
            return res.status(403).json({ message: "You can only delete your own posts" });
        }

        // Delete post image if exists
        if (post.image && post.image.startsWith('/uploads/')) {
            const imagePath = path.join(__dirname, '..', 'public', post.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Delete post
        await Post.findByIdAndDelete(postId);

        // Get io instance and emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('post_deleted', postId);
        }

        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.error("Delete post error:", error);
        res.status(500).json({ message: error.message || "Error deleting post" });
    }
};

// Like/Unlike a post
export const likePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId } = req.body;

        // Find post
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if user already liked the post
        const isLiked = post.likes.includes(userId);

        if (isLiked) {
            // Unlike: Remove user from likes array
            post.likes = post.likes.filter(id => id.toString() !== userId);
        } else {
            // Like: Add user to likes array
            post.likes.push(userId);
        }

        // Save updated post
        await post.save();

        // Populate post for socket emission
        await post.populate('user', 'firstName lastName userName profileImage headline');

        // Get io instance and emit socket event
        const io = req.app.get('io');
        if (io) {
            // Get user info for notification
            const user = await User.findById(userId).select('firstName lastName');
            const userName = `${user.firstName} ${user.lastName}`;

            io.emit('post_liked', {
                post,
                userId,
                userName
            });
        }

        res.status(200).json({
            message: isLiked ? "Post unliked" : "Post liked",
            likes: post.likes.length,
            isLiked: !isLiked
        });
    } catch (error) {
        console.error("Like post error:", error);
        res.status(500).json({ message: error.message || "Error liking/unliking post" });
    }
};

// Add a comment to a post
export const addComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId, text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ message: "Comment text is required" });
        }

        // Find post
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Create new comment
        const newComment = {
            user: userId,
            text: text.trim()
        };

        // Add comment to post
        post.comments.push(newComment);

        // Save updated post
        await post.save();

        // Get the newly added comment with user data
        const addedComment = post.comments[post.comments.length - 1];
        await Post.populate(post, {
            path: 'comments.user',
            select: 'firstName lastName userName profileImage',
            match: { _id: addedComment.user }
        });

        // Populate the full post for socket emission
        const populatedPost = await Post.findById(post._id)
            .populate('user', 'firstName lastName userName profileImage headline')
            .populate('comments.user', 'firstName lastName userName profileImage');

        // Get io instance and emit socket event
        const io = req.app.get('io');
        if (io) {
            // Get user info for notification
            const user = await User.findById(userId).select('firstName lastName');
            const userName = `${user.firstName} ${user.lastName}`;

            io.emit('comment_added', {
                post: populatedPost,
                userId,
                userName
            });
        }

        res.status(201).json(addedComment);
    } catch (error) {
        console.error("Add comment error:", error);
        res.status(500).json({ message: error.message || "Error adding comment" });
    }
};

// Delete a comment
export const deleteComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { userId } = req.body;

        // Find post
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Find comment
        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Check if user is the comment owner or post owner
        if (comment.user.toString() !== userId && post.user.toString() !== userId) {
            return res.status(403).json({ message: "You can only delete your own comments or comments on your posts" });
        }

        // Remove comment
        comment.remove();

        // Save updated post
        await post.save();

        // Populate the full post for socket emission
        const populatedPost = await Post.findById(post._id)
            .populate('user', 'firstName lastName userName profileImage headline')
            .populate('comments.user', 'firstName lastName userName profileImage');

        // Get io instance and emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('post_updated', populatedPost);
        }

        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.error("Delete comment error:", error);
        res.status(500).json({ message: error.message || "Error deleting comment" });
    }
};
