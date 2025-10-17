// server/routes/vendorApplications.js
const express = require("express");
const router = express.Router();
const BazaarApplication = require("../models/BazaarApplication");
const BoothApplication = require("../models/BoothApplication"); // adjust filename if different

// GET /api/vendor/applications?email=vendor@example.com&status=accepted&type=bazaar|booth
router.get("/", async (req, res) => {
  try {
    const { email, status, type } = req.query;
    if (!email) return res.status(400).json({ error: "email query param is required" });

    // Build query for bazaar applications: search attendees.email
    const bazaarQuery = { "attendees.email": email };
    if (status) bazaarQuery.status = status;

    // Build query for booth applications: different shape possible, check vendorEmail or attendees
    const boothQuery = {
      $or: [{ vendorEmail: email }, { "attendees.email": email }]
    };
    if (status) boothQuery.status = status;

    const result = {};

    if (!type || type === "bazaar") {
      // populate bazaar details
      const bazaars = await BazaarApplication.find(bazaarQuery).populate("bazaar").lean();
      result.bazaars = bazaars;
    }

    if (!type || type === "booth") {
      // ensure BoothApplication model exists and fields match your implementation
      const booths = await BoothApplication.find(boothQuery).lean();
      result.booths = booths;
    }

    return res.json(result);
  } catch (err) {
    console.error("GET /api/vendor/applications error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
