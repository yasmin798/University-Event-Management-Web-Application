const mongoose = require("mongoose");

const BazaarVendorRequestSchema = new mongoose.Schema(
  {
    bazaarId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Bazaar" },
    vendorName: { type: String, required: true },
    vendorEmail: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BazaarVendorRequest", BazaarVendorRequestSchema);
