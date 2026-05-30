import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy for Render/HTTPS deployment
app.enable("trust proxy");

const corsOptions = {
  origin: [
    "https://campus-resell-portal.vercel.app",
    //https://campus-resell-portal-2.onrender.com",
    "http://127.0.0.1:5173",
    "http://localhost:5173"
  ].filter(Boolean),
  credentials: true,
};

app.use(cors(corsOptions));
//app.options("/.*/", cors(corsOptions));
app.use(express.json());

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// Serve frontend statically in production
if (process.env.NODE_ENV === "production") {
  const frontendBuildPath = path.join(__dirname, "..", "frontend", "dist");
  app.use(express.static(frontendBuildPath));
  
  // Any route that doesn't match backend endpoints should serve frontend
  app.get(/.*/, (req, res) => {
    // If request starts with API prefix but wasn't handled, return 404
    if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/uploads")) {
      return res.status(404).json({ success: false, message: "Not Found" });
    }
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API running...");
  });
}

export default app;