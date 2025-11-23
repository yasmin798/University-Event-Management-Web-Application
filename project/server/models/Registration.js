const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  workshopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['confirmed', 'waitlisted', 'cancelled'],
    default: 'confirmed',
  },
  // Optional: Extra fields like payment status, notes
  notes: { type: String },
}, {
  timestamps: true, // Auto-adds createdAt/updatedAt
});

// Index for fast queries
registrationSchema.index({ workshopId: 1, userId: 1 }); // Unique per user/workshop
registrationSchema.index({ workshopId: 1 }); // Quick count by workshop

module.exports = mongoose.model('Registration', registrationSchema);