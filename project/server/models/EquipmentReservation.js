const mongoose = require("mongoose");

const equipmentReservationSchema = new mongoose.Schema(
  {
    courtName: { type: String, required: true }, // football, basketball, tennis
    date: { type: String, required: true }, // ISO date string (YYYY-MM-DD)
    time: { type: String, required: true }, // e.g., "10:00 AM - 12:00 PM"
    studentId: { type: String, required: true },
    studentEmail: { type: String, required: true },
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "EquipmentReservation",
  equipmentReservationSchema
);
