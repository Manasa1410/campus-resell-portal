import express from "express"; // ✅ MISSING FIX
import dotenv from "dotenv";
import http from "http";
dotenv.config();
import connectDB from "./config/db.js";
import app from "./app.js";
import { initSocket } from "./config/socket.js";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";



//
// 🧩 Middleware
//
app.use(express.json());

//
// 🔗 Routes
//
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/reports", reportRoutes);

//
// 🗄️ Connect DB
//
connectDB();

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
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});