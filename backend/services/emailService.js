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
const parseFromAddress = (from) => {
  const value = cleanValue(from);
  const match = value.match(/^(.*)<([^<>]+)>$/);

  if (!match) return { email: value };

  const name = cleanValue(match[1]);
  const email = cleanValue(match[2]);
  return name ? { email, name } : { email };
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

const resolveIPv4 = async (hostname) => {
  try {
    const { address } = await dns.promises.lookup(hostname, { family: 4 });
    return address;
  } catch (err) {
    console.warn(`[email] DNS IPv4 lookup failed for ${hostname}:`, err.message);
    return hostname;
  }
};

const getMailConfig = async () => {
  const resendApiKey = cleanSecret(getEnvValue("RESEND_API_KEY", "RESEND_KEY"));
  const brevoApiKey = cleanSecret(getEnvValue("BREVO_API_KEY", "SENDINBLUE_API_KEY", "BREVO_KEY"));
  const sendgridApiKey = cleanSecret(getEnvValue("SENDGRID_API_KEY", "SENDGRID_KEY"));
  const smtpHost = cleanValue(getEnvValue("SMTP_HOST", "EMAIL_HOST", "MAIL_HOST"));
  const smtpPort = Number(getEnvValue("SMTP_PORT", "EMAIL_PORT", "MAIL_PORT") || 587);
  const smtpUser = cleanValue(getEnvValue("SMTP_USER", "SMTP_USERNAME", "EMAIL_USER", "MAIL_USERNAME", "GMAIL_USER"));
  const smtpPass = cleanSecret(getEnvValue("SMTP_PASS", "SMTP_PASSWORD", "EMAIL_PASS", "MAIL_PASSWORD", "GMAIL_PASS"));
  const mailFrom = cleanValue(getEnvValue("MAIL_FROM", "EMAIL_FROM", "SMTP_FROM"));

  if (resendApiKey) {
    return {
      provider: "resend",
      account: "apikey",
      from: mailFrom || "Campus Resell Portal <onboarding@resend.dev>",
      apiKey: resendApiKey,
      sendViaApi: true,
    };
  }

  if (brevoApiKey) {
    return {
      provider: "brevo",
      account: "apikey",
      from: mailFrom || `"Campus Resell Portal" <${smtpUser || "no-reply@campus-resell.com"}>`,
      apiKey: brevoApiKey,
      sendViaApi: true,
    };
  }

  if (sendgridApiKey) {
    const targetHost = "smtp.sendgrid.net";
    const resolvedIp = await resolveIPv4(targetHost);
    return {
      provider: "sendgrid",
      account: "apikey",
      from: mailFrom || "Campus Resell Portal <no-reply@campus-resell.local>",
      apiKey: sendgridApiKey,
      sendViaApi: true,
      transport: {
        host: resolvedIp,
        port: smtpPort || 587,
        secure: false,
        auth: {
          user: "apikey",
          pass: sendgridApiKey,
        },
        tls: {
          servername: targetHost,
          rejectUnauthorized: false,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
      },
    };
  }

  if (smtpHost) {
    if (!smtpUser || !smtpPass) {
      throw new Error("SMTP_HOST is set, but SMTP credentials are missing.");
    }

    const secureEnv = getEnvValue("SMTP_SECURE", "EMAIL_SECURE", "MAIL_SECURE");
    const isSecure = secureEnv ? String(secureEnv).toLowerCase() === "true" : (smtpPort === 465);
    const resolvedIp = await resolveIPv4(smtpHost);

    return {
      provider: "smtp",
      account: smtpUser,
      from: mailFrom || smtpUser,
      transport: {
        host: resolvedIp,
        port: smtpPort || 587,
        secure: isSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          servername: smtpHost,
          rejectUnauthorized: false,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
      },
    };
  }

  if (smtpUser || smtpPass) {
    if (!smtpUser || !smtpPass) {
      throw new Error("SMTP credentials must include both username and password.");
    }

    const explicitPort = getEnvValue("EMAIL_PORT", "MAIL_PORT", "SMTP_PORT");
    const portNumber = explicitPort ? Number(explicitPort) : 465;
    const explicitSecure = getEnvValue("EMAIL_SECURE", "MAIL_SECURE", "SMTP_SECURE");
    const isSecure = explicitSecure ? String(explicitSecure).toLowerCase() === "true" : (portNumber === 465);
    const targetHost = "smtp.gmail.com";
    const resolvedIp = await resolveIPv4(targetHost);

    return {
      provider: "gmail",
      account: smtpUser,
      from: mailFrom || `"Campus Resell Portal" <${smtpUser}>`,
      transport: {
        host: resolvedIp,
        port: portNumber,
        secure: isSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          servername: targetHost,
          rejectUnauthorized: false,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
      },
    };
  }

  throw new Error(
    "Email is not configured. Set SENDGRID_API_KEY, RESEND_API_KEY, or SMTP_HOST/SMTP credentials, or EMAIL_USER/EMAIL_PASS."
  );
};

const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  const config = await getMailConfig();
  if (config.sendViaApi) {
    cachedTransporter = {
      provider: config.provider,
      account: config.account,
      maskedAccount: maskAccount(config.account),
      defaultFrom: config.from,
      apiKey: config.apiKey,
      sendViaApi: true,
    };
    console.log(`[email] configured provider=${config.provider}-api account=${cachedTransporter.maskedAccount || "n/a"}`);
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport(config.transport);
  cachedTransporter.provider = config.provider;
  cachedTransporter.account = config.account;
  cachedTransporter.maskedAccount = maskAccount(config.account);
  cachedTransporter.defaultFrom = config.from;
  cachedTransporter.apiKey = config.apiKey;
  cachedTransporter.sendViaApi = config.sendViaApi;
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
  const transporter = await getTransporter();
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  console.log(`[email] sending provider=${transporter.provider} to=${to} subject=${subject}`);

  if (transporter.provider === "resend" && transporter.sendViaApi) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${transporter.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: transporter.defaultFrom,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[email] failed provider=resend-api to=${to} status=${response.status} message=${errorText}`);
      throw new Error(`Unable to send email right now: Resend API returned ${response.status}`);
    }

    console.log(`[email] sent provider=resend-api to=${to}`);
    return { messageId: response.headers.get("x-message-id") || undefined };
  }

  if (transporter.provider === "brevo" && transporter.sendViaApi) {
    const fromObj = parseFromAddress(transporter.defaultFrom);
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": transporter.apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: { name: fromObj.name || "Campus Resell Portal", email: fromObj.email },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[email] failed provider=brevo-api to=${to} status=${response.status} message=${errorText}`);
      throw new Error(`Unable to send email right now: Brevo API returned ${response.status}`);
    }

    console.log(`[email] sent provider=brevo-api to=${to}`);
    const resData = await response.json().catch(() => ({}));
    return { messageId: resData.messageId || undefined };
  }

  if (transporter.provider === "sendgrid" && transporter.sendViaApi) {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${transporter.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: parseFromAddress(transporter.defaultFrom),
        subject,
        content: [
          { type: "text/plain", value: text },
          { type: "text/html", value: html },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[email] failed provider=sendgrid-api to=${to} status=${response.status} message=${errorText}`);
      throw new Error(`Unable to send email right now: SendGrid API returned ${response.status}`);
    }

    console.log(`[email] sent provider=sendgrid-api to=${to}`);
    return { messageId: response.headers.get("x-message-id") || undefined };
  }

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
    cachedTransporter = null;
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
    const transporter = await getTransporter();
    if (transporter.sendViaApi) {
      return {
        success: true,
        provider: `${transporter.provider}-api`,
        account: transporter.maskedAccount,
        accountConfigured: Boolean(transporter.apiKey),
        ready: true,
      };
    }

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
