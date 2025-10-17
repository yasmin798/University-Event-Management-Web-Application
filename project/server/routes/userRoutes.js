// routes/userRoutes.js
const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const User = require("../models/User");
const Trip = require("../models/Trips");
const Bazaar = require("../models/Bazaar");
const Workshop = require("../models/Workshop");

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
