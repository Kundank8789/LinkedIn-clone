import express from "express";
import {
    getCurrentUser,
    getUserById,
    updateUserProfile,
    updateUserEducation,
    updateUserExperience,
    getSuggestedUsers
} from "../controllers/user.controllers.js";
import isAuth from "../middlewares/isAuth.js";
import upload from '../middlewares/uploadMiddleware.js';

let userRouter = express.Router();

// Get current user routes
userRouter.get("/currentuser", isAuth, getCurrentUser);
userRouter.get("/me", isAuth, getCurrentUser);

// Get user by ID
userRouter.get("/:userId", getUserById);

// Update user profile
userRouter.put("/profile", isAuth, updateUserProfile);

// Update user education
userRouter.put("/education", isAuth, updateUserEducation);

// Update user experience
userRouter.put("/experience", isAuth, updateUserExperience);

// Get suggested users
userRouter.get("/suggested/users", isAuth, getSuggestedUsers);

export default userRouter;
