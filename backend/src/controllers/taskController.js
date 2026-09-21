/**
 * taskController.js — Tasks Controller (async sqlite3)
 */

const { dbRun, dbGet, dbAll } = require("../db");

/** GET /api/tasks */
const getTasks = async (req, res) => {
  try {
    const { project_id, status, assignee_id } = req.query;
    const params = [];
    let where = "WHERE 1=1";

    if (project_id) { where += " AND t.project_id = ?"; params.push(project_id); }
    if (status)     { where += " AND t.status = ?";     params.push(status); }
    if (assignee_id){ where += " AND t.assignee_id = ?"; params.push(assignee_id); }

    const tasks = await dbAll(
      `SELECT t.id, t.title, t.description, t.status, t.priority,
              t.project_id, t.assignee_id, t.created_by,
              t.due_date, t.created_at, t.updated_at,
              p.name AS project_name,
              u1.name AS assignee_name,
              u2.name AS creator_name
       FROM tasks t
       LEFT JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u1 ON u1.id = t.assignee_id
       LEFT JOIN users u2 ON u2.id = t.created_by
       ${where}
       ORDER BY t.created_at DESC`,
      params
    );
    res.status(200).json({ success: true, data: tasks });
  } catch (err) {
    console.error("GetTasks error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** GET /api/tasks/:id */
const getTask = async (req, res) => {
  try {
    const task = await dbGet(
      `SELECT t.*, p.name AS project_name, u1.name AS assignee_name, u2.name AS creator_name
       FROM tasks t
       LEFT JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u1 ON u1.id = t.assignee_id
       LEFT JOIN users u2 ON u2.id = t.created_by
       WHERE t.id = ?`,
      [req.params.id]
    );
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    console.error("GetTask error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** POST /api/tasks */
const createTask = async (req, res) => {
  try {
    const { title, description, project_id, assignee_id, priority, due_date } = req.body;

    if (!title || !title.trim())
      return res.status(400).json({ success: false, message: "Task title is required." });
    if (!project_id)
      return res.status(400).json({ success: false, message: "project_id is required." });

    const project = await dbGet("SELECT id FROM projects WHERE id = ?", [project_id]);
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });

    const { lastID } = await dbRun(
      `INSERT INTO tasks (title, description, project_id, assignee_id, priority, due_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description || "",
        project_id,
        assignee_id || null,
        priority || "medium",
        due_date || null,
        req.user.id,
      ]
    );

    const task = await dbGet(
      `SELECT t.*, p.name AS project_name, u1.name AS assignee_name
       FROM tasks t
       LEFT JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u1 ON u1.id = t.assignee_id
       WHERE t.id = ?`,
      [lastID]
    );
    res.status(201).json({ success: true, message: "Task created.", data: task });
  } catch (err) {
    console.error("CreateTask error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** PUT /api/tasks/:id */
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assignee_id, due_date } = req.body;

    const existing = await dbGet("SELECT * FROM tasks WHERE id = ?", [id]);
    if (!existing) return res.status(404).json({ success: false, message: "Task not found." });

    const validStatuses = ["todo", "in_progress", "done"];
    if (status && !validStatuses.includes(status))
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(", ")}` });

    await dbRun(
      `UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?,
       assignee_id = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [
        title !== undefined ? title.trim() : existing.title,
        description !== undefined ? description : existing.description,
        status !== undefined ? status : existing.status,
        priority !== undefined ? priority : existing.priority,
        assignee_id !== undefined ? assignee_id : existing.assignee_id,
        due_date !== undefined ? due_date : existing.due_date,
        id,
      ]
    );

    const updated = await dbGet(
      `SELECT t.*, p.name AS project_name, u1.name AS assignee_name
       FROM tasks t
       LEFT JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u1 ON u1.id = t.assignee_id
       WHERE t.id = ?`,
      [id]
    );
    res.status(200).json({ success: true, message: "Task updated.", data: updated });
  } catch (err) {
    console.error("UpdateTask error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** DELETE /api/tasks/:id */
const deleteTask = async (req, res) => {
  try {
    const existing = await dbGet("SELECT id FROM tasks WHERE id = ?", [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: "Task not found." });
    await dbRun("DELETE FROM tasks WHERE id = ?", [req.params.id]);
    res.status(200).json({ success: true, message: "Task deleted." });
  } catch (err) {
    console.error("DeleteTask error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** GET /api/tasks/stats */
const getStats = async (req, res) => {
  try {
    const [totalProjects, totalTasks, todoCount, inProgressCount, doneCount, totalUsers] =
      await Promise.all([
        dbGet("SELECT COUNT(*) as count FROM projects", []),
        dbGet("SELECT COUNT(*) as count FROM tasks", []),
        dbGet("SELECT COUNT(*) as count FROM tasks WHERE status = 'todo'", []),
        dbGet("SELECT COUNT(*) as count FROM tasks WHERE status = 'in_progress'", []),
        dbGet("SELECT COUNT(*) as count FROM tasks WHERE status = 'done'", []),
        dbGet("SELECT COUNT(*) as count FROM users", []),
      ]);

    res.status(200).json({
      success: true,
      data: {
        totalProjects: totalProjects.count,
        totalTasks: totalTasks.count,
        totalUsers: totalUsers.count,
        tasksByStatus: {
          todo: todoCount.count,
          in_progress: inProgressCount.count,
          done: doneCount.count,
        },
      },
    });
  } catch (err) {
    console.error("GetStats error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, getStats };
