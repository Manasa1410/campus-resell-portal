import User from "../models/userModel.js"; // ✅ corrected path
import Product from "../models/productModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail, sendOTPEmail } from "../services/emailService.js";
//import generateToken from "../utils/generateToken.js";
import {
  validateRegisterInput,
  validateLoginInput,
  validateEmail,
} from "../utils/validators.js";

import * as crypto from "crypto";
//import generateResetToken from "../utils/generateResetToken.js";
import { generateToken, generateResetToken } from "../utils/generateToken.js";

//
// 📝 Register User
//
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Validate input
    const errorMessage = validateRegisterInput({ name, email: normalizedEmail, password });
    if (errorMessage) {
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }
     const avatar = req.file ? req.file.path : "";

    // Check if user exists
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      avatar: avatar,
    });

    // ✅ Send welcome email AFTER user creation (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch((err) =>
      console.log("Email send failed:", err.message)
    );

    // Send response
    res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



//
// 🔑 Login User
//
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
  return res.status(400).json({
    success: false,
    message: "Email and password are required",
  });
}
    const normalizedEmail = email.toLowerCase().trim();

    // Validate input
    const errorMessage = validateLoginInput({ email: normalizedEmail, password });
    if (errorMessage) {
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    // Find user (include password)
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if banned
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Your account is banned",
      });
    }

    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//
// 👤 Get User Profile (Protected)
//
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Calculate Trust Score (Average rating of all products listed by the user)
    const products = await Product.find({ seller: user._id });
    const ratedProducts = products.filter(p => p.numReviews > 0);
    const trustScore = ratedProducts.length > 0 
      ? (ratedProducts.reduce((acc, p) => acc + p.rating, 0) / ratedProducts.length).toFixed(1)
      : 0;

    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      trustScore: Number(trustScore),
      totalListings: products.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 📝 Update Profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.name = req.body.name || user.name;
    
    if (req.body.email) {
      const normalizedEmail = req.body.email.toLowerCase().trim();
      if (!validateEmail(normalizedEmail)) {
        return res.status(400).json({ success: false, message: "Use a valid email address" });
      }
      // Check if email already taken
      if (normalizedEmail !== user.email) {
        const emailExists = await User.findOne({ email: normalizedEmail });
        if (emailExists) return res.status(400).json({ success: false, message: "Email already in use" });
        user.email = normalizedEmail;
      }
    }

    await user.save();
    res.json({ success: true, message: "Profile updated successfully", user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔒 Update Password
export const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Please provide both old and new passwords" });
    }

    const user = await User.findById(req.user.id).select("+password");

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect old password" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


//update avatar

export const updateAvatar = async (req, res) => {
  try {
    // Find logged-in user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if file uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    // Save file path
    user.avatar = req.file.path;

    await user.save();

    res.json({
      success: true,
      message: "Avatar updated successfully",
      avatar: user.avatar,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 📩 Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    if (!validateEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Use a valid email address" });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedToken = crypto.createHash("sha256").update(otp).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save();
    
    await sendOTPEmail(user.email, otp);

    res.json({
      success: true,
      message: "OTP sent to email",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// 🔄 Reset Password
export const resetPassword = async (req, res) => {
  try {
    const token = req.params.token;

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token is invalid or expired",
      });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
