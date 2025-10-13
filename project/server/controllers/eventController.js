// server/controllers/eventController.js
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Try to require a model; if missing or misnamed, define a minimal fallback (never crash)
function loadOrDefineModel(modelName, collection) {
  // already compiled?
  if (mongoose.models[modelName]) return mongoose.models[modelName];

  const modelPath = path.join(__dirname, "..", "models", `${modelName}.js`);
  if (fs.existsSync(modelPath)) {
    // If file exists but require fails due to syntax error, surface it clearly
    try {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      return require(`../models/${modelName}`);
    } catch (e) {
      console.error(`⚠️ Failed to load models/${modelName}.js:`, e.message);
      console.error(
        "→ Falling back to dynamic schema so the app can keep running."
      );
    }
  } else {
    console.warn(
      `⚠️ models/${modelName}.js not found. Using a dynamic fallback schema.`
    );
  }

  // Fallback: define a permissive schema so routes work and you can fix the file later
  const DynamicSchema = new mongoose.Schema(
    {
      type: { type: String, default: modelName.toLowerCase() }, // "bazaar" | "trip"
      title: { type: String, required: true, trim: true },
      description: String,
      location: String,
      startDateTime: { type: Date, required: true },
      endDateTime: { type: Date, required: true },
      price: { type: Number, default: 0 },
      capacity: { type: Number, default: 0 },
      organizer: String,
      contactEmail: String,
      status: {
        type: String,
        enum: ["draft", "published", "cancelled"],
        default: "published",
      },
    },
    { timestamps: true, strict: false, collection }
  );

  return mongoose.model(modelName, DynamicSchema);
}

function pickModel(req) {
  // Decide based on route path
  if (req.baseUrl.endsWith("/api") && req.path.startsWith("/bazaars")) {
    return loadOrDefineModel("Bazaar", "bazaars");
  }
  if (req.baseUrl.endsWith("/api") && req.path.startsWith("/trips")) {
    return loadOrDefineModel("Trip", "trips");
  }
  // default (rare)
  return loadOrDefineModel("Bazaar", "bazaars");
}

function buildFilters(q) {
  const f = {};
  if (q.upcoming === "true") f.startDateTime = { $gte: new Date() };
  if (q.past === "true") f.endDateTime = { $lte: new Date() };
  if (q.search) f.$text = { $search: q.search }; // needs a text index to be efficient; safe even without
  return f;
}

exports.list = async (req, res) => {
  try {
    const Model = pickModel(req);
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit || "50", 10))
    );
    const sort = req.query.sort || "startDateTime";
    const filter = buildFilters(req.query);

    const [items, total] = await Promise.all([
      Model.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Model.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error("list error:", e);
    res.status(500).json({ error: e.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const Model = pickModel(req);
    const item = await Model.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const Model = pickModel(req);
    const payload = { ...req.body };
    if (!payload.title)
      return res.status(400).json({ error: "title is required" });
    if (!payload.startDateTime || !payload.endDateTime) {
      return res
        .status(400)
        .json({ error: "startDateTime and endDateTime are required" });
    }
    const created = await Model.create(payload);
    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const Model = pickModel(req);
    const updated = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const Model = pickModel(req);
    const deleted = await Model.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
