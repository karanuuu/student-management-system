const express = require("express");
const router = express.Router();
const { register, login, profile } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

// Register route
router.post("/register", register);

// Login route
router.post("/login", login);

// Profile route (protected)
router.get("/profile", authMiddleware, profile);

module.exports = router;
