// server/routes/suggestions.js
const express = require("express");
const router = express.Router();
const Suggestion = require("../models/Suggestion");
const { protect } = require("../middleware/auth"); // ✅ this matches your auth.js

// Middleware: only Events Office (or admin) can view suggestions
const requireEventsOffice = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const role = String(req.user.role || "").toLowerCase();
  if (role === "events_office" || role === "admin") {
    return next();
  }

  return res.status(403).json({ message: "Events Office access only" });
};

// POST /api/suggestions  (students submit)
router.post("/", protect, async (req, res) => {
  try {
    const {
      eventType,
      suggestion,
      extraDetails,
      preferredTimeframe,
      studentId,
    } = req.body;

    if (!eventType || !suggestion || !studentId) {
      return res.status(400).json({
        message: "eventType, suggestion and studentId are required",
      });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = req.user._id || req.user.id;
    const userEmail = req.user.email;

    const doc = await Suggestion.create({
      eventType: String(eventType).toUpperCase(), // normalize to match enum
      suggestion: suggestion.trim(),
      extraDetails: extraDetails?.trim() || undefined,
      preferredTimeframe: preferredTimeframe?.trim() || undefined,
      studentId: studentId?.trim(),
      createdBy: userId,
      suggestionEmail: userEmail || null, // so Events Office sees the email
    });

    return res.status(201).json(doc);
  } catch (err) {
    console.error("Error creating suggestion:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/suggestions  (Events Office / admin dashboard)
router.get("/", protect, requireEventsOffice, async (req, res) => {
  try {
    const { eventType } = req.query;
    const filter = {};
    if (eventType) {
      filter.eventType = String(eventType).toUpperCase();
    }

    const suggestions = await Suggestion.find(filter)
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    return res.json(suggestions);
  } catch (err) {
    console.error("Error fetching suggestions:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
