// server/models/GymSession.js
const mongoose = require("mongoose");

const gymSessionSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    time: { type: String, required: true }, // e.g., "08:00"
    duration: { type: Number, required: true }, // in minutes
    type: {
      type: String,
      enum: ["yoga", "pilates", "aerobics", "zumba", "cross circuit", "kick-boxing"],
      required: true,
    },
    maxParticipants: { type: Number, required: true },
    registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("GymSession", gymSessionSchema);
