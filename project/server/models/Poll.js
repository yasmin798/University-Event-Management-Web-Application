// server/models/Poll.js
const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BoothApplication",
    required: true,
  },
  vendorName: { type: String, required: true },
  boothSize: { type: String, required: true },
  durationWeeks: { type: Number, required: true },
  platformSlot: { type: String, required: true },
  votes: { type: Number, default: 0 },
  // Optional: store attendee names for display
  teamMembers: [String],
});

const pollSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    candidates: [candidateSchema],

    votedUsers: {
      type: [String], // track who voted
      default: []
    },
    
    // Optional: link to bazaar if needed
    bazaar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bazaar",
    },
  },
  { timestamps: true }
);

// Auto-close poll when endDate passes (can be used in a cron job later)
pollSchema.pre("save", function (next) {
  if (this.endDate < new Date()) {
    this.isActive = false;
  }
  next();
});

// Index for performance
pollSchema.index({ endDate: 1 });
pollSchema.index({ isActive: 1 });

module.exports = mongoose.model("Poll", pollSchema);