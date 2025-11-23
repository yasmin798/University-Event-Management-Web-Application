// routes/gym.js (full updated with enhanced logging and error handling for debugging)
const express = require("express");
const router = express.Router();
const GymSession = require("../models/GymSession");
const User = require("../models/User");
let sendEmail; // Lazy load to avoid import errors
try {
  sendEmail = require("../models/Email");
} catch (e) {
  console.warn("Email module not found; notifications disabled");
  sendEmail = async () => {}; // No-op
}

// Middleware to log requests (for debugging)
router.use((req, res, next) => {
  console.log(`[GYM-ROUTE] ${req.method} ${req.path} - Body:`, req.body);
  next();
});

// GET all sessions (visible to all, includes allowedRoles)
router.get("/", async (req, res) => {
  try {
    const sessions = await GymSession.find().sort({ date: 1 }).lean();
    console.log(`[GYM-GET] Fetched ${sessions.length} sessions`);
    res.json(sessions);
  } catch (err) {
    console.error("[GYM-GET] Error:", err);
    res.status(500).json({ error: "Failed to fetch gym sessions" });
  }
});

// POST new session
router.post("/", async (req, res) => {
  try {
    const { date, time, duration, type, maxParticipants, allowedRoles = [] } = req.body;
    console.log(`[GYM-POST] Creating session with allowedRoles:`, allowedRoles);
    const newSession = new GymSession({ 
      date: new Date(date), 
      time, 
      duration: parseInt(duration), 
      type, 
      maxParticipants: parseInt(maxParticipants),
      allowedRoles 
    });
    const saved = await newSession.save();
    console.log(`[GYM-POST] Saved session ${saved._id} with allowedRoles:`, saved.allowedRoles);
    res.status(201).json(saved);
  } catch (err) {
    console.error("[GYM-POST] Error:", err);
    res.status(500).json({ error: "Failed to create gym session" });
  }
});

// PUT update session
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { allowedRoles, ...updateData } = req.body; // Handle allowedRoles update
    const updated = await GymSession.findByIdAndUpdate(
      id, 
      { ...updateData, allowedRoles: allowedRoles || undefined }, 
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Session not found" });
    }
    console.log(`[GYM-PUT] Updated ${id}, allowedRoles now:`, updated.allowedRoles);

    // Notify if registered users exist
    if (updated.registeredUsers?.length > 0) {
      updated.registeredUsers.forEach((user) => {
        sendEmail(user.email, "Gym Session Updated", `Session updated: ${updated.type} on ${updated.date.toDateString()}`);
      });
    }

    res.json(updated);
  } catch (err) {
    console.error("[GYM-PUT] Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE session
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const session = await GymSession.findById(id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.registeredUsers?.length > 0) {
      session.registeredUsers.forEach((user) => {
        sendEmail(user.email, "Gym Session Cancelled", `Session cancelled: ${session.type} on ${session.date.toDateString()}`);
      });
    }

    await GymSession.findByIdAndDelete(id);
    console.log(`[GYM-DELETE] Deleted ${id}`);
    res.json({ message: "Session deleted successfully" });
  } catch (err) {
    console.error("[GYM-DELETE] Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST register (strict role enforcement with detailed logging)
router.post("/register", async (req, res) => {
  try {
    const { sessionId, email } = req.body;
    console.log(`[GYM-REGISTER] Request for email: ${email}, session: ${sessionId}`);

    if (!sessionId || !email) {
      console.log("[GYM-REGISTER] Missing fields");
      return res.status(400).json({ error: "Missing sessionId or email" });
    }

    // Find session
    const session = await GymSession.findById(sessionId);
    if (!session) {
      console.log(`[GYM-REGISTER] Session ${sessionId} not found`);
      return res.status(404).json({ error: "Session not found" });
    }
    console.log(`[GYM-REGISTER] Session found: ${session.type}, allowedRoles:`, session.allowedRoles);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[GYM-REGISTER] User with email ${email} not found`);
      return res.status(404).json({ error: "User not found. Ensure email is correct and user exists." });
    }
    console.log(`[GYM-REGISTER] User: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'} (role: ${user.role})`);

    // Role restriction check
    const isOpenToAll = !session.allowedRoles || session.allowedRoles.length === 0;
    console.log(`[GYM-REGISTER] Is open to all? ${isOpenToAll}, User role: ${user.role}`);
    if (!isOpenToAll && !session.allowedRoles.includes(user.role)) {
      const allowed = session.allowedRoles
        .map(r => r.charAt(0).toUpperCase() + r.slice(1) + (r === "ta" ? "s" : "s"))
        .join(", ");
      console.log(`[GYM-REGISTER] Denied: Role ${user.role} not in [${allowed}]`);
      return res.status(403).json({ 
        error: `This gym session is restricted to ${allowed} only. Your role (${user.role}) is not eligible.` 
      });
    }
    console.log("[GYM-REGISTER] Role check passed");

    // Capacity check
    const currentCount = session.registeredUsers.length;
    if (currentCount >= session.maxParticipants) {
      console.log(`[GYM-REGISTER] Full: ${currentCount}/${session.maxParticipants}`);
      return res.status(400).json({ error: "Session is full" });
    }

    // Already registered check
    const alreadyReg = session.registeredUsers.some(reg => reg.userId?.toString() === user._id.toString());
    if (alreadyReg) {
      console.log("[GYM-REGISTER] Already registered");
      return res.status(400).json({ error: "You are already registered" });
    }

    // Add registration
    session.registeredUsers.push({
      userId: user._id,
      email: user.email,
      registeredAt: new Date()
    });
    await session.save();
    console.log(`[GYM-REGISTER] Success! New count: ${session.registeredUsers.length}/${session.maxParticipants}`);

    // Send confirmation (optional)
    sendEmail(user.email, "Registration Confirmed", `Registered for ${session.type} on ${session.date.toDateString()} at ${session.time}.`);

    res.json({ message: "Registered successfully!" });
  } catch (err) {
    console.error("[GYM-REGISTER] Unexpected error:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
});

module.exports = router;