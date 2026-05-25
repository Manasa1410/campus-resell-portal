import mongoose from "mongoose";
import { EMAIL_REGEX } from "../utils/validators.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, "Use a valid public or institutional email"],
      index: true,
    },

    password: {
      type: String,
      required: true,
      select: false, // 🔥 prevents password from being returned in queries
    },

    avatar: {
      type: String,
      default: "",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isBanned: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    // ⭐ Optional but useful
    lastLogin: {
      type: Date,
      default: null,
    },

    resetPasswordToken: {
       type: String,
    },

    resetPasswordExpire: {
        type: Date,
    },
  },
  { timestamps: true }
);

// Virtual property for isAdmin based on role
userSchema.virtual('isAdmin').get(function() {
  return this.role === 'admin';
});


export default mongoose.model("User", userSchema);
