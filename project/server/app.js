require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { protect, adminOnly } = require("./middleware/auth");

// Routers
const authRoutes = require("./routes/authRoutes");
const gymRouter = require("./routes/gym");
const eventRoutes = require("./routes/eventRoutes"); // exposes /bazaars, /trips, /conferences
const workshopRoutes = require("./routes/workshopRoutes");
const userRoutes = require("./routes/userRoutes");
const bazaarApplicationRoutes = require("./routes/bazaarApplications");
const boothApplicationsRouter = require("./routes/boothApplications");
const adminBazaarRequestsRoute = require("./routes/adminBazaarRequests");
const adminBoothRequestsRoute = require("./routes/adminBoothRequests");
const notificationRoutes = require('./routes/notificationRoutes');


// Models
const User = require("./models/User");

const app = express();

/* ---------------- Middleware ---------------- */
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3001", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(morgan("dev"));
app.set("etag", false);

// Logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length) console.log("Body:", req.body);
  next();
});

// No-cache
app.use((_, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

/* ---------------- Routes ---------------- */
// auth / gym
app.use("/api/auth", authRoutes);
app.use("/api/gym", gymRouter);
app.use('/api/notifications', notificationRoutes);
// mount feature routers
app.use("/api", eventRoutes); // -> /api/bazaars, /api/trips, /api/conferences
app.use("/api", userRoutes); // -> /api/users/... (or similar)
app.use("/api/workshops", workshopRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bazaar-applications", bazaarApplicationRoutes);
app.use("/api/booth-applications", boothApplicationsRouter);
app.use("/api/bazaar-applications", adminBazaarRequestsRoute);
app.use("/api/booth-applications", adminBoothRequestsRoute);

/* ---------------- DB ---------------- */
const MONGO = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eventity";
mongoose
  .connect(MONGO)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* ---------------- Auth: Signup/Login ---------------- */
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

    // Validation based on role
    if (role === "vendor") {
      if (!companyName || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }
    } else {
      if (!firstName || !lastName || !email || !password || !roleSpecificId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
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
      firstName: role !== "vendor" ? firstName : undefined,
      lastName: role !== "vendor" ? lastName : undefined,
      email,
      password,
      role,
      roleSpecificId: role !== "vendor" ? roleSpecificId : undefined,
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

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "1h" }
    );

    res.json({
      message: "✅ Login successful!",
      token,
      user: {
        id: user._id,
        name: user.role === "vendor" ? user.companyName : `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- Debug ---------------- */
app.get("/api/debug/users", async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/* ---------------- Admin Verify/Delete ---------------- */
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

app.delete("/api/admin/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid user ID" });

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ success: true, message: "🗑️ User deleted successfully." });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Server error during delete", details: err.message });
  }
});

/* ---------------- Email Verification ---------------- */
const verificationTokens = {}; // token -> { userId, role }

app.post("/api/admin/send-verification", async (req, res) => {
  try {
    const { email, userId, role } = req.body;
    if (!email || !userId)
      return res.status(400).json({ error: "Missing email or userId" });

    // Generate unique token for verification
    const token = crypto.randomBytes(32).toString("hex");
    verificationTokens[token] = { userId, role };

    // Verification link — adjust localhost:3000 to your frontend URL
    const verifyUrl = `http://localhost:3000/api/verify/${token}`;

    // ✅ Gmail transporter with App Password
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // e.g., youremail@gmail.com
        pass: process.env.EMAIL_PASS, // your 16-character App Password
      },
    });

    // Email content (HTML)
    const mailOptions = {
      from: `"Eventity Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Account Verification - Eventity",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;">
          <h2 style="color:#10B981;">Eventity - Account Verification</h2>
          <p>Hello,</p>
          <p>Your account has been approved by an admin. Please click the button below to verify your account:</p>
          <a href="${verifyUrl}" target="_blank"
             style="background:#10B981;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:10px;">
            Verify My Account
          </a>
          <p style="margin-top:20px;color:#555;">If you did not request this, you can safely ignore this email.</p>
          <hr/>
          <small>© 2025 Eventity Team</small>
        </div>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    console.log(`📧 Verification email sent to ${email}`);
    res.json({ success: true, message: `Verification email sent to ${email}` });
  } catch (err) {
    console.error("❌ Mail error:", err);
    res.status(500).json({
      error: "Failed to send verification email",
      details: err.message,
    });
  }
});

/* ---------------- Vendor Requests ---------------- */
app.get("/api/bazaar-vendor-requests/:bazaarId", async (req, res) => {
  try {
    const { bazaarId } = req.params;
    const requests = await BazaarVendorRequest.find({ bazaarId }).sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch vendor requests" });
  }
});

app.get("/api/admin/booth-vendor-requests", adminOnly, async (_req, res) => {
  try {
    const requests = await BoothVendorRequest.find().sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch booth vendor requests" });
  }
});

app.patch("/api/admin/bazaar-vendor-requests/:id", adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // expected: "accepted" or "rejected"

    if (!["accepted", "rejected"].includes(status.toLowerCase())) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const request = await BazaarVendorRequest.findById(id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    request.status = status.toUpperCase();
    await request.save();

    res.json({ success: true, message: `Bazaar request ${status} successfully`, request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update bazaar request" });
  }
});

app.patch("/api/admin/booth-vendor-requests/:id", adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status.toLowerCase())) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const request = await BoothVendorRequest.findById(id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    request.status = status.toUpperCase();
    await request.save();

    res.json({ success: true, message: `Booth request ${status} successfully`, request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update booth request" });
  }
});

/* ---------------- Health & Errors ---------------- */
app.get("/", (_req, res) => res.send("API OK"));

app.use((err, _req, res, _next) => {
  if (err && err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS blocked this origin" });
  }
  console.error("💥 Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

/* ---------------- Start ---------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Backend running at http://localhost:${PORT}`)
);


const vendorApplicationsRoute = require("./routes/vendorApplications");
app.use("/api/vendor/applications", vendorApplicationsRoute);