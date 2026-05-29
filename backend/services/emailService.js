import nodemailer from "nodemailer";

let cachedTransporter;

const getMailConfig = () => {
  if (process.env.SENDGRID_API_KEY) {
    return {
      provider: "sendgrid",
      from: process.env.MAIL_FROM || process.env.EMAIL_FROM || "Campus Resell Portal <no-reply@campus-resell.local>",
      transport: {
        host: "smtp.sendgrid.net",
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
          user: "apikey",
          pass: process.env.SENDGRID_API_KEY,
        },
      },
    };
  }

  if (process.env.SMTP_HOST) {
    return {
      provider: "smtp",
      from: process.env.MAIL_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER,
      transport: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || "false") === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
    };
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return {
      provider: "gmail",
      from: process.env.MAIL_FROM || `"Campus Resell Portal" <${process.env.EMAIL_USER}>`,
      transport: {
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
    };
  }

  throw new Error(
    "Email is not configured. Set SENDGRID_API_KEY, or SMTP_HOST/SMTP_USER/SMTP_PASS, or EMAIL_USER/EMAIL_PASS."
  );
};

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const config = getMailConfig();
  cachedTransporter = nodemailer.createTransport(config.transport);
  cachedTransporter.provider = config.provider;
  cachedTransporter.defaultFrom = config.from;

  // Proactively verify SMTP connection and log status
  cachedTransporter.verify((error, success) => {
    if (error) {
      console.error(`[SMTP Connection Error] Failed to connect to ${config.provider}. Details:`, error.message);
    } else {
      console.log(`[SMTP Connection Success] ${config.provider.toUpperCase()} transporter is ready to send emails.`);
    }
  });

  return cachedTransporter;
};

export const sendEmail = async (to, subject, html) => {
  const transporter = getTransporter();

  try {
    const info = await transporter.sendMail({
      from: transporter.defaultFrom,
      to,
      subject,
      html,
    });

    console.log(`[email] sent provider=${transporter.provider} to=${to} messageId=${info.messageId || "n/a"}`);
    return info;
  } catch (error) {
    console.error(`[email] failed provider=${transporter.provider} to=${to} code=${error.code || "n/a"} message=${error.message}`);
    throw new Error(`Unable to send email right now: ${error.response || error.message}`);
  }
};

export const sendWelcomeEmail = async (userEmail, name) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="margin:0 0 12px;color:#111827">Welcome to Campus Resell Portal</h2>
      <p style="color:#4b5563">Hi ${name}, your account is ready.</p>
    </div>
  `;

  return sendEmail(userEmail, "Welcome to Campus Resell Portal", html);
};

export const sendOTPEmail = async (userEmail, otp) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="margin:0 0 12px;color:#111827">Your verification code</h2>
      <p style="color:#4b5563;line-height:1.5">Use this code to verify your campus email. It expires in 10 minutes.</p>
      <div style="margin:24px 0;padding:18px;text-align:center;background:#f3f4f6;border-radius:10px">
        <span style="font-size:34px;font-weight:800;letter-spacing:6px;color:#2563eb">${otp}</span>
      </div>
      <p style="font-size:12px;color:#6b7280">If you did not request this, ignore this email.</p>
    </div>
  `;

  return sendEmail(userEmail, "Campus Resell Portal OTP", html);
};

export const sendVerificationEmail = async (userEmail, token) => {
  const verificationLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify/${token}`;

  const html = `
    <div style="font-family:Arial,sans-serif">
      <h2>Email Verification</h2>
      <p>Click below to verify your account:</p>
      <a href="${verificationLink}">Verify Email</a>
    </div>
  `;

  return sendEmail(userEmail, "Verify Your Email", html);
};
