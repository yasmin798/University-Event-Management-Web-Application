const BoothApplication = require("../models/BoothApplication");

// CREATE Booth
exports.createBooth = async (req, res) => {
  try {
    console.log("Creating booth:", req.body);
    const booth = new BoothApplication(req.body);
    await booth.save();
    res.status(201).json(booth);
  } catch (err) {
    console.error("Error creating booth:", err);
    res.status(400).json({ error: err.message });
  }
};

// GET all booths
exports.getAllBooths = async (req, res) => {
  try {
    console.log("Fetching all booths...");
    const booths = await BoothApplication.find().sort({ createdAt: -1 });
    res.status(200).json(booths);
  } catch (err) {
    console.error("Error fetching booths:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET booth by ID
exports.getBoothById = async (req, res) => {
  try {
    const booth = await BoothApplication.findById(req.params.id);
    if (!booth) return res.status(404).json({ error: "Booth not found" });
    res.status(200).json(booth);
  } catch (err) {
    console.error("Error fetching booth:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE booth
exports.updateBooth = async (req, res) => {
  try {
    const updated = await BoothApplication.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: "Booth not found" });
    res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating booth:", err);
    res.status(400).json({ error: err.message });
  }
};

// DELETE booth
exports.deleteBooth = async (req, res) => {
  try {
    console.log("Deleting booth:", req.params.id);
    const deleted = await BoothApplication.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Booth not found" });
    res.status(200).json({ message: "Booth deleted successfully" });
  } catch (err) {
    console.error("Error deleting booth:", err);
    res.status(500).json({ error: err.message });
  }
};
