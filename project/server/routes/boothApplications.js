// server/routes/boothApplications.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const BoothApplication = require("../models/BoothApplication");
const Bazaar = require("../models/Bazaar");

// Create new booth application
router.post("/", async (req, res) => {
  try {
    const { bazaar, attendees, boothSize, durationWeeks, platformSlot } = req.body;

    if (!bazaar) return res.status(400).json({ error: "bazaar is required" });
    if (!Array.isArray(attendees) || attendees.length < 1 || attendees.length > 5)
      return res.status(400).json({ error: "attendees must be array of 1-5" });
    if (!["2x2","4x4"].includes(boothSize)) return res.status(400).json({ error: "invalid boothSize" });
    if (![1,2,3,4].includes(Number(durationWeeks))) return res.status(400).json({ error: "durationWeeks must be 1-4" });
    if (!["B1","B2","B3","B4","B5"].includes(platformSlot)) return res.status(400).json({ error: "invalid platformSlot" });

    if (!mongoose.Types.ObjectId.isValid(bazaar)) return res.status(400).json({ error: "invalid bazaar id" });
    const foundB = await Bazaar.findById(bazaar);
    if (!foundB) return res.status(404).json({ error: "Bazaar not found" });

    const doc = new BoothApplication({ bazaar, attendees, boothSize, durationWeeks, platformSlot });
    const saved = await doc.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("POST /api/booth-applications error:", err);
    res.status(500).json({ error: "Failed to create booth application" });
  }
});

// Get all booth applications
router.get("/", async (req, res) => {
  try {
    const list = await BoothApplication.find().populate("bazaar").sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch booth applications" });
  }
});

// Get applications for a bazaar
router.get("/bazaar/:bazaarId", async (req, res) => {
  try {
    const { bazaarId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(bazaarId)) return res.status(400).json({ error: "invalid bazaar id" });
    const list = await BoothApplication.find({ bazaar: bazaarId }).populate("bazaar").sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch booth applications for bazaar" });
  }
});

// Update application status (admin)
router.patch("/:id", /* adminOnly, */ async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "status is required" });
    const s = String(status).toLowerCase();
    if (!["pending","accepted","rejected"].includes(s)) return res.status(400).json({ error: "invalid status" });
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "invalid id" });

    const doc = await BoothApplication.findById(id);
    if (!doc) return res.status(404).json({ error: "Application not found" });

    doc.status = s;
    await doc.save();
    res.json({ success: true, application: doc });
  } catch (err) {
    console.error("PATCH /api/booth-applications/:id error:", err);
    res.status(500).json({ error: "Failed to update application" });
  }
});

// Optionally: delete application
router.delete("/:id", /* adminOnly, */ async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "invalid id" });
    await BoothApplication.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/booth-applications/:id error:", err);
    res.status(500).json({ error: "Failed to delete application" });
  }
});

module.exports = router;
