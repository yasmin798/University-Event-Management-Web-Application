// server/routes/boothApplications.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const BoothApplication = require("../models/BoothApplication");
const Bazaar = require("../models/Bazaar");
const Notification = require("../models/Notification");
const User = require("../models/User");

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "ids");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (_req, file, cb) {
    const safe = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    cb(null, safe);
  },
});

const upload = multer({ storage });

// Create new booth application
// Expects multipart/form-data with `attendees` (JSON string) and `idFiles` array
router.post("/", upload.array("idFiles", 5), async (req, res) => {
  try {
    const { boothSize, durationWeeks, platformSlot } = req.body;
    let attendees = req.body.attendees;
    if (typeof attendees === "string") {
      try {
        attendees = JSON.parse(attendees);
      } catch (e) {
        return res.status(400).json({ error: "Invalid attendees JSON" });
      }
    }
    const files = req.files || [];

    if (!Array.isArray(attendees) || attendees.length < 1 || attendees.length > 5)
      return res.status(400).json({ error: "attendees must be array of 1-5" });
    if (!["2x2", "4x4"].includes(boothSize))
      return res.status(400).json({ error: "invalid boothSize" });
    if (![1, 2, 3, 4].includes(Number(durationWeeks)))
      return res.status(400).json({ error: "durationWeeks must be 1-4" });
    if (!["B1", "B2", "B3", "B4", "B5"].includes(platformSlot))
      return res.status(400).json({ error: "invalid platformSlot" });

    if (files.length !== attendees.length) {
      return res.status(400).json({ error: "An ID file must be uploaded for every attendee (field name 'idFiles')." });
    }

    // Attach file paths to attendees
    for (let i = 0; i < attendees.length; i++) {
      const a = attendees[i];
      if (!a.name || !a.name.trim()) return res.status(400).json({ error: `Attendee ${i + 1}: name is required` });
      if (!a.email || !a.email.trim()) return res.status(400).json({ error: `Attendee ${i + 1}: email is required` });
      if (!/^\S+@\S+\.\S+$/.test(a.email.trim())) return res.status(400).json({ error: `Attendee ${i + 1}: invalid email format` });
      const file = files[i];
      if (!file) return res.status(400).json({ error: `Missing ID file for attendee ${i + 1}` });
      a.idDocument = `/uploads/ids/${path.basename(file.path)}`;
      a.attendingEntireDuration = true;
    }

    const doc = new BoothApplication({
      attendees: attendees.map(a => ({
        name: a.name.trim(),
        email: a.email.trim(),
        idDocument: a.idDocument,
        attendingEntireDuration: !!a.attendingEntireDuration,
      })),
      boothSize,
      durationWeeks,
      platformSlot,
    });

    const saved = await doc.save();
    res.status(201).json(saved);

    // Notify Events Office and Admin users about new pending booth vendor application
    try {
      const recipients = await User.find({ role: { $in: ["events_office", "admin"] }, status: "active" }).select("_id email role");
      const baz = await Bazaar.findById(doc.bazaar);
      const message = `New booth vendor application pending${baz ? ` for bazaar '${baz.title}'` : ''}. Application ID: ${saved._id}`;
      const notifPromises = recipients.map(u => {
        const n = new Notification({
          userId: u._id,
          message,
          type: 'vendor_application'
        });
        return n.save();
      });
      await Promise.all(notifPromises);
    } catch (nerr) {
      console.error("Failed to create notifications for recipients:", nerr);
    }
  } catch (err) {
    console.error("POST /api/booth-applications error:", err);
    res.status(500).json({ error: "Failed to create booth application" });
  }
});

// Get all booth applications
router.get("/", async (req, res) => {
  try {
    const list = await BoothApplication.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch booth applications" });
  }
});

// Get applications for a bazaar
router.get("/bazaar/:bazaarId", async (req, res) => {
  try {
    const { bazaarId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(bazaarId)) return res.status(400).json({ error: "invalid bazaar id" });
    const list = await BoothApplication.find({ bazaar: bazaarId }).populate("bazaar").sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch booth applications for bazaar" });
  }
});

// Update application status (admin)
router.patch("/:id", /* adminOnly, */ async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "status is required" });
    const s = String(status).toLowerCase();
    if (!["pending","accepted","rejected"].includes(s)) return res.status(400).json({ error: "invalid status" });
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "invalid id" });

    const doc = await BoothApplication.findById(id);
    if (!doc) return res.status(404).json({ error: "Application not found" });

    doc.status = s;
    await doc.save();
    res.json({ success: true, application: doc });
  } catch (err) {
    console.error("PATCH /api/booth-applications/:id error:", err);
    res.status(500).json({ error: "Failed to update application" });
  }
});

// Optionally: delete application
router.delete("/:id", /* adminOnly, */ async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "invalid id" });
    await BoothApplication.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/booth-applications/:id error:", err);
    res.status(500).json({ error: "Failed to delete application" });
  }
});

module.exports = router;
