const mongoose = require("mongoose");
const Workshop = require("../models/Workshop");
const Notification = require("../models/Notification");
const User = require("../models/User"); // Add this import

const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const sendCertificateEmail = require("../utils/mailer");

// CREATE Workshop
// CREATE Workshop + SEND NOTIFICATIONS TO BOTH SIDES
exports.createWorkshop = async (req, res) => {
  try {
    const workshop = new Workshop({
      ...req.body,
      createdBy: req.user._id,
      status: "pending",
    });

    await workshop.save();

    // -----------------------------
    // NOTIFICATIONS SECTION
    // -----------------------------

    // Get professor name
    const professor = await User.findById(req.user._id).select("name");
    const profName = professor?.name || "A professor";

    // Get all events officers
    const eventsOfficers = await User.find({ role: "events_officer" });

    const notificationsToCreate = [];

    // 1. Notify every Events Officer
    for (const officer of eventsOfficers) {
      notificationsToCreate.push({
        userId: officer._id,
        message: `New workshop submitted: "${workshop.workshopName}" by Prof. ${profName}`,
        type: "workshop_submission",
        workshopId: workshop._id,
        unread: true,
      });
    }

    // 2. Notify the Professor himself (confirmation)
    notificationsToCreate.push({
      userId: req.user._id,
      message: `Your workshop "${workshop.workshopName}" has been submitted and is pending approval`,
      type: "workshop_submitted",
      workshopId: workshop._id,
      unread: true,
    });

    // 🔥 3. NEW: Notify **all users** that a new workshop exists (same style as trips/bazaars)
    const allUsers = await User.find({}, "_id");

    allUsers.forEach((u) => {
      notificationsToCreate.push({
        userId: u._id,
        message: `A new workshop has been proposed: ${workshop.workshopName}`,
        type: "workshop",
        workshopId: workshop._id,
        unread: true,
      });
    });

    // Save all notifications at once
    if (notificationsToCreate.length > 0) {
      await Notification.insertMany(notificationsToCreate);
    }

    // -----------------------------
    // END NOTIFICATIONS
    // -----------------------------

    res.status(201).json(workshop);
  } catch (err) {
    console.error("CREATE WORKSHOP ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET all workshops
exports.getAllWorkshops = async (req, res) => {
  try {
    console.log("Fetching all workshops...");
    const workshops = await Workshop.find().sort({ createdAt: -1 });
    console.log(`Found ${workshops.length} workshops`);
    res.status(200).json(workshops);
  } catch (err) {
    console.error("Error fetching workshops:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ error: err.message });
  }
};

// GET workshop by ID
exports.getWorkshopById = async (req, res) => {
  try {
    console.log("Fetching workshop by ID:", req.params.id);
    const workshop = await Workshop.findById(req.params.id)
      .populate(
        "registeredUsers",
        "firstName lastName email role roleSpecificId"
      )
      .populate("createdBy", "firstName lastName email");
    if (!workshop) {
      console.log("Workshop not found");
      return res.status(404).json({ error: "Workshop not found" });
    }
    console.log("Workshop found:", workshop._id);
    res.status(200).json(workshop);
  } catch (err) {
    console.error("Error fetching workshop by ID:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE workshop
exports.updateWorkshop = async (req, res) => {
  try {
    console.log("Updating workshop:", req.params.id);
    console.log("Update data:", req.body);

    // 🔥 NEW: Fetch the original workshop to check for status change
    const originalWorkshop = await Workshop.findById(req.params.id);
    if (!originalWorkshop) {
      console.log("Workshop not found for update");
      return res.status(404).json({ error: "Workshop not found" });
    }

    const updated = await Workshop.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      console.log("Workshop not found for update");
      return res.status(404).json({ error: "Workshop not found" });
    }

    console.log("Workshop updated successfully:", updated._id);

    // 🔥 NEW: Check if status changed to "published" or "rejected"
    const statusChange =
      req.body.status && req.body.status !== originalWorkshop.status;
    if (statusChange) {
      const newStatus = req.body.status.toLowerCase();
      if (newStatus === "published" || newStatus === "rejected") {
        console.log(
          `🔄 Status changed to "${newStatus}" for workshop "${updated.workshopName}"`
        );

        // Resolve professor IDs: Start with createdBy (submitter)
        let professorIds = [originalWorkshop.createdBy];

        // If professorsParticipating is provided and different, add them
        if (updated.professorsParticipating) {
          let additionalProfs = [];
          if (Array.isArray(updated.professorsParticipating)) {
            // If array of ObjectIds
            additionalProfs = updated.professorsParticipating.filter(
              (id) => id.toString() !== originalWorkshop.createdBy.toString()
            );
          } else if (typeof updated.professorsParticipating === "string") {
            // If comma-separated names, lookup by name in User
            const profNames = updated.professorsParticipating
              .split(",")
              .map((name) => name.trim())
              .filter((name) => name);
            const users = await User.find(
              { name: { $in: profNames }, role: "professor" },
              "_id"
            ); // FIXED: Use 'name' for lookup
            additionalProfs = users.map((u) => u._id);
          }
          professorIds = [...new Set([...professorIds, ...additionalProfs])]; // Dedupe
        }

        // Create notifications for each professor
        const notificationsToCreate = [];
        for (const profId of professorIds) {
          notificationsToCreate.push({
            userId: profId,
            message: `Your workshop "${updated.workshopName}" has been ${newStatus}!`,
            type: "workshop_status",
            eventType: "workshop", // For polymorphic ref
            workshopId: updated._id,
            unread: true,
          });
        }

        // Save all at once
        if (notificationsToCreate.length > 0) {
          await Notification.insertMany(notificationsToCreate);
          console.log(
            `📩 Created ${notificationsToCreate.length} status notifications`
          );
        }
      }
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating workshop:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

// DELETE workshop
exports.deleteWorkshop = async (req, res) => {
  try {
    console.log("Deleting workshop:", req.params.id);
    const deleted = await Workshop.findByIdAndDelete(req.params.id);
    if (!deleted) {
      console.log("Workshop not found for deletion");
      return res.status(404).json({ error: "Workshop not found" });
    }
    console.log("Workshop deleted successfully:", deleted._id);
    res.status(200).json({ message: "Workshop deleted successfully" });
  } catch (err) {
    console.error("Error deleting workshop:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET workshops by professor ID
exports.getMyWorkshops = async (req, res) => {
  try {
    const userId = req.user._id;
    const workshops = await Workshop.find({ createdBy: userId });
    res.status(200).json(
      workshops.map((w) => ({
        ...w.toObject(),
        createdBy: w.createdBy.toString(), // ✅ convert ObjectId to string
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET workshops NOT created by this professor
exports.getOtherWorkshops = async (req, res) => {
  try {
    const userId = req.user._id;
    const workshops = await Workshop.find({ createdBy: { $ne: userId } });
    res.status(200).json(
      workshops.map((w) => ({
        ...w.toObject(),
        createdBy: w.createdBy.toString(), // ✅ convert ObjectId to string
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// NEW: GET participants controller
exports.getParticipants = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id)
      .populate(
        "registeredUsers",
        "firstName lastName email role roleSpecificId"
      )
      .populate("attendedUsers", "firstName lastName email role roleSpecificId")
      .populate("createdBy", "firstName lastName email");

    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    // Check ownership (only creator can access)
    if (workshop.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({
      workshop,
      registeredUsers: workshop.registeredUsers,
      attendedUsers: workshop.attendedUsers,
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// NEW: POST send-certificates controller


// controllers/workshopController.js
// controllers/workshopController.js
exports.requestEdits = async (req, res) => {
  try {
    const { id } = req.params; // Workshop ID
    const { message } = req.body;

    const workshop = await Workshop.findById(id);
    if (!workshop) {
      return res.status(404).json({ error: "Workshop not found" });
    }

    const createdByStr = workshop.createdBy;
    if (!createdByStr || !mongoose.Types.ObjectId.isValid(createdByStr)) {
      console.warn(`Invalid or missing createdBy ID: ${createdByStr}`);
      return res
        .status(400)
        .json({ error: "Invalid professor ID in workshop" });
    }

    const professorId = new mongoose.Types.ObjectId(createdByStr);

    const professor = await User.findById(professorId).select("name email");
    if (!professor) {
      const admin = await User.findOne({ role: "admin" }).select("email");
      if (!admin) {
        return res
          .status(500)
          .json({
            error: "No professor or admin found to receive edit request",
          });
      }

      await Notification.create({
        userId: admin._id,
        message: `Edit request for workshop "${workshop.workshopName}" (original professor missing): ${message}`,
        workshopId: workshop._id,
        type: "edit_request",
        unread: true,
      });

      console.log(`📩 Notification sent to admin ${admin.email}`);
    } else {
      await Notification.create({
        userId: professor._id,
        message:
          message || `Edit request for workshop "${workshop.workshopName}"`,
        workshopId: workshop._id,
        type: "edit_request",
        unread: true,
      });

      console.log(`📩 Notification sent to professor ${professor.email}`);
    }

    res
      .status(200)
      .json({ success: true, message: "Edit request sent successfully" });
  } catch (err) {
    console.error("Error in requestEdits:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ ✅ ✅ THIS MUST BE OUTSIDE — SEPARATE EXPORT
exports.sendBatchCertificates = async (req, res) => {
  try {
    const { participantIds } = req.body;
    const workshopId = req.params.id;

    if (!participantIds || !Array.isArray(participantIds)) {
      return res.status(400).json({ error: "participantIds must be an array" });
    }

    console.log("✅ Sending certificates to:", participantIds);
    console.log("✅ Workshop:", workshopId);

    // ✅ Get workshop
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ error: "Workshop not found" });
    }

    let sentCount = 0;

    for (const userId of participantIds) {
      const user = await User.findById(userId).select("name email role");
      if (!user || !user.email) continue;

      // ✅ Generate PDF
      const pdfBuffer = await new Promise((resolve) => {
        const doc = new PDFDocument({ size: "A4" });
        const buffers = [];

        doc.on("data", (data) => buffers.push(data));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        doc.fontSize(26).text("Certificate of Attendance", { align: "center" });
        doc.moveDown(2);
        doc.fontSize(18).text("This certifies that", { align: "center" });
        doc.moveDown();
        doc.fontSize(22).text(user.name, { align: "center" });
        doc.moveDown();
        doc.fontSize(16).text("has successfully attended the workshop", {
          align: "center",
        });
        doc.moveDown();
        doc.fontSize(18).text(workshop.workshopName, { align: "center" });
        doc.moveDown(2);
        doc.fontSize(12).text(
          `Issued on: ${new Date().toDateString()}`,
          { align: "center" }
        );

        doc.end();
      });

      // ✅ Send REAL 
      
     await sendCertificateEmail(
  user.email,
  user.name,
  workshop.workshopName,
  pdfBuffer
);


      sentCount++;
      console.log(`✅ Sent to ${user.email}`);
    }

    return res.status(200).json({
      sentCount,
      message: "✅ Certificates sent successfully via email",
    });

  } catch (err) {
    console.error("❌ Certificate Error:", err);
    return res.status(500).json({ error: "Failed to send certificates" });
  }
};

