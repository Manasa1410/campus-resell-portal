import User from "../models/userModel.js";
import Product from "../models/productModel.js";
// import Chat from "../models/chatModel.js"; // Import if chat model is available

// 📊 Get Admin Dashboard Stats
export const getAdminStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    const availableProducts = await Product.countDocuments({ status: "available" });
    
    res.json({
      success: true,
      stats: {
        users: userCount,
        products: productCount,
        available: availableProducts,
        chats: 0, // Update with actual chat count if model imported
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 👥 Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🚫 Ban/Unban User
export const toggleBanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.isAdmin) return res.status(400).json({ success: false, message: "Cannot ban an admin" });

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({ success: true, message: `User ${user.isBanned ? "banned" : "unbanned"}`, isBanned: user.isBanned });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};