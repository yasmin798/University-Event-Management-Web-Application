// server/models/Bazaar.js
const mongoose = require("mongoose");

// Reusable Review Schema (same as in other models)
const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Sub-schema for registrations (unchanged — perfect as-is)
const RegistrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
});

const BazaarSchema = new mongoose.Schema(
  {
    type: { type: String, default: "bazaar" },
    title: { type: String, required: true },
    location: { type: String, required: true },
    shortDescription: { type: String, default: "" },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    registrationDeadline: { type: Date },
    price: { type: Number, default: 0 },
    capacity: { type: Number, default: 0 },
    status: { type: String, default: "published" },

    // Registrations (logged-in + guest users)
    registrations: {
      type: [RegistrationSchema],
      default: [],
    },

    // ADD THIS: Reviews from attendees
    reviews: [reviewSchema],
  },
  { 
    timestamps: true, 
    strict: true, 
    collection: "bazaars" 
  }
);

// Indexes for performance
BazaarSchema.index({ startDateTime: 1 });
BazaarSchema.index({ "reviews.createdAt": -1 });

module.exports = mongoose.models.Bazaar || mongoose.model("Bazaar", BazaarSchema);