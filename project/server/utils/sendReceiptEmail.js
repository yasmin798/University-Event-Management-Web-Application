// server/utils/sendReceiptEmail.js
const nodemailer = require("nodemailer");

const sendReceiptEmail = async ({ to, userName, eventTitle, amount, eventType, paymentMethod, isRefund = false }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const typeText = eventType === "trip" ? "Trip" : "Workshop";
  const action = isRefund ? "Refund Processed" : "Payment Confirmed";
  const color = isRefund ? "#e67e22" : "#27ae60";
  const sign = isRefund ? "+" : "";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px;">
      <h2 style="color: ${color}; text-align: center; margin-bottom: 10px;">${action}</h2>
      <p style="text-align: center; color: #555; font-size: 16px;">Hello <strong>${userName}</strong>,</p>

      <div style="background: white; padding: 25px; border-radius: 12px; margin: 20px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <h3 style="margin: 0 0 15px; color: #2c3e50;">${typeText}: ${eventTitle}</h3>
        <hr style="border: 1px dashed #ddd; margin: 15px 0;" />
        <p style="margin: 10px 0; font-size: 16px;">
          <strong>Amount:</strong> 
          <span style="font-size: 22px; color: ${color}; font-weight: bold;">
            ${sign}${amount.toFixed(2)} EGP
          </span>
        </p>
        <p style="margin: 10px 0;"><strong>Method:</strong> ${paymentMethod === "wallet" ? "Wallet" : "Card"}${isRefund ? " → Wallet" : ""}</p>
        <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date().toLocaleString("en-GB")}</p>
        ${isRefund ? '<p style="color: #e67e22; font-weight: bold;">Your registration has been cancelled.</p>' : ''}
      </div>

      <p style="text-align: center; color: #7f8c8d; font-size: 14px;">
        Thank you for using <strong>Eventity</strong> — Campus Events Made Simple
      </p>
      <p style="text-align: center; color: #95a5a6; font-size: 12px;">
        Questions? Just reply to this email
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Eventity" <${process.env.EMAIL_USER}>`,
      to,
      subject: isRefund 
        ? `Refund Confirmed – ${typeText}: ${eventTitle}`
        : `Payment Received – ${typeText}: ${eventTitle}`,
      html,
    });
    console.log(`Email sent to ${to} (${isRefund ? "refund" : "payment"})`);
  } catch (err) {
    console.error("Failed to send receipt email:", err);
  }
};

module.exports = sendReceiptEmail;