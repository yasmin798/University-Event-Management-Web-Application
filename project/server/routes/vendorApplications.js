const express = require("express");
const router = express.Router();
const BazaarApplication = require("../models/BazaarApplication");
const BoothApplication = require("../models/BoothApplication");

router.get("/", async (req, res) => {
  try {
    const { email, status, type } = req.query;
    if (!email) return res.status(400).json({ error: "email query param is required" });

    // 🔸 Filter for bazaar apps (attendees.email)
    const bazaarQuery = { "attendees.email": email };
    if (status) bazaarQuery.status = status;

    // 🔸 Filter for booth apps (attendees.email)
    const boothQuery = { "attendees.email": email };
    if (status) boothQuery.status = status;

    const result = {};

    if (!type || type === "bazaar") {
      const bazaars = await BazaarApplication.find(bazaarQuery)
        .populate("bazaar") // only if you have a reference
        .lean();
      result.bazaars = bazaars;
    }

    if (!type || type === "booth") {
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
