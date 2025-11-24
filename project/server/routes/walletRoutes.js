// server/routes/walletRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const walletController = require("../controllers/walletController");

router.post("/topup/create-session", protect, walletController.createTopupSession);
router.post("/topup/confirm", protect, walletController.confirmTopup);
router.get("/balance", protect, walletController.getBalance);

module.exports = router;
