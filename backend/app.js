import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors({
  origin: [process.env.FRONTEND_URL, "http://localhost:5173"].filter(Boolean),
  credentials: true
}));
app.use(express.json());

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

app.get("/", (req, res) => {
  res.send("API running...");
});

export default app;