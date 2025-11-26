// models/Workshop.js
const mongoose = require("mongoose");

// Reusable review schema (you can also put this in a separate file if you want)
const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const workshopSchema = new mongoose.Schema(
  {
    workshopName: { type: String, required: true },
    location: { type: String, required: true },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    shortDescription: { type: String, required: true },
    fullAgenda: { type: String, required: true },
    facultyResponsible: { type: String, required: true },
    professorsParticipating: { type: String, required: true },
    requiredBudget: { type: Number, required: true },
    fundingSource: { type: String, required: true },
    extraResources: { type: String },
    capacity: { type: Number, required: true },
    registrationDeadline: { type: Date, required: true },

    // Registered users (attendees)
    registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      default: "pending",
      enum: ["pending", "published", "rejected", "edits_requested"],
    },

    image: { type: String },

    // ADD THIS: Reviews array
    reviews: [reviewSchema],
    paidUsers: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: "User"
}],
    // ADD THIS: Allowed roles for registration (empty array = open to all)
    allowedRoles: {
      type: [String],
      enum: ["student", "professor", "ta", "staff"],
      default: [],
    },
  },
  { timestamps: true }
);

// Optional: Index for faster queries
workshopSchema.index({ startDateTime: 1 });
workshopSchema.index({ "reviews.createdAt": -1 });

module.exports = mongoose.model("Workshop", workshopSchema);
