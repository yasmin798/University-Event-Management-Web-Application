// server/routes/reviews.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const User = require("../models/User");

const Workshop         = require("../models/Workshop");
const Trip             = require("../models/Trips");
const Conference       = require("../models/Conference");
const Bazaar           = require("../models/Bazaar");
const BoothApplication = require("../models/BoothApplication");

const findEventById = async (id) => {
  const models = [Workshop, Trip, Conference, Bazaar, BoothApplication];
  for (const Model of models) {
    const doc = await Model.findById(id);
    if (doc) return { event: doc, Model };
  }
  return { event: null, Model: null };
};

// GET reviews
router.get("/:id/reviews", async (req, res) => {
  try {
    const { event } = await findEventById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const reviews = (event.reviews || [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(reviews);
  } catch (err) {
    console.error("Get reviews error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST review — NOW BAZAARS & BOOTHS CAN BE REVIEWED BY ANYONE
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
    const hasPassed = new Date(eventDate) < new Date();

    if (!hasPassed) {
      return res.status(403).json({ error: "You can only review past events" });
    }

    // Prevent duplicate reviews
    const alreadyReviewed = event.reviews?.some(r => r.userId.toString() === userId);
    if (alreadyReviewed) {
      return res.status(400).json({ error: "You have already reviewed this event" });
    }

    // SPECIAL RULE: Bazaars & Booths → anyone can review
    const isBazaar = event.type === "bazaar" || event.collection?.collectionName === "bazaars";
    const isBooth = event.__t === "BoothApplication" || event.platformSlot; // BoothApplication has platformSlot

    let hasAttended = true; // default allow

    if (!isBazaar && !isBooth) {
      // Only check registration for Workshops, Trips, Conferences
      let attendees = [];
      if (event.registeredUsers) attendees.push(...event.registeredUsers);
      if (event.registrations) attendees.push(...event.registrations.map(r => r.userId || r.email));
      if (event.attendees) attendees.push(...event.attendees);

      hasAttended = attendees.some(id => id && id.toString() === userId);
      if (!hasAttended) {
        return res.status(403).json({ error: "You must have registered to review this event" });
      }
    }

    // Get user's name
    const user = await User.findById(userId).select("name");
    const userName = user?.name || "Student";

    // Add the review
    event.reviews.push({
      userId,
      userName,
      rating: Number(rating),
      comment: comment?.trim() || null,
    });

    await event.save();

    const sorted = event.reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted);
  } catch (err) {
    console.error("Submit review error:", err);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// GET attendees (optional — used by frontend)
router.get("/:id/attendees", protect, async (req, res) => {
  try {
    const { event } = await findEventById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    let attendees = [];
    if (event.registeredUsers) attendees.push(...event.registeredUsers);
    if (event.registrations) attendees.push(...event.registrations.map(r => r.userId || r.email));
    if (event.attendees) attendees.push(...event.attendees);

    res.json(attendees);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;