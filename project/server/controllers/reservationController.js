const Reservation = require("../models/Reservation");

// Get all reservations
exports.getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find();
    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};

// Create reservation
exports.createReservation = async (req, res) => {
  try {
    const { courtName, date, time, studentName, studentId } = req.body;
    if (!courtName || !date || !time || !studentName || !studentId) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existing = await Reservation.findOne({ courtName, date, time });
    if (existing) {
      return res.status(400).json({ message: "This time slot is already reserved." });
    }

    const newReservation = new Reservation({ courtName, date, time, studentName, studentId });
    await newReservation.save();

    res.status(201).json({ message: "Reservation saved successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};
