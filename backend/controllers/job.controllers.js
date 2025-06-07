import Job from "../models/job.model.js";
import User from "../models/user.model.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new job posting
export const createJob = async (req, res) => {
    try {
        // Log the entire request for debugging
        console.log("Job creation request headers:", req.headers);
        console.log("Job creation request body:", req.body);
        console.log("Authenticated user ID:", req.userId);

        const {
            title,
            company,
            location,
            description,
            requirements,
            jobType,
            salary,
            userId,
            expiresInDays
        } = req.body;

        // Use authenticated user ID if userId is not provided
        const postedBy = userId || req.userId;

        if (!postedBy) {
            return res.status(400).json({ message: "User ID is required. Please make sure you're logged in." });
        }

        // Validate job type
        const validJobTypes = ['full-time', 'part-time', 'contract', 'internship', 'remote'];
        if (jobType && !validJobTypes.includes(jobType)) {
            return res.status(400).json({
                message: `Invalid job type. Must be one of: ${validJobTypes.join(', ')}`,
                receivedValue: jobType
            });
        }

        // Calculate expiry date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (parseInt(expiresInDays) || 30));

        // Create job object with default values for missing fields
        const newJob = new Job({
            title: title || "Untitled Position",
            company: company || "Unnamed Company",
            location: location || "Remote",
            description: description || "No description provided",
            requirements: requirements || "No specific requirements",
            jobType: jobType || "full-time", // Using jobType with lowercase values to match the model
            salary: salary || "",
            postedBy: postedBy,
            expiresAt,
            isActive: true // Ensure the job is active by default (field is isActive, not active)
        });

        // Save job
        await newJob.save();

        // Populate user data
        await newJob.populate('postedBy', 'firstName lastName userName profileImage');

        res.status(201).json(newJob);
    } catch (error) {
        console.error("Create job error:", error);
        res.status(500).json({ message: error.message || "Error creating job posting" });
    }
};

// Get all active jobs
export const getJobs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Search filters
        const filters = { isActive: true, expiresAt: { $gt: new Date() } };

        // Add search query if provided
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            filters.$or = [
                { title: searchRegex },
                { company: searchRegex },
                { location: searchRegex },
                { description: searchRegex }
            ];
        }

        // Add job type filter if provided
        if (req.query.jobType) {
            filters.jobType = req.query.jobType;
        }

        // Add location filter if provided
        if (req.query.location) {
            filters.location = new RegExp(req.query.location, 'i');
        }

        // Get jobs with pagination, sorted by newest first
        const jobs = await Job.find(filters)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('postedBy', 'firstName lastName userName profileImage');

        // Get total count for pagination
        const total = await Job.countDocuments(filters);

        res.status(200).json({
            jobs,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error("Get jobs error:", error);
        res.status(500).json({ message: error.message || "Error fetching jobs" });
    }
};

// Get a single job by ID
export const getJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        // Find job and populate user data
        const job = await Job.findById(jobId)
            .populate('postedBy', 'firstName lastName userName profileImage headline');

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        res.status(200).json(job);
    } catch (error) {
        console.error("Get job error:", error);
        res.status(500).json({ message: error.message || "Error fetching job" });
    }
};

// Update a job posting
export const updateJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const {
            title,
            company,
            location,
            description,
            requirements,
            jobType,
            salary,
            userId,
            isActive,
            expiresInDays
        } = req.body;

        // Find job
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        // Check if user is the job poster
        if (job.postedBy.toString() !== userId) {
            return res.status(403).json({ message: "You can only update your own job postings" });
        }

        // Update job fields
        if (title) job.title = title;
        if (company) job.company = company;
        if (location) job.location = location;
        if (description) job.description = description;
        if (requirements) job.requirements = requirements;
        if (jobType) job.jobType = jobType;
        if (salary) job.salary = salary;
        if (isActive !== undefined) job.isActive = isActive;

        // Update expiry date if provided
        if (expiresInDays) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));
            job.expiresAt = expiresAt;
        }

        // Save updated job
        await job.save();

        // Populate user data
        await job.populate('postedBy', 'firstName lastName userName profileImage');

        res.status(200).json(job);
    } catch (error) {
        console.error("Update job error:", error);
        res.status(500).json({ message: error.message || "Error updating job posting" });
    }
};

// Delete a job posting
export const deleteJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { userId } = req.body;

        // Find job
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        // Check if user is the job poster
        if (job.postedBy.toString() !== userId) {
            return res.status(403).json({ message: "You can only delete your own job postings" });
        }

        // Delete job
        await Job.findByIdAndDelete(jobId);

        res.status(200).json({ message: "Job posting deleted successfully" });
    } catch (error) {
        console.error("Delete job error:", error);
        res.status(500).json({ message: error.message || "Error deleting job posting" });
    }
};

// Apply for a job
export const applyForJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { userId, coverLetter } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "Resume file is required" });
        }

        // Find job
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        // Check if job is active and not expired
        if (!job.isActive || job.expiresAt < new Date()) {
            return res.status(400).json({ message: "This job posting is no longer active" });
        }

        // Check if user already applied
        const alreadyApplied = job.applications.some(app => app.user.toString() === userId);
        if (alreadyApplied) {
            return res.status(400).json({ message: "You have already applied for this job" });
        }

        // Create application object
        const application = {
            user: userId,
            resume: `/uploads/resumes/${req.file.filename}`,
            coverLetter: coverLetter || ""
        };

        // Add application to job
        job.applications.push(application);

        // Save job
        await job.save();

        res.status(201).json({ message: "Application submitted successfully" });
    } catch (error) {
        console.error("Job application error:", error);
        res.status(500).json({ message: error.message || "Error applying for job" });
    }
};

// Get job applications (for job poster)
export const getJobApplications = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { userId } = req.query;

        // Find job
        const job = await Job.findById(jobId)
            .populate({
                path: 'applications.user',
                select: 'firstName lastName userName profileImage headline'
            });

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        // Check if user is the job poster
        if (job.postedBy.toString() !== userId) {
            return res.status(403).json({ message: "You can only view applications for your own job postings" });
        }

        res.status(200).json(job.applications);
    } catch (error) {
        console.error("Get job applications error:", error);
        res.status(500).json({ message: error.message || "Error fetching job applications" });
    }
};

// Update application status
export const updateApplicationStatus = async (req, res) => {
    try {
        const { jobId, applicationId } = req.params;
        const { userId, status } = req.body;

        // Validate status
        const validStatuses = ['pending', 'reviewed', 'rejected', 'shortlisted', 'hired'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        // Find job
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        // Check if user is the job poster
        if (job.postedBy.toString() !== userId) {
            return res.status(403).json({ message: "You can only update applications for your own job postings" });
        }

        // Find application
        const application = job.applications.id(applicationId);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        // Update status
        application.status = status;

        // Save job
        await job.save();

        res.status(200).json({ message: "Application status updated successfully" });
    } catch (error) {
        console.error("Update application status error:", error);
        res.status(500).json({ message: error.message || "Error updating application status" });
    }
};

// Get user's job applications
export const getUserApplications = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find jobs where user has applied
        const jobs = await Job.find({ 'applications.user': userId })
            .populate('postedBy', 'firstName lastName userName profileImage');

        // Extract application data
        const applications = jobs.map(job => {
            const application = job.applications.find(app => app.user.toString() === userId);
            return {
                job: {
                    _id: job._id,
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    jobType: job.jobType,
                    postedBy: job.postedBy,
                    createdAt: job.createdAt
                },
                status: application.status,
                appliedAt: application.createdAt
            };
        });

        res.status(200).json(applications);
    } catch (error) {
        console.error("Get user applications error:", error);
        res.status(500).json({ message: error.message || "Error fetching user applications" });
    }
};
