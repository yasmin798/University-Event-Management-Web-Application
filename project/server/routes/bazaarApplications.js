const express = require("express");
const router = express.Router();
const BazaarApplication = require("../models/BazaarApplication");
const Bazaar = require("../models/Bazaar");

router.post("/", async (req, res) => {
  try {
    console.log("POST /api/bazaar-applications body:", JSON.stringify(req.body));
    const { bazaar, attendees, boothSize } = req.body;

    if (!bazaar) return res.status(400).json({ message: "bazaar is required" });
    const found = await Bazaar.findById(bazaar);
    if (!found) return res.status(404).json({ message: "Bazaar not found" });

    if (!Array.isArray(attendees) || attendees.length < 1 || attendees.length > 5)
      return res.status(400).json({ message: "attendees must be array of 1-5" });

    if (!["2x2","4x4"].includes(boothSize))
      return res.status(400).json({ message: "invalid boothSize" });

    const appDoc = new BazaarApplication({ bazaar, attendees, boothSize });
    const saved = await appDoc.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error("Error saving application:", err);
    return res.status(500).json({ message: err.message || "server error" });
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