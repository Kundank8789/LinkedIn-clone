import Endorsement from "../models/endorsement.model.js";
import User from "../models/user.model.js";
import { createNotification } from "./notification.controllers.js";

// Endorse a skill
export const endorseSkill = async (req, res) => {
    try {
        const { userId, skill } = req.body;
        const endorserId = req.userId;

        // Validate input
        if (!userId || !skill) {
            return res.status(400).json({ message: "User ID and skill are required" });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if endorser exists
        const endorser = await User.findById(endorserId);
        if (!endorser) {
            return res.status(404).json({ message: "Endorser not found" });
        }

        // Check if user has this skill
        if (!user.skills.includes(skill)) {
            return res.status(400).json({ message: "User does not have this skill" });
        }

        // Find or create endorsement
        let endorsement = await Endorsement.findOne({ user: userId, skill });

        if (!endorsement) {
            // Create new endorsement
            endorsement = new Endorsement({
                skill,
                user: userId,
                endorsedBy: [endorserId]
            });
        } else {
            // Check if already endorsed
            if (endorsement.endorsedBy.includes(endorserId)) {
                return res.status(400).json({ message: "You have already endorsed this skill" });
            }

            // Add endorser to the list
            endorsement.endorsedBy.push(endorserId);
            endorsement.updatedAt = new Date();
        }

        await endorsement.save();

        // Create notification
        const notificationData = {
            recipient: userId,
            sender: endorserId,
            type: 'skill_endorsement',
            content: `${endorser.firstName} ${endorser.lastName} endorsed you for ${skill}`,
            relatedId: endorsement._id,
            onModel: 'Endorsement',
            read: false
        };

        await createNotification(notificationData);

        // Get the populated endorsement
        const populatedEndorsement = await Endorsement.findById(endorsement._id)
            .populate('endorsedBy', 'firstName lastName userName profileImage headline');

        res.status(200).json({
            message: "Skill endorsed successfully",
            endorsement: populatedEndorsement
        });
    } catch (error) {
        console.error("Endorse skill error:", error);
        res.status(500).json({ message: error.message || "Error endorsing skill" });
    }
};

// Remove skill endorsement
export const removeEndorsement = async (req, res) => {
    try {
        const { userId, skill } = req.body;
        const endorserId = req.userId;

        // Validate input
        if (!userId || !skill) {
            return res.status(400).json({ message: "User ID and skill are required" });
        }

        // Find endorsement
        const endorsement = await Endorsement.findOne({ user: userId, skill });

        if (!endorsement) {
            return res.status(404).json({ message: "Endorsement not found" });
        }

        // Check if user has endorsed this skill
        if (!endorsement.endorsedBy.includes(endorserId)) {
            return res.status(400).json({ message: "You have not endorsed this skill" });
        }

        // Remove endorser from the list
        endorsement.endorsedBy = endorsement.endorsedBy.filter(
            id => id.toString() !== endorserId
        );
        endorsement.updatedAt = new Date();

        // If no endorsers left, delete the endorsement
        if (endorsement.endorsedBy.length === 0) {
            await Endorsement.findByIdAndDelete(endorsement._id);
            return res.status(200).json({ message: "Endorsement removed successfully" });
        }

        await endorsement.save();

        // Get the populated endorsement
        const populatedEndorsement = await Endorsement.findById(endorsement._id)
            .populate('endorsedBy', 'firstName lastName userName profileImage headline');

        res.status(200).json({
            message: "Endorsement removed successfully",
            endorsement: populatedEndorsement
        });
    } catch (error) {
        console.error("Remove endorsement error:", error);
        res.status(500).json({ message: error.message || "Error removing endorsement" });
    }
};

// Get user's skill endorsements
export const getUserEndorsements = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get all endorsements for the user
        const endorsements = await Endorsement.find({ user: userId })
            .populate('endorsedBy', 'firstName lastName userName profileImage headline')
            .sort({ updatedAt: -1 });

        // Group endorsements by skill and count
        const skillEndorsements = {};
        
        endorsements.forEach(endorsement => {
            skillEndorsements[endorsement.skill] = {
                skill: endorsement.skill,
                count: endorsement.endorsedBy.length,
                endorsedBy: endorsement.endorsedBy,
                _id: endorsement._id
            };
        });

        res.status(200).json(Object.values(skillEndorsements));
    } catch (error) {
        console.error("Get user endorsements error:", error);
        res.status(500).json({ message: error.message || "Error getting endorsements" });
    }
};

// Get top endorsed skills for a user
export const getTopEndorsedSkills = async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 5;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get all endorsements for the user
        const endorsements = await Endorsement.find({ user: userId })
            .populate('endorsedBy', 'firstName lastName userName profileImage')
            .sort({ 'endorsedBy': -1 }) // Sort by number of endorsements
            .limit(limit);

        res.status(200).json(endorsements);
    } catch (error) {
        console.error("Get top endorsed skills error:", error);
        res.status(500).json({ message: error.message || "Error getting top endorsed skills" });
    }
};
