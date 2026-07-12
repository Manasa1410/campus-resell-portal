import nodemailer from "nodemailer";
import dotenv from "dotenv";
import dns from "dns";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });
dns.setDefaultResultOrder("ipv4first");

let cachedTransporter;

const cleanValue = (value) => String(value || "").trim().replace(/^['"]|['"]$/g, "");
const cleanSecret = (value) => cleanValue(value).replace(/\s+/g, "");
const maskAccount = (account) => {
  const value = cleanValue(account);
  if (!value || value === "apikey") return value;

  const [localPart, domain] = value.split("@");
  if (!domain) return "configured";

  const visible = localPart.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(localPart.length - 2, 3))}@${domain}`;
};
const getEnvValue = (...names) => {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
};

const getMailConfig = () => {
  const sendgridApiKey = cleanSecret(getEnvValue("SENDGRID_API_KEY", "SENDGRID_KEY"));
  const smtpHost = cleanValue(getEnvValue("SMTP_HOST", "EMAIL_HOST", "MAIL_HOST"));
  const smtpPort = Number(getEnvValue("SMTP_PORT", "EMAIL_PORT", "MAIL_PORT") || 587);
  const smtpUser = cleanValue(getEnvValue("SMTP_USER", "SMTP_USERNAME", "EMAIL_USER", "MAIL_USERNAME", "GMAIL_USER"));
  const smtpPass = cleanSecret(getEnvValue("SMTP_PASS", "SMTP_PASSWORD", "EMAIL_PASS", "MAIL_PASSWORD", "GMAIL_PASS"));
  const mailFrom = cleanValue(getEnvValue("MAIL_FROM", "EMAIL_FROM", "SMTP_FROM"));
  const emailPort = Number(getEnvValue("EMAIL_PORT", "MAIL_PORT") || 587);
  const emailSecure = String(getEnvValue("EMAIL_SECURE", "MAIL_SECURE") || (emailPort === 465 ? "true" : "false")) === "true";

  if (sendgridApiKey) {
    return {
      provider: "sendgrid",
      account: "apikey",
      from: mailFrom || "Campus Resell Portal <no-reply@campus-resell.local>",
      transport: {
        host: "smtp.sendgrid.net",
        port: smtpPort || 587,
        secure: false,
        auth: {
          user: "apikey",
          pass: sendgridApiKey,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        family: 4,
      },
    };
  }

  if (smtpHost) {
    if (!smtpUser || !smtpPass) {
      throw new Error("SMTP_HOST is set, but SMTP credentials are missing.");
    }

    return {
      provider: "smtp",
      account: smtpUser,
      from: mailFrom || smtpUser,
      transport: {
        host: smtpHost,
        port: smtpPort || 587,
        secure: String(getEnvValue("SMTP_SECURE", "EMAIL_SECURE", "MAIL_SECURE") || "false") === "true",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        family: 4,
      },
    };
  }

  if (smtpUser || smtpPass) {
    if (!smtpUser || !smtpPass) {
      throw new Error("SMTP credentials must include both username and password.");
    }

    return {
      provider: "gmail",
      account: smtpUser,
      from: mailFrom || `"Campus Resell Portal" <${smtpUser}>`,
      transport: {
        host: "smtp.gmail.com",
        port: emailPort,
        secure: emailSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        family: 4,
      },
    };
  }

  throw new Error(
    "Email is not configured. Set SENDGRID_API_KEY, or SMTP_HOST/SMTP credentials, or EMAIL_USER/EMAIL_PASS."
  );
};

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const config = getMailConfig();
  cachedTransporter = nodemailer.createTransport(config.transport);
  cachedTransporter.provider = config.provider;
  cachedTransporter.account = config.account;
  cachedTransporter.maskedAccount = maskAccount(config.account);
  cachedTransporter.defaultFrom = config.from;
  console.log(`[email] configured provider=${config.provider} account=${cachedTransporter.maskedAccount || "n/a"}`);

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
      `[email] failed provider=${transporter.provider} account=${transporter.maskedAccount || "n/a"} to=${to} code=${error.code || "n/a"} command=${error.command || "n/a"} responseCode=${error.responseCode || "n/a"} message=${error.message}`
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
      account: transporter.maskedAccount,
      accountConfigured: Boolean(transporter.account),
      ready: true,
    };
  } catch (error) {
    return {
      success: false,
      provider: cachedTransporter?.provider || "unknown",
      account: cachedTransporter?.maskedAccount || "unknown",
      accountConfigured: Boolean(cachedTransporter?.account),
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
