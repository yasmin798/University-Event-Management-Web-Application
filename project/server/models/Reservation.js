const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    courtName: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    studentName: { type: String, required: true },
    studentId: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reservation", reservationSchema);
