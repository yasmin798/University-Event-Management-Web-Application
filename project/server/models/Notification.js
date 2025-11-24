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

  // === Optional refs for different event types ===
  workshopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop'
  },
  bazaarId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bazaar'
  },
  boothId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BoothApplication'
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  conferenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conference'
  },

  unread: {
    type: Boolean,
    default: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
