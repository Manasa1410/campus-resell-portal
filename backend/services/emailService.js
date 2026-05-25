import nodemailer from "nodemailer";

//
// 📧 Create Transporter
//
//
// 📤 Send Email
//
export const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("SMTP Credentials (EMAIL_USER/EMAIL_PASS) are missing in .env");
    }

    console.log(`📧 Attempting to send email from: ${process.env.EMAIL_USER}`);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Must be a 16-digit App Password
      },
    });

    const mailOptions = {
      from: `"Campus Resell Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("📧 Email sent:", info.response);
  } catch (error) {
    console.error("❌ Email error:", error.message);
    throw error; // Propagate the error so the controller can catch it
  }
};

//
// 🎉 Welcome Email
//
export const sendWelcomeEmail = async (userEmail, userName) => {
  const html = `
    <h2>Welcome to Campus Resell Portal 🎉</h2>
    <p>Hi ${userName},</p>
    <p>Your account has been successfully created.</p>
    <p>Start buying and selling within your campus!</p>
  `;

  await sendEmail(userEmail, "Welcome to Campus Resell Portal", html);
};

//
// 🔐 Verification Email (Optional)
//
export const sendVerificationEmail = async (userEmail, token) => {
  const verificationLink = `http://localhost:3000/verify/${token}`;

  const html = `
    <h2>Email Verification</h2>
    <p>Click below to verify your account:</p>
    <a href="${verificationLink}">Verify Email</a>
  `;

  await sendEmail(userEmail, "Verify Your Email", html);
};

//
// 🔑 Password Reset OTP Email
//
export const sendOTPEmail = async (userEmail, otp) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 400px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
      <h2 style="color: #0f172a; margin-bottom: 16px;">Password Reset Request</h2>
      <p style="color: #64748b; font-size: 14px; line-height: 1.5;">Use the following code to reset your password. This OTP is valid for 10 minutes:</p>
      <div style="background: #f8fafc; padding: 16px; text-align: center; border-radius: 8px; margin-top: 20px;">
        <span style="font-size: 32px; font-weight: 900; letter-spacing: 4px; color: #2563eb;">${otp}</span>
      </div>
    </div>
  `;

  await sendEmail(userEmail, "Your Password Reset OTP", html);
};