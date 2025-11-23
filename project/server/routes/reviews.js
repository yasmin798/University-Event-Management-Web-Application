// server/routes/reviews.js
// FINAL VERSION — Conferences are now open for public reviews (like Bazaars)
// Workshops & Trips still require registration

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");

// Event Models
const Workshop         = require("../models/Workshop");
const Trip             = require("../models/Trips");
const Conference       = require("../models/Conference");
const Bazaar           = require("../models/Bazaar");
const BoothApplication = require("../models/BoothApplication");

// Helper: Find event by ID across all collections
const findEventById = async (id) => {
  const models = [Workshop, Trip, Conference, Bazaar, BoothApplication];
  for (const Model of models) {
    const doc = await Model.findById(id);
    if (doc) return { event: doc, Model };
  }
  return { event: null, Model: null };
};

// GET /api/events/:id/reviews — Get all reviews
router.get("/:id/reviews", async (req, res) => {
  try {
    const { event } = await findEventById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const reviews = (event.reviews || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(reviews);
  } catch (err) {
    console.error("GET reviews error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/events/:id/reviews — Submit review
router.post("/:id/reviews", protect, async (req, res) => {
  const { rating, comment } = req.body;
  const userId = req.user._id.toString();

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  try {
    const { event } = await findEventById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Check if event has ended (use endDateTime if exists, otherwise startDateTime)
    const eventEndDate = event.endDateTime || event.endDate || event.startDateTime || event.startDate;
    if (!eventEndDate || new Date(eventEndDate) >= new Date()) {
      return res.status(403).json({ error: "You can only review events that have ended" });
    }

    // Prevent duplicate reviews
    if (event.reviews?.some(r => r.userId?.toString() === userId)) {
      return res.status(400).json({ error: "You have already reviewed this event" });
    }

    // EVENTS THAT ALLOW ANYONE TO REVIEW AFTER ENDING
    const isOpenToPublicReview =
      event.type === "bazaar" ||
      event.__t === "BoothApplication" ||
      !!event.platformSlot ||
      event.type === "conference" ||
      event.type?.toLowerCase() === "conference";

    // Only require registration for Workshops & Trips
    if (!isOpenToPublicReview) {
      const attendees = [
        ...(event.registeredUsers || []),
        ...(event.registrations?.map(r => r.userId || r.email) || []),
        ...(event.attendees || []),
      ];
      const hasRegistered = attendees.some(id => id && id.toString() === userId);
      if (!hasRegistered) {
        return res.status(403).json({ error: "You must have registered to review this event" });
      }
    }

    // Use authenticated user's name + role badge
    let displayName = req.user.name || req.user.email?.split("@")[0] || "User";
    if (req.user.role === "staff") displayName = `${displayName} (Staff)`;
    else if (req.user.role === "ta") displayName = `${displayName} (TA)`;
    else if (req.user.role === "admin") displayName = `${displayName} (Admin)`;

    // Ensure reviews array exists
    if (!Array.isArray(event.reviews)) {
      event.reviews = [];
    }

    // Add the review
    event.reviews.push({
      userId,
      userName: displayName,
      rating: Number(rating),
      comment: comment?.trim() || null,
      createdAt: new Date(),
    });

    event.markModified("reviews");
    await event.save({ validateBeforeSave: false });

    // Return sorted reviews (newest first)
    const sortedReviews = event.reviews
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(201).json(sortedReviews);

  } catch (err) {
    console.error("POST review error:", err.message);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

module.exports = router;