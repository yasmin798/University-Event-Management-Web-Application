const express = require("express");
const router = express.Router();
const LoyaltyApplication = require("../models/LoyaltyApplication");
const Notification = require("../models/Notification");
const User = require("../models/User");
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
      status: "accepted", // Auto-approve vendor applications
    });

    res.status(201).json(app);

    // Create notifications for all verified, active students, professors, and staff about the new partner
    // NOTE: Running after response to avoid blocking the vendor
    setImmediate(async () => {
      try {
        console.log("🔔 Starting notification creation for new loyalty partner...");
        
        const recipients = await User.find({ 
          role: { $in: ["student", "professor", "staff", "ta"] }, 
          status: "active", 
          isVerified: true 
        }).select("_id role email");
        
        console.log(`📩 Found ${recipients.length} eligible users for loyalty notification`);
        if (recipients.length > 0) {
          console.log("Users by role:", {
            students: recipients.filter(u => u.role === "student").length,
            professors: recipients.filter(u => u.role === "professor").length,
            staff: recipients.filter(u => u.role === "staff").length,
            ta: recipients.filter(u => u.role === "ta").length
          });
        }
        
        if (recipients.length) {
          const message = `New GUC Loyalty Partner: ${companyName} — ${discountRate}% off. Promo: ${promoCode}`;
          const payloads = recipients.map((u) => ({
            userId: u._id,
            message,
            type: "loyalty",
            unread: true,
          }));
          
          const result = await Notification.insertMany(payloads);
          console.log(`✅ Created ${result.length} loyalty notifications`);
        } else {
          console.log("⚠️ No eligible users found for loyalty notifications");
        }
      } catch (nerr) {
        console.error("❌ Failed to notify users about new loyalty partner:", nerr);
      }
    });
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


// Public: list all approved vendors for students
router.get("/approved", async (req, res) => {
  try {
    const { status } = req.query; // optional: 'accepted' | 'pending' | 'all'
    
    // One-time migration: update any pending applications to accepted
    await LoyaltyApplication.updateMany(
      { status: { $in: ["pending", null, undefined] } },
      { $set: { status: "accepted" } }
    );
    
    const filter =
      status === "all"
        ? { status: { $in: ["accepted", "pending"] } }
        : status === "pending"
        ? { status: "pending" }
        : { status: "accepted" };

    const apps = await LoyaltyApplication.find(filter)
      .select("companyName discountRate promoCode termsAndConditions status")
      .lean();
    res.json(apps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching approved vendors" });
  }
});
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
