// server/controllers/adminController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ✅ Create Admin or Event Office (POST /api/admin/create-user)
exports.createUser = async (req, res) => {
  try {
    const { firstName, email, password, role, isVerified } = req.body;

    // Validate role
    if (!["admin", "events_office"].includes(role)) {
      return res.status(400).json({ error: "Invalid role specified." });
    }

    // Check existing
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "User already exists." });
    }

    // Create user (password auto-hashed by the schema)
    const user = await User.create({
      firstName,
      email,
      password,
      role,
      isVerified: isVerified || true, // auto-verify if created by admin
    });

    res.status(201).json({ message: `${role} created successfully`, user });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: err.message });
  }
};