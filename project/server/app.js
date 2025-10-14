require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Routers
const authRoutes = require("./routes/authRoutes");
const gymRouter = require("./routes/gym");
const eventRoutes = require("./routes/eventRoutes");
const workshopRoutes = require("./routes/workshopRoutes");

// Models
const User = require("./models/User");

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3001", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(morgan("dev"));
app.set("etag", false);

// Custom Logger Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length) console.log("Body:", req.body);
  next();
});

// Prevent browser caching of API responses
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/gym", gymRouter);
app.use("/api", eventRoutes);

app.use("/api/workshops", workshopRoutes);

// Connect to MongoDB
const MONGO = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eventity";
mongoose
  .connect(MONGO)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// In-memory token store for email verification
const verificationTokens = {};

/* ---------------- SIGNUP ---------------- */
app.post("/api/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      roleSpecificId,
      companyName,
    } = req.body;
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !role ||
      !roleSpecificId
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const validRoles = ["student", "professor", "staff", "ta", "vendor"];
    if (!validRoles.includes(role))
      return res.status(400).json({ error: "Invalid role" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "Email already registered" });

    const needsApproval = ["staff", "professor", "ta"].includes(role);
    const isVerified = !needsApproval;

    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      roleSpecificId,
      companyName: companyName || "",
      isVerified,
    });

    const saved = await newUser.save();
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

// LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ error: "Invalid email or password" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ error: "Invalid email or password" });

    if (!user.isVerified)
      return res.status(403).json({ error: "Account not verified yet." });

    res.json({
      message: "✅ Login successful!",
      user: {
        id: user._id,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid user ID" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const allowedRoles = ["staff", "ta", "professor"];
    if (role && !allowedRoles.includes(role))
      return res.status(400).json({ error: "Invalid role" });

    user.isVerified = true;
    if (role) user.role = role;

    const saved = await user.save();
    res
      .status(200)
      .json({ success: true, message: "✅ User verified", user: saved });
  } catch (err) {
    res
      .status(500)
      .json({
        error: "Server error during verification",
        details: err.message,
      });
  }
});

/* ---------------- ADMIN DELETE ---------------- */
app.delete("/api/admin/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid user ID" });

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ message: "🗑️ User deleted successfully." });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Server error during delete", details: err.message });
  }
});

/* ---------------- EMAIL VERIFICATION SYSTEM ---------------- */
app.post("/api/admin/send-verification", async (req, res) => {
  try {
    const { email, userId } = req.body;
    if (!email || !userId)
      return res.status(400).json({ error: "Missing email or userId" });

    const token = crypto.randomBytes(32).toString("hex");
    verificationTokens[token] = userId;

    const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyUrl = `${frontend}/api/verify/${token}`;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Account Verification - Admin Approval",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2 style="color:#10B981;">Account Verification</h2>
          <p>Hello,</p>
          <p>Your account has been reviewed. Please click the button below to verify your account:</p>
          <a href="${verifyUrl}" target="_blank" style="background:#10B981;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
            Verify My Account
          </a>
          <p style="margin-top:20px;color:#555;">If you didn’t request this, you can ignore this email.</p>
          <hr/>
          <small>This link will expire after use.</small>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: `Verification mail sent to ${email}` });
  } catch (err) {
    console.error("❌ Mail error:", err);
    res
      .status(500)
      .json({
        error: "Failed to send verification mail",
        details: err.message,
      });
  }
});

app.get("/api/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const userId = verificationTokens[token];
    if (!userId)
      return res.status(400).send("Invalid or expired verification link.");

    const user = await User.findById(userId);
    if (!user) return res.status(404).send("User not found.");

    user.isVerified = true;
    await user.save();
    delete verificationTokens[token];

    res.send("<h2>✅ Account verified successfully! You can now log in.</h2>");
  } catch (err) {
    console.error("❌ Verification error:", err);
    res.status(500).send("Server error during verification.");
  }
});

/* ---------------- Healthcheck ---------------- */
app.get("/", (_req, res) => res.send("API OK"));

/* ---------------- Error Handler ---------------- */
app.use((err, _req, res, _next) => {
  if (err && err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS blocked this origin" });
  }
  console.error("💥 Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

/* ---------------- Start Server ---------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
