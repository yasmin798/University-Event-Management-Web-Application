// routes/userRoutes.js
const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const User = require("../models/User");
const Trip = require("../models/Trips");
const Bazaar = require("../models/Bazaar");
const Workshop = require("../models/Workshop"); // Add more event models as needed

const router = express.Router();

// Admin: View all users with details and status
router.get("/admin/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude password
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// User: View my registered events (upcoming/past)
router.get("/users/me/registered-events", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date(); // Use current date (October 13, 2025, as per prompt)

    // Aggregate from all event types
    const [trips, bazaars, workshops] = await Promise.all([
      Trip.find({ registeredUsers: userId }),
      Bazaar.find({ registeredUsers: userId }),
      Workshop.find({ registeredUsers: userId }),
    ]);

    const allEvents = [...trips, ...bazaars, ...workshops];
    const upcoming = allEvents.filter(e => new Date(e.startDateTime) > now);
    const past = allEvents.filter(e => new Date(e.endDateTime) < now);

    res.json({ upcoming, past });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch registered events" });
  }
});

module.exports = router;