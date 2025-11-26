// server/routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const nodemailer = require("nodemailer");
const BazaarApplication = require("../models/BazaarApplication");
const BoothApplication = require("../models/BoothApplication");
const { protect } = require("../middleware/auth");
const Trip = require("../models/Trips");     // <-- ADD THIS LINE
const Workshop = require("../models/Workshop");

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
// server/routes/paymentRoutes.js – ADD THIS

/* --------------------------------------------
   PAY EVENT (TRIPS + WORKSHOPS) — FIXED & SAFE
---------------------------------------------*/
router.post("/pay-event", protect, async (req, res) => {
  const { eventId, eventType, method } = req.body;

  if (!eventId || !eventType || !method) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  if (!["workshop", "trip"].includes(eventType.toLowerCase())) {
    return res.status(400).json({ error: "Only workshop and trip supported" });
  }

  try {
    let event;
    let priceEGP = 0;

    // FETCH EVENT WITH CORRECT FIELDS
    if (eventType.toLowerCase() === "workshop") {
      event = await Workshop.findById(eventId)
        .select("+requiredBudget +capacity +paidUsers +title +registeredUsers");
      if (!event) return res.status(404).json({ error: "Workshop not found" });

      // CALCULATE PRICE FOR WORKSHOPS
      const budget = Number(event.requiredBudget || 0);
      const capacity = Number(event.capacity || 1);
      if (capacity <= 0) return res.status(400).json({ error: "Invalid capacity" });
      priceEGP = Math.round((budget / capacity) + 100);

    } else if (eventType.toLowerCase() === "trip") {
      event = await Trip.findById(eventId)
        .select("+price +paidUsers +title +registeredUsers");
      if (!event) return res.status(404).json({ error: "Trip not found" });

      priceEGP = Number(event.price || 0);
    }

    if (priceEGP <= 0) {
      return res.status(400).json({ error: "Event has no price" });
    }

    const userId = req.user._id;

    // Check registration
    const isRegistered = event.registeredUsers?.some(id => id.toString() === userId.toString());
    if (!isRegistered) {
      return res.status(403).json({ error: "You are not registered for this event" });
    }

    // Check if already paid
    if (event.paidUsers?.some(id => id.toString() === userId.toString())) {
      return res.status(400).json({ error: "Already paid" });
    }

    // WALLET PAYMENT
    if (method === "wallet") {
      const user = await User.findById(userId);
      if ((user.walletBalance || 0) < priceEGP) {
        return res.status(400).json({ error: "Insufficient wallet balance" });
      }

      user.walletBalance -= priceEGP;
      await user.save();

      await WalletTransaction.create({
        user: userId,
        type: "payment",
        amount: priceEGP,
        relatedApp: eventId,
        appModel: eventType === "workshop" ? "Workshop" : "Trip",
      });

      event.paidUsers = event.paidUsers || [];
      event.paidUsers.push(userId);
      await event.save();

      return res.json({ success: true, method: "wallet" });
    }

    // STRIPE PAYMENT — NOW 100% SAFE
    if (method === "stripe") {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "egp",
            product_data: {
              name: `${event.title || "Event"} – Registration Fee`,
            },
            unit_amount: Math.round(priceEGP * 100), // GUARANTEED NUMBER
          },
          quantity: 1,
        }],
        mode: "payment",
        success_url: `${process.env.CLIENT_URL}/registered-events?paid=success`,
        cancel_url: `${process.env.CLIENT_URL}/registered-events?paid=cancel`,
        metadata: {
          userId: userId.toString(),
          eventId,
          eventType,
        },
      });

      return res.json({ url: session.url });
    }

  } catch (err) {
    console.error("Event payment error:", err);
    res.status(500).json({ error: "Payment failed" });
  }
});
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
