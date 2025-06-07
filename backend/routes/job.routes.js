import express from 'express';
import {
    createJob,
    getJobs,
    getJob,
    updateJob,
    deleteJob,
    applyForJob,
    getJobApplications,
    updateApplicationStatus,
    getUserApplications
} from '../controllers/job.controllers.js';
import isAuth from '../middlewares/isAuth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up multer for resume uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/resumes'));
    },
    filename: function(req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function(req, file, cb) {
        const filetypes = /pdf|doc|docx/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Only PDF and Word documents are allowed"));
    }
});

const router = express.Router();

// Public routes
router.get('/', getJobs);
router.get('/:jobId', getJob);

// Protected routes - make sure isAuth middleware is applied
router.post('/', isAuth, createJob);
router.put('/:jobId', isAuth, updateJob);
router.delete('/:jobId', isAuth, deleteJob);
router.post('/:jobId/apply', isAuth, upload.single('resume'), applyForJob);
router.get('/:jobId/applications', isAuth, getJobApplications);
router.put('/:jobId/applications/:applicationId', isAuth, updateApplicationStatus);
router.get('/user/:userId/applications', isAuth, getUserApplications);

export default router;
