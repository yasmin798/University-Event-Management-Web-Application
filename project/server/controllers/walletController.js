// server/controllers/walletController.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");

// POST /api/wallet/topup/create-session
exports.createTopupSession = async (req, res) => {
  try {
    let rawAmount = req.body.amountEGP || req.body.amount;

    if (!rawAmount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const amountEGP = parseFloat(String(rawAmount).trim());
    if (isNaN(amountEGP) || amountEGP < 5) {
      return res.status(400).json({ error: "Minimum top-up is 5 EGP" });
    }

    const amountCents = Math.round(amountEGP * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "egp",
            product_data: { name: "Wallet Top-up" },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: req.user._id.toString(),
        amountEGP: amountEGP.toFixed(2),
      },
      success_url: `${process.env.CLIENT_URL}/wallet/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/wallet/cancel`,
    });

    res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error("createTopupSession error:", err);
    res.status(500).json({ error: "Failed to create top-up session" });
  }
};

// POST /api/wallet/topup/confirm
exports.confirmTopup = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    if (!req.user?._id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user._id;
    const amountEGP = Number(session.metadata?.amountEGP || 0);

    if (amountEGP <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Prevent double credit
    const existing = await WalletTransaction.findOne({
      reference: sessionId,
      type: "topup",
    });
    if (existing) {
      const user = await User.findById(userId);
      return res.json({
        success: true,
        alreadyProcessed: true,
        walletBalance: user?.walletBalance || 0,
      });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.walletBalance = (user.walletBalance || 0) + amountEGP;

    const transaction = await WalletTransaction.create({
      user: userId,
      type: "topup",
      amount: amountEGP,
      reference: sessionId,
    });

    user.walletTransactions.push(transaction._id);
    await user.save();

    console.log(`Wallet topped up: +${amountEGP} EGP → ${user.walletBalance} EGP`);

    res.json({
      success: true,
      walletBalance: user.walletBalance,
      transaction,
    });
  } catch (err) {
    console.error("confirmTopup error:", err);
    res.status(500).json({ error: "Confirmation failed" });
  }
};

// GET /api/wallet/balance
exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("walletBalance walletTransactions")
      .populate({
        path: "walletTransactions",
        options: { sort: { createdAt: -1 }, limit: 20 },
      });

    res.json({
      walletBalance: user?.walletBalance || 0,
      transactions: user?.walletTransactions || [],
    });
  } catch (err) {
    console.error("getBalance error:", err);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
};