const mongoose = require("mongoose");

const suggestionSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: ["WORKSHOP", "TRIP", "BAZAAR", "BOOTH", "CONFERENCE"],
      required: true,
    },

    suggestion: {
      type: String,
      required: true,
      trim: true,
    },

    extraDetails: {
      type: String,
      trim: true,
    },

    preferredTimeframe: {
      type: String,
      trim: true,
    },

    // 🔹 Student ID typed by the student in the form
    studentId: {
      type: String,
      trim: true,
    },

    // 🔹 Snapshot of the student's email at submission time
    suggestionEmail: {
      type: String,
      trim: true,
    },

    // 🔹 User reference from JWT
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["new", "seen", "in_progress", "done"],
      default: "new",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Suggestion", suggestionSchema);
