const mongoose = require("mongoose");

const BoothVendorRequestSchema = new mongoose.Schema(
  {
    bazaarId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Bazaar" },
    vendorName: { type: String, required: true },
    email: { type: String },
    location: { type: String },
    duration: { type: String },
    boothSize: { type: String },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BoothVendorRequest", BoothVendorRequestSchema);
