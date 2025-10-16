// server/routes/adminBazaarRequests.js
const express = require("express");
const router = express.Router();
const BazaarApplication = require("../models/BazaarApplication");

// PATCH: update vendor request status (accept/reject)
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const validStatuses = ["pending", "accepted", "rejected"];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res
        .status(400)
        .json({ error: "Invalid status. Must be pending, accepted, or rejected." });
    }

    const request = await BazaarApplication.findById(id);
    if (!request) {
      return res.status(404).json({ error: "Vendor request not found" });
    }

    request.status = status.toLowerCase();
    await request.save();

    res.json({
      success: true,
      message: `Request ${status} successfully`,
      request,
    });
  } catch (err) {
    console.error("Error updating vendor request:", err);
    res.status(500).json({ error: "Server error updating vendor request" });
  }
});

module.exports = router;
