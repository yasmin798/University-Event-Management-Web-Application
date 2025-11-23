// routes/gym.js (updated with role restrictions and userId handling)
const express = require("express");
const router = express.Router();
const GymSession = require("../models/GymSession");
const User = require("../models/User"); // ← NEW: For role lookup
const sendEmail = require("../models/Email"); // Assuming this exists; adjust if needed

// GET all sessions (visible to all, no filtering)
router.get("/", async (req, res) => {
  try {
    const sessions = await GymSession.find().sort({ date: 1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch gym sessions" });
  }
});

// POST a new session (now includes allowedRoles)
router.post("/", async (req, res) => {
  try {
    const { date, time, duration, type, maxParticipants, allowedRoles = [] } = req.body;
    const newSession = new GymSession({ 
      date, 
      time, 
      duration, 
      type, 
      maxParticipants,
      allowedRoles // ← NEW: Save restrictions
    });
    const saved = await newSession.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: "Failed to create gym session" });
  }
});

// EDIT SESSION (updated to handle allowedRoles if sent)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await GymSession.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true, // ← NEW: Validates enum for allowedRoles
    });

    if (!updated) return res.status(404).json({ error: "Session not found" });

    // Notify all registered users (unchanged)
    if (updated.registeredUsers && updated.registeredUsers.length > 0) {
      for (const user of updated.registeredUsers) {
        await sendEmail(
          user.email,
          "Gym Session Updated",
          `The gym session you registered for has been updated.\n\nNew Details:\nDate: ${updated.date}\nTime: ${updated.time}\nDuration: ${updated.duration} mins\nType: ${updated.type}`
        );
      }
    }

    res.json(updated);
  } catch (err) {
    console.error("Edit error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE SESSION (unchanged)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const session = await GymSession.findById(id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    // Notify before deleting (unchanged)
    if (session.registeredUsers && session.registeredUsers.length > 0) {
      for (const user of session.registeredUsers) {
        await sendEmail(
          user.email,
          "Gym Session Cancelled",
          `The gym session you registered for has been cancelled.\n\nDetails:\nDate: ${session.date}\nTime: ${session.time}\nType: ${session.type}`
        );
      }
    }

    await GymSession.findByIdAndDelete(id);

    res.json({ message: "Session deleted and emails sent" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// REGISTER FOR SESSION (updated with role check and userId)
router.post("/register", async (req, res) => {
  try {
    const { sessionId, email } = req.body;

    if (!sessionId || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const session = await GymSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Find user by email to get role and _id
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ← NEW: Role restriction check
    const isOpenToAll = !session.allowedRoles || session.allowedRoles.length === 0;
    if (!isOpenToAll && !session.allowedRoles.includes(user.role)) {
      const allowed = session.allowedRoles.map(r => r.charAt(0).toUpperCase() + r.slice(1) + "s").join(", ");
      return res.status(403).json({ 
        error: `This gym session is intended for ${allowed}!` 
      });
    }

    // Check if session is full
    if (session.registeredUsers.length >= session.maxParticipants) {
      return res.status(400).json({ error: "This session is already full." });
    }

    // Check if already registered
    const alreadyRegistered = session.registeredUsers.some(
      (u) => u.userId && u.userId.toString() === user._id.toString()
    );
    if (alreadyRegistered) {
      return res.status(400).json({ error: "Already registered" });
    }

    // Add user (with userId for consistency)
    session.registeredUsers.push({ 
      userId: user._id, 
      email: user.email,
      registeredAt: new Date()
    });

    await session.save();

    res.json({ message: "Registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;