const Workshop = require("../models/Workshop");

// CREATE Workshop
exports.createWorkshop = async (req, res) => {
  try {
    const workshop = new Workshop(req.body);
    await workshop.save();
    res.status(201).json(workshop);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET all workshops
exports.getAllWorkshops = async (req, res) => {
  try {
    const workshops = await Workshop.find().sort({ createdAt: -1 });
    res.json(workshops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET workshop by ID
exports.getWorkshopById = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) return res.status(404).json({ error: "Workshop not found" });
    res.json(workshop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE workshop
exports.updateWorkshop = async (req, res) => {
  try {
    const updated = await Workshop.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Workshop not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE workshop
exports.deleteWorkshop = async (req, res) => {
  try {
    const deleted = await Workshop.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Workshop not found" });
    res.json({ message: "Workshop deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET workshops by professor ID
exports.getMyWorkshops = async (req, res) => {
  try {
    const workshops = await Workshop.find({ createdBy: req.params.professorId });
    res.json(workshops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET workshops NOT created by this professor
exports.getOtherWorkshops = async (req, res) => {
  try {
    const workshops = await Workshop.find({ createdBy: { $ne: req.params.professorId } });
    res.json(workshops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
