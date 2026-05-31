import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

let cachedTransporter;

const cleanValue = (value) => String(value || "").trim().replace(/^['"]|['"]$/g, "");
const cleanSecret = (value) => cleanValue(value).replace(/\s+/g, "");

const getMailConfig = () => {
  const sendgridApiKey = cleanSecret(process.env.SENDGRID_API_KEY);
  const smtpUser = cleanValue(process.env.SMTP_USER);
  const smtpPass = cleanSecret(process.env.SMTP_PASS);
  const emailUser = cleanValue(process.env.EMAIL_USER);
  const emailPass = cleanSecret(process.env.EMAIL_PASS);

  if (sendgridApiKey) {
    return {
      provider: "sendgrid",
      account: "apikey",
      from: cleanValue(process.env.MAIL_FROM || process.env.EMAIL_FROM) || "Campus Resell Portal <no-reply@campus-resell.local>",
      transport: {
        host: "smtp.sendgrid.net",
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
          user: "apikey",
          pass: sendgridApiKey,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      },
    };
  }

  if (process.env.SMTP_HOST) {
    if (!smtpUser || !smtpPass) {
      throw new Error("SMTP_HOST is set, but SMTP_USER or SMTP_PASS is missing.");
    }

    return {
      provider: "smtp",
      account: smtpUser,
      from: cleanValue(process.env.MAIL_FROM || process.env.EMAIL_FROM) || smtpUser,
      transport: {
        host: cleanValue(process.env.SMTP_HOST),
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || "false") === "true",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      },
    };
  }

  if (emailUser || emailPass) {
    if (!emailUser || !emailPass) {
      throw new Error("EMAIL_USER and EMAIL_PASS must both be set for Gmail SMTP.");
    }

    const emailPort = Number(process.env.EMAIL_PORT || 465);
    const emailSecure = String(process.env.EMAIL_SECURE || (emailPort === 465 ? "true" : "false")) === "true";

    return {
      provider: "gmail",
      account: emailUser,
      from: cleanValue(process.env.MAIL_FROM || process.env.EMAIL_FROM) || `"Campus Resell Portal" <${emailUser}>`,
      transport: {
        host: "smtp.gmail.com",
        port: emailPort,
        secure: emailSecure,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
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
  cachedTransporter.account = config.account;
  cachedTransporter.defaultFrom = config.from;
  console.log(`[email] configured provider=${config.provider} account=${config.account || "n/a"} from=${config.from}`);

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
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  console.log(`[email] sending provider=${transporter.provider} to=${to} subject=${subject}`);

  try {
    const info = await transporter.sendMail({
      from: transporter.defaultFrom,
      to,
      subject,
      html,
      text,
    });

    console.log(`[email] sent provider=${transporter.provider} to=${to} messageId=${info.messageId || "n/a"}`);
    return info;
  } catch (error) {
    const setupHint =
      transporter.provider === "gmail" && ["EAUTH", "EENVELOPE"].includes(error.code)
        ? " For Gmail/Google Workspace, use an app password and make sure the MAIL_FROM address matches the authenticated account."
        : "";
    console.error(
      `[email] failed provider=${transporter.provider} account=${transporter.account || "n/a"} to=${to} code=${error.code || "n/a"} command=${error.command || "n/a"} responseCode=${error.responseCode || "n/a"} message=${error.message}`
    );
    throw new Error(`Unable to send email right now: ${error.response || error.message}${setupHint}`);
  }
};

export const verifyEmailTransport = async () => {
  try {
    const transporter = getTransporter();
    await new Promise((resolve, reject) => transporter.verify((error, success) => (error ? reject(error) : resolve(success))));
    return {
      success: true,
      provider: transporter.provider,
      account: transporter.account,
      ready: true,
    };
  } catch (error) {
    return {
      success: false,
      provider: cachedTransporter?.provider || "unknown",
      account: cachedTransporter?.account || "unknown",
      ready: false,
      error: error.message,
      code: error.code || null,
      responseCode: error.responseCode || null,
    };
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
