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

// mount feature routers
app.use("/api", eventRoutes); // -> /api/bazaars, /api/trips, /api/conferences
app.use("/api", userRoutes); // -> /api/users/... (or similar)
app.use("/api/workshops", workshopRoutes);

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
        firstName: user.firstName,
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

    res.status(200).json({ message: "🗑️  User deleted successfully." });
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

    const token = crypto.randomBytes(32).toString("hex");
    verificationTokens[token] = { userId, role };

    const verifyUrl = `http://localhost:3000/api/verify/${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Account Verification - Admin Approval",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;">
          <h2 style="color:#10B981;">Account Verification</h2>
          <p>Hello,</p>
          <p>Your account has been reviewed. Please click the button below to verify your account:</p>
          <a href="${verifyUrl}" target="_blank"
             style="background:#10B981;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;">
            Verify My Account
          </a>
          <p style="margin-top:20px;color:#555;">This link will expire once used.</p>
          <hr/>
          <small>© 2025 Your App Team</small>
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
    const data = verificationTokens[token];
    if (!data) {
      return res
        .status(400)
        .send(
          "<h2 style='color:red;text-align:center;'>❌ Invalid or expired verification link.</h2>"
        );
    }

    const { userId, role } = data;
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .send("<h2 style='color:red;text-align:center;'>User not found.</h2>");
    }

    user.isVerified = true;
    if (role) user.role = role;
    await user.save();

    delete verificationTokens[token];

    res.send(`
      <html>
        <head>
          <meta http-equiv="refresh" content="4;url=http://localhost:3001/login" />
          <style>
            body { font-family: Arial, sans-serif; background-color: #f0fdf4; display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; color:#10B981; text-align:center; }
            h1 { font-size: 24px; margin-bottom: 10px; }
            p { color: #065f46; font-size: 16px; }
          </style>
        </head>
        <body>
          <h1>✅ Verified Successfully!</h1>
          <p>You’re being redirected to the login page...</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("❌ Verification error:", err);
    res.status(500).send("<h2>Server error during verification.</h2>");
  }
});
// Models
const BazaarVendorRequest = require("./models/BazaarVendorRequest");
const BoothVendorRequest = require("./models/BoothVendorRequest");

/* ---------------- Vendor Requests ---------------- */

// Get all bazaar vendor requests
// Get vendor requests for a specific bazaar
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


// Get all booth vendor requests
app.get("/api/admin/booth-vendor-requests", adminOnly, async (_req, res) => {
  try {
    const requests = await BoothVendorRequest.find().sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch booth vendor requests" });
  }
});

// Accept/Reject a bazaar vendor request
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

// Accept/Reject a booth vendor request
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

const bazaarApplicationRoutes = require("./routes/bazaarApplications");

app.use("/api/bazaar-applications", bazaarApplicationRoutes);


const boothApplicationsRouter = require("./routes/boothApplications");
app.use("/api/booth-applications", boothApplicationsRouter);

const adminBazaarRequestsRoute = require("./routes/adminBazaarRequests");
app.use("/api/bazaar-applications", adminBazaarRequestsRoute);

const adminBoothRequestsRoute = require("./routes/adminBoothRequests");
app.use("/api/booth-applications", adminBoothRequestsRoute);
