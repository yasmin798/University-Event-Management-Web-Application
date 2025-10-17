const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// 🟩 GET user's notifications
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('workshopId', 'workshopName');
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// 🟩 POST mark all as read
router.post('/mark-read', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, unread: true },
      { unread: false }
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// 🟩 POST create new notification (e.g., student requests edits)
router.post('/', protect, async (req, res) => {
  try {
    const { message, workshopId, receiverRole } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Find all professors if receiverRole = "professor"
    let recipients = [];
    if (receiverRole === "professor") {
      recipients = await User.find({ role: "professor" }).select("_id");
    } else {
      recipients = [{ _id: req.user.id }]; // fallback to self
    }

    // Create a notification for each recipient
    const notifications = recipients.map(recipient => ({
      userId: recipient._id,
      message,
      workshopId,
      type: "edit_request"
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({ success: true, count: notifications.length });
  } catch (err) {
    console.error("Error creating notification:", err);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

module.exports = router;
