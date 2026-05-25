import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    reason: {
      type: String,
      required: true,
      enum: ["Spam", "Fake product", "Abuse", "Other"],
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed"],
      default: "pending",
    },
    adminNote: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Indexing for faster lookups and duplicate prevention
reportSchema.index({ reporter: 1, reportedUser: 1, product: 1 }, { unique: true });

const Report = mongoose.model("Report", reportSchema);
export default Report;