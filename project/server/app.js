// app.js  (backend runs on port 3000)
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/User"); // make sure models/User.js exists

const app = express();
app.use(express.json());

// ✅ allow frontend on port 3001
app.use(cors({ origin: "http://localhost:3001" }));

// simple logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log("Body:", req.body);
  next();
});

// ✅ connect to MongoDB
const MONGO = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/signup";
mongoose
  .connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* ---------------- SIGNUP ---------------- */
app.post("/api/register", async (req, res) => {
  try {
    const { firstName, lastName, roleSpecificId, email, password, role } = req.body;

    console.log("📩 Signup request:", req.body);

    // validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const validRoles = ["student", "professor", "staff", "ta", "vendor"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // duplicate email check
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // staff, professor, ta → need admin verification
    const needsApproval = ["staff", "professor", "ta"].includes(role);
    const isVerified = !needsApproval;

    // save to DB
    const newUser = new User({
      firstName: firstName || "",
      lastName: lastName || "",
      roleSpecificId,
      email,
      password,
      role,
      isVerified,
    });

    const saved = await newUser.save();

    console.log("✅ User saved:", saved.email);

    return res.status(201).json({
      success: true,
      message: needsApproval
        ? "✅ Registration complete, awaiting admin verification!"
        : "✅ Signup successful!",
      user: {
        id: saved._id,
        email: saved.email,
        role: saved.role,
        isVerified: saved.isVerified,
      },
    });
  } catch (err) {
    console.error("❌ Signup error:", err);
    return res
      .status(500)
      .json({ error: "Server error during signup", details: err.message });
  }
});

/* ---------------- DEBUG ---------------- */
app.get("/api/debug/users", async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ count: users.length, users });
});

/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Backend running at http://localhost:${PORT}`)
);
