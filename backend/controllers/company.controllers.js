import Company from "../models/company.model.js";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Job from "../models/Job.js";
import { createNotification } from "./notification.controllers.js";

// Helper function to generate slug
const generateSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
};

// Create a company
export const createCompany = async (req, res) => {
    try {
        const {
            name,
            tagline,
            description,
            website,
            industry,
            companySize,
            headquarters,
            founded,
            specialties
        } = req.body;

        const userId = req.userId;

        // Validate required fields
        if (!name) {
            return res.status(400).json({ message: "Company name is required" });
        }

        // Generate slug
        let slug = generateSlug(name);
        
        // Check if slug already exists
        const existingCompany = await Company.findOne({ slug });
        if (existingCompany) {
            // Add random string to make slug unique
            slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
        }

        // Create company
        const company = new Company({
            name,
            slug,
            tagline,
            description,
            website,
            industry,
            companySize,
            headquarters,
            founded,
            specialties: specialties || [],
            admins: [userId],
            employees: [{
                user: userId,
                position: "Founder",
                startDate: new Date(),
                current: true
            }],
            followers: [userId]
        });

        await company.save();

        res.status(201).json({
            message: "Company created successfully",
            company
        });
    } catch (error) {
        console.error("Create company error:", error);
        res.status(500).json({ message: error.message || "Error creating company" });
    }
};

// Update company
export const updateCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const userId = req.userId;
        const updateData = req.body;

        // Find company
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        // Check if user is an admin
        if (!company.admins.includes(userId)) {
            return res.status(403).json({ message: "You are not authorized to update this company" });
        }

        // Fields that cannot be updated directly
        const protectedFields = ['admins', 'employees', 'followers', 'verified', 'slug'];
        
        // Remove protected fields from update data
        protectedFields.forEach(field => {
            if (updateData[field]) {
                delete updateData[field];
            }
        });

        // Update company
        const updatedCompany = await Company.findByIdAndUpdate(
            companyId,
            { $set: updateData },
            { new: true }
        );

        res.status(200).json({
            message: "Company updated successfully",
            company: updatedCompany
        });
    } catch (error) {
        console.error("Update company error:", error);
        res.status(500).json({ message: error.message || "Error updating company" });
    }
};

// Get company by ID or slug
export const getCompany = async (req, res) => {
    try {
        const { identifier } = req.params;
        let company;

        // Check if identifier is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            company = await Company.findById(identifier)
                .populate('admins', 'firstName lastName userName profileImage headline')
                .populate('employees.user', 'firstName lastName userName profileImage headline')
                .populate('followers', 'firstName lastName userName profileImage headline');
        } else {
            // Assume identifier is a slug
            company = await Company.findOne({ slug: identifier })
                .populate('admins', 'firstName lastName userName profileImage headline')
                .populate('employees.user', 'firstName lastName userName profileImage headline')
                .populate('followers', 'firstName lastName userName profileImage headline');
        }

        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        res.status(200).json(company);
    } catch (error) {
        console.error("Get company error:", error);
        res.status(500).json({ message: error.message || "Error getting company" });
    }
};

// Follow/unfollow company
export const toggleFollowCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const userId = req.userId;

        // Find company
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        // Check if user is already following
        const isFollowing = company.followers.includes(userId);

        if (isFollowing) {
            // Unfollow
            company.followers = company.followers.filter(id => id.toString() !== userId);
            await company.save();
            
            res.status(200).json({
                message: "Company unfollowed successfully",
                isFollowing: false,
                followerCount: company.followers.length
            });
        } else {
            // Follow
            company.followers.push(userId);
            await company.save();
            
            res.status(200).json({
                message: "Company followed successfully",
                isFollowing: true,
                followerCount: company.followers.length
            });
        }
    } catch (error) {
        console.error("Toggle follow company error:", error);
        res.status(500).json({ message: error.message || "Error following/unfollowing company" });
    }
};

// Add employee to company
export const addEmployee = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { userId, position, startDate, endDate, current } = req.body;
        const adminId = req.userId;

        // Find company
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        // Check if user is an admin
        if (!company.admins.includes(adminId)) {
            return res.status(403).json({ message: "You are not authorized to add employees" });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if user is already an employee
        const isEmployee = company.employees.some(emp => emp.user.toString() === userId);
        if (isEmployee) {
            return res.status(400).json({ message: "User is already an employee" });
        }

        // Add employee
        company.employees.push({
            user: userId,
            position,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : null,
            current: current !== undefined ? current : true
        });

        await company.save();

        // Create notification
        const notificationData = {
            recipient: userId,
            sender: adminId,
            type: 'company_added',
            content: `You were added as an employee at ${company.name}`,
            relatedId: company._id,
            onModel: 'Company',
            read: false
        };

        await createNotification(notificationData);

        // Get updated company with populated fields
        const updatedCompany = await Company.findById(companyId)
            .populate('admins', 'firstName lastName userName profileImage headline')
            .populate('employees.user', 'firstName lastName userName profileImage headline')
            .populate('followers', 'firstName lastName userName profileImage headline');

        res.status(200).json({
            message: "Employee added successfully",
            company: updatedCompany
        });
    } catch (error) {
        console.error("Add employee error:", error);
        res.status(500).json({ message: error.message || "Error adding employee" });
    }
};

// Update employee information
export const updateEmployee = async (req, res) => {
    try {
        const { companyId, employeeId } = req.params;
        const { position, startDate, endDate, current } = req.body;
        const adminId = req.userId;

        // Find company
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        // Check if user is an admin
        if (!company.admins.includes(adminId)) {
            return res.status(403).json({ message: "You are not authorized to update employees" });
        }

        // Find employee
        const employeeIndex = company.employees.findIndex(emp => emp._id.toString() === employeeId);
        if (employeeIndex === -1) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // Update employee
        if (position) company.employees[employeeIndex].position = position;
        if (startDate) company.employees[employeeIndex].startDate = new Date(startDate);
        if (endDate) company.employees[employeeIndex].endDate = new Date(endDate);
        if (current !== undefined) company.employees[employeeIndex].current = current;

        await company.save();

        // Get updated company with populated fields
        const updatedCompany = await Company.findById(companyId)
            .populate('admins', 'firstName lastName userName profileImage headline')
            .populate('employees.user', 'firstName lastName userName profileImage headline')
            .populate('followers', 'firstName lastName userName profileImage headline');

        res.status(200).json({
            message: "Employee updated successfully",
            company: updatedCompany
        });
    } catch (error) {
        console.error("Update employee error:", error);
        res.status(500).json({ message: error.message || "Error updating employee" });
    }
};

// Remove employee from company
export const removeEmployee = async (req, res) => {
    try {
        const { companyId, employeeId } = req.params;
        const adminId = req.userId;

        // Find company
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        // Check if user is an admin
        if (!company.admins.includes(adminId)) {
            return res.status(403).json({ message: "You are not authorized to remove employees" });
        }

        // Find employee
        const employeeIndex = company.employees.findIndex(emp => emp._id.toString() === employeeId);
        if (employeeIndex === -1) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // Get employee user ID for notification
        const userId = company.employees[employeeIndex].user;

        // Remove employee
        company.employees.splice(employeeIndex, 1);
        await company.save();

        // Create notification
        const notificationData = {
            recipient: userId,
            sender: adminId,
            type: 'company_removed',
            content: `You were removed as an employee from ${company.name}`,
            relatedId: company._id,
            onModel: 'Company',
            read: false
        };

        await createNotification(notificationData);

        // Get updated company with populated fields
        const updatedCompany = await Company.findById(companyId)
            .populate('admins', 'firstName lastName userName profileImage headline')
            .populate('employees.user', 'firstName lastName userName profileImage headline')
            .populate('followers', 'firstName lastName userName profileImage headline');

        res.status(200).json({
            message: "Employee removed successfully",
            company: updatedCompany
        });
    } catch (error) {
        console.error("Remove employee error:", error);
        res.status(500).json({ message: error.message || "Error removing employee" });
    }
};

// Get company posts
export const getCompanyPosts = async (req, res) => {
    try {
        const { companyId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Find company
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        // Get admin user IDs
        const adminIds = company.admins;

        // Find posts by company admins
        const posts = await Post.find({ user: { $in: adminIds }, isCompanyPost: true, company: companyId })
            .populate('user', 'firstName lastName userName profileImage headline')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const total = await Post.countDocuments({ user: { $in: adminIds }, isCompanyPost: true, company: companyId });

        res.status(200).json({
            posts,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error("Get company posts error:", error);
        res.status(500).json({ message: error.message || "Error getting company posts" });
    }
};

// Get company jobs
export const getCompanyJobs = async (req, res) => {
    try {
        const { companyId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Find company
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        // Find jobs by company name
        const jobs = await Job.find({ 
            company: company.name,
            active: true,
            expiresAt: { $gt: new Date() }
        })
            .populate('postedBy', 'firstName lastName userName profileImage headline')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const total = await Job.countDocuments({ 
            company: company.name,
            active: true,
            expiresAt: { $gt: new Date() }
        });

        res.status(200).json({
            jobs,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error("Get company jobs error:", error);
        res.status(500).json({ message: error.message || "Error getting company jobs" });
    }
};

// Search companies
export const searchCompanies = async (req, res) => {
    try {
        const { query, industry } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build search filter
        const filter = {};

        // Add text search if query provided
        if (query) {
            const searchRegex = new RegExp(query, 'i');
            filter.$or = [
                { name: searchRegex },
                { description: searchRegex },
                { specialties: searchRegex }
            ];
        }

        // Add industry filter if provided
        if (industry) {
            filter.industry = industry;
        }

        // If no filters provided, return error
        if (Object.keys(filter).length === 0) {
            return res.status(400).json({ message: "At least one search parameter is required" });
        }

        // Search companies
        const companies = await Company.find(filter)
            .select('name logo tagline industry followers')
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const total = await Company.countDocuments(filter);

        res.status(200).json({
            companies,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error("Search companies error:", error);
        res.status(500).json({ message: error.message || "Error searching companies" });
    }
};
