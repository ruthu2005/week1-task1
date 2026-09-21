/**
 * routes/tasks.js — Task Routes
 */

const express = require("express");
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getStats,
} = require("../controllers/taskController");
const { protect, adminOnly } = require("../middleware/auth");

// All task routes require authentication
router.use(protect);

router.get("/stats", getStats);   // Must be before /:id to avoid conflict
router.get("/", getTasks);
router.get("/:id", getTask);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", adminOnly, deleteTask);

module.exports = router;
