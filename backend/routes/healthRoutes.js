import express from "express";
import { isCloudinaryConfigured } from "../config/cloudinaryUpload.js";
import { verifyEmailTransport } from "../services/emailService.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    cloudinary: {
      enabled: isCloudinaryConfigured(),
    },
  });
});

router.get("/email", async (req, res) => {
  const status = await verifyEmailTransport();
  res.status(status.success ? 200 : 500).json({
    success: status.success,
    email: {
      provider: status.provider,
      account: status.account,
      accountConfigured: status.accountConfigured,
      ready: status.ready,
      error: status.success ? undefined : status.error,
      code: status.success ? undefined : status.code,
      responseCode: status.success ? undefined : status.responseCode,
    },
  });
});

export default router;
