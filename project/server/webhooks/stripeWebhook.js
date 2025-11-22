// server/webhooks/stripeWebhook.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const endpointSecret = "whsec_1234567890"; // ← CHANGE THIS! Get from Stripe Dashboard → Webhooks

const BazaarApplication = require("../models/BazaarApplication");
const BoothApplication = require("../models/BoothApplication");

const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { applicationId, type } = session.metadata;

    try {
      if (type === "bazaar") {
        await BazaarApplication.findByIdAndUpdate(applicationId, { paid: true, paymentSessionId: session.id });
      } else if (type === "booth") {
        await BoothApplication.findByIdAndUpdate(applicationId, { paid: true, paymentSessionId: session.id });
      }
      console.log(`Payment success for ${type} application ${applicationId}`);
    } catch (err) {
      console.error("Failed to update payment status:", err);
    }
  }

  res.json({ received: true });
};

module.exports = stripeWebhook;