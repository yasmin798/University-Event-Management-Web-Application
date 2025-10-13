// server/models/Conference.js
const mongoose = require("mongoose");

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
    status: {
      type: String,
      enum: ["draft", "published", "cancelled"],
      default: "published",
    },
    registrations: {
      type: [
        {
          userId: { type: String },
          email: { type: String, required: true },
          registeredAt: { type: Date, default: Date.now },
        },
      ],
      default: [],  // Ensure new documents have empty array
    },
  },
  { timestamps: true, collection: "conferences" }
);

module.exports = mongoose.model("Conference", ConferenceSchema);