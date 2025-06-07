import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    resume: {
        type: String,
        required: true
    },
    coverLetter: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'rejected', 'shortlisted', 'hired'],
        default: 'pending'
    }
}, { timestamps: true });

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    requirements: {
        type: String,
        required: true
    },
    jobType: {
        type: String,
        enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
        required: true
    },
    salary: {
        type: String,
        trim: true
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    applications: [applicationSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, { timestamps: true });

const JobModel = mongoose.model("JobModel", jobSchema);
export default JobModel;
