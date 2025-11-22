// routes/gym.js
const express = require("express");
const router = express.Router();
const GymSession = require("../models/GymSession");
const sendEmail = require("../models/Email");


// GET all sessions
router.get("/", async (req, res) => {
  try {
    const sessions = await GymSession.find().sort({ date: 1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch gym sessions" });
  }
});

// POST a new session
router.post("/", async (req, res) => {
  try {
    const { date, time, duration, type, maxParticipants } = req.body;
    const newSession = new GymSession({ date, time, duration, type, maxParticipants });
    const saved = await newSession.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: "Failed to create gym session" });
  }
});

// ----------------------------------------
// EDIT SESSION
// ----------------------------------------
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await GymSession.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updated) return res.status(404).json({ error: "Session not found" });

    // Notify all registered users
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


// ----------------------------------------
// DELETE SESSION
// ----------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const session = await GymSession.findById(id);
    if (!session) return res.status(404).json({ error: "Session not found" });


    // Notify before deleting
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

    // ✅ Check if session is full
    if (session.registeredUsers.length >= session.maxParticipants) {
      return res
        .status(400)
        .json({ error: "This session is already full." });
    }

    // ❌ Check if email already registered
    const alreadyRegistered = session.registeredUsers.some(
      (u) => u.email === email
    );

    if (alreadyRegistered) {
      return res.status(400).json({ error: "Already registered" });
    }

    // ✅ Add user
    session.registeredUsers.push({ email });

    await session.save();

    res.json({ message: "Registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Server error" });
  }
});






module.exports = router;
