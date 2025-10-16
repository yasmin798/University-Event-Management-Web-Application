const mongoose = require("mongoose");

const AttendeeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
});

const BazaarApplicationSchema = new mongoose.Schema({
  bazaar: { type: mongoose.Schema.Types.ObjectId, ref: "Bazaar", required: true },
  attendees: { type: [AttendeeSchema], required: true },
  boothSize: { type: String, enum: ["2x2","4x4"], required: true },
  status: { type: String, default: "pending" }
}, { timestamps: true });

module.exports = mongoose.models.BazaarApplication || mongoose.model("BazaarApplication", BazaarApplicationSchema);