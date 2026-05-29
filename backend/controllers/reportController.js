import mongoose from "mongoose";
import Report from "../models/reportModel.js";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";

//
// 🚨 Create Report
//
export const createReport = async (req, res) => {
  try {
    const { reportedUser, product, message, targetId: rawTargetId, targetType: rawTargetType, reason, description } = req.body;
    const reporterId = req.user.id;
    
    // Map to polymorphic fields used in backend/models/reportModel.js
    const targetId = rawTargetId || reportedUser || product || message;
    const targetType = rawTargetType || (reportedUser ? "User" : message ? "Message" : "Product");

    // 1. Validations
    if (!targetId) {
      return res.status(400).json({ success: false, message: "Report target (User or Product) is required" });
    }

    if (targetType === "User" && targetId.toString() === reporterId.toString()) {
      return res.status(400).json({ success: false, message: "You cannot report yourself" });
    }

    // 2. Prevent Duplicate Reports
    const existingReport = await Report.findOne({
      reporter: reporterId,
      reportedBy: reporterId,
      targetId,
      targetType,
    });

    if (existingReport) {
      return res.status(400).json({ success: false, message: "You have already reported this item/user" });
    }

    // 3. Create Report
    const report = await (await Report.create({
      reporter: reporterId,
      targetId,
      targetType,
      reason,
      description,
    })).populate("reporter", "name");

    // 4. Auto Moderation: If a user gets 5+ reports, ban them
    if (targetType === "User") {
      const reportCount = await Report.countDocuments({ targetId, targetType: "User" });
      if (reportCount >= 5) {
        await User.findByIdAndUpdate(targetId, { isBanned: true });
      }
    } else {
      // Check the seller of the product
      const reportedProduct = await Product.findById(targetId);
      if (reportedProduct) {
        const sellerReports = await Report.countDocuments({ targetId: reportedProduct.seller, targetType: "User" });
        if (sellerReports >= 5) {
          await User.findByIdAndUpdate(reportedProduct.seller, { isBanned: true });
        }
      }
    }

    res.status(201).json({
      success: true,
      report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//
// 📋 Get All Reports (Admin Only)
//
export const getReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 })
      .populate("reporter", "name email")
      .populate("targetId"); // Mongoose uses refPath to populate either User or Product

    res.json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//
// 🔄 Update Report Status (Admin)
//
export const updateReportStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    if (status) report.status = status;
    if (adminNote !== undefined) report.adminNote = adminNote;

    await report.save();
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//
// 🔨 Ban User (Admin)
//
export const banUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isBanned = true;
    await user.save();

    res.json({
      success: true,
      message: "User has been banned",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// controller // Unban User (Admin)
export const unbanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isBanned = false;
    await user.save();

    res.json({ success: true, message: "User unbanned" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//
// 🗑️ Delete Report (Admin)
//
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    const report = await Report.findByIdAndDelete(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    res.json({
      success: true,
      message: "Report record deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
