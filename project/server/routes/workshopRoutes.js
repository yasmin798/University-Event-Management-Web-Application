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
