const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getAttendeesReport } = require("../controllers/reportController");
const { getSalesReport } = require("../controllers/salesController");

// GET /api/reports/attendees
// protected (must be authenticated). Controller will check for allowed roles (admin/staff).
router.get("/attendees", protect, getAttendeesReport);
router.get("/sales", protect, getSalesReport);

module.exports = router;
