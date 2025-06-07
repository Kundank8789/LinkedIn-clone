import mongoose from "mongoose";

const viewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    source: {
        type: String,
        enum: ['search', 'feed', 'profile', 'company', 'job', 'direct'],
        default: 'direct'
    }
});

const analyticsSchema = new mongoose.Schema({
    // The entity being tracked (profile, post, job, company)
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    entityType: {
        type: String,
        enum: ['profile', 'post', 'job', 'company'],
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    views: [viewSchema],
    uniqueViewers: {
        type: Number,
        default: 0
    },
    totalViews: {
        type: Number,
        default: 0
    },
    // For profiles: track who viewed the profile
    profileViews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    // For posts: track engagement
    likes: {
        type: Number,
        default: 0
    },
    comments: {
        type: Number,
        default: 0
    },
    shares: {
        type: Number,
        default: 0
    },
    // For jobs: track applications
    applications: {
        type: Number,
        default: 0
    },
    // For companies: track followers
    followers: {
        type: Number,
        default: 0
    },
    // Time periods for aggregation
    dailyStats: [{
        date: {
            type: Date
        },
        views: {
            type: Number,
            default: 0
        },
        uniqueViewers: {
            type: Number,
            default: 0
        },
        likes: {
            type: Number,
            default: 0
        },
        comments: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        },
        applications: {
            type: Number,
            default: 0
        },
        followers: {
            type: Number,
            default: 0
        }
    }]
}, { timestamps: true });

// Create compound index for entity type and ID
analyticsSchema.index({ entityType: 1, entityId: 1 }, { unique: true });

const Analytics = mongoose.model("Analytics", analyticsSchema);
export default Analytics;
