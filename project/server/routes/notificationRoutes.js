const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { protect } = require("../middleware/auth");
const User = require("../models/User");


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



// POST: Create a notification for any event type
router.post("/create", protect, async (req, res) => {
  try {
    const { userId, message, type, eventType, eventId } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: "userId and message are required" });
    }

    // Allowed event types
    const validTypes = ["workshop", "bazaar", "booth", "trip", "conference", "general"];

    if (eventType && !validTypes.includes(eventType)) {
      return res.status(400).json({ error: "Invalid eventType provided" });
    }

    // Build notification data dynamically
    const notifData = {
      userId,
      message,
      type: type || "general",
      unread: true,
    };

    // Map eventId to specific field
    if (eventType === "workshop") notifData.workshopId = eventId;
    if (eventType === "bazaar") notifData.bazaarId = eventId;
    if (eventType === "booth") notifData.boothId = eventId;
    if (eventType === "trip") notifData.tripId = eventId;
    if (eventType === "conference") notifData.conferenceId = eventId;

    const notification = new Notification(notifData);
    await notification.save();

    return res.status(201).json({
      success: true,
      notification,
    });

  } catch (error) {
    console.error("Error creating notification:", error);
    return res.status(500).json({ error: "Server error creating notification" });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 }); // newest first

    res.status(200).json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Failed to load notifications" });
  }
});

// TEMP: Create a test notification
router.post("/test", async (req, res) => {
  try {
    const notification = await Notification.create({
      userId: req.body.userId,
      message: req.body.message,
      type: "test"
    });

    res.status(201).json({
      success: true,
      notification
    });
  } catch (err) {
    console.error("TEST notification failed:", err);
    res.status(500).json({ error: err.message });
  }
});





module.exports = router;
