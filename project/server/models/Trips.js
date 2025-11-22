// server/models/Trip.js
const mongoose = require("mongoose");

// Reusable Review Schema (you can also move this to a separate file later)
const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

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

    // Registered users (from User model)
    registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Guest registrations (non-logged-in users)
    registrations: {
      type: [
        {
          userId: { type: String }, // could be null for guests
          name: { type: String, default: "Guest" },
          email: { type: String, required: true },
          registeredAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    // ADD THIS: Reviews from attendees
    reviews: [reviewSchema],
  },
  { 
    timestamps: true, 
    collection: "trips" 
  }
);

// Indexes for performance
TripSchema.index({ startDateTime: 1 });
TripSchema.index({ "reviews.createdAt": -1 });

module.exports = mongoose.models.Trip || mongoose.model("Trip", TripSchema);