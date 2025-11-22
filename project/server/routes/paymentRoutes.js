// server/routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Load your models
const BazaarApplication = require("../models/BazaarApplication");
const BoothApplication = require("../models/BoothApplication");

// POST /api/payments/create-session
router.post("/create-session", async (req, res) => {
  const { applicationId, type } = req.body;

  try {
    let application;
    let title = "Vendor Payment";
    let amount = 0;

    if (type === "bazaar") {
      application = await BazaarApplication.findById(applicationId).populate("bazaar");
      if (!application) return res.status(404).json({ error: "Bazaar app not found" });
      title = `Bazaar Booth - ${application.bazaar?.title || "Unknown"}`;
      amount = application.boothPrice || 50000; // price in cents (500 EGP)
    } else if (type === "booth") {
      application = await BoothApplication.findById(applicationId);
      if (!application) return res.status(404).json({ error: "Booth app not found" });
      title = `Platform Booth - ${application.vendorName}`;
      amount = (application.durationWeeks || 1) * 25000; // 250 EGP per week
    }

    if (application.status !== "accepted") {
      return res.status(400).json({ error: "Only accepted applications can be paid" });
    }

    if (application.paid) {
      return res.status(400).json({ error: "Already paid" });
    }

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
      // server/routes/paymentRoutes.js
success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&appId=${applicationId}&type=${type}`,
cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      metadata: {
        applicationId,
        type,
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: "Payment session failed" });
  }
});

module.exports = router;