const express = require("express");
const router = express.Router();
const { register, login, profile } = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");

// Register route
router.post("/register", register);

// Login route
router.post("/login", login);

// Profile route (protected)
router.get("/profile", verifyToken, profile);

module.exports = router;
