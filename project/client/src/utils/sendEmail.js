// server/utils/sendEmail.js
const nodemailer = require("nodemailer");

async function sendEmail({ to, subject, text, html }) {
  // Create transporter using your SMTP service (Gmail example)
  const transporter = nodemailer.createTransport({
    service: "Gmail", // or another service
    auth: {
      user: process.env.EMAIL_USER, // your email
      pass: process.env.EMAIL_PASS, // app password if using Gmail
    },
  });

  const mailOptions = {
    from: `"Bazaar Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return info;
  } catch (err) {
    console.error("Error sending email:", err);
    throw err;
  }
}

module.exports = sendEmail;
