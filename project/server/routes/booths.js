const express = require("express");
const router = express.Router();
const boothController = require("../controllers/boothController");

router.post("/", boothController.createBooth);
router.get("/", boothController.getAllBooths);
router.get("/:id", boothController.getBoothById);
router.put("/:id", boothController.updateBooth);
router.delete("/:id", boothController.deleteBooth);

module.exports = router;
