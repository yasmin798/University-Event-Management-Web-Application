// server/models/Bazaar.js
const mongoose = require("mongoose");

const BazaarSchema = new mongoose.Schema(
  {
    type: { type: String, default: "bazaar" },
    title: { type: String, required: true }, // <- stored as "title"
    location: { type: String, required: true },
    shortDescription: { type: String, default: "" },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    registrationDeadline: { type: Date },
    price: { type: Number, default: 0 },
    capacity: { type: Number, default: 0 },
    status: { type: String, default: "published" },
  },
  // IMPORTANT: write into signup DB, collection "bazaars"
  { timestamps: true, strict: true, collection: "bazaars" }
);

module.exports =
  mongoose.models.Bazaar || mongoose.model("Bazaar", BazaarSchema);
