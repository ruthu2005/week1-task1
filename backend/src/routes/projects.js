/**
 * routes/projects.js — Project Routes
 */

const express = require("express");
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");
const { protect, adminOnly } = require("../middleware/auth");

// All project routes require authentication
router.use(protect);

router.get("/", getProjects);
router.get("/:id", getProject);

// Admin-only mutations
router.post("/", adminOnly, createProject);
router.put("/:id", adminOnly, updateProject);
router.delete("/:id", adminOnly, deleteProject);

module.exports = router;
