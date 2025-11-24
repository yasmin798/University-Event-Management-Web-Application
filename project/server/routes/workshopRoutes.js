const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Notification = require("../models/Notification");

const {
  createWorkshop,
  getAllWorkshops,
  getWorkshopById,
  updateWorkshop,
  deleteWorkshop,
  getMyWorkshops,
  getOtherWorkshops,
  getMine,
  getOthers,
} = require("../controllers/workshopController");
// ... existing routes ...
const { requestEdits } = require('../controllers/workshopController');
const { protect, adminOnly } = require('../middleware/auth'); // Assuming adminOnly exists
router.post('/', protect, createWorkshop);
// Protected actions
router.post('/:id/request-edits', protect, (req, res, next) => {
  if (!["admin", "events_office"].includes(req.user.role)) {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
}, requestEdits);


// ⚠️ IMPORTANT: specific/filter routes MUST come BEFORE parametric routes
router.get('/mine', protect, getMyWorkshops);
router.get('/others', protect, getOtherWorkshops);
router.post("/workshops", protect, createWorkshop);
router.get("/workshops/mine", protect, getMyWorkshops);
router.get("/workshops/others", protect, getOtherWorkshops);


// CRUD routes (general paths)
router.post('/', createWorkshop);
router.get('/', getAllWorkshops);
router.get('/:id', getWorkshopById); // This catches everything not matched above
router.put('/:id', updateWorkshop);
router.delete('/:id', deleteWorkshop);

module.exports = router;