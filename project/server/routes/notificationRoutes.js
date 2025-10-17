const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth'); // Assuming you have this

// GET user's notifications
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('workshopId', 'workshopName'); // Optional: populate workshop name if needed
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST mark all as read
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

module.exports = router;