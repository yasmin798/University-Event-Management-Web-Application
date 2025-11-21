// server/models/Bazaar.js
const mongoose = require("mongoose");

// Sub-schema for registrations (with name)
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
    registrations: {
      type: [RegistrationSchema],
      default: [],
    },
  },
  { timestamps: true, strict: true, collection: "bazaars" }
);

module.exports = mongoose.models.Bazaar || mongoose.model("Bazaar", BazaarSchema);