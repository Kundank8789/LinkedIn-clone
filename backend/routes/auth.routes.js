import express from 'express';
import { login, logout, SignUp, forgotPassword, resetPassword } from '../controllers/auth.controllers.js';

let authRouter = express.Router();

authRouter.post('/signup', SignUp);
authRouter.post('/login', login);
authRouter.get('/logout', logout);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);
export default authRouter;