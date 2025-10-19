const express = require("express");
const router = express.Router();
const { createUser } = require("../controllers/adminController");

// Create Admin or Event Office
router.post("/create-user", createUser);
router.post('/create-user', createUser);

module.exports = router;