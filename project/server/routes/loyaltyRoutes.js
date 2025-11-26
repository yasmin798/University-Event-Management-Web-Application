const express = require("express");
const router = express.Router();
const LoyaltyApplication = require("../models/LoyaltyApplication");
const { protect, adminOnly } = require("../middleware/auth");

// Vendor submits a new loyalty application
// APPLY for loyalty (vendor)
router.post("/apply", protect, async (req, res) => {
  try {
    const { companyName, discountRate, promoCode, termsAndConditions } = req.body;

    if (!companyName || !discountRate || !promoCode || !termsAndConditions) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const app = await LoyaltyApplication.create({
      vendor: req.user._id,
      companyName,
      discountRate,
      promoCode,
      termsAndConditions,
    });

    res.status(201).json(app);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
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
// Vendor: get my participation

// GET my applications
router.get("/my", protect, async (req, res) => {
  const apps = await LoyaltyApplication.find({ vendor: req.user._id });
  res.json(apps);
});


// // Public: list all approved vendors
// router.get("/approved", async (_req, res) => {
//   try {
//     const apps = await LoyaltyApplication.find({ status: "accepted" }).populate(
//       "vendor",
//       "companyName"
//     );
//     res.json(apps);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error fetching approved vendors" });
//   }
// });
// Vendor: cancel participation
router.delete("/cancel", protect, async (req, res) => {
  try {
    const deleted = await LoyaltyApplication.findOneAndDelete({ vendor: req.user.id });
    if (!deleted) return res.status(404).json({ error: "You are not participating" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;
