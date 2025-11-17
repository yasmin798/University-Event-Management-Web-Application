// server/models/Trip.js
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
    registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // For registration
    registrations: {
      type: [
        {
          userId: { type: String },
          name: { type: String, default: "Guest" },   // ADD THIS
          email: { type: String, required: true },
          registeredAt: { type: Date, default: Date.now },
        },
      ],
      default: [],  // Ensure new documents have empty array
    },
  },
  { timestamps: true, collection: "trips" }  // Explicitly set collection name
);

module.exports = mongoose.models.Trip || mongoose.model("Trip", TripSchema);