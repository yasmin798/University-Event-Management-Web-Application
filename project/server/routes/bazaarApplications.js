// server/routes/bazaarApplications.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const BazaarApplication = require("../models/BazaarApplication");
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

// CREATE BAZAAR APPLICATION
// Expects multipart/form-data with `attendees` (JSON string) and `idFiles` array of files
router.post("/", upload.array("idFiles", 5), async (req, res) => {
  try {
    // attendees may be sent as JSON string in multipart requests
    const { bazaar, boothSize } = req.body;
    let attendees = req.body.attendees;
    if (typeof attendees === "string") {
      try {
        attendees = JSON.parse(attendees);
      } catch (e) {
        return res.status(400).json({ error: "Invalid attendees JSON" });
      }
    }

    const files = req.files || [];

    // === VALIDATE INPUT ===
    if (!bazaar) {
      return res.status(400).json({ error: "bazaar is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(bazaar)) {
      return res.status(400).json({ error: "invalid bazaar id" });
    }

    if (!Array.isArray(attendees) || attendees.length < 1 || attendees.length > 5) {
      return res.status(400).json({ error: "attendees must be array of 1-5" });
    }

    // Require an ID file for each attendee (vendors must upload IDs for entire duration)
    if (files.length !== attendees.length) {
      return res.status(400).json({ error: "An ID file must be uploaded for every attendee (field name 'idFiles')." });
    }

    if (!["2x2", "4x4"].includes(boothSize)) {
      return res.status(400).json({ error: "invalid boothSize" });
    }

    // Validate every attendee has name & valid email
    for (let i = 0; i < attendees.length; i++) {
      const a = attendees[i];
      if (!a.name || !a.name.trim()) {
        return res.status(400).json({ error: `Attendee ${i + 1}: name is required` });
      }
      if (!a.email || !a.email.trim()) {
        return res.status(400).json({ error: `Attendee ${i + 1}: email is required` });
      }
      if (!/^\S+@\S+\.\S+$/.test(a.email.trim())) {
        return res.status(400).json({ error: `Attendee ${i + 1}: invalid email format` });
      }
      // Ensure corresponding file exists
      const file = files[i];
      if (!file) {
        return res.status(400).json({ error: `Missing ID file for attendee ${i + 1}` });
      }
      // Attach file path to attendee object
      a.idDocument = `/uploads/ids/${path.basename(file.path)}`;
      a.attendingEntireDuration = true;
    }

    // === CHECK BAZAAR EXISTS ===
    const baz = await Bazaar.findById(bazaar);
    if (!baz) {
      return res.status(404).json({ error: "Bazaar not found" });
    }

    // === SAVE APPLICATION ===
    const appDoc = new BazaarApplication({
      bazaar,
      attendees: attendees.map(a => ({
        userId: a.userId || null,
        name: a.name.trim(),
        email: a.email.trim(),
        idDocument: a.idDocument,
        attendingEntireDuration: !!a.attendingEntireDuration,
      })),
      boothSize,
    });
    const savedApp = await appDoc.save();

    // === PUSH TO BAZAAR.REGISTRATIONS ===
    const now = new Date();
    const newRegs = attendees.map(a => ({
      userId: a.userId || null,
      name: a.name.trim(),
      email: a.email.trim(),
      registeredAt: now,
    }));

    const existingEmails = new Set(
      (baz.registrations || []).map(r => String(r.email).toLowerCase())
    );

    const toPush = newRegs.filter(r => 
      r.email && !existingEmails.has(String(r.email).toLowerCase())
    );

    if (toPush.length > 0) {
      await Bazaar.findByIdAndUpdate(
        bazaar,
        { $push: { registrations: { $each: toPush } } },
        { new: true }
      );
    }

    // Return updated bazaar
    const updatedBazaar = await Bazaar.findById(bazaar);

    // Notify Events Office users about new pending vendor application
    try {
      const eventsOfficeUsers = await User.find({ role: "events_office", status: "active" }).select("_id email");
      const notifPromises = eventsOfficeUsers.map(u => {
        const n = new Notification({
          userId: u._id,
          message: `New vendor application pending for bazaar '${baz.title || updatedBazaar.title || bazaar}'. Application ID: ${savedApp._id}`,
          type: 'vendor_application'
        });
        return n.save();
      });
      await Promise.all(notifPromises);
    } catch (nerr) {
      console.error("Failed to create notifications for events office:", nerr);
    }
    return res.status(201).json({
      success: true,
      application: savedApp,
      bazaar: updatedBazaar,
    });
  } catch (err) {
    console.error("POST /api/bazaar-applications error:", err);
    return res.status(500).json({ error: "Server error creating application" });
  }
});

// GET ALL BAZAAR APPLICATIONS (Admin)
router.get("/", async (req, res) => {
  try {
    const list = await BazaarApplication.find().populate("bazaar", "title location startDateTime");
    res.json(list);
  } catch (err) {
    console.error("GET /api/bazaar-applications error:", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// GET APPLICATIONS FOR A SPECIFIC BAZAAR
router.get("/:bazaarId", async (req, res) => {
  try {
    const { bazaarId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bazaarId)) {
      return res.status(400).json({ error: "invalid bazaar id" });
    }

    const applications = await BazaarApplication.find({ bazaar: bazaarId })
      .populate("bazaar", "title location startDateTime")
      .sort({ createdAt: -1 });

    res.status(200).json({ requests: applications });
  } catch (err) {
    console.error("Error fetching bazaar applications:", err);
    res.status(500).json({ error: "Failed to fetch applications for this bazaar" });
  }
});

module.exports = router;