import User from "../models/userModel.js"; // ✅ corrected path
import Product from "../models/productModel.js";
import Otp from "../models/otpModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { upload, saveUploadedImage } from "../config/cloudinaryUpload.js"; // Import upload middleware and helper
import { sendWelcomeEmail, sendOTPEmail } from "../services/emailService.js";
import {
  validateRegisterInput,
  validateLoginInput,
  validateEmail,
  validateCollegeEmailDomain,
  getAllowedCollegeDomains,
} from "../utils/validators.js";

import * as crypto from "crypto";
//import generateResetToken from "../utils/generateResetToken.js";
import { generateToken } from "../utils/generateToken.js";

const formatImageUrl = (req, imagePath) => {
  // Cloudinary URLs are absolute, so return directly.
  // If imagePath is null/undefined, return empty string or default.
  return imagePath || "";
};

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const hashOtp = (otp) => crypto.createHash("sha256").update(String(otp)).digest("hex");

// Multer middleware for avatar upload
export const uploadAvatar = upload.single('avatar'); // Export this to use in routes

//
// 📝 Register User
//
export const registerUser = async (req, res) => {
  try {
    console.log("[auth] register req.file:", req.file); // Debugging
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

    // Validate if the email belongs to an allowed college domain
    if (!validateCollegeEmailDomain(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Registration is restricted to educational institutional emails only (e.g., .edu or .ac.in).",
      });
    }

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
      password: hashedPassword, // Use saveUploadedImage to handle the file upload and get the URL
      avatar: req.file ? await saveUploadedImage(req.file, 'campus_resell/avatars') : "",
    });

    // ✅ Send welcome email AFTER user creation (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch((err) =>
      console.log("Email send failed:", err.message)
    );

    // Send response
    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: formatImageUrl(req, user.avatar),
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        wishlist: user.wishlist || [],
      },
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
    console.log('[auth] login attempt:', { email: email || null, ip: req.ip || req.headers['x-forwarded-for'] || req.get('host') });
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
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: formatImageUrl(req, user.avatar),
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        wishlist: user.wishlist || [],
      },
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
    const user = await User.findById(req.user.id || req.user._id).select("+wishlist");

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
      user: {
        ...user.toObject(),
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: formatImageUrl(req, user.avatar),
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        averageRating: user.averageRating,
        totalReviews: user.totalReviews,
        createdAt: user.createdAt,
        // Ensure wishlist is always an array of IDs for consistency
        wishlist: user.wishlist ? user.wishlist.map(id => id.toString()) : [],
        trustScore: Number(trustScore),
        totalListings: products.length
      }
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
    res.json({ 
      success: true, 
      message: "Profile updated successfully", 
      user: { ...user.toObject(), avatar: formatImageUrl(req, user.avatar) } 
    });
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

export const updateAvatar = async (req, res) => { // This function needs to be wrapped by uploadAvatar middleware in the route definition
  try {
    console.log("[avatar] req.file received:", req.file); // Debugging log

    // Check if file uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    const user = await User.findById(req.user.id || req.user._id);
    
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.avatar = await saveUploadedImage(req.file, 'campus_resell/avatars'); // Use saveUploadedImage to handle the file upload
    await user.save();
    console.log(`[avatar] saved to DB for user=${user._id}: ${user.avatar}`);

    const formattedAvatar = formatImageUrl(req, user.avatar);

    res.json({
      success: true,
      message: "Avatar updated successfully",
      avatar: formattedAvatar,
      user: {
        ...user.toObject({ virtuals: true }),
        avatar: formattedAvatar,
        wishlist: Array.isArray(user.wishlist) ? user.wishlist : [],
      },
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
    const normalizedEmail = String(email || "").toLowerCase().trim();

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
    const otp = generateOtp();
    const hashedToken = hashOtp(otp);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save();

    try {
      await sendOTPEmail(user.email, otp);
    } catch (err) {
      console.error(`[SMTP Error] Forgot password OTP send failed for ${user.email}:`, err.message);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save().catch(() => {});

      const errorMessage = process.env.NODE_ENV === "production"
        ? "Unable to send password reset OTP right now. Please try again later."
        : err.message || "Unable to send password reset OTP right now.";

      return res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }

    return res.json({
      success: true,
      message: "OTP sent to email. Please check your inbox.",
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

// 🔑 Verify Reset OTP
export const verifyResetOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP is required" });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid or expired",
      });
    }

    res.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// 📩 Request Email Verification OTP
export const requestEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const targetEmail = (email || req.user?.email || "").toLowerCase().trim();

    if (!targetEmail || !validateEmail(targetEmail)) {
      return res.status(400).json({ success: false, message: "Use a valid email address" });
    }

    // Strict Educational Domain Check
    if (!validateCollegeEmailDomain(targetEmail)) {
      return res.status(400).json({
        success: false,
        message: "Access restricted. Use an educational email such as .edu, .edu.in, .ac.in, or a configured college domain.",
      });
    }

    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const emailExists = await User.findOne({ email: targetEmail, _id: { $ne: userId } });
    if (emailExists) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }

    // Cooldown check (30 seconds resend cooldown)
    const latestOtp = await Otp.findOne({ email: targetEmail }).sort({ _id: -1 });
    if (latestOtp) {
      const otpDate = latestOtp.createdAt || latestOtp._id.getTimestamp();
      const diff = Date.now() - new Date(otpDate).getTime();
      if (diff < 30 * 1000) {
        const waitTime = Math.ceil((30 * 1000 - diff) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitTime} seconds before requesting another OTP.`,
        });
      }
    }

    // Rate Limit check (max 5 requests per 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentOtpCount = await Otp.countDocuments({
      email: targetEmail,
      createdAt: { $gte: tenMinutesAgo },
    });
    if (recentOtpCount >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many OTP requests. Please try again after 10 minutes.",
      });
    }

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Hash OTP before storing
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Create record first so it's ready for verification immediately
    const otpRecord = await Otp.create({
      email: targetEmail,
      otp: hashedOtp,
      expiresAt,
    });

    // Send email and only return success if delivery is confirmed
    try {
      await sendOTPEmail(targetEmail, otp);
    } catch (err) {
      console.error(`❌ [SMTP ERROR] Email verification OTP failed for ${targetEmail}:`, err.message);
      await Otp.findByIdAndDelete(otpRecord._id).catch(() => {});
      return res.status(500).json({
        success: false,
        message: "Unable to send verification email right now. Please try again later.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${targetEmail}`,
      expiresInMinutes: 10,
    });
  } catch (error) {
    console.error("❌ [OTP GENERAL ERROR]:", error.stack || error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 🔄 Confirm Email Verification
export const confirmEmailVerification = async (req, res) => {
  try {
    const { otp, newEmail } = req.body;
    const targetEmail = (newEmail || req.user.email).toLowerCase().trim();

    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP is required" });
    }

    // Find all active OTP records for this email
    const storedOtps = await Otp.find({
      email: targetEmail,
      expiresAt: { $gt: new Date() },
    });

    if (!storedOtps || storedOtps.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // Compare input OTP with hashed OTP records using bcrypt
    let isMatched = false;
    for (const stored of storedOtps) {
      const match = await bcrypt.compare(otp, stored.otp);
      if (match) {
        isMatched = true;
        break;
      }
    }

    if (!isMatched) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    const user = await User.findById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if the target email is already taken
    const emailExists = await User.findOne({ email: targetEmail, _id: { $ne: user._id } });
    if (emailExists) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }

    // Update user status
    user.email = targetEmail;
    user.isVerified = true;
    await user.save();

    // Prevent reuse by deleting all OTP records for this email address
    await Otp.deleteMany({ email: targetEmail });

    return res.status(200).json({
      success: true,
      message: "Account verified successfully! Check out your new badge.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("[OTP Verify General Error]:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Remove any duplicate definitions below this line. 
// Ensure these aliases only point to the functions defined above.
export const sendOtp = requestEmailVerification;
export const verifyOtp = confirmEmailVerification;
