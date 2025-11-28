// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    companyName: String, // ✅ Added for vendors
    roleSpecificId: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "staff", "professor", "ta", "vendor", "admin", "events_office"],
      required: true,
    },
    isVerified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",     // added for checking if user is active/blocked
    },

    // ⭐️ NEW: Vendor documents & verification
    taxCardUrl: {
      type: String,
      default: null,
    },
    logoUrl: {
      type: String,
      default: null,
    },
    vendorVerificationStatus: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "not_submitted",
    },

    favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event", // we'll use a virtual populate later
  }],
  // Loyalty partner fields for vendors
  isLoyaltyPartner: { type: Boolean, default: false },
  loyalty: {
    discountRate: { type: Number, default: 0 }, // percentage e.g., 10 for 10%
    promoCode: { type: String, default: "" },
    terms: { type: String, default: "" },
    validFrom: { type: Date },
    validTo: { type: Date },
  },
   // Wallet balance in EGP (integer or decimal depending on your needs)
 walletBalance: { type: Number, default: 0 },
 // optional wallet transaction refs for quick lookup
 walletTransactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "WalletTransaction" }],
  },
  { timestamps: true }
);

// ✅ Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Compare password method
userSchema.methods.comparePassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model("User", userSchema);