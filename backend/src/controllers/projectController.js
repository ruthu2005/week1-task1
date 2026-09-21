/**
 * projectController.js — Projects Controller (async sqlite3)
 */

const { dbRun, dbGet, dbAll } = require("../db");

/** GET /api/projects */
const getProjects = async (req, res) => {
  try {
    const projects = await dbAll(
      `SELECT p.id, p.name, p.description, p.owner_id, p.created_at, p.updated_at,
              u.name AS owner_name,
              COUNT(t.id) AS task_count
       FROM projects p
       LEFT JOIN users u ON u.id = p.owner_id
       LEFT JOIN tasks t ON t.project_id = p.id
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      []
    );
    res.status(200).json({ success: true, data: projects });
  } catch (err) {
    console.error("GetProjects error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** GET /api/projects/:id */
const getProject = async (req, res) => {
  try {
    const project = await dbGet(
      `SELECT p.*, u.name AS owner_name FROM projects p
       LEFT JOIN users u ON u.id = p.owner_id WHERE p.id = ?`,
      [req.params.id]
    );
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });
    res.status(200).json({ success: true, data: project });
  } catch (err) {
    console.error("GetProject error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** POST /api/projects */
const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ success: false, message: "Project name is required." });

    const { lastID } = await dbRun(
      "INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)",
      [name.trim(), description || "", req.user.id]
    );
    const project = await dbGet("SELECT * FROM projects WHERE id = ?", [lastID]);
    res.status(201).json({ success: true, message: "Project created.", data: project });
  } catch (err) {
    console.error("CreateProject error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** PUT /api/projects/:id */
const updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const { id } = req.params;
    const existing = await dbGet("SELECT * FROM projects WHERE id = ?", [id]);
    if (!existing) return res.status(404).json({ success: false, message: "Project not found." });

    await dbRun(
      `UPDATE projects SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name !== undefined ? name.trim() : existing.name, description !== undefined ? description : existing.description, id]
    );
    const updated = await dbGet("SELECT * FROM projects WHERE id = ?", [id]);
    res.status(200).json({ success: true, message: "Project updated.", data: updated });
  } catch (err) {
    console.error("UpdateProject error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** DELETE /api/projects/:id */
const deleteProject = async (req, res) => {
  try {
    const existing = await dbGet("SELECT id FROM projects WHERE id = ?", [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: "Project not found." });
    await dbRun("DELETE FROM projects WHERE id = ?", [req.params.id]);
    res.status(200).json({ success: true, message: "Project deleted." });
  } catch (err) {
    console.error("DeleteProject error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject };
