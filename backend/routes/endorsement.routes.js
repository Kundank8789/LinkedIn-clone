import express from 'express';
import {
    endorseSkill,
    removeEndorsement,
    getUserEndorsements,
    getTopEndorsedSkills
} from '../controllers/endorsement.controllers.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

// Endorse a skill
router.post('/endorse', isAuth, endorseSkill);

// Remove endorsement
router.post('/remove', isAuth, removeEndorsement);

// Get user's endorsements
router.get('/user/:userId', getUserEndorsements);

// Get top endorsed skills
router.get('/top/:userId', getTopEndorsedSkills);

export default router;
