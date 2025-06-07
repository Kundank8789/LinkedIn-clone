import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Job from "../models/job.model.js";

// Search users
export const searchUsers = async (req, res) => {
    try {
        const { query, location, skills, experience } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build search filter
        const filter = {};

        // Add text search if query provided
        if (query) {
            const searchRegex = new RegExp(query, 'i');
            filter.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { userName: searchRegex },
                { headline: searchRegex }
            ];
        }

        // Add location filter if provided
        if (location) {
            filter.location = new RegExp(location, 'i');
        }

        // Add skills filter if provided
        if (skills) {
            const skillsArray = skills.split(',').map(skill => skill.trim());
            filter.skills = { $in: skillsArray };
        }

        // Add experience filter if provided
        if (experience) {
            filter['experience.title'] = new RegExp(experience, 'i');
        }

        // If no filters provided, return error
        if (Object.keys(filter).length === 0) {
            return res.status(400).json({ message: "At least one search parameter is required" });
        }

        // Search users with filters
        const users = await User.find(filter)
        .select('firstName lastName userName profileImage headline location skills')
        .skip(skip)
        .limit(limit);

        // Get total count for pagination
        const total = await User.countDocuments(filter);

        res.status(200).json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error("Search users error:", error);
        res.status(500).json({ message: error.message || "Error searching users" });
    }
};

// Search posts
export const searchPosts = async (req, res) => {
    try {
        const { query } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        if (!query) {
            return res.status(400).json({ message: "Search query is required" });
        }

        // Create search regex
        const searchRegex = new RegExp(query, 'i');

        // Search posts by text content
        const posts = await Post.find({
            text: searchRegex
        })
        .populate('user', 'firstName lastName userName profileImage headline')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        // Get total count for pagination
        const total = await Post.countDocuments({
            text: searchRegex
        });

        res.status(200).json({
            posts,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error("Search posts error:", error);
        res.status(500).json({ message: error.message || "Error searching posts" });
    }
};

// Search jobs
export const searchJobs = async (req, res) => {
    try {
        const { query, location, type, company, salary, skills, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build search filter
        const filter = {
            isActive: true, // Changed from active to isActive to match the model
            expiresAt: { $gt: new Date() }
        };

        // Add text search if query provided
        if (query) {
            const searchRegex = new RegExp(query, 'i');
            filter.$or = [
                { title: searchRegex },
                { company: searchRegex },
                { description: searchRegex }
            ];
        }

        // Add location filter if provided
        if (location) {
            filter.location = new RegExp(location, 'i');
        }

        // Add job type filter if provided
        if (type) {
            filter.jobType = type; // Changed from type to jobType to match the model
        }

        // Add company filter if provided
        if (company) {
            filter.company = new RegExp(company, 'i');
        }

        // Add salary filter if provided
        if (salary) {
            filter.salary = new RegExp(salary, 'i');
        }

        // Add skills filter if provided
        if (skills) {
            const skillsArray = skills.split(',').map(skill => skill.trim());
            filter.skills = { $in: skillsArray };
        }

        // If no filters provided except active/expiry, add default text search
        if (Object.keys(filter).length <= 2) {
            return res.status(400).json({ message: "At least one search parameter is required" });
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Search jobs with filters
        const jobs = await Job.find(filter)
        .populate('postedBy', 'firstName lastName userName profileImage')
        .sort(sort)
        .skip(skip)
        .limit(limit);

        // Get total count for pagination
        const total = await Job.countDocuments(filter);

        res.status(200).json({
            jobs,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error("Search jobs error:", error);
        res.status(500).json({ message: error.message || "Error searching jobs" });
    }
};

// Global search (users, posts, jobs)
export const globalSearch = async (req, res) => {
    try {
        const { query, filter } = req.query;
        const limit = parseInt(req.query.limit) || 5;

        if (!query) {
            return res.status(400).json({ message: "Search query is required" });
        }

        // Create search regex
        const searchRegex = new RegExp(query, 'i');

        // Determine which entities to search based on filter
        const searchUsers = !filter || filter === 'all' || filter === 'users';
        const searchPosts = !filter || filter === 'all' || filter === 'posts';
        const searchJobs = !filter || filter === 'all' || filter === 'jobs';

        // Prepare promises array
        const promises = [];

        // Add user search if needed
        if (searchUsers) {
            promises.push(
                User.find({
                    $or: [
                        { firstName: searchRegex },
                        { lastName: searchRegex },
                        { userName: searchRegex },
                        { headline: searchRegex },
                        { location: searchRegex },
                        { 'skills': searchRegex }
                    ]
                })
                .select('firstName lastName userName profileImage headline location')
                .limit(limit)
            );
        } else {
            promises.push(Promise.resolve([]));
        }

        // Add post search if needed
        if (searchPosts) {
            promises.push(
                Post.find({
                    $or: [
                        { text: searchRegex },
                        { 'comments.text': searchRegex }
                    ]
                })
                .populate('user', 'firstName lastName userName profileImage')
                .sort({ createdAt: -1 })
                .limit(limit)
            );
        } else {
            promises.push(Promise.resolve([]));
        }

        // Add job search if needed
        if (searchJobs) {
            promises.push(
                Job.find({
                    isActive: true, // Changed from active to isActive to match the model
                    expiresAt: { $gt: new Date() },
                    $or: [
                        { title: searchRegex },
                        { company: searchRegex },
                        { location: searchRegex },
                        { description: searchRegex },
                        { 'skills': searchRegex }
                    ]
                })
                .populate('postedBy', 'firstName lastName userName profileImage')
                .sort({ createdAt: -1 })
                .limit(limit)
            );
        } else {
            promises.push(Promise.resolve([]));
        }

        // Execute all searches in parallel
        const [users, posts, jobs] = await Promise.all(promises);

        // Get total counts
        const countPromises = [];

        if (searchUsers) {
            countPromises.push(
                User.countDocuments({
                    $or: [
                        { firstName: searchRegex },
                        { lastName: searchRegex },
                        { userName: searchRegex },
                        { headline: searchRegex },
                        { location: searchRegex },
                        { 'skills': searchRegex }
                    ]
                })
            );
        } else {
            countPromises.push(Promise.resolve(0));
        }

        if (searchPosts) {
            countPromises.push(
                Post.countDocuments({
                    $or: [
                        { text: searchRegex },
                        { 'comments.text': searchRegex }
                    ]
                })
            );
        } else {
            countPromises.push(Promise.resolve(0));
        }

        if (searchJobs) {
            countPromises.push(
                Job.countDocuments({
                    isActive: true, // Changed from active to isActive to match the model
                    expiresAt: { $gt: new Date() },
                    $or: [
                        { title: searchRegex },
                        { company: searchRegex },
                        { location: searchRegex },
                        { description: searchRegex },
                        { 'skills': searchRegex }
                    ]
                })
            );
        } else {
            countPromises.push(Promise.resolve(0));
        }

        const [totalUsers, totalPosts, totalJobs] = await Promise.all(countPromises);

        res.status(200).json({
            users,
            posts,
            jobs,
            counts: {
                users: totalUsers,
                posts: totalPosts,
                jobs: totalJobs,
                total: totalUsers + totalPosts + totalJobs
            }
        });
    } catch (error) {
        console.error("Global search error:", error);
        res.status(500).json({ message: error.message || "Error performing search" });
    }
};
