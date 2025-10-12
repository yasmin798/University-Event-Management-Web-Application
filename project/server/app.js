// app.js (Backend runs on port 3000)
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/User"); // ensure models/User.js exists

const app = express();
app.use(express.json());

// ✅ Allow frontend on port 3001
app.use(cors({ origin: "http://localhost:3001" }));

// ✅ Simple logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log("Body:", req.body);
  next();
});

// ✅ Connect to MongoDB
const MONGO = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/signup";
mongoose
  .connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* ---------------- SIGNUP ---------------- */
app.post("/api/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      companyName, // ✅ added to handle vendor signup
      roleSpecificId,
      email,
      password,
      role,
    } = req.body;

    console.log("📩 Signup request:", req.body);

    // ✅ Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Check valid roles
    const validRoles = ["student", "professor", "staff", "ta", "vendor"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // ✅ Prevent duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // ✅ Determine if verification is needed
    const needsApproval = ["staff", "professor", "ta"].includes(role);
    const isVerified = !needsApproval;

    // ✅ Save new user
    const newUser = new User({
      firstName: firstName || "",
      lastName: lastName || "",
      companyName: companyName || "", // ✅ save company name for vendors
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

/* ---------------- DEBUG (VIEW ALL USERS) ---------------- */
app.get("/api/debug/users", async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ count: users.length, users });
  } catch (err) {
    console.error("❌ Debug fetch error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/* ---------------- ADMIN VERIFY ROUTE ---------------- */
app.patch("/api/admin/verify/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    console.log(`🟢 Admin verifying user: ${id} as role: ${role}`);

    // ✅ Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // ✅ Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Validate assigned role
    const allowedRoles = ["staff", "ta", "professor"];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid assigned role" });
    }

    // ✅ Update verification + role
    user.isVerified = true;
    if (role) user.role = role;

    const saved = await user.save();

    console.log(`✅ User ${saved.email} verified as ${saved.role}`);

    return res.status(200).json({
      success: true,
      message: "✅ User verified and role updated successfully!",
      user: saved,
    });
  } catch (err) {
    console.error("❌ Verification error:", err);
    return res.status(500).json({
      error: "Server error during verification",
      details: err.message,
    });
  }
});

/* ---------------- ADMIN DELETE ROUTE ---------------- */
app.delete("/api/admin/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Admin deleting user: ${id}`);

    // ✅ Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log(`✅ Deleted user: ${deleted.email}`);

    res.status(200).json({ message: "🗑️ User deleted successfully." });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({
      error: "Server error during delete",
      details: err.message,
    });
  }
});

/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
