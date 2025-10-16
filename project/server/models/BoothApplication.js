// server/models/BoothApplication.js
const mongoose = require("mongoose");

const AttendeeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
});

const BoothApplicationSchema = new mongoose.Schema({
  bazaar: { type: mongoose.Schema.Types.ObjectId, ref: "Bazaar", required: true },
  attendees: { type: [AttendeeSchema], required: true },
  boothSize: { type: String, enum: ["2x2", "4x4"], required: true },
  durationWeeks: { type: Number, min: 1, max: 4, required: true },
  platformSlot: { type: String, enum: ["B1","B2","B3","B4","B5"], required: true },
  status: { type: String, enum: ["pending","accepted","rejected"], default: "pending" },
}, { timestamps: true });

module.exports = mongoose.models.BoothApplication || mongoose.model("BoothApplication", BoothApplicationSchema);
