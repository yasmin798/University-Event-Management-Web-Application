// server/models/BazaarApplication.js
const mongoose = require("mongoose");

// Attendee in application
const AttendeeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  // Path to uploaded ID document (stored in server uploads)
  idDocument: { type: String, required: true },
  // Whether this attendee will attend for the entire duration (vendors must upload IDs for full duration)
  attendingEntireDuration: { type: Boolean, default: true },
});

const BazaarApplicationSchema = new mongoose.Schema(
  {
    bazaar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bazaar",
      required: true,
    },
    attendees: {
      type: [AttendeeSchema],
      required: true,
      validate: [arrayLimit, "Attendees must be between 1 and 5"],
    },
    boothSize: {
      type: String,
      enum: ["2x2", "4x4"],
      required: true,
    },

     // ✅ NEW: what the company does / will offer at the bazaar
    vendorDescription: {
      type: String,
      trim: true,
    },

    
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    paid: { type: Boolean, default: false },
  paymentDeadline: { type: Date }, // ← ADD THIS
  
acceptedAt: { type: Date },
},
  
  { timestamps: true },
  
);

// Validator: 1–5 attendees
function arrayLimit(val) {
  return val.length >= 1 && val.length <= 5;
}

module.exports =
  mongoose.models.BazaarApplication ||
  mongoose.model("BazaarApplication", BazaarApplicationSchema);