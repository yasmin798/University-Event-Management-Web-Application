// server/models/WalletTransaction.js
const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["topup", "payment", "refund"], required: true },
  amount: { type: Number, required: true }, // in EGP
  description: { type: String },
  reference: { type: String }, // optional (Stripe session id or note)
  relatedApp: { type: mongoose.Schema.Types.ObjectId, refPath: "appModel", default: null },
  appModel: { type: String, enum: ["BazaarApplication", "BoothApplication", "Trip", "Workshop"], default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.WalletTransaction || mongoose.model("WalletTransaction", walletTransactionSchema);
