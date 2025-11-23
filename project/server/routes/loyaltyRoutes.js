const express = require("express");
const router = express.Router();
const LoyaltyApplication = require("../models/LoyaltyApplication");
const { protect, adminOnly } = require("../middleware/auth");

// Vendor submits a new loyalty application
router.post("/apply", protect, async (req, res) => {
  const { companyName, discountRate, promoCode, termsAndConditions } = req.body;

  if (!companyName || !discountRate || !promoCode || !termsAndConditions) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const application = await LoyaltyApplication.create({
      companyName,
      discountRate,
      promoCode,
      termsAndConditions,
      vendor: req.user.id, // assuming your token gives user id
    });

    res.status(201).json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


// Admin views all applications
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const apps = await LoyaltyApplication.find().populate("vendor", "companyName email");
    res.json(apps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching applications" });
  }
});

// Admin approves/rejects
router.patch("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body; // accepted or rejected
    if (!["accepted", "rejected"].includes(status))
      return res.status(400).json({ error: "Invalid status" });

    const app = await LoyaltyApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ error: "Application not found" });

    app.status = status;
    app.approvedBy = req.user.id;
    app.approvalDate = new Date();
    await app.save();

    res.json({ success: true, application: app });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating application" });
  }
});

// Public: list all approved vendors
router.get("/approved", async (_req, res) => {
  try {
    const apps = await LoyaltyApplication.find({ status: "accepted" }).populate(
      "vendor",
      "companyName"
    );
    res.json(apps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching approved vendors" });
  }
});

module.exports = router;
