// server/routes/pollRoutes.js
const express = require("express");
const router = express.Router();
const Poll = require("../models/Poll");
const BoothApplication = require("../models/BoothApplication");
const mongoose = require("mongoose");

// ==================== CREATE POLL FROM CONFLICTING BOOTH APPLICATIONS ====================
router.post("/from-booths", async (req, res) => {
  try {
    const { title, endDate, vendorApplications } = req.body;

    if (!title || !endDate || !Array.isArray(vendorApplications) || vendorApplications.length < 2) {
      return res.status(400).json({ error: "Need title, endDate and at least 2 vendors" });
    }

    const candidates = vendorApplications.map(v => ({
      applicationId: new mongoose.Types.ObjectId(v.applicationId),
      vendorName: v.vendorName.trim(),
      boothSize: v.boothSize,
      durationWeeks: Number(v.durationWeeks),
      platformSlot: v.platformSlot,
      votes: 0,
    }));

    const poll = new Poll({
      title: title.trim(),
      endDate: new Date(endDate),
      candidates,
      
    });

    await poll.save();

    res.status(201).json({ message: "Poll created successfully!", poll });
  } catch (err) {
    console.error("Create poll error:", err);
    res.status(400).json({ error: err.message || "Failed to create poll" });
  }
});

// Get all polls
router.get("/", async (req, res) => {
  try {
    const polls = await Poll.find();
    res.json(polls);
  } catch (err) {
    console.error("Get polls error:", err);
    res.status(500).json({ error: "Failed to fetch polls" });
  }
});



module.exports = router;