// server/routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const nodemailer = require("nodemailer");
const BazaarApplication = require("../models/BazaarApplication");
const BoothApplication = require("../models/BoothApplication");

/* --------------------------------------------
   PRICE LOGIC (MIRROR OF FRONTEND LOGIC)
---------------------------------------------*/
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

// Helper: calculate price based on same logic as frontend
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

/* --------------------------------------------
   CREATE STRIPE CHECKOUT SESSION
---------------------------------------------*/
router.post("/create-session", async (req, res) => {
  const { applicationId, type } = req.body;

  if (!applicationId || !type) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    let application;
    let title;

    // FETCH APPLICATION
    if (type === "bazaar") {
      application = await BazaarApplication.findById(applicationId).populate("bazaar");
      if (!application) return res.status(404).json({ error: "Bazaar app not found" });

      title = `Bazaar Booth – ${application.bazaar?.title || ""}`;
    }

    if (type === "booth") {
      application = await BoothApplication.findById(applicationId);
      if (!application) return res.status(404).json({ error: "Booth app not found" });

      title = "Platform Booth";
    }

    // VALIDATION
    if (application.status !== "accepted") {
      return res.status(400).json({ error: "Only accepted applications may be paid" });
    }

    if (application.paid) {
      return res.status(400).json({ error: "Already paid" });
    }

    if (application.paymentDeadline && new Date() > new Date(application.paymentDeadline)) {
      return res.status(400).json({ error: "Payment deadline has expired" });
    }

    // CALCULATE PRICE USING SAME LOGIC AS FRONTEND
    const priceEGP = calculatePrice(application, type);
    const amount = priceEGP * 100; // Stripe requires cents

    // CREATE STRIPE SESSION
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "egp",
            product_data: {
              name: title,
              description: `Application ID: ${applicationId}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],

      mode: "payment",

      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&appId=${applicationId}&type=${type}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,

      metadata: {
        applicationId,
        type,
      },
    });

    return res.json({ url: session.url });

  } catch (err) {
    console.error("Stripe session error:", err);
    res.status(500).json({ error: "Payment session failed" });
  }
});

/* --------------------------------------------
   CONFIRM STRIPE PAYMENT
---------------------------------------------*/
router.post("/confirm", async (req, res) => {
  const { sessionId, appId, type } = req.body;

  if (!sessionId || !appId || !type) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    // 1) Retrieve Stripe session to verify payment
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== "paid") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    // 2) Pick which model to update
    const Model = type === "bazaar" ? BazaarApplication : BoothApplication;

    // 3) Update the application as paid
    const updated = await Model.findByIdAndUpdate(
      appId,
      {
        paid: true,
        paymentDate: new Date(),
      },
      { new: true }
    ).populate("bazaar");

    if (!updated) {
      return res.status(404).json({ error: "Application not found" });
    }

    /* --------------------------------------------
       SEND EMAIL RECEIPT TO VENDOR
    ---------------------------------------------*/
    try {
      // Extract vendor email
     const vendorEmail = updated.attendees?.[0]?.email;
      const amountEGP = calculatePrice(updated, type);

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"Eventity Payments" <${process.env.EMAIL_USER}>`,
        to: vendorEmail,
        subject: "Payment Receipt – Eventity",
        html: `
        <h2>Payment Confirmation</h2>
        <p>Dear vendor,</p>
        <p>Your payment has been successfully received.</p>

        <h3>Payment Details</h3>
        <p><strong>Application ID:</strong> ${updated._id}</p>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Amount Paid:</strong> ${amountEGP} EGP</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>

        ${
          type === "bazaar"
            ? `<p><strong>Bazaar:</strong> ${updated.bazaar?.title}</p>`
            : `<p><strong>Booth Location:</strong> ${updated.platformSlot ||
                updated.location}</p>`
        }

        <br/>
        <p>Thank you for using Eventity!</p>
      `,
      };

      await transporter.sendMail(mailOptions);
      console.log("Payment email receipt sent ✔️");
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
      // Do NOT return error — payment must still succeed
    }

    // Final response
    return res.json({ success: true });

  } catch (err) {
    console.error("Payment confirm error:", err);
    res.status(500).json({ error: "Server error confirming payment" });
  }
});
module.exports = router;
