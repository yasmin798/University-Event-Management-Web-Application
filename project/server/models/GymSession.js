const mongoose = require("mongoose");

const gymSessionSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    time: { type: String, required: true }, // e.g., "08:00"
    duration: { type: Number, required: true }, // in minutes
    type: {
      type: String,
      enum: [
        "yoga",
        "pilates",
        "aerobics",
        "zumba",
        "cross circuit",
        "kick-boxing",
      ],
      required: true,
    },
    maxParticipants: { type: Number, required: true },

    // ← NEW: Role restriction
    allowedRoles: {
      type: [String],
      enum: ["student", "professor", "ta", "staff"],
      default: [],
    },

    // NEW: Machines status listing for the gym
    machines: [
      {
        name: { type: String, required: true },
        status: {
          type: String,
          enum: ["available", "malfunctioned"],
          required: true,
        },
      },
    ],

    registeredUsers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        email: { type: String, required: true },
        registeredAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("GymSession", gymSessionSchema);
