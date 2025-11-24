// server/routes/reviews.js
// FINAL VERSION — Conferences are now open for public reviews (like Bazaars)
// Workshops & Trips still require registration

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const nodemailer = require("nodemailer"); // Ensure: cd server && npm i nodemailer

// Event Models
const Workshop         = require("../models/Workshop");
const Trip             = require("../models/Trips");
const Conference       = require("../models/Conference");
const Bazaar           = require("../models/Bazaar");
const BoothApplication = require("../models/BoothApplication");
const User             = require("../models/User");

// Email transporter setup (configure with your SMTP details; e.g., Gmail, SendGrid)
const transporter = nodemailer.createTransport({  // ✅ Fixed: createTransport (no 'er')
  service: 'gmail', // Or 'SendGrid', etc.
  auth: {
    user: process.env.EMAIL_USER, // Set in .env: EMAIL_USER=your@gmail.com
    pass: process.env.EMAIL_PASS, // Set in .env: EMAIL_PASS=your-app-password
  },
});

// Helper: Find event by ID across all collections
const findEventById = async (id) => {
  const models = [Workshop, Trip, Conference, Bazaar, BoothApplication];
  for (const Model of models) {
    const doc = await Model.findById(id);
    if (doc) return { event: doc, Model };
  }
  return { event: null, Model: null };
};

// Helper: Send warning email
const sendWarningEmail = async (to, userName, eventTitle, commentSnippet) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Review Deleted - Action Required",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">Warning: Your Review Has Been Removed</h2>
        <p>Hi ${userName},</p>
        <p>Your review on <strong>${eventTitle}</strong> has been deleted by an admin.</p>
        <p>Details: ${commentSnippet}</p>
        <p>This may be due to guideline violations. Please review our community standards before posting again.</p>
        <p>Best,<br><strong>Eventity Admin Team</strong></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">This is an automated message. Please do not reply.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Warning email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("Failed to send warning email:", error);
    return false;
  }
};

// GET /api/events/:id/reviews — Get all reviews
router.get("/:id/reviews", async (req, res) => {
  try {
    const { event } = await findEventById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const reviews = (event.reviews || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(reviews);
  } catch (err) {
    console.error("GET reviews error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/events/:id/reviews — Submit review
router.post("/:id/reviews", protect, async (req, res) => {
  const { rating, comment } = req.body;
  const userId = req.user._id.toString();

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  try {
    const { event } = await findEventById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Check if event has ended (use endDateTime if exists, otherwise startDateTime)
    const eventEndDate = event.endDateTime || event.endDate || event.startDateTime || event.startDate;
    if (!eventEndDate || new Date(eventEndDate) >= new Date()) {
      return res.status(403).json({ error: "You can only review events that have ended" });
    }

    // Prevent duplicate reviews
    if (event.reviews?.some(r => r.userId?.toString() === userId)) {
      return res.status(400).json({ error: "You have already reviewed this event" });
    }

    // EVENTS THAT ALLOW ANYONE TO REVIEW AFTER ENDING
    const isOpenToPublicReview =
      event.type === "bazaar" ||
      event.__t === "BoothApplication" ||
      !!event.platformSlot ||
      event.type === "conference" ||
      event.type?.toLowerCase() === "conference";

    // Only require registration for Workshops & Trips
    if (!isOpenToPublicReview) {
      const attendees = [
        ...(event.registeredUsers || []),
        ...(event.registrations?.map(r => r.userId || r.email) || []),
        ...(event.attendees || []),
      ];
      const hasRegistered = attendees.some(id => id && id.toString() === userId);
      if (!hasRegistered) {
        return res.status(403).json({ error: "You must have registered to review this event" });
      }
    }

    // Use authenticated user's name + role badge
    let displayName = req.user.name || req.user.email?.split("@")[0] || "User";
    if (req.user.role === "staff") displayName = `${displayName} (Staff)`;
    else if (req.user.role === "ta") displayName = `${displayName} (TA)`;
    else if (req.user.role === "admin") displayName = `${displayName} (Admin)`;

    // Ensure reviews array exists
    if (!Array.isArray(event.reviews)) {
      event.reviews = [];
    }

    // Add the review
    event.reviews.push({
      userId,
      userName: displayName,
      rating: Number(rating),
      comment: comment?.trim() || null,
      createdAt: new Date(),
    });

    event.markModified("reviews");
    await event.save({ validateBeforeSave: false });

    // Return sorted reviews (newest first)
    const sortedReviews = event.reviews
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(201).json(sortedReviews);

  } catch (err) {
    console.error("POST review error:", err.message);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// DELETE /api/events/:id/reviews/:userId — Admin only: Delete review and send warning email
router.delete("/:id/reviews/:userId", protect, async (req, res) => {
  // Admin check
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { id: eventId, userId } = req.params;

  try {
    const { event } = await findEventById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Find and remove the review
    const reviewIndex = event.reviews?.findIndex(r => r.userId?.toString() === userId);
    if (reviewIndex === -1) {
      return res.status(404).json({ error: "Review not found" });
    }

    const removedReview = event.reviews[reviewIndex];
    event.reviews.splice(reviewIndex, 1);
    event.markModified("reviews");
    await event.save({ validateBeforeSave: false });

    // Fetch user details for notification
    const user = await User.findById(userId);
    let emailSent = false;
    if (user && user.email) {
      const eventTitle = event.title || event.name || event.workshopName || "this event";
      const commentSnippet = removedReview.comment ? `"${removedReview.comment.substring(0, 100)}..."` : "your rating";
      
      emailSent = await sendWarningEmail(user.email, user.firstName || user.email.split("@")[0], eventTitle, commentSnippet);
    } else {
      console.warn("Could not send email: User email not found");
    }

    // Return updated sorted reviews
    const sortedReviews = (event.reviews || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ 
      message: `Review deleted${emailSent ? ' and warning email sent' : ', but email failed'}.`, 
      reviews: sortedReviews 
    });
  } catch (err) {
    console.error("DELETE review error:", err.message);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

module.exports = router;