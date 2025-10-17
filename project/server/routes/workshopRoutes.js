const express = require("express");
const router = express.Router();
const {
  createWorkshop,
  getAllWorkshops,
  getWorkshopById,
  updateWorkshop,
  deleteWorkshop,
  getMyWorkshops,
  getOtherWorkshops
} = require("../controllers/workshopController");
// ... existing routes ...
const { requestEdits } = require('../controllers/workshopController');
const { protect, adminOnly } = require('../middleware/auth'); // Assuming adminOnly exists

// Protected actions
router.post('/:id/request-edits', protect, adminOnly, requestEdits);

// ⚠️ IMPORTANT: specific/filter routes MUST come BEFORE parametric routes
router.get('/mine/:professorId', getMyWorkshops);
router.get('/others/:professorId', getOtherWorkshops);

// CRUD routes (general paths)
router.post('/', createWorkshop);
router.get('/', getAllWorkshops);
router.get('/:id', getWorkshopById); // This catches everything not matched above
router.put('/:id', updateWorkshop);
router.delete('/:id', deleteWorkshop);

module.exports = router;