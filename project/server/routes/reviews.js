// server/routes/reviews.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const User = require("../models/User");

// Event models
const Workshop         = require("../models/Workshop");
const Trip             = require("../models/Trips");
const Conference       = require("../models/Conference");
const Bazaar           = require("../models/Bazaar");
const BoothApplication = require("../models/BoothApplication");

// Helper: find any event by ID
const findEventById = async (id) => {
  const models = [Workshop, Trip, Conference, Bazaar, BoothApplication];
  for (const Model of models) {
    const doc = await Model.findById(id);
    if (doc) return { event: doc, Model };
  }
  return { event: null, Model: null };
};

// GET /api/events/:id/reviews
router.get("/:id/reviews", async (req, res) => {
  try {
    const { event } = await findEventById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const reviews = (event.reviews || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(reviews);
  } catch (err) {
    console.error("GET reviews error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/events/:id/reviews
router.post("/:id/reviews", protect, async (req, res) => {
  const { rating, comment } = req.body;
  const userId = req.user._id.toString();

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be 1–5" });
  }

  try {
    const { event } = await findEventById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const eventDate = event.startDateTime || event.endDateTime || event.startDate;
    if (!eventDate || isNaN(new Date(eventDate).getTime())) {
      return res.status(400).json({ error: "Event date is invalid or missing" });
    }
    if (new Date(eventDate) >= new Date()) {
      return res.status(403).json({ error: "You can only review past events" });
    }

    // Prevent duplicate review
    if (event.reviews?.some(r => r.userId?.toString() === userId)) {
      return res.status(400).json({ error: "You already reviewed this event" });
    }

    // Check if user is allowed to review
    const isBazaar = event.type === "bazaar";
    const isBooth = event.__t === "BoothApplication" || !!event.platformSlot;

    if (!isBazaar && !isBooth) {
      const attendees = [
        ...(event.registeredUsers || []),
        ...(event.registrations?.map(r => r.userId || r.email) || []),
        ...(event.attendees || []),
      ];
      if (!attendees.some(id => id && id.toString() === userId)) {
        return res.status(403).json({ error: "You must have attended or registered to review" });
      }
    }

    // Initialize reviews array if missing
    if (!Array.isArray(event.reviews)) event.set("reviews", []);

    // Get user name
    const user = await User.findById(userId).select("name");

    // Push review
    event.reviews.push({
      userId: userId,
      userName: user?.name || "Student",
      rating: Number(rating),
      comment: comment?.trim() || null,
      createdAt: new Date(),
    });

    event.markModified("reviews");

    // SAVE without validating other fields (prevents Bazaar registration errors)
    await event.save({ validateBeforeSave: false });

    const sorted = event.reviews
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(201).json(sorted);

  } catch (err) {
    console.error("POST review error:", err);
    res.status(500).json({ error: "Server error — check logs" });
  }
});

module.exports = router;
