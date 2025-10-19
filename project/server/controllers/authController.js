// controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ================= Signup =================
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, companyName, email, password, role, roleSpecificId } = req.body;

    // Check role restrictions
    if (role !== "vendor" && companyName) {
      return res.status(400).json({ message: "Company name is only for vendors" });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const newUser = new User({
      firstName,
      lastName,
      companyName,
      email,
      password,
      role,
      roleSpecificId,
    });

    await newUser.save();

    // TODO: Send verification email for Student/Staff/TA/Professor if needed

    res.status(201).json({ message: "Signup successful! Await verification if required." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= Login =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // Check verification for non-vendors
    if (
  !user.isVerified &&
  !["vendor", "admin", "events_office"].includes(user.role)
) {
  return res.status(401).json({ message: "User not verified" });
}

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= Logout =================
// In JWT auth, logout is handled on the client side by deleting the token
exports.logout = async (req, res) => {
  try {
    // Optionally, you can implement a token blacklist here
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};