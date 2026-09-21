import { useState, useEffect } from "react";
import { tasksAPI, projectsAPI, authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import TaskCard from "../components/TaskCard";

const STATUS_COLS = [
  { key: "todo",        label: "To Do",       icon: "📋", color: "#64748b" },
  { key: "in_progress", label: "In Progress", icon: "⚙️", color: "#f59e0b" },
  { key: "done",        label: "Done",        icon: "✅", color: "#10b981" },
];

export default function Tasks() {
  const { isAdmin } = useAuth();

  const [tasks, setTasks]       = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  // Filters
  const [filterProject, setFilterProject] = useState("");
  const [filterStatus,  setFilterStatus]  = useState("");

  // New-task form
  const [form, setForm] = useState({
    title: "", description: "", project_id: "",
    assignee_id: "", priority: "medium", due_date: "",
  });

  // ── Fetch data ────────────────────────────────────────────────
  const fetchTasks = async () => {
    try {
      const params = {};
      if (filterProject) params.project_id = filterProject;
      if (filterStatus)  params.status      = filterStatus;
      const res = await tasksAPI.getAll(params);
      setTasks(res.data.data);
    } catch {
      setError("Failed to load tasks.");
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pRes, uRes] = await Promise.all([
          projectsAPI.getAll(),
          authAPI.getUsers(),
        ]);
        setProjects(pRes.data.data);
        setUsers(uRes.data.data);
      } catch {}
      await fetchTasks();
      setLoading(false);
    };
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    if (!loading) fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterProject, filterStatus]);

  // ── Task CRUD ─────────────────────────────────────────────────
  const openCreate = () => {
    setForm({ title: "", description: "", project_id: projects[0]?.id || "", assignee_id: "", priority: "medium", due_date: "" });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Task title is required."); return; }
    if (!form.project_id)   { setError("Please select a project."); return; }
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        assignee_id: form.assignee_id || undefined,
        due_date:    form.due_date    || undefined,
      };
      const res = await tasksAPI.create(payload);
      setTasks((prev) => [res.data.data, ...prev]);
      setShowModal(false);
    } catch (err) {
      setError(err?.message || "Failed to create task.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = (updated) => {
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
  };

  const handleDelete = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // ── Group tasks by status ─────────────────────────────────────
  const tasksByStatus = STATUS_COLS.reduce((acc, col) => {
    acc[col.key] = tasks.filter((t) => t.status === col.key);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <h1>Tasks</h1>
        <p>Track, assign, and manage tasks across all your projects.</p>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <select
            id="filter-project"
            className="form-select"
            style={{ width: "auto" }}
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            id="filter-status"
            className="form-select"
            style={{ width: "auto" }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <button id="btn-create-task" className="btn btn-primary" onClick={openCreate}>
          + New Task
        </button>
      </div>

      {/* Board */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: "50vh" }}>
          <div className="spinner" />
        </div>
      ) : (
        <div className="task-board">
          {STATUS_COLS.map((col) => (
            <div key={col.key} className="board-column">
              <div className="board-column-header">
                <div className="board-column-title" style={{ color: col.color }}>
                  {col.icon} {col.label}
                </div>
                <span className="column-count">{tasksByStatus[col.key].length}</span>
              </div>

              {tasksByStatus[col.key].length === 0 ? (
                <div style={{ textAlign: "center", padding: "var(--space-8) var(--space-4)", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
                  No tasks here
                </div>
              ) : (
                tasksByStatus[col.key].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Task</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {error && <div className="error-banner"><span>⚠️</span> {error}</div>}

            <form onSubmit={handleSubmit} id="task-form">
              <div className="form-group">
                <label htmlFor="task-title" className="form-label">Task Title *</label>
                <input
                  id="task-title"
                  className="form-input"
                  placeholder="What needs to be done?"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="task-description" className="form-label">Description</label>
                <textarea
                  id="task-description"
                  className="form-textarea"
                  placeholder="Additional details…"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="task-project" className="form-label">Project *</label>
                  <select
                    id="task-project"
                    className="form-select"
                    value={form.project_id}
                    onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}
                    required
                  >
                    <option value="">Select project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="task-priority" className="form-label">Priority</label>
                  <select
                    id="task-priority"
                    className="form-select"
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="task-assignee" className="form-label">Assignee</label>
                  <select
                    id="task-assignee"
                    className="form-select"
                    value={form.assignee_id}
                    onChange={(e) => setForm((f) => ({ ...f, assignee_id: e.target.value }))}
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="task-due-date" className="form-label">Due Date</label>
                  <input
                    id="task-due-date"
                    type="date"
                    className="form-input"
                    value={form.due_date}
                    onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-6)" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button id="btn-save-task" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Creating…</> : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
