const mongoose = require("mongoose");
const Workshop = require("../models/Workshop");
const Notification = require("../models/Notification");
const User = require("../models/User"); // Add this import

const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

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
    console.log('Fetching all workshops...');
    const workshops = await Workshop.find().sort({ createdAt: -1 });
    console.log(`Found ${workshops.length} workshops`);
    res.status(200).json(workshops);
  } catch (err) {
    console.error('Error fetching workshops:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: err.message });
  }
};

// GET workshop by ID
exports.getWorkshopById = async (req, res) => {
  try {
    console.log('Fetching workshop by ID:', req.params.id);
    const workshop = await Workshop.findById(req.params.id)
      .populate('registeredUsers', 'name email role') // FIXED: Use 'name' (based on logs showing email/role but no name/fullName)
      .populate('createdBy', 'name'); // FIXED: Use 'name'
    if (!workshop) {
      console.log('Workshop not found');
      return res.status(404).json({ error: "Workshop not found" });
    }
    console.log('Workshop found:', workshop._id);
    res.status(200).json(workshop);
  } catch (err) {
    console.error('Error fetching workshop by ID:', err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE workshop
exports.updateWorkshop = async (req, res) => {
  try {
    console.log('Updating workshop:', req.params.id);
    console.log('Update data:', req.body);

    // 🔥 NEW: Fetch the original workshop to check for status change
    const originalWorkshop = await Workshop.findById(req.params.id);
    if (!originalWorkshop) {
      console.log('Workshop not found for update');
      return res.status(404).json({ error: "Workshop not found" });
    }

    const updated = await Workshop.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { 
        new: true,
        runValidators: true 
      }
    );

    if (!updated) {
      console.log('Workshop not found for update');
      return res.status(404).json({ error: "Workshop not found" });
    }

    console.log('Workshop updated successfully:', updated._id);

    // 🔥 NEW: Check if status changed to "published" or "rejected"
    const statusChange = req.body.status && req.body.status !== originalWorkshop.status;
    if (statusChange) {
      const newStatus = req.body.status.toLowerCase();
      if (newStatus === "published" || newStatus === "rejected") {
        console.log(`🔄 Status changed to "${newStatus}" for workshop "${updated.workshopName}"`);

        // Resolve professor IDs: Start with createdBy (submitter)
        let professorIds = [originalWorkshop.createdBy];

        // If professorsParticipating is provided and different, add them
        if (updated.professorsParticipating) {
          let additionalProfs = [];
          if (Array.isArray(updated.professorsParticipating)) {
            // If array of ObjectIds
            additionalProfs = updated.professorsParticipating.filter(id => id.toString() !== originalWorkshop.createdBy.toString());
          } else if (typeof updated.professorsParticipating === 'string') {
            // If comma-separated names, lookup by name in User
            const profNames = updated.professorsParticipating.split(',').map(name => name.trim()).filter(name => name);
            const users = await User.find({ name: { $in: profNames }, role: "professor" }, '_id'); // FIXED: Use 'name' for lookup
            additionalProfs = users.map(u => u._id);
          }
          professorIds = [...new Set([...professorIds, ...additionalProfs])];  // Dedupe
        }

        // Create notifications for each professor
        const notificationsToCreate = [];
        for (const profId of professorIds) {
          notificationsToCreate.push({
            userId: profId,
            message: `Your workshop "${updated.workshopName}" has been ${newStatus}!`,
            type: "workshop_status",
            eventType: "workshop",  // For polymorphic ref
            workshopId: updated._id,
            unread: true,
          });
        }

        // Save all at once
        if (notificationsToCreate.length > 0) {
          await Notification.insertMany(notificationsToCreate);
          console.log(`📩 Created ${notificationsToCreate.length} status notifications`);
        }
      }
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error('Error updating workshop:', err);
    res.status(400).json({ error: err.message });
  }
};

// DELETE workshop
exports.deleteWorkshop = async (req, res) => {
  try {
    console.log('Deleting workshop:', req.params.id);
    const deleted = await Workshop.findByIdAndDelete(req.params.id);
    if (!deleted) {
      console.log('Workshop not found for deletion');
      return res.status(404).json({ error: "Workshop not found" });
    }
    console.log('Workshop deleted successfully:', deleted._id);
    res.status(200).json({ message: "Workshop deleted successfully" });
  } catch (err) {
    console.error('Error deleting workshop:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET workshops by professor ID
exports.getMyWorkshops = async (req, res) => {
  try {
    const userId = req.user._id; 
    const workshops = await Workshop.find({ createdBy: userId });
    res.status(200).json(
      workshops.map(w => ({
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
      workshops.map(w => ({
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
      .populate('registeredUsers', 'name email role') // FIXED: Use 'name'
      .populate('attendedUsers', 'name email role') // FIXED: Use 'name'
      .populate('createdBy', 'name'); // FIXED: Use 'name'

    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    // Check ownership (only creator can access)
    if (workshop.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      workshop,
      registeredUsers: workshop.registeredUsers,
      attendedUsers: workshop.attendedUsers,
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// NEW: POST send-certificates controller
exports.sendCertificates = async (req, res) => {
  try {
    const { attendedUserIds } = req.body; // Array of user _id strings
    if (!Array.isArray(attendedUserIds) || attendedUserIds.length === 0) {
      return res.status(400).json({ message: 'No users selected' });
    }

    const workshop = await Workshop.findById(req.params.id).populate('createdBy', 'name'); // FIXED: Use 'name'

    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    if (workshop.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate users are in registeredUsers (fetch populated for check)
    const populatedWorkshop = await Workshop.findById(req.params.id).populate('registeredUsers', '_id');
    const invalidUsers = attendedUserIds.filter(id => 
      !populatedWorkshop.registeredUsers.some(u => u._id.toString() === id)
    );
    if (invalidUsers.length > 0) {
      return res.status(400).json({ message: 'Some users not registered' });
    }

    // Setup nodemailer transporter (configure with your SMTP, e.g., Gmail)
    const transporter = nodemailer.createTransporter({
      service: 'gmail', // Or your provider
      auth: {
        user: process.env.EMAIL_USER, // Env var
        pass: process.env.EMAIL_PASS, // App password
      },
    });

    const attendedObjs = []; // To push to attendedUsers

    for (const userIdStr of attendedUserIds) {
      const user = await User.findById(userIdStr).select('name email role'); // FIXED: Use 'name'
      if (!user) continue; // Skip invalid

      // Generate PDF certificate
      const doc = new PDFDocument();
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', async () => {
        const pdfBuffer = Buffer.concat(chunks);

        // Send email
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: `Certificate of Attendance: ${workshop.workshopName}`,
          text: `Dear ${user.name},\n\nYou have successfully completed the workshop "${workshop.workshopName}" on ${new Date(workshop.startDateTime).toLocaleDateString()}.\n\nPlease find your certificate attached.\n\nBest regards,\nWorkshop Team`, // FIXED: Use 'name'
          attachments: [{
            filename: `Certificate_${workshop.workshopName}_${user.name.replace(/\s+/g, '_')}.pdf`, // FIXED: Use 'name'
            content: pdfBuffer,
          }],
        });
      });

      // Build PDF content (simple template)
      doc.fontSize(20).text('Certificate of Attendance', 100, 100);
      doc.fontSize(12).text(`This certifies that`, 100, 150);
      doc.fontSize(16).text(user.name, 100, 170); // FIXED: Use 'name'
      doc.text(`${user.role.toUpperCase()}`, 100, 190);
      doc.text(`has attended and completed the workshop`, 100, 220);
      doc.fontSize(18).text(workshop.workshopName, 100, 240);
      doc.text(`Held on: ${new Date(workshop.startDateTime).toLocaleDateString()} - ${new Date(workshop.endDateTime).toLocaleDateString()}`, 100, 270);
      doc.text(`Location: ${workshop.location}`, 100, 290);
      doc.text(`Issued on: ${new Date().toLocaleDateString()}`, 100, 320);
      // Add signature/space or image if needed
      doc.end();

      attendedObjs.push(user._id);
    }

    // Update workshop: remove from registered, add to attended
    workshop.registeredUsers = workshop.registeredUsers.filter(u => 
      !attendedUserIds.includes(u._id.toString())
    );
    workshop.attendedUsers.push(...attendedObjs);
    await workshop.save();

    // Repopulate for response
    await workshop.populate('attendedUsers', 'name email role'); // FIXED: Use 'name'

    res.json({
      message: `Certificates sent to ${attendedUserIds.length} users`,
      updatedAttendedCount: workshop.attendedUsers.length,
    });
  } catch (error) {
    console.error('Error sending certificates:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// controllers/workshopController.js
exports.requestEdits = async (req, res) => {
  try {
    const { id } = req.params; // Workshop ID
    const { message } = req.body;

    // Find the workshop
    const workshop = await Workshop.findById(id);
    if (!workshop) {
      return res.status(404).json({ error: "Workshop not found" });
    }

    // Get the createdBy string and convert to ObjectId if valid
    const createdByStr = workshop.createdBy;
    if (!createdByStr || !mongoose.Types.ObjectId.isValid(createdByStr)) {
      console.warn(`Invalid or missing createdBy ID: ${createdByStr}`);
      return res.status(400).json({ error: "Invalid professor ID in workshop" });
    }

    const professorId = new mongoose.Types.ObjectId(createdByStr); // Convert string to ObjectId

    // Find the professor using the ObjectId
    const professor = await User.findById(professorId).select('name email'); // FIXED: Use 'name'
    if (!professor) {
      console.warn(`Professor not found for ID: ${createdByStr}`);
      // Optional: Fallback to admin
      const admin = await User.findOne({ role: "admin" }).select('email'); // FIXED: Select email
      if (!admin) {
        return res.status(500).json({ error: "No professor or admin found to receive edit request" });
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
        message: message || `Edit request for workshop "${workshop.workshopName}"`,
        workshopId: workshop._id,
        type: "edit_request",
        unread: true,
      });
      console.log(`📩 Notification sent to professor ${professor.email}`);
    }

    // Do NOT update status to keep buttons visible in EventsHome
    // workshop.status = "edits_requested";
    // await workshop.save();

    res.status(200).json({ success: true, message: "Edit request sent successfully" });
  } catch (err) {
    console.error("Error in requestEdits:", err);
    res.status(500).json({ error: "Server error" });
  }
};