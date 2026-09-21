/**
 * routes/auth.js — Auth Routes
 */

const express = require("express");
const router = express.Router();
const { register, login, getMe, getUsers } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes (require valid JWT)
router.get("/me", protect, getMe);
router.get("/users", protect, getUsers);

module.exports = router;
