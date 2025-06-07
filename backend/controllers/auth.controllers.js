import User from "../models/user.model.js";
import bcrypt from 'bcrypt';
import genToken from '../config/token.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export const SignUp = async (req, res) => {
    try {
        let { firstName, lastName, userName, email, password } = req.body;
        let exitEmail = await User.findOne({ email });
        if (exitEmail) {
            return res.status(400).json({ message: "Email already exists!" });
        }
        let exitUserName = await User.findOne({ userName });
        if (exitUserName) {
            return res.status(400).json({ message: "Username already exists!" });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: "Password should be at least 8 characters!" });
        }
        let hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            firstName,
            lastName,
            userName,
            email,
            password: hashedPassword
        });
        let token = await genToken(user._id);
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            secure: process.env.NODE_ENVIRONMENT === "production",
        });
        return res.status(201).json({ user, token });

    } catch (error) {
        console.log("Signup error:", error);
        return res.status(500).json({ message: error.message || "signup error" });
    }
};

export const login= async (req, res) => {
    try{
        let {  email, password } = req.body;
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User doesn't exist!" });
        }
       const isMatch = await bcrypt.compare(password,user.password);
       if(!isMatch) {
            return res.status(400).json({ message: "incorrect password!" });
        }

        let token = await genToken(user._id);
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            secure: process.env.NODE_ENVIRONMENT === "production",
        });
        return res.status(200).json({ user, token });

    }catch (error) {
        console.log("Login error:", error);
        return res.status(500).json({ message: error.message || "login error" });

    }
}

export const logout = async (_req, res) => {
    try{
        res.clearCookie("token")
        return res.status(200).json({ message: "logout success" });

    }catch(error){
        console.log("Logout error:", error);
        return res.status(500).json({ message: error.message || "logout error" });

    }
}

// Forgot Password - Send reset email
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User with this email does not exist" });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Set token and expiry on user document
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        // Setup email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Email options
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <h1>You requested a password reset</h1>
                <p>Please click on the following link to reset your password:</p>
                <a href="${resetUrl}" target="_blank">Reset Password</a>
                <p>If you didn't request this, please ignore this email.</p>
                <p>This link will expire in 1 hour.</p>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Password reset email sent" });
    } catch (error) {
        console.log("Forgot password error:", error);
        return res.status(500).json({ message: error.message || "Error sending reset email" });
    }
};

// Reset Password
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Find user by reset token and check if token is still valid
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Password reset token is invalid or has expired" });
        }

        // Validate new password
        if (newPassword.length < 8) {
            return res.status(400).json({ message: "Password should be at least 8 characters!" });
        }

        // Hash new password and update user
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
        console.log("Reset password error:", error);
        return res.status(500).json({ message: error.message || "Error resetting password" });
    }
};