// server/routes/eventRoutes.js
const express = require("express");
const Bazaar = require("../models/Bazaar");
const Trip = require("../models/Trips");

const router = express.Router();

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
      // 👇 force dates & numbers into the right types
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

  // accept either name or title from UI
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
  });

  res.status(201).json(doc);
});

// Update trip
router.put("/trips/:id", async (req, res) => {
  const updates = { ...req.body };
  // (Optional) also allow name -> title on update
  if (updates.name && !updates.title) updates.title = updates.name;

  const doc = await Trip.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!doc) return res.status(404).json({ error: "Trip not found" });
  res.json(doc);
});

module.exports = router;
