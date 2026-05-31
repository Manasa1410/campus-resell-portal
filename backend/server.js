import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

import express from "express";
import fs from "fs";
import http from "http";
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

import userRoutes from "./routes/userRoutes.js";

//
// 🗄️ Connect DB
//
await connectDB();


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

app.use("/api/users", userRoutes);

// Serve frontend statically only in local development
const frontendBuildPath = path.join(__dirname, "..", "frontend", "dist");
const isLocalDev = process.env.NODE_ENV !== "production";
const hasFrontendBuild = fs.existsSync(frontendBuildPath);

if (isLocalDev && hasFrontendBuild) {
  app.use(express.static(frontendBuildPath));

  // Any route that doesn't match backend endpoints should serve frontend
  app.get(/.*/, (req, res) => {
    if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/uploads")) {
      return res.status(404).json({ success: false, message: "Not Found" });
    }
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
} else {
  // Production: just serve API message (frontend is on Vercel)
  app.get("/", (req, res) => {
    res.send("🚀 Campus Resell Portal API is running...");
  });
}



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
