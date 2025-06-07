import Job from '../models/Job.js';
import User from '../models/user.model.js';

// Create a new job
export const createJob = async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      type,
      description,
      requirements,
      salary,
      skills,
      expiresAt
    } = req.body;

    // Validate required fields
    if (!title || !company || !location || !type || !description || !requirements || !expiresAt) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Create new job
    const newJob = new Job({
      title,
      company,
      location,
      type,
      description,
      requirements,
      salary,
      postedBy: req.user.id,
      skills: skills || [],
      expiresAt: new Date(expiresAt)
    });

    // Save job to database
    await newJob.save();

    // Populate the postedBy field with user data
    const job = await Job.findById(newJob._id).populate('postedBy', 'firstName lastName profileImage');

    res.status(201).json({ success: true, job });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all jobs with pagination and filters
export const getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      location,
      type,
      company,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { active: true };

    // Add search query if provided
    if (search) {
      filter.$text = { $search: search };
    }

    // Add location filter if provided
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    // Add job type filter if provided
    if (type) {
      filter.type = type;
    }

    // Add company filter if provided
    if (company) {
      filter.company = { $regex: company, $options: 'i' };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const jobs = await Job.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('postedBy', 'firstName lastName profileImage company')
      .exec();

    // Get total count for pagination
    const totalJobs = await Job.countDocuments(filter);

    res.status(200).json({
      success: true,
      jobs,
      totalPages: Math.ceil(totalJobs / parseInt(limit)),
      currentPage: parseInt(page),
      totalJobs
    });
  } catch (error) {
    console.error('Error getting jobs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get job by ID
export const getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId)
      .populate('postedBy', 'firstName lastName profileImage company headline')
      .populate('applicants.user', 'firstName lastName profileImage');

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    res.status(200).json({ success: true, job });
  } catch (error) {
    console.error('Error getting job:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update job
export const updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const {
      title,
      company,
      location,
      type,
      description,
      requirements,
      salary,
      skills,
      active,
      expiresAt
    } = req.body;

    // Find job
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Check if user is the job poster
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this job' });
    }

    // Update job fields
    if (title) job.title = title;
    if (company) job.company = company;
    if (location) job.location = location;
    if (type) job.type = type;
    if (description) job.description = description;
    if (requirements) job.requirements = requirements;
    if (salary) job.salary = salary;
    if (skills) job.skills = skills;
    if (active !== undefined) job.active = active;
    if (expiresAt) job.expiresAt = new Date(expiresAt);

    // Save updated job
    await job.save();

    // Get updated job with populated fields
    const updatedJob = await Job.findById(jobId)
      .populate('postedBy', 'firstName lastName profileImage');

    res.status(200).json({ success: true, job: updatedJob });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete job
export const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Find job
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Check if user is the job poster
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this job' });
    }

    // Delete job
    await Job.findByIdAndDelete(jobId);

    res.status(200).json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Apply for a job
export const applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { resume, coverLetter } = req.body;

    // Find job
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Check if job is still active
    if (!job.active) {
      return res.status(400).json({ success: false, message: 'This job is no longer active' });
    }

    // Check if job has expired
    if (new Date(job.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'This job posting has expired' });
    }

    // Check if user has already applied
    const alreadyApplied = job.applicants.some(applicant =>
      applicant.user.toString() === req.user.id
    );

    if (alreadyApplied) {
      return res.status(400).json({ success: false, message: 'You have already applied for this job' });
    }

    // Add user to applicants
    job.applicants.push({
      user: req.user.id,
      resume,
      coverLetter,
      status: 'Pending',
      appliedAt: new Date()
    });

    // Save job
    await job.save();

    // Get updated job with populated fields
    const updatedJob = await Job.findById(jobId)
      .populate('postedBy', 'firstName lastName profileImage')
      .populate('applicants.user', 'firstName lastName profileImage');

    res.status(200).json({ success: true, job: updatedJob });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update application status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { jobId, applicationId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['Pending', 'Reviewed', 'Shortlisted', 'Rejected', 'Hired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Find job
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Check if user is the job poster
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update application status' });
    }

    // Find application
    const application = job.applicants.id(applicationId);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Update status
    application.status = status;

    // Save job
    await job.save();

    // Get updated job with populated fields
    const updatedJob = await Job.findById(jobId)
      .populate('postedBy', 'firstName lastName profileImage')
      .populate('applicants.user', 'firstName lastName profileImage');

    res.status(200).json({ success: true, job: updatedJob });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get jobs posted by current user
export const getMyPostedJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get jobs posted by user
    const jobs = await Job.find({ postedBy: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('applicants.user', 'firstName lastName profileImage');

    // Get total count for pagination
    const totalJobs = await Job.countDocuments({ postedBy: req.user.id });

    res.status(200).json({
      success: true,
      jobs,
      totalPages: Math.ceil(totalJobs / parseInt(limit)),
      currentPage: parseInt(page),
      totalJobs
    });
  } catch (error) {
    console.error('Error getting posted jobs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get jobs applied by current user
export const getMyApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get jobs applied by user
    const jobs = await Job.find({ 'applicants.user': req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('postedBy', 'firstName lastName profileImage company');

    // Get total count for pagination
    const totalJobs = await Job.countDocuments({ 'applicants.user': req.user.id });

    // Format response to include application status
    const applications = jobs.map(job => {
      const application = job.applicants.find(app => app.user.toString() === req.user.id);
      return {
        job: {
          _id: job._id,
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type,
          postedBy: job.postedBy,
          createdAt: job.createdAt,
          expiresAt: job.expiresAt,
          active: job.active
        },
        status: application.status,
        appliedAt: application.appliedAt
      };
    });

    res.status(200).json({
      success: true,
      applications,
      totalPages: Math.ceil(totalJobs / parseInt(limit)),
      currentPage: parseInt(page),
      totalApplications: totalJobs
    });
  } catch (error) {
    console.error('Error getting applications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
