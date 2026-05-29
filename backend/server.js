import express from "express"; // ✅ MISSING FIX
import dotenv from "dotenv";
import http from "http";
dotenv.config();
import connectDB from "./config/db.js";
import app from "./app.js";
import { initSocket } from "./config/socket.js";

import authRoutes from "./routes/authRoutes.js";
import { sendOtp, verifyOtp } from "./controllers/authController.js";
import { protect } from "./middleware/authMiddleware.js";
import productRoutes from "./routes/productRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import sellerReviewRoutes from "./routes/sellerReviewRoutes.js";
import savedSearchRoutes from "./routes/savedSearchRoutes.js";

import path from "path";

import userRoutes from "./routes/userRoutes.js";

//
// 🗄️ Connect DB
//
connectDB();


//
// 🔗 Routes
//
app.use("/api/auth", authRoutes);
app.post("/api/send-otp", protect, sendOtp);
app.post("/api/verify-otp", protect, verifyOtp);
app.use("/api/products", productRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/seller-reviews", sellerReviewRoutes);
app.use("/api/saved-searches", savedSearchRoutes);

app.use("/uploads", express.static(path.join("uploads")));

app.use("/api/users", userRoutes);




//
// 🚀 Create HTTP Server
//
const server = http.createServer(app);

//
// 🔌 Socket.io
//
initSocket(server);

//
// 🚀 Start Server
//
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
