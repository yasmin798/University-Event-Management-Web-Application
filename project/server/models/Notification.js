const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'general'
  },
  workshopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  unread: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);