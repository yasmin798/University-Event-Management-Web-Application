// server/routes/paymentMail.js
const express = require("express");
const router = express.Router();
const BazaarApplication = require("../models/BazaarApplication");
const BoothApplication = require("../models/BoothApplication");
const nodemailer = require("nodemailer");

/* ---------- Price tables (same as paymentRoutes.js) ---------- */
const BAZAAR_PRICE_TABLE = {
  "Small (2x2)": 300,
  "Medium (3x3)": 600,
  "Large (4x4)": 1000,
  "Extra Large (5x5)": 1500,
  default: 500,
};

const BOOTH_PRICE_TABLE = {
  "Main Gate": 500,
  "Food Court": 400,
  "Central Area": 350,
  "Side Wing": 250,
  default: 300,
};

/* ---------- Helper to calculate price ---------- */
function calculatePrice(app, type) {
  if (type === "bazaar") {
    const size = app.boothSize || "default";
    return BAZAAR_PRICE_TABLE[size] || BAZAAR_PRICE_TABLE.default;
  }
  if (type === "booth") {
    const location = app.platformSlot || app.location || "default";
    const weeks = app.durationWeeks || 1;
    const base = BOOTH_PRICE_TABLE[location] || BOOTH_PRICE_TABLE.default;
    return base * weeks;
  }
  return 0;
}

/* ---------- Email sender ---------- */
async function sendEmail({ to, subject, text }) {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Bazaar Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
}

/* ---------- Receipt endpoint ---------- */
router.post("/send-receipt", async (req, res) => {
  const { appId, type } = req.body;

  try {
    let app, email, subject, body;

    if (type === "bazaar") {
      app = await BazaarApplication.findById(appId).populate("bazaar");
      if (!app) return res.status(404).json({ error: "Bazaar app not found" });
      email = app.vendorEmail;
      subject = `Receipt for Bazaar Booth – ${app.bazaar.title}`;
      body = `Hello ${app.vendorName},\n\nThank you for your payment of EGP ${app.amount} for the bazaar booth.\n\nRegards,\nAdmin`;
    }

    if (type === "booth") {
      app = await BoothApplication.findById(appId);
      if (!app) return res.status(404).json({ error: "Booth app not found" });
      email = app.vendorEmail;
      subject = `Receipt for Platform Booth`;
      body = `Hello ${app.vendorName},\n\nThank you for your payment of EGP ${app.amount} for the platform booth.\n\nRegards,\nAdmin`;
    }

    await sendMail(email, subject, body);

    res.json({ success: true });
  } catch (err) {
    console.error("Send receipt error:", err);
    res.status(500).json({ error: "Failed to send receipt" });
  }
});
module.exports = router;
