// app.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const User = require("./models/User");
const gymRouter = require("./routes/gym");

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:3001" }));
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// ✅ Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log("Body:", req.body);
  next();
});
app.use("/api/gym", gymRouter);

// ✅ Connect to MongoDB
const MONGO = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/signup";
mongoose
  .connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* ---------------- SIGNUP ---------------- */
app.post("/api/register", async (req, res) => {
  try {
    const { firstName, lastName, companyName, roleSpecificId, email, password, role: requestedRole } = req.body;

    // ✅ Validate required fields
    if (!email || !password || !requestedRole || !firstName || !lastName || !roleSpecificId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Validate role
    const validRoles = ["student", "professor", "staff", "ta", "vendor"];
    if (!validRoles.includes(requestedRole)) return res.status(400).json({ error: "Invalid role" });

    // ✅ Check duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });

    // ✅ Determine verification
    const needsApproval = ["staff", "professor", "ta"].includes(requestedRole);
    const isVerified = !needsApproval;

    // ✅ Save new user (password hashing handled by schema pre-save)
    const newUser = new User({
      firstName,
      lastName,
      companyName: companyName || "",
      roleSpecificId,
      email,
      password,
      role: requestedRole,
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
    return res.status(500).json({ error: "Server error during signup", details: err.message });
  }
});

/* ---------------- LOGIN ---------------- */
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: "Invalid email or password" });

    if (!user.isVerified) return res.status(403).json({ error: "Account not verified yet." });

    res.json({
      message: "✅ Login successful!",
      user: {
        id: user._id,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
        roleSpecificId: user.roleSpecificId,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

/* ---------------- DEBUG USERS ---------------- */
app.get("/api/debug/users", async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/* ---------------- ADMIN VERIFY ---------------- */
app.patch("/api/admin/verify/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid user ID" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const allowedRoles = ["staff", "ta", "professor"];
    if (role && !allowedRoles.includes(role)) return res.status(400).json({ error: "Invalid role" });

    user.isVerified = true;
    if (role) user.role = role;

    const saved = await user.save();
    res.status(200).json({ success: true, message: "✅ User verified", user: saved });
  } catch (err) {
    res.status(500).json({ error: "Server error during verification", details: err.message });
  }
});

/* ---------------- ADMIN DELETE ---------------- */
app.delete("/api/admin/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid user ID" });

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ message: "🗑️ User deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Server error during delete", details: err.message });
  }
});

/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Backend running at http://localhost:${PORT}`));
