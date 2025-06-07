import express from 'express';
import {
    createCompany,
    updateCompany,
    getCompany,
    toggleFollowCompany,
    addEmployee,
    updateEmployee,
    removeEmployee,
    getCompanyPosts,
    getCompanyJobs,
    searchCompanies
} from '../controllers/company.controllers.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

// Create a company
router.post('/', isAuth, createCompany);

// Update company
router.put('/:companyId', isAuth, updateCompany);

// Get company by ID or slug
router.get('/:identifier', getCompany);

// Follow/unfollow company
router.post('/:companyId/follow', isAuth, toggleFollowCompany);

// Employee management
router.post('/:companyId/employees', isAuth, addEmployee);
router.put('/:companyId/employees/:employeeId', isAuth, updateEmployee);
router.delete('/:companyId/employees/:employeeId', isAuth, removeEmployee);

// Get company content
router.get('/:companyId/posts', getCompanyPosts);
router.get('/:companyId/jobs', getCompanyJobs);

// Search companies
router.get('/search/companies', searchCompanies);

export default router;
