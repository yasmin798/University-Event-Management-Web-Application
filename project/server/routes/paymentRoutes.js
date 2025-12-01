// server/routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const nodemailer = require("nodemailer");
const BazaarApplication = require("../models/BazaarApplication");
const BoothApplication = require("../models/BoothApplication");
const { protect } = require("../middleware/auth");
const Trip = require("../models/Trips"); // <-- ADD THIS LINE
const Workshop = require("../models/Workshop");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction"); // ← you probably already have this

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
      application = await BazaarApplication.findById(applicationId).populate(
        "bazaar"
      );
      if (!application)
        return res.status(404).json({ error: "Bazaar app not found" });

      title = `Bazaar Booth – ${application.bazaar?.title || ""}`;
    }

    if (type === "booth") {
      application = await BoothApplication.findById(applicationId);
      if (!application)
        return res.status(404).json({ error: "Booth app not found" });

      title = "Platform Booth";
    }

    // VALIDATION
    if (application.status !== "accepted") {
      return res
        .status(400)
        .json({ error: "Only accepted applications may be paid" });
    }

    if (application.paid) {
      return res.status(400).json({ error: "Already paid" });
    }

    if (
      application.paymentDeadline &&
      new Date() > new Date(application.paymentDeadline)
    ) {
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
      cancel_url: `${process.env.CLIENT_URL}/events/registered`,

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
/* CONFIRM EVENT PAYMENT — ONLY FOR TRIPS & WORKSHOPS */
router.post("/confirm-event-payment", protect, async (req, res) => {
  const { sessionId, eventId, eventType } = req.body;

  if (!sessionId || !eventId || !eventType) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    const userId = req.user._id;
    const Model = eventType.toLowerCase() === "workshop" ? Workshop : Trip;

    await Model.findByIdAndUpdate(
      eventId,
      { $addToSet: { paidUsers: userId } },
      { new: true }
    );

    console.log(`EVENT PAID: ${eventType} ${eventId} by user ${userId}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Event payment confirm error:", err);
    res.status(500).json({ error: "Confirmation failed" });
  }
});
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
      event = await Workshop.findById(eventId).select(
        "+requiredBudget +capacity +paidUsers +title +registeredUsers"
      );
      if (!event) return res.status(404).json({ error: "Workshop not found" });

      // CALCULATE PRICE FOR WORKSHOPS
      const budget = Number(event.requiredBudget || 0);
      const capacity = Number(event.capacity || 1);
      if (capacity <= 0)
        return res.status(400).json({ error: "Invalid capacity" });
      priceEGP = Math.round(budget / capacity + 100);
    } else if (eventType.toLowerCase() === "trip") {
      event = await Trip.findById(eventId).select(
        "+price +paidUsers +title +registeredUsers"
      );
      if (!event) return res.status(404).json({ error: "Trip not found" });

      priceEGP = Number(event.price || 0);
    }

    if (priceEGP <= 0) {
      return res.status(400).json({ error: "Event has no price" });
    }

    const userId = req.user._id;

    // Check registration
    const isRegistered = event.registeredUsers?.some(
      (id) => id.toString() === userId.toString()
    );
    if (!isRegistered) {
      return res
        .status(403)
        .json({ error: "You are not registered for this event" });
    }

    // Check if already paid
    if (event.paidUsers?.some((id) => id.toString() === userId.toString())) {
      return res.status(400).json({ error: "Already paid" });
    }

    // WALLET PAYMENT
    // WALLET PAYMENT — FINAL BULLETPROOF VERSION
    // WALLET PAYMENT — COMPLETE & BULLETPROOF
    if (method === "wallet") {
      // RECALCULATE PRICE HERE (IN CASE IT WAS LOST)
      let priceInEGP;
      if (eventType.toLowerCase() === "workshop") {
        const budget = Number(event.requiredBudget || 0);
        const capacity = Number(event.capacity || 1);
        if (capacity <= 0)
          return res.status(400).json({ error: "Invalid capacity" });
        priceInEGP = Math.round(budget / capacity + 100);
      } else {
        priceInEGP = Number(event.price || 0);
      }

      const user = await User.findById(userId);
      if ((user.walletBalance || 0) < priceInEGP) {
        return res.status(400).json({ error: "Insufficient wallet balance" });
      }

      // Deduct from wallet
      user.walletBalance -= priceInEGP;
      await user.save();

      // CREATE TRANSACTION — NOW APPEARS IN HISTORY
      await WalletTransaction.create({
        user: userId,
        type: "payment",
        amount: priceInEGP,
        description: `Registration - ${
          event.title || event.workshopName || "Event"
        }`,
        relatedApp: eventId,
        appModel: eventType === "workshop" ? "Workshop" : "Trip",
      });

      // MARK AS PAID — BULLETPROOF
      if (!event.paidUsers) event.paidUsers = [];
      if (!event.paidUsers.some((id) => id.toString() === userId.toString())) {
        event.paidUsers.push(userId);
        event.markModified("paidUsers"); // FORCES SAVE
      }
      await event.save();
      if (user?.email) {
        const sendReceiptEmail = require("../utils/sendReceiptEmail");
        await sendReceiptEmail({
          to: user.email,
          userName: user.name || "Student",
          eventTitle: event.title || event.workshopName || "Event",
          amount: priceInEGP,
          eventType: eventType.toLowerCase(),
          paymentMethod: "wallet",
          isRefund: false,
        });
      }

      return res.json({ success: true, method: "wallet" });
    }

    // STRIPE PAYMENT — NOW 100% SAFE
    if (method === "stripe") {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "egp",
              product_data: {
                name: `${event.title || "Event"} – Registration Fee`,
              },
              unit_amount: Math.round(priceEGP * 100), // GUARANTEED NUMBER
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.CLIENT_URL}/event-payment-success?session_id={CHECKOUT_SESSION_ID}&eventId=${eventId}&eventType=${eventType}`,
        cancel_url: `${process.env.CLIENT_URL}/events/registered`,
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
            : `<p><strong>Booth Location:</strong> ${
                updated.platformSlot || updated.location
              }</p>`
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
/* =============================================
   REFUND EVENT (TRIP / WORKSHOP) → WALLET
   Conditions:
   • User has paid
   • Event starts in 14+ days
   • Money goes back to wallet
   ============================================= */
// ADD THIS ROUTE — RIGHT AFTER YOUR OTHER ROUTES
router.post("/confirm-event-payment-and-email", protect, async (req, res) => {
  const { sessionId, eventId, eventType } = req.body;

  if (!sessionId || !eventId || !eventType) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    // 1. Verify Stripe payment
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    const userId = req.user._id;
    const Model = eventType.toLowerCase() === "workshop" ? Workshop : Trip;

    const event = await Model.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // 2. Mark as paid (if not already)
    if (!event.paidUsers?.some((id) => id.toString() === userId.toString())) {
      event.paidUsers.push(userId);
      await event.save();
    }

    // 3. SEND RECEIPT EMAIL
    const user = await User.findById(userId);
    if (user?.email) {
      const sendReceiptEmail = require("../utils/sendReceiptEmail");
      await sendReceiptEmail({
        to: user.email,
        userName: user.name || "Student",
        eventTitle: event.title || event.workshopName || "Event",
        amount: session.amount_total / 100, // Stripe gives in halalas
        eventType: eventType.toLowerCase(),
        paymentMethod: "card",
        isRefund: false,
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Card payment confirm + email error:", err);
    res.status(500).json({ error: "Failed" });
  }
});
router.post("/refund-event", protect, async (req, res) => {
  const { eventId, eventType } = req.body;
  const userId = req.user._id;

  if (
    !eventId ||
    !eventType ||
    !["trip", "workshop"].includes(eventType.toLowerCase())
  ) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const Model = eventType.toLowerCase() === "workshop" ? Workshop : Trip;
    const event = await Model.findById(eventId);

    if (!event) return res.status(404).json({ error: "Event not found" });

    // 1. Must be paid
    const userPaid = event.paidUsers?.some(
      (id) => id.toString() === userId.toString()
    );
    if (!userPaid) {
      return res
        .status(400)
        .json({ error: "You have not paid for this event" });
    }

    // 2. Event must start 14+ days from now
    const startDate = new Date(event.startDateTime || event.startDate);
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    if (startDate <= twoWeeksFromNow) {
      return res
        .status(400)
        .json({
          error: "Refund not allowed: event starts in less than 14 days",
        });
    }

    // 3. Calculate exact refund amount (same logic as payment)
    let refundAmount = 0;
    if (eventType.toLowerCase() === "workshop") {
      const budget = Number(event.requiredBudget || 0);
      const capacity = Number(event.capacity || 1);
      refundAmount = Math.round(budget / capacity + 100);
    } else {
      refundAmount = Number(event.price || 0);
    }

    if (refundAmount <= 0) {
      return res.status(400).json({ error: "No refundable amount" });
    }

    // 4. Refund to wallet
    const user = await User.findById(userId);
    user.walletBalance += refundAmount;
    await user.save();

    // 5. Record refund transaction
    await WalletTransaction.create({
      user: userId,
      type: "refund",
      amount: refundAmount,
      description: `Refund – ${event.title || event.workshopName || "Event"}`,
      relatedApp: eventId,
      appModel: eventType === "workshop" ? "Workshop" : "Trip",
    });

    // 6. Remove from paidUsers AND registeredUsers
    event.paidUsers = event.paidUsers.filter(
      (id) => id.toString() !== userId.toString()
    );
    event.registeredUsers = event.registeredUsers.filter(
      (id) => id.toString() !== userId.toString()
    );
    await event.save();
    // After WalletTransaction.create(...) and before return res.json(...)
    if (user?.email) {
      const sendReceiptEmail = require("../utils/sendReceiptEmail");
      await sendReceiptEmail({
        to: user.email,
        userName: user.name || "Student",
        eventTitle: event.title || event.workshopName || "Event",
        amount: refundAmount,
        eventType: eventType.toLowerCase(),
        paymentMethod: "wallet",
        isRefund: true,
      });
    }
    return res.json({
      success: true,
      message: "Refund successful",
      refundedAmount: refundAmount,
    });
  } catch (err) {
    console.error("Refund error:", err);
    return res.status(500).json({ error: "Refund failed" });
  }
});
module.exports = router;
