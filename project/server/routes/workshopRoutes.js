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

router.post('/:id/request-edits', protect, adminOnly, requestEdits);
// CRUD routes
router.post("/", createWorkshop);
router.get("/", getAllWorkshops);
router.get("/:id", getWorkshopById);
router.put("/:id", updateWorkshop);
router.delete("/:id", deleteWorkshop);

// Filter routes
router.get("/mine/:professorId", getMyWorkshops);
router.get("/others/:professorId", getOtherWorkshops);

module.exports = router;
