const mongoose = require("mongoose");

const loyaltyApplicationSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    companyName: { type: String, required: true }, // NEW
    discountRate: { type: Number, required: true },
    promoCode: { type: String, required: true, unique: true },
    termsAndConditions: { type: String, required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvalDate: { type: Date },
  
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoyaltyApplication", loyaltyApplicationSchema);

