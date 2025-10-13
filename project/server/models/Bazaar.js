// server/models/Bazaar.js
const mongoose = require("mongoose");

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
  { timestamps: true, strict: true, collection: "bazaars" }
);

module.exports =
  mongoose.models.Bazaar || mongoose.model("Bazaar", BazaarSchema);