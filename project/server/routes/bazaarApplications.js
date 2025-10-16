// server/routes/bazaarApplications.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const BazaarApplication = require("../models/BazaarApplication");
const Bazaar = require("../models/Bazaar");

// Create new bazaar application and add attendees into Bazaar.registrations
router.post("/", async (req, res) => {
  try {
    const { bazaar, attendees, boothSize } = req.body;

    // basic validation
    if (!bazaar) return res.status(400).json({ error: "bazaar is required" });
    if (!Array.isArray(attendees) || attendees.length < 1 || attendees.length > 5)
      return res.status(400).json({ error: "attendees must be array of 1-5" });
    if (!["2x2","4x4"].includes(boothSize))
      return res.status(400).json({ error: "invalid boothSize" });

    if (!mongoose.Types.ObjectId.isValid(bazaar)) return res.status(400).json({ error: "invalid bazaar id" });

    // confirm bazaar exists
    const baz = await Bazaar.findById(bazaar);
    if (!baz) return res.status(404).json({ error: "Bazaar not found" });

    // Save application
    const appDoc = new BazaarApplication({ bazaar, attendees, boothSize });
    const savedApp = await appDoc.save();

    // Prepare registration entries to push to bazaar.registrations
    // map attendees => { userId?: null, name?, email, registeredAt: now }
    const now = new Date();
    const newRegs = attendees.map((a) => ({
      userId: a.userId || null,
      name: a.name || "",
      email: a.email,
      registeredAt: now,
    }));

    // Avoid duplicate emails in bazaar.registrations
    const existingEmails = new Set((baz.registrations || []).map((r) => String(r.email).toLowerCase()));

    const toPush = newRegs.filter((r) => r.email && !existingEmails.has(String(r.email).toLowerCase()));

    if (toPush.length > 0) {
      // use $push with $each for atomic update
      await Bazaar.findByIdAndUpdate(
        bazaar,
        { $push: { registrations: { $each: toPush } } },
        { new: true }
      );
    }

    // Return saved application and optionally updated bazaar (fresh copy)
    const updatedBazaar = await Bazaar.findById(bazaar);

    return res.status(201).json({ success: true, application: savedApp, bazaar: updatedBazaar });
  } catch (err) {
    console.error("POST /api/bazaar-applications error:", err);
    return res.status(500).json({ error: "Server error creating application" });
  }
});

router.get("/", async (req, res) => {
  const list = await BazaarApplication.find().populate("bazaar");
  res.json(list);
});

router.get("/:bazaarId", async (req, res) => {
  try {
    const { bazaarId } = req.params;
    const applications = await BazaarApplication.find({ bazaar: bazaarId }).populate("bazaar");

    res.status(200).json({ requests: applications });
  } catch (err) {
    console.error("Error fetching bazaar applications:", err);
    res.status(500).json({ error: "Failed to fetch applications for this bazaar" });
  }
});


module.exports = router;