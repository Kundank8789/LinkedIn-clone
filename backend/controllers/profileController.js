import Profile from '../models/profile.model.js';
import User from '../models/user.model.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get profile by user ID
const getProfile = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find profile by user ID
    let profile = await Profile.findOne({ user: userId }).populate('user', 'firstName lastName email');

    // If profile doesn't exist, create a new one
    if (!profile) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      profile = new Profile({
        user: userId,
        bio: '',
        education: [],
        experience: []
      });

      await profile.save();
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Upload profile image
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const userId = req.body.userId;

    // Find profile by user ID
    let profile = await Profile.findOne({ user: userId });

    // If profile doesn't exist, create a new one
    if (!profile) {
      profile = new Profile({
        user: userId,
        bio: '',
        education: [],
        experience: []
      });
    }

    // Delete old profile image if it exists
    if (profile.profileImage && profile.profileImage.startsWith('/uploads/')) {
      const oldImagePath = path.join(__dirname, '..', 'public', profile.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Set new profile image path
    const imageUrl = `/uploads/${req.file.filename}`;
    profile.profileImage = imageUrl;

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      imageUrl
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update profile with external image URL
const updateExternalImage = async (req, res) => {
  try {
    const { userId, imageUrl } = req.body;

    if (!userId || !imageUrl) {
      return res.status(400).json({ success: false, message: 'User ID and image URL are required' });
    }

    // Find profile by user ID
    let profile = await Profile.findOne({ user: userId });

    // If profile doesn't exist, create a new one
    if (!profile) {
      profile = new Profile({
        user: userId,
        bio: '',
        education: [],
        experience: []
      });
    }

    // Delete old profile image if it exists and is a local file
    if (profile.profileImage && profile.profileImage.startsWith('/uploads/')) {
      const oldImagePath = path.join(__dirname, '..', 'public', profile.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Set new profile image URL
    profile.profileImage = imageUrl;

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      imageUrl
    });
  } catch (error) {
    console.error('Error updating profile image:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update bio
const updateBio = async (req, res) => {
  try {
    const { userId, bio } = req.body;

    if (!userId || bio === undefined) {
      return res.status(400).json({ success: false, message: 'User ID and bio are required' });
    }

    // Find profile by user ID
    let profile = await Profile.findOne({ user: userId });

    // If profile doesn't exist, create a new one
    if (!profile) {
      profile = new Profile({
        user: userId,
        bio,
        education: [],
        experience: []
      });
    } else {
      profile.bio = bio;
    }

    await profile.save();

    res.status(200).json({ success: true, message: 'Bio updated successfully' });
  } catch (error) {
    console.error('Error updating bio:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update education
const updateEducation = async (req, res) => {
  try {
    const { userId, education } = req.body;

    if (!userId || !education) {
      return res.status(400).json({ success: false, message: 'User ID and education data are required' });
    }

    // Find profile by user ID
    let profile = await Profile.findOne({ user: userId });

    // If profile doesn't exist, create a new one
    if (!profile) {
      profile = new Profile({
        user: userId,
        bio: '',
        education,
        experience: []
      });
    } else {
      profile.education = education;
    }

    await profile.save();

    res.status(200).json({ success: true, message: 'Education updated successfully' });
  } catch (error) {
    console.error('Error updating education:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update experience
const updateExperience = async (req, res) => {
  try {
    const { userId, experience } = req.body;

    if (!userId || !experience) {
      return res.status(400).json({ success: false, message: 'User ID and experience data are required' });
    }

    // Find profile by user ID
    let profile = await Profile.findOne({ user: userId });

    // If profile doesn't exist, create a new one
    if (!profile) {
      profile = new Profile({
        user: userId,
        bio: '',
        education: [],
        experience
      });
    } else {
      profile.experience = experience;
    }

    await profile.save();

    res.status(200).json({ success: true, message: 'Experience updated successfully' });
  } catch (error) {
    console.error('Error updating experience:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export { getProfile, uploadProfileImage, updateExternalImage, updateBio, updateEducation, updateExperience };
