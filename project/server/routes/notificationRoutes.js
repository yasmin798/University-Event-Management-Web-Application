const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { protect } = require("../middleware/auth");

// 📩 GET all notifications for the logged-in user
router.get("/", protect, async (req, res) => {
  try {
    console.log("📨 Fetching notifications for user:", req.user._id);

    const notifications = await Notification.find({ userId: req.user._id })
      .populate("workshopId", "workshopName")
      .sort({ createdAt: -1 });

    if (!notifications.length) {
      console.log("⚠️ No notifications found for this user");
    }

    res.status(200).json(notifications);
  } catch (err) {
    console.error("❌ Error fetching notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// 🆕 POST create new notification (optional for testing)
router.post("/", protect, async (req, res) => {
  try {
    const { message, type, workshopId, receiverId } = req.body;

    if (!message || !receiverId) {
      return res.status(400).json({ error: "Message and receiverId required" });
    }

    const newNotification = new Notification({
      userId: receiverId, // the receiver of the notification
      message,
      type: type || "general",
      workshopId: workshopId || null,
    });

    await newNotification.save();
    console.log("✅ Notification saved:", newNotification);
    res.status(201).json(newNotification);
  } catch (err) {
    console.error("❌ Error creating notification:", err);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

// ✅ PATCH mark as read
router.patch("/:id/read", protect, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { unread: false },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(notification);
  } catch (err) {
    console.error("❌ Error marking notification as read:", err);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

module.exports = router;
