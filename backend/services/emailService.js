import nodemailer from "nodemailer";

//
// 📧 Create Transporter
//
const transporter = nodemailer.createTransport({
  service: "gmail", // you can change later
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

//
// 📤 Send Email
//
export const sendEmail = async (to, subject, html) => {
  try {
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