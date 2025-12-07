// server/routes/boothApplications.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const BoothApplication = require("../models/BoothApplication");
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
    const safe = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    cb(null, safe);
  },
});

const upload = multer({ storage });

// Create new booth application
// Expects multipart/form-data with `attendees` (JSON string) and `idFiles` array
router.post("/", upload.array("idFiles", 5), async (req, res) => {
  try {
    const { boothSize, durationWeeks, platformSlot, startDateTime } = req.body;

    let attendees = req.body.attendees;
    if (typeof attendees === "string") {
      try {
        attendees = JSON.parse(attendees);
      } catch (e) {
        return res.status(400).json({ error: "Invalid attendees JSON" });
      }
    }
    const files = req.files || [];

    if (!Array.isArray(attendees) || attendees.length < 1 || attendees.length > 5)
      return res.status(400).json({ error: "attendees must be array of 1-5" });
    if (!["2x2", "4x4"].includes(boothSize))
      return res.status(400).json({ error: "invalid boothSize" });
    if (![1, 2, 3, 4].includes(Number(durationWeeks)))
      return res.status(400).json({ error: "durationWeeks must be 1-4" });
    if (!["B1", "B2", "B3", "B4", "B5"].includes(platformSlot))
      return res.status(400).json({ error: "invalid platformSlot" });

    if (files.length !== attendees.length) {
      return res.status(400).json({ error: "An ID file must be uploaded for every attendee (field name 'idFiles')." });
    }

    // Attach file paths to attendees
    for (let i = 0; i < attendees.length; i++) {
      const a = attendees[i];
      if (!a.name || !a.name.trim()) return res.status(400).json({ error: `Attendee ${i + 1}: name is required` });
      if (!a.email || !a.email.trim()) return res.status(400).json({ error: `Attendee ${i + 1}: email is required` });
      if (!/^\S+@\S+\.\S+$/.test(a.email.trim())) return res.status(400).json({ error: `Attendee ${i + 1}: invalid email format` });
      const file = files[i];
      if (!file) return res.status(400).json({ error: `Missing ID file for attendee ${i + 1}` });
      a.idDocument = `/uploads/ids/${path.basename(file.path)}`;
      a.attendingEntireDuration = true;
    }
    // Calculate end date automatically
let start = startDateTime ? new Date(startDateTime) : null;
let end = start
  ? new Date(start.getTime() + Number(durationWeeks) * 7 * 24 * 60 * 60 * 1000)
  : null;


    const doc = new BoothApplication({
      attendees: attendees.map(a => ({
        name: a.name.trim(),
        email: a.email.trim(),
        idDocument: a.idDocument,
        attendingEntireDuration: !!a.attendingEntireDuration,
      })),
      boothSize,
      durationWeeks,
      platformSlot,
       startDateTime: start,
  endDateTime: end,
    });

    const saved = await doc.save();
    res.status(201).json(saved);

    // Notify Events Office and Admin users about new pending booth vendor application
    try {
      const recipients = await User.find({ role: { $in: ["events_office", "admin"] }, status: "active" }).select("_id email role");
      const baz = await Bazaar.findById(doc.bazaar);
      const message = `New booth vendor application pending${baz ? ` for bazaar '${baz.title}'` : ''}. Application ID: ${saved._id}`;
      const notifPromises = recipients.map(u => {
        const n = new Notification({
          userId: u._id,
          message,
          type: 'vendor_application'
        });
        return n.save();
      });
      await Promise.all(notifPromises);
    } catch (nerr) {
      console.error("Failed to create notifications for recipients:", nerr);
    }
  } catch (err) {
    console.error("POST /api/booth-applications error:", err);
    res.status(500).json({ error: "Failed to create booth application" });
  }
});

// Get all booth applications
router.get("/", async (req, res) => {
  try {
    const list = await BoothApplication.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch booth applications" });
  }
});
// Add this route to your boothApplications.js file, preferably after the existing routes

// Add this route to the end of your boothApplications.js file, before the module.exports


// Get applications for a bazaar
router.get("/bazaar/:bazaarId", async (req, res) => {
  try {
    const { bazaarId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(bazaarId)) return res.status(400).json({ error: "invalid bazaar id" });
    const list = await BoothApplication.find({ bazaar: bazaarId }).populate("bazaar").sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch booth applications for bazaar" });
  }
});

// Update application status (admin)
router.patch("/:id", /* adminOnly, */ async (req, res) => {
  try {
   const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ error: "status is required" });
    const s = String(status).toLowerCase();

    if (!["pending", "accepted", "rejected"].includes(s))
      return res.status(400).json({ error: "invalid status" });

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "invalid id" });

    const doc = await BoothApplication.findById(id);
    if (!doc) return res.status(404).json({ error: "Application not found" });

    // update status
    doc.status = s;

    // ADD DEADLINE WHEN ACCEPTED
    if (s === "accepted") {
      let now = new Date();
      doc.acceptedAt = now;
      doc.paymentDeadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    }

    await doc.save();

    // ======================================================
        // 🔔 SEND NOTIFICATION TO ALL USERS ONLY IF ACCEPTED
        // ======================================================
        if (s === "accepted") {
  const users = await User.find({}, "_id");

  const boothTitle =
    doc.boothTitle ||
    (doc.attendees?.length > 0 && doc.attendees[0].name
      ? `by ${doc.attendees[0].name}`
      : `Booth at platform ${doc.platformSlot}`);

  const notifications = users.map((u) => ({
    userId: u._id,
    message: `A new booth has been opened: ${boothTitle}`,
    type: "booth_announcement",
    boothId: doc._id,
    unread: true,
  }));

  await Notification.insertMany(notifications);
}

        // ======================================================
    res.json({ success: true, application: doc });
  } catch (err) {
    console.error("PATCH /api/booth-applications/:id error:", err);
    res.status(500).json({ error: "Failed to update application" });
  }
});

// Optionally: delete application
router.delete("/:id", /* adminOnly, */ async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "invalid id" });
    await BoothApplication.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/booth-applications/:id error:", err);
    res.status(500).json({ error: "Failed to delete application" });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "invalid id" });
    await BoothApplication.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/booth-applications/:id error:", err);
    res.status(500).json({ error: "Failed to delete application" });
  }
});
router.post("/admin/send-qr-codes", async (req, res) => {
  let pdfPath;

  try {
    const { boothId, vendorEmail, vendorName, subject, body } = req.body;

    if (!boothId || !vendorEmail) {
      return res.status(400).json({ error: "Missing required fields: boothId and vendorEmail" });
    }

    const boothApplication = await BoothApplication.findById(boothId);
    if (!boothApplication) {
      return res.status(404).json({ error: "Booth application not found" });
    }

    if (boothApplication.status !== "accepted") {
      return res.status(400).json({ error: "QR codes can only be sent for accepted booth applications" });
    }

    const attendees = boothApplication.attendees || [];
    if (attendees.length === 0) {
      return res.status(400).json({ error: "No attendees found for this booth application" });
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

    doc.addPage();
    doc.fontSize(12).fillColor('#374151').text('QR Code Instructions:', 30, 30);
    doc.fontSize(10).text('Each QR code is associated with a specific attendee and contains their unique identification information.', 30, 55);
    doc.text('Present the appropriate QR code at check-in stations to verify attendee presence.', 30, 70);
    doc.text(`This document contains QR codes for ${attendees.length} attendees associated with booth application ${boothId}.`, 30, 90);

    doc.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Create nodemailer transporter using your existing email configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify the transporter configuration
    await transporter.verify();

    const emailDefaultSubject = `QR Codes for Your Booth Application ${boothId}`;
    const emailDefaultBody = `Dear ${vendorName},

Please find attached a PDF containing QR codes for all attendees associated with your booth application.

This document contains ${attendees.length} individual QR codes, one for each registered attendee. Each QR code is accompanied by the corresponding attendee's name and email address.

These QR codes are required for attendee check-in and verification during the event. Please ensure that each attendee has access to their respective QR code.

If you have any questions regarding the QR codes or attendee management, please contact the event administration team.

Thank you,
Event Administration Team`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: vendorEmail,
      subject: subject || emailDefaultSubject, // use custom subject if provided
      text: body || emailDefaultBody,         // use custom body if provided
      attachments: [
        {
          filename: `QR_Codes_Booth_${boothId}.pdf`,
          path: pdfPath,
        },
      ],
    };

    const emailResult = await transporter.sendMail(mailOptions);

    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }

    console.log(
      `QR codes email successfully sent to ${vendorEmail} for booth ${boothId}, Message ID: ${emailResult.messageId}`
    );

    res.json({
      success: true,
      message: `QR codes have been successfully sent to ${vendorEmail}`,
      attendeeCount: attendees.length,
      messageId: emailResult.messageId,
    });
  } catch (error) {
    console.error("Error in send-qr-codes endpoint:", error);

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
