// server/models/Conference.js (updated)
const mongoose = require("mongoose");

// Reusable Review Schema (you can move this to a separate file later if you want)
const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const ConferenceSchema = new mongoose.Schema(
  {
    type: { type: String, default: "conference" },
    title: { type: String, required: true, trim: true },
    name: { type: String, trim: true },
    shortDescription: { type: String, trim: true },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    website: { type: String, required: true, trim: true },
    fullAgenda: { type: String, trim: true },
    requiredBudget: { type: Number, required: true },
    fundingSource: { type: String, required: true, enum: ["GUC", "external"] },
    extraResources: { type: String, trim: true },

    // Role restrictions - specify which roles can access this conference
    allowedRoles: {
      type: [String],
      default: [],
      enum: ["student", "professor", "ta", "staff"],
    },

    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "archived"],
      default: "published",
    },

    // ADD THIS: Reviews from attendees
    reviews: [reviewSchema],
  },
  {
    timestamps: true,
    collection: "conferences",
  }
);

// Indexes for better performance
ConferenceSchema.index({ startDateTime: 1 });
ConferenceSchema.index({ "reviews.createdAt": -1 });

module.exports = mongoose.model("Conference", ConferenceSchema);
