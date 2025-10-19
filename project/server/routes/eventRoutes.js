// server/routes/eventRoutes.js
const express = require("express");
const Bazaar = require("../models/Bazaar");
const Trip = require("../models/Trips");  // Fixed file name reference
const Conference = require("../models/Conference");
const router = express.Router();
const { register } = require("../controllers/registrationController");
const { protect } = require("../middleware/auth"); // Import protect
const Workshop = require("../models/Workshop"); // import your Workshop model
const BoothApplication = require("../models/BoothApplication");
const boothController = require("../controllers/boothController");
const tripImage = "/trip.jpeg";

// Helper: normalize title so UI can send either "name" or "title"
const normTitle = (b = {}) => b.title || b.name || "";

/* ---------------- BAZAARS ---------------- */

// List bazaars
router.get("/bazaars", async (_req, res) => {
  const items = await Bazaar.find().sort({ startDateTime: 1 });
  res.json({ items, total: items.length, page: 1, pages: 1 });
});

// Get one bazaar
router.get("/bazaars/:id", async (req, res) => {
  const doc = await Bazaar.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(doc);
});


// GET /api/bazaars/upcoming
router.get("/upcoming", async (req, res) => {
  try {
    // Example: find bazaars with start date >= today, sorted ascending
    const now = new Date();
    const bazaars = await Bazaar.find({ startDate: { $gte: now } }).sort({ startDate: 1 }).lean();
    return res.json({ bazaars });
  } catch (err) {
    console.error("Error fetching bazaars:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Create bazaar
router.post("/bazaars", async (req, res) => {
  try {
    const b = req.body || {};

    const title = b.title || b.name || "";
    if (!title) return res.status(400).json({ error: "title is required" });
    if (!b.location)
      return res.status(400).json({ error: "location is required" });
    if (!b.startDateTime || !b.endDateTime) {
      return res
        .status(400)
        .json({ error: "startDateTime and endDateTime are required" });
    }

    const doc = await Bazaar.create({
      type: "bazaar",
      title,
      location: b.location,
      shortDescription: b.shortDescription || "",
      startDateTime: new Date(b.startDateTime),
      endDateTime: new Date(b.endDateTime),
      registrationDeadline: b.registrationDeadline
        ? new Date(b.registrationDeadline)
        : undefined,
      price: b.price != null ? Number(b.price) : 0,
      capacity: b.capacity != null ? Number(b.capacity) : 0,
      status: "published",
    });

    res.status(201).json(doc);
  } catch (e) {
    console.error("Create bazaar error:", e);
    res.status(400).json({ error: e.message });
  }
});

// Update bazaar
router.put("/bazaars/:id", async (req, res) => {
  try {
    const b = req.body || {};
    const updates = {
      ...(b.title || b.name ? { title: b.title || b.name } : {}),
      ...(b.location ? { location: b.location } : {}),
      ...(b.shortDescription !== undefined
        ? { shortDescription: b.shortDescription }
        : {}),
      ...(b.startDateTime ? { startDateTime: new Date(b.startDateTime) } : {}),
      ...(b.endDateTime ? { endDateTime: new Date(b.endDateTime) } : {}),
      ...(b.registrationDeadline
        ? { registrationDeadline: new Date(b.registrationDeadline) }
        : {}),
      ...(b.price != null ? { price: Number(b.price) } : {}),
      ...(b.capacity != null ? { capacity: Number(b.capacity) } : {}),
    };

    const doc = await Bazaar.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (e) {
    console.error("Update bazaar error:", e);
    res.status(400).json({ error: e.message });
  }
});

// Delete bazaar
router.delete("/bazaars/:id", async (req, res) => {
  try {
    const bazaar = await Bazaar.findById(req.params.id);
    if (!bazaar) return res.status(404).json({ error: "Bazaar not found" });

    const hasRegistrations = Array.isArray(bazaar.registrations) && bazaar.registrations.length > 0;
    if (hasRegistrations) {
      return res.status(403).json({ error: "Cannot delete: participants have registered" });
    }

    await Bazaar.findByIdAndDelete(req.params.id);
    res.json({ ok: true, message: "Bazaar deleted successfully" });
  } catch (e) {
    console.error("Delete bazaar error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ---------------- TRIPS ---------------- */

// List trips (paged)
router.get("/trips", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.max(
    1,
    Math.min(100, parseInt(req.query.limit || "50", 10))
  );

  const [items, total] = await Promise.all([
    Trip.find()
      .sort({ startDateTime: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Trip.countDocuments(),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

// Get one trip
router.get("/trips/:id", async (req, res) => {
  const doc = await Trip.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: "Trip not found" });
  res.json(doc);
});

// Create trip
router.post("/trips", async (req, res) => {
  const b = req.body || {};

  const title = normTitle(b);
  if (!title) return res.status(400).json({ error: "title is required" });
  if (!b.location)
    return res.status(400).json({ error: "location is required" });
  if (!b.startDateTime || !b.endDateTime) {
    return res
      .status(400)
      .json({ error: "startDateTime and endDateTime are required" });
  }

  const doc = await Trip.create({
    type: "trip",
    title,
    location: b.location,
    shortDescription: b.shortDescription,
    startDateTime: b.startDateTime,
    endDateTime: b.endDateTime,
    registrationDeadline: b.registrationDeadline,
    price: b.price ?? 0,
    capacity: b.capacity ?? 0,
    image: tripImage,
  });

  res.status(201).json(doc);
});

// Update trip
router.put("/trips/:id", async (req, res) => {
  const updates = { ...req.body };
  if (updates.name && !updates.title) updates.title = updates.name;

  const doc = await Trip.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!doc) return res.status(404).json({ error: "Trip not found" });
  res.json(doc);
});

// Delete trip
router.delete("/trips/:id", async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    const hasRegistrations = Array.isArray(trip.registrations) && trip.registrations.length > 0;
    if (hasRegistrations) {
      return res.status(403).json({ error: "Cannot delete: participants have registered" });
    }

    await Trip.findByIdAndDelete(req.params.id);
    res.json({ ok: true, message: "Trip deleted successfully" });
  } catch (e) {
    console.error("Delete trip error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ---------------- CONFERENCES ---------------- */

// List conferences
router.get("/conferences", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit || "50", 10))
    );

    const [items, total] = await Promise.all([
      Conference.find()
        .sort({ startDateTime: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Conference.countDocuments(),
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error("List conferences error:", e);
    res.status(500).json({ error: e.message });
  }
});

// Get one conference
router.get("/conferences/:id", async (req, res) => {
  try {
    const doc = await Conference.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Conference not found" });
    res.json(doc);
  } catch (e) {
    console.error("Get conference error:", e);
    res.status(400).json({ error: e.message });
  }
});

// Create conference
router.post("/conferences", async (req, res) => {
  try {
    const b = req.body || {};

    const title = normTitle(b);
    if (!title) return res.status(400).json({ error: "title is required" });
    if (!b.startDateTime || !b.endDateTime) {
      return res
        .status(400)
        .json({ error: "startDateTime and endDateTime are required" });
    }
    if (!b.requiredBudget)
      return res.status(400).json({ error: "requiredBudget is required" });
    if (!b.fundingSource)
      return res.status(400).json({ error: "fundingSource is required" });
    if (!b.website)
      return res.status(400).json({ error: "website is required" });

    const doc = await Conference.create({
      type: "conference",
      title,
      name: b.name || title,
      shortDescription: b.shortDescription || "",
      startDateTime: new Date(b.startDateTime),
      endDateTime: new Date(b.endDateTime),
      website: b.website,
      fullAgenda: b.fullAgenda || "",
      requiredBudget: Number(b.requiredBudget),
      fundingSource: b.fundingSource,
      extraResources: b.extraResources || "",
      status: "published",
    });

    res.status(201).json(doc);
  } catch (e) {
    console.error("Create conference error:", e);
    res.status(400).json({ error: e.message });
  }
});

// Update conference
router.put("/conferences/:id", async (req, res) => {
  try {
    const b = req.body || {};
    if (b.website === undefined)
      return res.status(400).json({ error: "website is required" });

    const updates = {
      ...(b.title || b.name ? { title: b.title || b.name, name: b.title || b.name } : {}),
      ...(b.shortDescription !== undefined ? { shortDescription: b.shortDescription } : {}),
      ...(b.startDateTime ? { startDateTime: new Date(b.startDateTime) } : {}),
      ...(b.endDateTime ? { endDateTime: new Date(b.endDateTime) } : {}),
      ...(b.website !== undefined ? { website: b.website } : {}),
      ...(b.fullAgenda !== undefined ? { fullAgenda: b.fullAgenda } : {}),
      ...(b.requiredBudget != null ? { requiredBudget: Number(b.requiredBudget) } : {}),
      ...(b.fundingSource ? { fundingSource: b.fundingSource } : {}),
      ...(b.extraResources !== undefined ? { extraResources: b.extraResources } : {}),
    };

    const doc = await Conference.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ error: "Conference not found" });
    res.json(doc);
  } catch (e) {
    console.error("Update conference error:", e);
    res.status(400).json({ error: e.message });
  }
});

// Delete conference
router.delete("/conferences/:id", async (req, res) => {
  try {
    const conference = await Conference.findById(req.params.id);
    if (!conference) return res.status(404).json({ error: "Conference not found" });

    // Only check registrations (no start time restriction)
    const hasRegistrations = Array.isArray(conference.registrations) && conference.registrations.length > 0;
    if (hasRegistrations) {
      return res.status(403).json({ error: "Cannot delete: participants have registered" });
    }

    await Conference.findByIdAndDelete(req.params.id);
    res.json({ ok: true, message: "Conference deleted successfully" });
  } catch (e) {
    console.error("Delete conference error:", e);
    res.status(500).json({ error: e.message });
  }
});

// Register for any event (generic)
router.post("/events/:eventId/register", protect, register); // protect requires token

// GET /api/events/all
// GET /api/events/all
// GET /api/events/all
router.get("/all", async (req, res) => {
  try {
    // Fetch all event types
    const workshops = await Workshop.find();
    const bazaars = await Bazaar.find();
    const trips = await Trip.find();
    const conferences = await Conference.find();
    const booths = await BoothApplication.find({ status: "accepted" }).sort({ createdAt: -1 });

const normalizedBooths = booths.map((b) => ({
 
  type: "booth",
  title: b.title || `Booth ${b._id}`,
  startDateTime: b.startDateTime || new Date().toISOString(),
  endDateTime: b.endDateTime || new Date().toISOString(),
  description: b.description || "",
  image: b.image || "", 
}));


    const allEvents = [
      ...workshops.map((w) => ({ ...w.toObject(), type: "Workshop" })),
      ...bazaars.map((b) => ({ ...b.toObject(), type: "Bazaar" })),
      ...trips.map((t) => ({ ...t.toObject(), type: "Trip" })),
      ...conferences.map((c) => ({ ...c.toObject(), type: "Conference" })),
      ...normalizedBooths,
    ];

    res.json(allEvents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});





router.get("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    if (!id || !type) return res.status(400).json({ error: "Missing id or type" });

    let event;
    if (type === "workshop") event = await Workshop.findById(id);
    else if (type === "bazaar") event = await Bazaar.findById(id);
    else if (type === "trip") event = await Trip.findById(id);
    else if (type === "conference") event = await Conference.findById(id);
     else if (type === "booth") {
    event = await BoothApplication.findById(id).populate({
        path: "bazaar",
        select: "title startDateTime endDateTime"
    });
}
    else return res.status(400).json({ error: "Invalid event type" });
      if (type === "booth" && event) {
  event = {
    ...event.toObject(),
    type: "Booth",
    title: event.bazaar?.title || event.bazaar?.name || "Booth",
    name: event.bazaar?.title || event.bazaar?.name || "Booth",
    startDateTime: event.bazaar?.startDateTime,
    endDateTime: event.bazaar?.endDateTime,
    description: event.description || event.shortDescription || "",
  };
}
    if (!event) return res.status(404).json({ error: "Event not found" });

    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});
/* ---------------- BOOTHS ---------------- */

// Delete booth
// router.delete("/booths/:id", async (req, res) => {
//   try {
//     const booth = await BoothApplication.findById(req.params.id);

//     if (!booth) return res.status(404).json({ error: "Booth not found" });

   
//     await BoothApplication.findByIdAndDelete(req.params.id);
//     res.json({ ok: true, message: "Booth deleted successfully" });
//   } catch (err) {
//     console.error("Delete booth error:", err);
//     res.status(500).json({ error: "Server error while deleting booth" });
//   }
// });
router.delete("/booths/:id", boothController.deleteBooth);

module.exports = router;