// server/models/Trips.js
const mongoose = require("mongoose");

const TripSchema = new mongoose.Schema(
  {
    type: { type: String, default: "trip" },
    title: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    shortDescription: { type: String, default: "" },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    registrationDeadline: { type: Date },
    price: { type: Number, default: 0, min: 0 },
    capacity: { type: Number, default: 0, min: 0 },
    status: { type: String, default: "published" },
  },
  { timestamps: true }
);

// prevent OverwriteModelError on hot reloads
module.exports = mongoose.models.Trip || mongoose.model("Trip", TripSchema);
