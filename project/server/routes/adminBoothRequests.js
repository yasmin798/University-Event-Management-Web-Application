const express = require("express");
const router = express.Router();
const BazaarBoothApplication = require("../models/BoothApplication"); // change to your model filename
// or if you used BazaarVendorRequest for booths, require that
const Notification = require("../models/Notification");
const User = require("../models/User");

// PATCH /api/admin/booth-vendor-requests/:id
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status)
      return res.status(400).json({ error: "status is required" });

    const s = String(status).toLowerCase();
    if (!["pending", "accepted", "rejected"].includes(s)) {
      return res.status(400).json({
        error: "invalid status - must be 'pending', 'accepted' or 'rejected'"
      });
    }

    const appDoc = await BazaarBoothApplication.findById(id);
    if (!appDoc)
      return res.status(404).json({ error: "Booth application not found" });

    // Update application status
    appDoc.status = s;
    await appDoc.save();

    // ======================================================
            // 🔔 SEND NOTIFICATION TO ALL USERS ONLY IF ACCEPTED
            // ======================================================
            if (s === "accepted") {
      const users = await User.find({}, "_id");
    
      const boothTitle =
        doc.boothTitle ||
        (doc.attendees?.length > 0 && doc.attendees[0].name
          ? `by ${doc.attendees[0].name}`
          : `Booth at platform ${doc.platformSlot}`);
    
      const notifications = users.map((u) => ({
        userId: u._id,
        message: `A new booth has been opened: ${boothTitle}`,
        type: "booth_announcement",
        boothId: doc._id,
        unread: true,
      }));
    
      await Notification.insertMany(notifications);
    }
    
            // ======================================================

    return res.json({ success: true, application: appDoc });
  } catch (err) {
    console.error("PATCH /api/booth-applications/:id error:", err);
    return res.status(500).json({ error: "Server error updating application" });
  }
});


module.exports = router;
