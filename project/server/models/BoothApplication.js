// server/models/BoothApplication.js
const mongoose = require("mongoose");

// Schema for each attendee (team member of the booth)
const AttendeeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  // Path to uploaded ID document for attendee
  idDocument: { type: String, required: true },
  attendingEntireDuration: { type: Boolean, default: true },
});

// Reusable Review Schema (same as all other events)
const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const BoothApplicationSchema = new mongoose.Schema(
  {
    attendees: { type: [AttendeeSchema], required: true },
    boothSize: { type: String, enum: ["2x2", "4x4"], required: true },
    durationWeeks: { type: Number, min: 1, max: 4, required: true },
    platformSlot: { type: String, enum: ["B1", "B2", "B3", "B4", "B5"], required: true },
    
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    
    bazaar: { type: mongoose.Schema.Types.ObjectId, ref: "Bazaar" },

    // ADD THIS: Reviews from visitors who visited this booth
    reviews: [reviewSchema],

    // Optional: Add this to make booth title visible in reviews
    boothTitle: { type: String, trim: true }, // e.g. "Handmade Jewelry by Sara"
  },
  { 
    timestamps: true,
    collection: "boothapplications" // optional: explicit collection name
  }
);

// Indexes for performance
BoothApplicationSchema.index({ status: 1 });
BoothApplicationSchema.index({ "reviews.createdAt": -1 });
BoothApplicationSchema.index({ bazaar: 1 });

module.exports =
  mongoose.models.BoothApplication ||
  mongoose.model("BoothApplication", BoothApplicationSchema);