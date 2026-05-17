import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0, // 🔥 prevents negative prices
    },

    category: {
      type: String,
      enum: ["Books", "Electronics", "Cycles", "Others"],
      required: true,
      index: true, // 🔥 faster filtering
    },

    images: [
      {
        type: String,
      },
    ],

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["available", "sold"],
      default: "available",
    },

    // ⭐ Optional but powerful
    location: {
      type: String,
      default: "",
    },

    // ⭐ Optional: for popularity
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);