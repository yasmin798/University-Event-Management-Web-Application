// routes/gym.js
const express = require("express");
const router = express.Router();
const GymSession = require("../models/GymSession");

// GET all sessions
router.get("/", async (req, res) => {
  try {
    const sessions = await GymSession.find().sort({ date: 1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch gym sessions" });
  }
});

// POST a new session
router.post("/", async (req, res) => {
  try {
    const { date, time, duration, type, maxParticipants } = req.body;
    const newSession = new GymSession({ date, time, duration, type, maxParticipants });
    const saved = await newSession.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: "Failed to create gym session" });
  }
});

// DELETE a session by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await GymSession.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Gym session not found" });
    res.json({ success: true, message: "🗑️ Gym session deleted successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete gym session" });
  }
});


// UPDATE a session by ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, duration } = req.body;

    const updated = await GymSession.findByIdAndUpdate(
      id,
      { date, time, duration },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Gym session not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update gym session" });
  }
});


module.exports = router;
