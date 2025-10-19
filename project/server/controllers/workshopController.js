const Workshop = require("../models/Workshop");
const Notification = require("../models/Notification");

// CREATE Workshop
exports.createWorkshop = async (req, res) => {
  try {
    console.log('Creating workshop with data:', req.body);
    const workshop = new Workshop(req.body);
    await workshop.save();
    console.log('Workshop created successfully:', workshop._id);
    res.status(201).json(workshop);
  } catch (err) {
    console.error('Error creating workshop:', err);
    res.status(400).json({ error: err.message });
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
    console.log('Fetching workshops for professor:', req.params.professorId);
    const workshops = await Workshop.find({ createdBy: req.params.professorId });
    console.log(`Found ${workshops.length} workshops for this professor`);
    res.status(200).json(workshops);
  } catch (err) {
    console.error('Error fetching professor workshops:', err);
    res.status(500).json({ error: err.message });
  }
};
// ... existing exports ...

// controllers/workshopController.js
exports.requestEdits = async (req, res) => {
  try {
    const { id } = req.params; // workshop ID
    const { message } = req.body;

    const workshop = await Workshop.findById(id);
    if (!workshop) return res.status(404).json({ error: "Workshop not found" });

    // Find the professor who owns this workshop
    const professor = await User.findById(workshop.professorId);
    if (!professor) return res.status(404).json({ error: "Professor not found" });

    // ✅ Create a notification for that specific professor
    await Notification.create({
      userId: professor._id,
      message: message || `Edit request for your workshop "${workshop.workshopName}"`,
      workshopId: workshop._id,
      type: "edit_request",
    });

    console.log(`📩 Notification sent to professor ${professor.email}`);

    res.status(200).json({ success: true, message: "Edit request sent successfully" });
  } catch (err) {
    console.error("Error in requestEdits:", err);
    res.status(500).json({ error: "Failed to send edit request" });
  }
};


// GET workshops NOT created by this professor
exports.getOtherWorkshops = async (req, res) => {
  try {
    console.log('Fetching other professors workshops, excluding:', req.params.professorId);
    const workshops = await Workshop.find({ createdBy: { $ne: req.params.professorId } });
    console.log(`Found ${workshops.length} workshops from other professors`);
    res.status(200).json(workshops);
  } catch (err) {
    console.error('Error fetching other workshops:', err);
    res.status(500).json({ error: err.message });
  }
};