const mongoose = require("mongoose");
const Workshop = require("../models/Workshop");
const Notification = require("../models/Notification");
const User = require("../models/User"); // Add this import

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
    const workshop = await Workshop.findById(req.params.id);
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
    const updated = await Workshop.findByIdAndUpdate(req.params.id, req.body, { 
      new: true,
      runValidators: true 
    });
    if (!updated) {
      console.log('Workshop not found for update');
      return res.status(404).json({ error: "Workshop not found" });
    }
    console.log('Workshop updated successfully:', updated._id);
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

// ... existing exports ...

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
    const professor = await User.findById(professorId);
    if (!professor) {
      console.warn(`Professor not found for ID: ${createdByStr}`);
      // Optional: Fallback to admin
      const admin = await User.findOne({ role: "admin" });
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