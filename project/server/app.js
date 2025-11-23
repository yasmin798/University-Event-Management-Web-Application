// Updated app.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { protect, adminOnly } = require("./middleware/auth");
const path = require("path");

// Routers
const authRoutes = require("./routes/authRoutes");
const gymRouter = require("./routes/gym");
const eventRoutes = require("./routes/eventRoutes");
const workshopRoutes = require("./routes/workshopRoutes");
const userRoutes = require("./routes/userRoutes");
const bazaarApplicationRoutes = require("./routes/bazaarApplications");
const boothApplicationsRouter = require("./routes/boothApplications");
const adminBazaarRequestsRoute = require("./routes/adminBazaarRequests");
const adminBoothRequestsRoute = require("./routes/adminBoothRequests");
const notificationRoutes = require("./routes/notificationRoutes");
const reportsRoutes = require("./routes/reports");
const vendorApplicationsRoute = require("./routes/vendorApplications");
const vendorsRoute = require("./routes/vendors");
const adminRoutes = require("./routes/admin");
const boothRoutes = require("./routes/booths");
const reservationRoutes = require("./routes/reservationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const stripeWebhook = require("./webhooks/stripeWebhook");
const reviewsRouter = require("./routes/reviews"); // or whatever the file is called
const loyaltyRoutes = require("./routes/loyaltyRoutes");

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

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
// Auth & Gym
app.use("/api/auth", authRoutes);
app.use("/api/gym", gymRouter);
app.use("/api/admin", require("./routes/admin"));

// Notifications
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportsRoutes);

// Feature routers
app.use("/api/workshops", workshopRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bazaar-applications", bazaarApplicationRoutes);
app.use("/api/bazaar-applications", adminBazaarRequestsRoute);
app.use("/api/booth-applications", boothApplicationsRouter);
app.use("/api/booth-applications", adminBoothRequestsRoute);
app.use("/api/vendor/applications", vendorApplicationsRoute);
app.use("/api/vendors", vendorsRoute);
app.use("/api/booths", require("./routes/booths"));

// Events routes (keep generic last)
app.use("/api/events", eventRoutes);
app.use("/api", eventRoutes);

app.use("/api/events", require("./routes/reviews"));

app.use("/api/reservations", reservationRoutes);
// Payment routes / Stripe webhook temporarily disabled because `paymentRoutes` / `stripeWebhook` are not defined in this branch.
// If you add Stripe integration, require and mount it here, e.g.:
// const paymentRoutes = require('./routes/paymentRoutes');
// app.use('/api/payments', paymentRoutes);
// app.post('/webhook/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

// Reviews router is not present in this version — keep events routes mounted above.







// loyalty program
app.use("/api/loyalty", loyaltyRoutes);
// Example in Express.js
app.post("/api/loyalty/apply", protect, async (req, res) => {
  const { companyName, discountRate, promoCode, termsAndConditions } = req.body;

  if (!companyName || !discountRate || !promoCode || !termsAndConditions) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const application = await LoyaltyApplication.create({
      companyName,
      discountRate,
      promoCode,
      termsAndConditions,
      vendor: req.user.id, // req.user comes from protect middleware
    });

    res.status(201).json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
/* ---------------- Database ---------------- */
const MONGO = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eventity";
mongoose
  .connect(MONGO)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* ---------------- Helper: Send Verification Email ---------------- */
async function sendVerificationEmail(email, userId, role, isAdmin = false) {
  try {
    const token = crypto.randomBytes(32).toString("hex");
    verificationTokens[token] = { userId, role };

    const verifyUrl = `http://localhost:3000/api/verify/${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const subject = isAdmin
      ? "Account Verification - Admin Approval"
      : "Welcome to Eventity - Verify Your Account";

    const body = isAdmin
      ? `
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
      `
      : `
        <div style="font-family:Arial,sans-serif;line-height:1.6;">
          <h2 style="color:#10B981;">Welcome to Eventity!</h2>
          <p>Hello ${email.split("@")[0]},</p>
          <p>Thank you for registering with Eventity. To complete your registration, please click the button below to verify your email address:</p>
          <a href="${verifyUrl}" target="_blank"
             style="background:#10B981;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:10px;">
            Verify Email Address
          </a>
          <p style="margin-top:20px;color:#555;">This link will expire in 24 hours. If you did not create an account, please ignore this email.</p>
          <hr/>
          <small>© 2025 Eventity Team</small>
        </div>
      `;

    const mailOptions = {
      from: `"Eventity" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: body,
    };

    await transporter.sendMail(mailOptions);

    console.log(
      `📧 ${isAdmin ? "Admin" : "Student"} verification email sent to ${email}`
    );
  } catch (err) {
    console.error("❌ Email send error:", err);
    throw new Error("Failed to send verification email");
  }
}

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

    let isVerified = true;
    let message = "✅ Signup successful!";

    const needsAdminApproval = ["staff", "professor", "ta", "student"].includes(
      role
    );

    if (needsAdminApproval) {
      isVerified = false;
      message = "✅ Registration complete, awaiting admin approval!";
    }

    const newUser = new User({
      firstName: role !== "vendor" ? firstName : undefined,
      lastName: role !== "vendor" ? lastName : undefined,
      email,
      password,
      role,
      roleSpecificId: role !== "vendor" ? roleSpecificId : undefined,
      companyName: companyName || "",
      isVerified,
      status: "active", // Explicitly set default
    });

    const saved = await newUser.save();

    res.status(201).json({
      success: true,
      message,
      user: {
        id: saved._id,
        email: saved.email,
        role: saved.role,
        isVerified: saved.isVerified,
      },
    });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res
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

    if (user.status === "blocked")
      return res.status(403).json({ error: "Account is blocked." });

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
        name:
          user.role === "vendor"
            ? user.companyName
            : `${user.firstName} ${user.lastName}`,
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

/* ---------------- Admin Verify/Delete/Block ---------------- */
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
    res.status(500).json({
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

    res
      .status(200)
      .json({ success: true, message: "🗑️ User deleted successfully." });
  } catch (err) {
    res.status(500).json({
      error: "Server error during delete",
      details: err.message,
    });
  }
});

app.patch("/api/admin/block/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "blocked"].includes(status))
      return res
        .status(400)
        .json({ error: "status must be 'active' or 'blocked'" });

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid user ID" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.status = status;

    const saved = await user.save();
    res.status(200).json({
      success: true,
      message: `User ${
        status === "blocked" ? "blocked" : "unblocked"
      } successfully.`,
      user: saved,
    });
  } catch (err) {
    res.status(500).json({
      error: "Server error during block/unblock",
      details: err.message,
    });
  }
});

/* ---------------- Email Verification ---------------- */
const verificationTokens = {};

// Send verification email (admin)
app.post("/api/admin/send-verification", async (req, res) => {
  try {
    const { email, userId, role } = req.body;
    if (!email || !userId)
      return res.status(400).json({ error: "Missing email or userId" });

    await sendVerificationEmail(email, userId, role, true);

    res.json({ success: true, message: `Verification email sent to ${email}` });
  } catch (err) {
    console.error("❌ Mail error:", err);
    res.status(500).json({
      error: "Failed to send verification email",
      details: err.message,
    });
  }
});

// Handle verification link click
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

    console.log(
      `✅ ${user.email} verified successfully as ${user.role || "student"}`
    );

    res.send(`
      <html>
        <head>
          <meta http-equiv="refresh" content="3;url=http://localhost:3001/login" />
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f0fdf4;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 100vh;
              color: #10B981;
              text-align: center;
            }
            h1 { font-size: 24px; margin-bottom: 10px; }
            p { color: #065f46; font-size: 16px; }
          </style>
        </head>
        <body>
          <h1>✅ Verification Complete!</h1>
          <p>Your account has been successfully verified.</p>
          <p>Redirecting to login in 3 seconds...</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("❌ Verification error:", err);
    res.status(500).send("<h2>Server error during verification.</h2>");
  }
});

/* ---------------- Health & Errors ---------------- */
app.get("/", (_req, res) => res.send("API OK"));

app.use((err, _req, res, _next) => {
  if (err && err.message === "Not allowed by CORS")
    return res.status(403).json({ error: "CORS blocked this origin" });
  console.error("💥 Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// app.js or server.js – put it with your other routes
app.use("/api/polls", require("./routes/pollRoutes"));

/* ---------------- Start ---------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Backend running at http://localhost:${PORT}`)
);

