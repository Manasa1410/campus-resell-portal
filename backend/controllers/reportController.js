import Report from "../models/reportModel.js";
import User from "../models/userModel.js";

//
// 🚨 Create Report
//
export const createReport = async (req, res) => {
  try {
    const { reportedUser, product, reason } = req.body;

    const report = await Report.create({
      reportedUser,
      reportedBy: req.user.id,
      product,
      reason,
    });

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
    const reports = await Report.find()
      .populate("reportedUser", "name email")
      .populate("reportedBy", "name email")
      .populate("product", "title");

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

    report.status = status || report.status;
    report.adminNote = adminNote || report.adminNote;

    await report.save();

    res.json({
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
  const user = await User.findById(req.params.userId);

  user.isBanned = false;
  await user.save();

  res.json({ success: true, message: "User unbanned" });
};