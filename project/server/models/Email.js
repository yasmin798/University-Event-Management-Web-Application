// server/models/Email.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail(to, subject, html) {
  try {
    if (!to) {
      console.error("❌ No recipient email provided");
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,             // ✔ MUST be "to"
      subject,
      html,
    };

    console.log("📨 Sending email to:", to);

    await transporter.sendMail(mailOptions);

    console.log("✅ Email Sent Successfully");
  } catch (err) {
    console.error("❌ Email send error:", err.message);
  }
}

module.exports = sendEmail;
