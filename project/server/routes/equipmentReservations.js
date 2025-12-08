const express = require("express");
const router = express.Router();
const {
  createEquipmentReservation,
  listEquipmentReservations,
} = require("../controllers/equipmentReservationController");

router.get("/", listEquipmentReservations);
router.post("/", createEquipmentReservation);

module.exports = router;
