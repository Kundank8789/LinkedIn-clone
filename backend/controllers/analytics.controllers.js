import Analytics from "../models/analytics.model.js";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Job from "../models/Job.js";
import Company from "../models/company.model.js";
import { createNotification } from "./notification.controllers.js";

// Track a view
export const trackView = async (req, res) => {
    try {
        const { entityType, entityId, source } = req.body;
        const userId = req.userId || null;

        // Validate input
        if (!entityType || !entityId) {
            return res.status(400).json({ message: "Entity type and ID are required" });
        }

        // Validate entity type
        const validEntityTypes = ['profile', 'post', 'job', 'company'];
        if (!validEntityTypes.includes(entityType)) {
            return res.status(400).json({ message: "Invalid entity type" });
        }

        // Find entity owner
        let owner;
        switch (entityType) {
            case 'profile':
                owner = entityId; // For profiles, the entity ID is the user ID
                break;
            case 'post':
                const post = await Post.findById(entityId);
                if (!post) {
                    return res.status(404).json({ message: "Post not found" });
                }
                owner = post.user;
                break;
            case 'job':
                const job = await Job.findById(entityId);
                if (!job) {
                    return res.status(404).json({ message: "Job not found" });
                }
                owner = job.postedBy;
                break;
            case 'company':
                const company = await Company.findById(entityId);
                if (!company) {
                    return res.status(404).json({ message: "Company not found" });
                }
                owner = company.admins[0]; // Use the first admin as owner
                break;
        }

        // Don't track if viewer is the owner
        if (userId && userId === owner.toString()) {
            return res.status(200).json({ message: "View not tracked (owner)" });
        }

        // Find or create analytics record
        let analytics = await Analytics.findOne({ entityType, entityId });

        if (!analytics) {
            analytics = new Analytics({
                entityType,
                entityId,
                owner,
                views: [],
                uniqueViewers: 0,
                totalViews: 0
            });
        }

        // Add view
        analytics.views.push({
            user: userId,
            timestamp: new Date(),
            source: source || 'direct'
        });

        // Update total views
        analytics.totalViews += 1;

        // Update unique viewers (if user is logged in)
        if (userId) {
            // Check if this user has viewed before
            const hasViewedBefore = analytics.views.some(
                view => view.user && view.user.toString() === userId
            );

            if (!hasViewedBefore) {
                analytics.uniqueViewers += 1;
            }

            // For profile views, track who viewed and notify
            if (entityType === 'profile') {
                // Add to profile views
                analytics.profileViews.push({
                    user: userId,
                    timestamp: new Date()
                });

                // Create notification for profile owner
                const notificationData = {
                    recipient: owner,
                    sender: userId,
                    type: 'profile_view',
                    content: 'viewed your profile',
                    relatedId: userId,
                    onModel: 'User',
                    read: false
                };

                await createNotification(notificationData);
            }
        }

        // Update daily stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let dailyStatIndex = analytics.dailyStats.findIndex(
            stat => new Date(stat.date).toDateString() === today.toDateString()
        );

        if (dailyStatIndex === -1) {
            // Add new daily stat
            analytics.dailyStats.push({
                date: today,
                views: 1,
                uniqueViewers: userId ? 1 : 0
            });
        } else {
            // Update existing daily stat
            analytics.dailyStats[dailyStatIndex].views += 1;
            
            if (userId) {
                // Check if this user has viewed today
                const hasViewedToday = analytics.views.some(
                    view => view.user && 
                    view.user.toString() === userId && 
                    new Date(view.timestamp).toDateString() === today.toDateString()
                );

                if (!hasViewedToday) {
                    analytics.dailyStats[dailyStatIndex].uniqueViewers += 1;
                }
            }
        }

        await analytics.save();

        res.status(200).json({ message: "View tracked successfully" });
    } catch (error) {
        console.error("Track view error:", error);
        res.status(500).json({ message: error.message || "Error tracking view" });
    }
};

// Update engagement metrics
export const updateEngagement = async (req, res) => {
    try {
        const { entityType, entityId, metric, value } = req.body;

        // Validate input
        if (!entityType || !entityId || !metric) {
            return res.status(400).json({ message: "Entity type, ID, and metric are required" });
        }

        // Validate entity type
        const validEntityTypes = ['post', 'job', 'company'];
        if (!validEntityTypes.includes(entityType)) {
            return res.status(400).json({ message: "Invalid entity type" });
        }

        // Validate metric
        const validMetrics = {
            post: ['likes', 'comments', 'shares'],
            job: ['applications'],
            company: ['followers']
        };

        if (!validMetrics[entityType].includes(metric)) {
            return res.status(400).json({ message: "Invalid metric for this entity type" });
        }

        // Find analytics record
        let analytics = await Analytics.findOne({ entityType, entityId });

        // If no record exists, find entity owner and create one
        if (!analytics) {
            let owner;
            switch (entityType) {
                case 'post':
                    const post = await Post.findById(entityId);
                    if (!post) {
                        return res.status(404).json({ message: "Post not found" });
                    }
                    owner = post.user;
                    break;
                case 'job':
                    const job = await Job.findById(entityId);
                    if (!job) {
                        return res.status(404).json({ message: "Job not found" });
                    }
                    owner = job.postedBy;
                    break;
                case 'company':
                    const company = await Company.findById(entityId);
                    if (!company) {
                        return res.status(404).json({ message: "Company not found" });
                    }
                    owner = company.admins[0]; // Use the first admin as owner
                    break;
            }

            analytics = new Analytics({
                entityType,
                entityId,
                owner,
                views: [],
                uniqueViewers: 0,
                totalViews: 0
            });
        }

        // Update metric
        analytics[metric] = value !== undefined ? value : (analytics[metric] || 0) + 1;

        // Update daily stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let dailyStatIndex = analytics.dailyStats.findIndex(
            stat => new Date(stat.date).toDateString() === today.toDateString()
        );

        if (dailyStatIndex === -1) {
            // Add new daily stat
            const newDailyStat = {
                date: today
            };
            newDailyStat[metric] = value !== undefined ? value : 1;
            analytics.dailyStats.push(newDailyStat);
        } else {
            // Update existing daily stat
            analytics.dailyStats[dailyStatIndex][metric] = value !== undefined 
                ? value 
                : (analytics.dailyStats[dailyStatIndex][metric] || 0) + 1;
        }

        await analytics.save();

        res.status(200).json({ message: "Engagement updated successfully" });
    } catch (error) {
        console.error("Update engagement error:", error);
        res.status(500).json({ message: error.message || "Error updating engagement" });
    }
};

// Get analytics for an entity
export const getEntityAnalytics = async (req, res) => {
    try {
        const { entityType, entityId } = req.params;
        const userId = req.userId;

        // Find analytics record
        const analytics = await Analytics.findOne({ entityType, entityId });

        if (!analytics) {
            return res.status(404).json({ message: "Analytics not found" });
        }

        // Check if user is authorized to view analytics
        if (analytics.owner.toString() !== userId) {
            return res.status(403).json({ message: "You are not authorized to view these analytics" });
        }

        res.status(200).json(analytics);
    } catch (error) {
        console.error("Get entity analytics error:", error);
        res.status(500).json({ message: error.message || "Error getting analytics" });
    }
};

// Get profile viewers
export const getProfileViewers = async (req, res) => {
    try {
        const { profileId } = req.params;
        const userId = req.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Check if user is authorized
        if (profileId !== userId) {
            return res.status(403).json({ message: "You can only view your own profile viewers" });
        }

        // Find analytics record
        const analytics = await Analytics.findOne({ entityType: 'profile', entityId: profileId });

        if (!analytics) {
            return res.status(200).json({
                viewers: [],
                totalPages: 0,
                currentPage: page,
                total: 0
            });
        }

        // Get unique viewers
        const uniqueViewerIds = [...new Set(
            analytics.profileViews
                .filter(view => view.user)
                .map(view => view.user.toString())
        )];

        // Get total count
        const total = uniqueViewerIds.length;

        // Get paginated viewers
        const paginatedViewerIds = uniqueViewerIds.slice(skip, skip + limit);

        // Get viewer details
        const viewers = await User.find({ _id: { $in: paginatedViewerIds } })
            .select('firstName lastName userName profileImage headline');

        // Add last view timestamp to each viewer
        const viewersWithTimestamp = viewers.map(viewer => {
            const lastView = analytics.profileViews
                .filter(view => view.user && view.user.toString() === viewer._id.toString())
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

            return {
                ...viewer.toObject(),
                lastViewedAt: lastView ? lastView.timestamp : null
            };
        });

        res.status(200).json({
            viewers: viewersWithTimestamp,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error("Get profile viewers error:", error);
        res.status(500).json({ message: error.message || "Error getting profile viewers" });
    }
};

// Get user's dashboard analytics
export const getUserDashboardAnalytics = async (req, res) => {
    try {
        const userId = req.userId;
        
        // Get date range (default: last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        // Get all analytics records where user is the owner
        const analyticsRecords = await Analytics.find({ owner: userId });
        
        // Initialize dashboard data
        const dashboard = {
            profileViews: {
                total: 0,
                trend: 0,
                dailyData: []
            },
            postEngagement: {
                likes: 0,
                comments: 0,
                shares: 0,
                trend: 0,
                dailyData: []
            },
            jobApplications: {
                total: 0,
                trend: 0,
                dailyData: []
            },
            companyFollowers: {
                total: 0,
                trend: 0,
                dailyData: []
            }
        };
        
        // Process each analytics record
        analyticsRecords.forEach(record => {
            switch (record.entityType) {
                case 'profile':
                    dashboard.profileViews.total = record.totalViews;
                    
                    // Get daily data for the date range
                    const profileDailyData = record.dailyStats
                        .filter(stat => new Date(stat.date) >= startDate && new Date(stat.date) <= endDate)
                        .map(stat => ({
                            date: stat.date,
                            views: stat.views || 0
                        }))
                        .sort((a, b) => new Date(a.date) - new Date(b.date));
                    
                    dashboard.profileViews.dailyData = profileDailyData;
                    
                    // Calculate trend (% change from first to last week)
                    if (profileDailyData.length > 14) {
                        const firstWeek = profileDailyData.slice(0, 7).reduce((sum, day) => sum + day.views, 0);
                        const lastWeek = profileDailyData.slice(-7).reduce((sum, day) => sum + day.views, 0);
                        
                        if (firstWeek > 0) {
                            dashboard.profileViews.trend = ((lastWeek - firstWeek) / firstWeek) * 100;
                        }
                    }
                    break;
                    
                case 'post':
                    dashboard.postEngagement.likes += record.likes || 0;
                    dashboard.postEngagement.comments += record.comments || 0;
                    dashboard.postEngagement.shares += record.shares || 0;
                    
                    // Process daily data for posts
                    record.dailyStats
                        .filter(stat => new Date(stat.date) >= startDate && new Date(stat.date) <= endDate)
                        .forEach(stat => {
                            const dateStr = new Date(stat.date).toISOString().split('T')[0];
                            
                            // Find or create entry for this date
                            let dayEntry = dashboard.postEngagement.dailyData.find(d => d.date === dateStr);
                            
                            if (!dayEntry) {
                                dayEntry = { date: dateStr, likes: 0, comments: 0, shares: 0 };
                                dashboard.postEngagement.dailyData.push(dayEntry);
                            }
                            
                            // Add this post's stats
                            dayEntry.likes += stat.likes || 0;
                            dayEntry.comments += stat.comments || 0;
                            dayEntry.shares += stat.shares || 0;
                        });
                    break;
                    
                case 'job':
                    dashboard.jobApplications.total += record.applications || 0;
                    
                    // Process daily data for jobs
                    record.dailyStats
                        .filter(stat => new Date(stat.date) >= startDate && new Date(stat.date) <= endDate)
                        .forEach(stat => {
                            const dateStr = new Date(stat.date).toISOString().split('T')[0];
                            
                            // Find or create entry for this date
                            let dayEntry = dashboard.jobApplications.dailyData.find(d => d.date === dateStr);
                            
                            if (!dayEntry) {
                                dayEntry = { date: dateStr, applications: 0 };
                                dashboard.jobApplications.dailyData.push(dayEntry);
                            }
                            
                            // Add this job's stats
                            dayEntry.applications += stat.applications || 0;
                        });
                    break;
                    
                case 'company':
                    dashboard.companyFollowers.total += record.followers || 0;
                    
                    // Process daily data for companies
                    record.dailyStats
                        .filter(stat => new Date(stat.date) >= startDate && new Date(stat.date) <= endDate)
                        .forEach(stat => {
                            const dateStr = new Date(stat.date).toISOString().split('T')[0];
                            
                            // Find or create entry for this date
                            let dayEntry = dashboard.companyFollowers.dailyData.find(d => d.date === dateStr);
                            
                            if (!dayEntry) {
                                dayEntry = { date: dateStr, followers: 0 };
                                dashboard.companyFollowers.dailyData.push(dayEntry);
                            }
                            
                            // Add this company's stats
                            dayEntry.followers += stat.followers || 0;
                        });
                    break;
            }
        });
        
        // Sort daily data by date
        dashboard.postEngagement.dailyData.sort((a, b) => new Date(a.date) - new Date(b.date));
        dashboard.jobApplications.dailyData.sort((a, b) => new Date(a.date) - new Date(b.date));
        dashboard.companyFollowers.dailyData.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        res.status(200).json(dashboard);
    } catch (error) {
        console.error("Get user dashboard analytics error:", error);
        res.status(500).json({ message: error.message || "Error getting dashboard analytics" });
    }
};
