import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";

export const getCurrentUser = async (req, res) => {
    try {
        let id = req.userId
        const user = await User.findById(id).select("-password");
        if (!user) {
            return res.status(400).json({ message: "user not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        console.log("Get current user error:", error);
        return res.status(500).json({ message: "get current user error" });
    }
}

// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.log("Get user by ID error:", error);
        return res.status(500).json({ message: "Error fetching user" });
    }
}

// Update user profile
export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { firstName, lastName, headline, location, skills } = req.body;

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update fields if provided
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (headline) user.headline = headline;
        if (location) user.location = location;
        if (skills) user.skills = skills;

        await user.save();

        return res.status(200).json({
            message: "Profile updated successfully",
            user: await User.findById(userId).select("-password")
        });
    } catch (error) {
        console.log("Update user profile error:", error);
        return res.status(500).json({ message: "Error updating profile" });
    }
}

// Update user education
export const updateUserEducation = async (req, res) => {
    try {
        const userId = req.userId;
        const { education } = req.body;

        if (!education || !Array.isArray(education)) {
            return res.status(400).json({ message: "Valid education data is required" });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update education
        user.education = education;
        await user.save();

        return res.status(200).json({
            message: "Education updated successfully",
            education: user.education
        });
    } catch (error) {
        console.log("Update education error:", error);
        return res.status(500).json({ message: "Error updating education" });
    }
}

// Update user experience
export const updateUserExperience = async (req, res) => {
    try {
        const userId = req.userId;
        const { experience } = req.body;

        if (!experience || !Array.isArray(experience)) {
            return res.status(400).json({ message: "Valid experience data is required" });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update experience
        user.experience = experience;
        await user.save();

        return res.status(200).json({
            message: "Experience updated successfully",
            experience: user.experience
        });
    } catch (error) {
        console.log("Update experience error:", error);
        return res.status(500).json({ message: "Error updating experience" });
    }
}

// Get suggested users
export const getSuggestedUsers = async (req, res) => {
    try {
        const userId = req.userId;
        const limit = parseInt(req.query.limit) || 10;

        // Find current user to get their connections and skills
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get IDs of users to exclude (current user and their connections)
        const excludeIds = [
            userId,
            ...currentUser.connections,
            ...currentUser.connectionRequests,
            ...currentUser.followers,
            ...currentUser.following
        ];

        // Find users with similar skills or industry
        // Or users who are not connected to the current user
        let suggestedUsers = [];

        // If user has skills, try to match based on skills first
        if (currentUser.skills && currentUser.skills.length > 0) {
            suggestedUsers = await User.find({
                _id: { $nin: excludeIds },
                skills: { $in: currentUser.skills }
            })
            .select('firstName lastName userName profileImage headline location skills')
            .limit(limit);
        }

        // If not enough users found by skills, get users based on location
        if (suggestedUsers.length < limit && currentUser.location) {
            const locationUsers = await User.find({
                _id: { $nin: [...excludeIds, ...suggestedUsers.map(u => u._id)] },
                location: currentUser.location
            })
            .select('firstName lastName userName profileImage headline location skills')
            .limit(limit - suggestedUsers.length);

            suggestedUsers = [...suggestedUsers, ...locationUsers];
        }

        // If still not enough, get random users
        if (suggestedUsers.length < limit) {
            const randomUsers = await User.find({
                _id: { $nin: [...excludeIds, ...suggestedUsers.map(u => u._id)] }
            })
            .select('firstName lastName userName profileImage headline location skills')
            .limit(limit - suggestedUsers.length);

            suggestedUsers = [...suggestedUsers, ...randomUsers];
        }

        return res.status(200).json(suggestedUsers);
    } catch (error) {
        console.log("Get suggested users error:", error);
        return res.status(500).json({ message: "Error fetching suggested users" });
    }
}
