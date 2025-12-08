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
const mongoose = require("mongoose");

// Current user profile
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      id: user._id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      role: user.role || "",
      roleSpecificId: user.roleSpecificId || "",
    });
  } catch (err) {
    console.error("/me error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});
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
      $pull: { favorites: req.params.eventId },
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
            return {
              ...doc,
              _id: doc._id.toString(),
              type: Model.modelName.toUpperCase(),
            };
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
    const userIdObj = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;
    const now = new Date();

    // Pull from each collection (adjust field names if different)
    const [trips, bazaars, workshops, conferences, booths] = await Promise.all([
      Trip.find({ registeredUsers: userId }),
      // Bazaars store visitor registrations in `registrations` (not registeredUsers)
      // Match registrations.userId by string or ObjectId depending on schema
      Bazaar.find({
        $or: [
          { "registrations.userId": userId },
          ...(userIdObj ? [{ "registrations.userId": userIdObj }] : []),
        ],
      }),
      Workshop.find({ registeredUsers: userId }),

      // Conferences also use `registrations` to record signups
      Conference.find({
        $or: [
          { "registrations.userId": userId },
          ...(userIdObj ? [{ "registrations.userId": userIdObj }] : []),
        ],
      }),
      // For booths, some documents store visitor registration in `registeredUsers`
      // while others use the new `registrations` array. Query both paths.
      BoothApplication.find({
        $or: [
          { registeredUsers: userId },
          ...(userIdObj ? [{ registeredUsers: userIdObj }] : []),
          { "registrations.userId": userId },
          ...(userIdObj ? [{ "registrations.userId": userIdObj }] : []),
        ],
      }),
    ]);

    // normalize shape expected by the frontend (optional but nice)
    const mapEvent = (doc, type) => {
      // Choose sensible fallbacks for start/end dates so events without
      // explicit scheduling (e.g., booth applications) still appear in lists.
      const fallbackStart =
        doc.startDateTime ||
        doc.startDate ||
        doc.date ||
        doc.createdAt ||
        new Date().toISOString();
      const fallbackEnd = doc.endDateTime || doc.endDate || fallbackStart;
      let calculatedPrice = 0;

      // SPECIAL CASE: WORKSHOPS — price is calculated
      if (type === "workshop") {
        const budget = Number(doc.requiredBudget || 0);
        const capacity = Number(doc.capacity || 1); // avoid division by zero
        calculatedPrice =
          capacity > 0 ? Math.round(budget / capacity + 100) : 0;
      } else {
        // All other events (trips, bazaars, etc.) use normal price field
        calculatedPrice = Number(doc.price || 0);
      }
      // Prefer attendee names for booths when available
      let title =
        doc.title ||
        doc.name ||
        doc.workshopName ||
        doc.boothTitle ||
        "Untitled";
      if ((type || "").toString().toLowerCase() === "booth") {
        try {
          const atts = doc.attendees || doc.registrations || [];
          const names = Array.isArray(atts)
            ? atts
                .map((a) => {
                  if (!a) return null;
                  if (typeof a === "string") return a;
                  return a.name || a.fullName || a.userName || a.email || null;
                })
                .filter(Boolean)
            : [];
          if (names.length > 0) title = names.join(", ");
        } catch (e) {
          // ignore and use fallback title
        }
      }

      return {
        _id: doc._id?.toString(),
        title,
        type,
        location: doc.location || doc.venue || "TBD",
        startDateTime: fallbackStart,
        endDateTime: fallbackEnd,
        price: calculatedPrice, // ← forces price to be a number
        paidUsers: doc.paidUsers || [], // ← includes paid users array
        professorsParticipating:
          doc.professorsParticipating || doc.facultyResponsible || "",
      };
    };

    // Log counts for debugging — helps confirm which collections matched
    console.log(
      `registered-events: user=${userId} trips=${trips.length} bazaars=${bazaars.length} workshops=${workshops.length} conferences=${conferences.length} booths=${booths.length}`
    );

    const all = [
      ...trips.map((d) => mapEvent(d, "trip")),
      ...bazaars.map((d) => mapEvent(d, "bazaar")),
      ...workshops.map((d) => mapEvent(d, "workshop")),
      ...conferences.map((d) => mapEvent(d, "conference")),
      ...booths.map((d) => mapEvent(d, "booth")),
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

// Temporary debug route: return raw matching documents per collection
// Use this to inspect exactly which collections contain registrations for the current user.
router.get("/me/registered-raw", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const mongoose = require("mongoose");
    const userIdObj = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const [trips, bazaars, workshops, conferences, booths] = await Promise.all([
      Trip.find({
        $or: [
          { registeredUsers: userId },
          ...(userIdObj ? [{ registeredUsers: userIdObj }] : []),
        ],
      }).lean(),
      Bazaar.find({
        $or: [
          { "registrations.userId": userId },
          ...(userIdObj ? [{ "registrations.userId": userIdObj }] : []),
        ],
      }).lean(),
      Workshop.find({
        $or: [
          { registeredUsers: userId },
          ...(userIdObj ? [{ registeredUsers: userIdObj }] : []),
        ],
      }).lean(),
      Conference.find({
        $or: [
          { "registrations.userId": userId },
          ...(userIdObj ? [{ "registrations.userId": userIdObj }] : []),
        ],
      }).lean(),
      BoothApplication.find({
        $or: [
          { registeredUsers: userId },
          ...(userIdObj ? [{ registeredUsers: userIdObj }] : []),
          { "registrations.userId": userId },
          ...(userIdObj ? [{ "registrations.userId": userIdObj }] : []),
        ],
      }).lean(),
    ]);

    return res.json({
      counts: {
        trips: trips.length,
        bazaars: bazaars.length,
        workshops: workshops.length,
        conferences: conferences.length,
        booths: booths.length,
      },
      trips,
      bazaars,
      workshops,
      conferences,
      booths,
    });
  } catch (err) {
    console.error("registered-raw error:", err);
    res.status(500).json({ error: "Failed to fetch raw registered documents" });
  }
});
