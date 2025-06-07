import express from 'express';
const router = express.Router();
import { getProfile, uploadProfileImage, updateExternalImage, updateBio, updateEducation, updateExperience } from '../controllers/profileController.js';
import upload from '../middlewares/uploadMiddleware.js';

// Get profile by user ID
router.get('/:userId', getProfile);

// Upload profile image
router.post('/upload-image', upload.single('profileImage'), uploadProfileImage);

// Update profile with external image URL
router.post('/update-external-image', updateExternalImage);

// Update bio
router.post('/update-bio', updateBio);

// Update education
router.post('/update-education', updateEducation);

// Update experience
router.post('/update-experience', updateExperience);

export default router;
