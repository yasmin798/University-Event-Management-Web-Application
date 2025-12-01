const express = require('express');
const router = express.Router();
const User = require('../models/User');
const mongoose = require('mongoose');
const multer = require("multer");
const path = require("path");
const { protect } = require("../middleware/auth");

// GET /api/vendors/loyalty
// Returns list of vendors participating in GUC loyalty program
router.get('/loyalty', async (req, res) => {
  try {
    // Only vendors who have isLoyaltyPartner true
    const partners = await User.find({ role: 'vendor', isLoyaltyPartner: true })
      .select('companyName email loyalty')
      .lean();

    // Format response: include human-friendly discount rate and promo code
    const formatted = partners.map((p) => ({
      id: p._id,
      companyName: p.companyName || p.email,
      email: p.email,
      discountRate: p.loyalty?.discountRate || 0,
      promoCode: p.loyalty?.promoCode || null,
      terms: p.loyalty?.terms || null,
      validFrom: p.loyalty?.validFrom || null,
      validTo: p.loyalty?.validTo || null,
    }));

    res.json({ partners: formatted });
  } catch (err) {
    console.error('GET /api/vendors/loyalty error:', err);
    res.status(500).json({ error: 'Failed to fetch loyalty partners' });
  }
});

// ---------- Multer setup for vendor documents ----------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads", "vendor-docs"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname); // .png, .jpg, .pdf...
    cb(
      null,
      `vendor-${req.user.id}-${file.fieldname}-${Date.now()}${ext}`
    );
  },
});

// (Optional) basic file filter: only images & pdf
function fileFilter(req, file, cb) {
  const allowed = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "application/pdf",
  ];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only images and PDF files are allowed"), false);
  }
  cb(null, true);
}

const upload = multer({ storage, fileFilter });

// ---------- Middleware: ensure user is vendor ----------
function vendorOnly(req, res, next) {
  if (!req.user || req.user.role !== "vendor") {
    return res.status(403).json({ error: "Vendor access only" });
  }
  next();
}

// ---------- GET current vendor profile ----------
router.get("/me", protect, vendorOnly, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "companyName email taxCardUrl logoUrl vendorVerificationStatus"
    );
    if (!user) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Error fetching vendor profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- PUT upload tax card + logo ----------
router.put(
  "/me/documents",
  protect,
  vendorOnly,
  upload.fields([
    { name: "taxCard", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      // Build public URLs based on your /uploads static route
      if (req.files.taxCard && req.files.taxCard[0]) {
        const file = req.files.taxCard[0];
        user.taxCardUrl = `/uploads/vendor-docs/${file.filename}`;
      }

      if (req.files.logo && req.files.logo[0]) {
        const file = req.files.logo[0];
        user.logoUrl = `/uploads/vendor-docs/${file.filename}`;
      }

      // Whenever vendor uploads/updates docs → status goes to pending
      user.vendorVerificationStatus = "pending";

      await user.save();

      res.json({
        success: true,
        message: "Documents uploaded successfully",
        taxCardUrl: user.taxCardUrl,
        logoUrl: user.logoUrl,
        vendorVerificationStatus: user.vendorVerificationStatus,
      });
    } catch (err) {
      console.error("Error uploading vendor documents:", err);
      res.status(500).json({ error: "Failed to upload documents" });
    }
  }
);

// =========================
// GET: All Vendors (Admin / Events Office)
// =========================
router.get("/", protect, async (req, res) => {
  try {
    // Allow only admin or events office
    if (!["admin", "events_office"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const vendors = await User.find({ role: "vendor" })
      .select("firstName lastName companyName email taxCardUrl logoUrl vendorVerificationStatus")
      .lean();

    res.json({ vendors });
  } catch (err) {
    console.error("Error fetching vendors:", err);
    res.status(500).json({ error: "Failed to fetch vendor list" });
  }
});



module.exports = router;
