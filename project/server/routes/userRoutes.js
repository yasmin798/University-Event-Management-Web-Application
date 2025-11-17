// routes/userRoutes.js
const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const User = require("../models/User");
const Trip = require("../models/Trips");
const Bazaar = require("../models/Bazaar");
const Workshop = require("../models/Workshop");
const Conference = require("../models/Conference");
const BoothApplication = require("../models/BoothApplication");

const router = express.Router();

// Admin: View all users
router.get("/admin/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
// POST /api/users/me/favorites
router.post("/me/favorites", protect, async (req, res) => {
  try {
    const { eventId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user.favorites.includes(eventId)) {
      user.favorites.push(eventId);
      await user.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// DELETE /api/users/me/favorites/:eventId
router.delete("/me/favorites/:eventId", protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { favorites: req.params.eventId }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET /api/users/me/favorites
router.get("/me/favorites", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    const favorites = user.favorites || [];

    // Fetch full event data
    const events = await Promise.all(
      favorites.map(async (id) => {
        const models = [Workshop, Bazaar, Trip, Conference, BoothApplication];
        for (const Model of models) {
          const doc = await Model.findById(id).lean();
          if (doc) {
            return { ...doc, _id: doc._id.toString(), type: Model.modelName.toUpperCase() };
          }
        }
        return null;
      })
    );

    res.json(events.filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ✅ Correct path (no extra "users")
router.get("/me/registered-events", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Pull from each collection (adjust field names if different)
    const [trips, bazaars, workshops] = await Promise.all([
      Trip.find({ registeredUsers: userId }),
      Bazaar.find({ registeredUsers: userId }),
      Workshop.find({ registeredUsers: userId }),
    ]);

    // normalize shape expected by the frontend (optional but nice)
    const mapEvent = (doc, type) => ({
      _id: doc._id,
      title: doc.title || doc.name || doc.workshopName || "Untitled",
      type,
      location: doc.location || doc.venue || "TBD",
      startDateTime: doc.startDateTime || doc.startDate,
      endDateTime: doc.endDateTime || doc.endDate,
    });

    const all = [
      ...trips.map((d) => mapEvent(d, "trip")),
      ...bazaars.map((d) => mapEvent(d, "bazaar")),
      ...workshops.map((d) => mapEvent(d, "workshop")),
    ];

    const upcoming = all.filter((e) => new Date(e.startDateTime) > now);
    const past = all.filter(
      (e) => new Date(e.endDateTime || e.startDateTime) < now
    );

    res.json({ upcoming, past });
  } catch (err) {
    console.error("registered-events error:", err);
    res.status(500).json({ error: "Failed to fetch registered events" });
  }
});

module.exports = router;
