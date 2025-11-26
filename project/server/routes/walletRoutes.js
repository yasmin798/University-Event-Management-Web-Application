// server/routes/walletRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const walletController = require("../controllers/walletController");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");

router.post("/topup/create-session", protect, walletController.createTopupSession);
router.post("/topup/confirm", protect, walletController.confirmTopup);
// server/routes/walletRoutes.js (or wherever this route is)
// server/routes/walletRoutes.js (or wherever it is)
router.get("/balance", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 50;

    const user = await User.findById(userId).select("walletBalance");
    const transactions = await WalletTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("type amount description createdAt") // MAKE SURE description IS INCLUDED
      .lean();

    res.json({
      walletBalance: user.walletBalance || 0,
      transactions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load wallet" });
  }
});
module.exports = router;
