// server/routes/bazaarApplications.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const BazaarApplication = require("../models/BazaarApplication");
const Bazaar = require("../models/Bazaar");
const Notification = require("../models/Notification");
const User = require("../models/User");
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const archiver = require('archiver');

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "ids");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (_req, file, cb) {
    const safe = `${Date.now()}-${file.originalname.replace(
      /[^a-zA-Z0-9.-]/g,
      "_"
    )}`;
    cb(null, safe);
  },
});

const upload = multer({ storage });

// CREATE BAZAAR APPLICATION
// Expects multipart/form-data with `attendees` (JSON string) and `idFiles` array of files
// Add this route to your boothApplications.js file, preferably after the existing routes


router.post("/", upload.array("idFiles", 5), async (req, res) => {
  try {
    // attendees may be sent as JSON string in multipart requests
    const { bazaar, boothSize } = req.body;
    let attendees = req.body.attendees;
    if (typeof attendees === "string") {
      try {
        attendees = JSON.parse(attendees);
      } catch (e) {
        return res.status(400).json({ error: "Invalid attendees JSON" });
      }
    }

    const files = req.files || [];

    // === VALIDATE INPUT ===
    if (!bazaar) {
      return res.status(400).json({ error: "bazaar is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(bazaar)) {
      return res.status(400).json({ error: "invalid bazaar id" });
    }

    if (
      !Array.isArray(attendees) ||
      attendees.length < 1 ||
      attendees.length > 5
    ) {
      return res.status(400).json({ error: "attendees must be array of 1-5" });
    }

    // Require an ID file for each attendee (vendors must upload IDs for entire duration)
    if (files.length !== attendees.length) {
      return res
        .status(400)
        .json({
          error:
            "An ID file must be uploaded for every attendee (field name 'idFiles').",
        });
    }

    if (!["2x2", "4x4"].includes(boothSize)) {
      return res.status(400).json({ error: "invalid boothSize" });
    }

    // Validate every attendee has name & valid email
    for (let i = 0; i < attendees.length; i++) {
      const a = attendees[i];
      if (!a.name || !a.name.trim()) {
        return res
          .status(400)
          .json({ error: `Attendee ${i + 1}: name is required` });
      }
      if (!a.email || !a.email.trim()) {
        return res
          .status(400)
          .json({ error: `Attendee ${i + 1}: email is required` });
      }
      if (!/^\S+@\S+\.\S+$/.test(a.email.trim())) {
        return res
          .status(400)
          .json({ error: `Attendee ${i + 1}: invalid email format` });
      }
      // Ensure corresponding file exists
      const file = files[i];
      if (!file) {
        return res
          .status(400)
          .json({ error: `Missing ID file for attendee ${i + 1}` });
      }
      // Attach file path to attendee object
      a.idDocument = `/uploads/ids/${path.basename(file.path)}`;
      a.attendingEntireDuration = true;
    }

    // === CHECK BAZAAR EXISTS ===
    const baz = await Bazaar.findById(bazaar);
    if (!baz) {
      return res.status(404).json({ error: "Bazaar not found" });
    }

    // === SAVE APPLICATION ===
    const appDoc = new BazaarApplication({
      bazaar,
      attendees: attendees.map((a) => ({
        userId: a.userId || null,
        name: a.name.trim(),
        email: a.email.trim(),
        idDocument: a.idDocument,
        attendingEntireDuration: !!a.attendingEntireDuration,
      })),
      boothSize,
    });
    const savedApp = await appDoc.save();

    // === PUSH TO BAZAAR.REGISTRATIONS ===
    const now = new Date();
    const newRegs = attendees.map((a) => ({
      userId: a.userId || null,
      name: a.name.trim(),
      email: a.email.trim(),
      registeredAt: now,
    }));

    const existingEmails = new Set(
      (baz.registrations || []).map((r) => String(r.email).toLowerCase())
    );

    const toPush = newRegs.filter(
      (r) => r.email && !existingEmails.has(String(r.email).toLowerCase())
    );

    if (toPush.length > 0) {
      await Bazaar.findByIdAndUpdate(
        bazaar,
        { $push: { registrations: { $each: toPush } } },
        { new: true }
      );
    }

    // Return updated bazaar
    const updatedBazaar = await Bazaar.findById(bazaar);

    // Notify Events Office users about new pending vendor application
    try {
      // notify both events office and admin users
      const recipients = await User.find({
        role: { $in: ["events_office", "admin"] },
        status: "active",
      }).select("_id email role");
      const notifPromises = recipients.map((u) => {
        const n = new Notification({
          userId: u._id,
          message: `New vendor application pending for bazaar '${
            baz.title || updatedBazaar.title || bazaar
          }'. Application ID: ${savedApp._id}`,
          type: "vendor_application",
        });
        return n.save();
      });
      await Promise.all(notifPromises);
    } catch (nerr) {
      console.error("Failed to create notifications for recipients:", nerr);
    }
    return res.status(201).json({
      success: true,
      application: savedApp,
      bazaar: updatedBazaar,
    });
  } catch (err) {
    console.error("POST /api/bazaar-applications error:", err);
    return res.status(500).json({ error: "Server error creating application" });
  }
});

// GET ALL BAZAAR APPLICATIONS (Admin)
router.get("/", async (req, res) => {
  try {
    const list = await BazaarApplication.find().populate(
      "bazaar",
      "title location startDateTime"
    );
    res.json(list);
  } catch (err) {
    console.error("GET /api/bazaar-applications error:", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// GET APPLICATIONS FOR A SPECIFIC BAZAAR
router.get("/:bazaarId", async (req, res) => {
  try {
    const { bazaarId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bazaarId)) {
      return res.status(400).json({ error: "invalid bazaar id" });
    }

    const applications = await BazaarApplication.find({ bazaar: bazaarId })
      .populate("bazaar", "title location startDateTime")
      .sort({ createdAt: -1 });

    res.status(200).json({ requests: applications });
  } catch (err) {
    console.error("Error fetching bazaar applications:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch applications for this bazaar" });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }

    const app = await BazaarApplication.findById(id);
    if (!app) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Optional: prevent canceling paid applications
    if (app.paid) {
      return res
        .status(400)
        .json({ error: "Cannot cancel a paid application" });
    }

    await BazaarApplication.findByIdAndDelete(id);

    res.json({ success: true, message: "Application canceled successfully" });
  } catch (err) {
    console.error("DELETE /api/bazaar-applications/:id error:", err);
    res.status(500).json({ error: "Server error canceling application" });
  }
});

// PATCH: update application status (accept/reject) - for admin
router.patch("/:id", async (req, res) => {
  console.log("=== BAZAAR APPLICATIONS PATCH ROUTE HIT ===");
  console.log("ID:", req.params.id);
  console.log("Body:", req.body);

  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }

    const validStatuses = ["pending", "accepted", "rejected"];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        error: "Invalid status. Must be pending, accepted, or rejected.",
      });
    }

    // Price table for bazaar booths
    const BAZAAR_PRICE_TABLE = {
      "2x2": 300,
      "4x4": 1000,
    };

    const request = await BazaarApplication.findById(id).populate("bazaar");
    if (!request) {
      return res.status(404).json({ error: "Vendor request not found" });
    }

    // Update status and payment deadline using direct MongoDB update
    let paymentDeadline = null;
    const updateFields = {
      status: status.toLowerCase(),
    };

    if (status.toLowerCase() === "accepted") {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 14);
      updateFields.paymentDeadline = deadline;
      paymentDeadline = deadline;
    }

    // Use direct MongoDB update to bypass Mongoose validation
    await BazaarApplication.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateFields }
    );

    // Send email notification to vendor
    if (request.attendees && request.attendees.length > 0) {
      const vendorEmail = request.attendees[0].email;
      const vendorName = request.attendees[0].name;

      if (vendorEmail) {
        try {
          const nodemailer = require("nodemailer");
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });

          let emailSubject = "";
          let emailBody = "";

          if (status.toLowerCase() === "accepted") {
            const boothPrice = BAZAAR_PRICE_TABLE[request.boothSize] || 0;
            const bazaarTitle = request.bazaar?.title || "Bazaar Event";
            const deadlineStr = paymentDeadline
              ? paymentDeadline.toLocaleDateString()
              : "within 14 days";

            emailSubject = `Bazaar Vendor Application Accepted – ${bazaarTitle}`;
            emailBody = `Dear ${vendorName},

Congratulations! Your application for a ${request.boothSize} booth at ${bazaarTitle} has been ACCEPTED.

Application Details:
- Booth Size: ${request.boothSize}
- Price: ${boothPrice} EGP
- Payment Deadline: ${deadlineStr}

Please complete your payment before the deadline to secure your booth.

Best regards,
Eventity Team`;
          } else if (status.toLowerCase() === "rejected") {
            const bazaarTitle = request.bazaar?.title || "Bazaar Event";

            emailSubject = `Bazaar Vendor Application Status – ${bazaarTitle}`;
            emailBody = `Dear ${vendorName},

Thank you for your interest in participating at ${bazaarTitle}.

Unfortunately, your application for a ${request.boothSize} booth has not been accepted at this time.

If you have any questions, please contact us.

Best regards,
Eventity Team`;
          }

          if (emailSubject && emailBody) {
            await transporter.sendMail({
              from: `"Eventity" <${process.env.EMAIL_USER}>`,
              to: vendorEmail,
              subject: emailSubject,
              text: emailBody,
            });
            console.log(`Email sent successfully to ${vendorEmail}`);
          }
        } catch (emailErr) {
          console.error("Error sending email to vendor:", emailErr);
          // Don't fail the request if email fails
        }
      }
    }

    res.json({
      success: true,
      message: `Request ${status} successfully`,
      request,
    });
  } catch (err) {
    console.error("Error updating vendor request:", err);
    res.status(500).json({ error: "Server error updating vendor request" });
  }
});
router.post("/admin/send-qr-codes", async (req, res) => {
  let pdfPath;

  try {
    const { boothId, vendorEmail, vendorName } = req.body;

    if (!boothId || !vendorEmail) {
      return res.status(400).json({ error: "Missing required fields: boothId and vendorEmail" });
    }

    // Use BazaarApplication instead of BoothApplication
    const bazaarApplication = await BazaarApplication.findById(boothId);
    if (!bazaarApplication) {
      return res.status(404).json({ error: "Bazaar application not found" });
    }

    if (bazaarApplication.status !== "accepted") {
      return res.status(400).json({ error: "QR codes can only be sent for accepted bazaar applications" });
    }

    const attendees = bazaarApplication.attendees || [];
    if (attendees.length === 0) {
      return res.status(400).json({ error: "No attendees found for this bazaar application" });
    }

    // Create temporary directory
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generate PDF with QR codes
    pdfPath = path.join(tempDir, `qr-codes-${boothId}.pdf`);
    
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    const pageWidth = doc.page.width - 100;
    const qrSize = 140;
    const itemsPerRow = 2;
    const rowHeight = qrSize + 60;

    let currentY = 30;
    let currentX = 30;

    for (let i = 0; i < attendees.length; i++) {
      const attendee = attendees[i];
      
      if (currentY + rowHeight > doc.page.height - 80) {
        doc.addPage();
        currentY = 30;
        currentX = 30;
      }

      const qrData = `attendee:${attendee.email}|id:${attendee._id}`;
      const qrDataUrl = await QRCode.toDataURL(qrData, { width: qrSize });

      doc.image(qrDataUrl, currentX, currentY, { width: qrSize, height: qrSize });
      doc.fontSize(12).fillColor('#1F2937').text(`Email: ${attendee.email}`, currentX + qrSize + 20, currentY);
      doc.fontSize(10).fillColor('#6B7280').text(`Name: ${attendee.name}`, currentX + qrSize + 20, currentY + 25);

      currentX += qrSize + 180;
      if ((i + 1) % itemsPerRow === 0 || currentX + qrSize > pageWidth) {
        currentY += rowHeight;
        currentX = 30;
      }
    }

    // Add instructions page
    doc.addPage();
    doc.fontSize(12).fillColor('#374151').text('QR Code Instructions:', 30, 30);
    doc.fontSize(10).text('Each QR code is associated with a specific attendee and contains their unique identification information.', 30, 55);
    doc.text('Present the appropriate QR code at check-in stations to verify attendee presence.', 30, 70);
    doc.text(`This document contains QR codes for ${attendees.length} attendees associated with bazaar application ${boothId}.`, 30, 90);

    doc.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: vendorEmail,
      subject: `QR Codes for Your Bazaar Vendor Application ${boothId}`,
      text: `Dear ${vendorName},

Please find attached a PDF containing QR codes for all attendees associated with your bazaar vendor application.

This document contains ${attendees.length} individual QR codes, one for each registered attendee. Each QR code is accompanied by the corresponding attendee's name and email address.

These QR codes are required for attendee check-in and verification during the event. Please ensure that each attendee has access to their respective QR code.

If you have any questions regarding the QR codes or attendee management, please contact the event administration team.

Thank you,
Event Administration Team`,
      attachments: [
        {
          filename: `QR_Codes_Bazaar_${boothId}.pdf`,
          path: pdfPath,
        },
      ],
    };

    const emailResult = await transporter.sendMail(mailOptions);

    // Clean up the temporary PDF file
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }

    console.log(`QR codes email successfully sent to ${vendorEmail} for bazaar application ${boothId}, Message ID: ${emailResult.messageId}`);

    res.json({
      success: true,
      message: `QR codes have been successfully sent to ${vendorEmail}`,
      attendeeCount: attendees.length,
      messageId: emailResult.messageId
    });

  } catch (error) {
    console.error("Error in send-qr-codes endpoint:", error);
    
    // Clean up temporary file if it exists
    if (pdfPath && fs.existsSync(pdfPath)) {
      try {
        fs.unlinkSync(pdfPath);
      } catch (cleanupError) {
        console.error("Error cleaning up temporary PDF file:", cleanupError);
      }
    }

    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
