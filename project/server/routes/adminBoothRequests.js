const express = require("express");
const router = express.Router();
const BazaarBoothApplication = require("../models/BoothApplication"); // change to your model filename
// or if you used BazaarVendorRequest for booths, require that

// PATCH /api/admin/booth-vendor-requests/:id
router.patch("/:id", /* adminOnly, */ async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ error: "status is required" });

    const s = String(status).toLowerCase();
    if (!["pending", "accepted", "rejected"].includes(s)) {
      return res.status(400).json({ error: "invalid status - must be 'pending', 'accepted' or 'rejected'" });
    }

    const appDoc = await BazaarBoothApplication.findById(id);
    if (!appDoc) return res.status(404).json({ error: "Booth application not found" });

    appDoc.status = s;
    await appDoc.save();

    return res.json({ success: true, application: appDoc });
  } catch (err) {
    console.error("PATCH /api/booth-applications/:id error:", err);
    return res.status(500).json({ error: "Server error updating application" });
  }
});

module.exports = router;
