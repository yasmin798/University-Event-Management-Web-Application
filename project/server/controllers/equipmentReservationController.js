const EquipmentReservation = require("../models/EquipmentReservation");

exports.createEquipmentReservation = async (req, res) => {
  try {
    const { courtName, date, time, studentId, studentEmail, items } = req.body;
    if (
      !courtName ||
      !date ||
      !time ||
      !studentId ||
      !studentEmail ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "All fields are required, with at least one item." });
    }

    const reservation = new EquipmentReservation({
      courtName,
      date,
      time,
      studentId,
      studentEmail,
      items,
    });
    await reservation.save();
    res.status(201).json({
      message: "Equipment reservation created.",
      reservationId: reservation._id,
    });
  } catch (err) {
    console.error("Failed to create equipment reservation:", err);
    res.status(500).json({ message: "Server error." });
  }
};

exports.listEquipmentReservations = async (_req, res) => {
  try {
    const reservations = await EquipmentReservation.find().sort({
      createdAt: -1,
    });
    res.json(reservations);
  } catch (err) {
    console.error("Failed to list equipment reservations:", err);
    res.status(500).json({ message: "Server error." });
  }
};
