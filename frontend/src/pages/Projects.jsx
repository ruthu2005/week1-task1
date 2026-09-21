import { useState, useEffect } from "react";
import { projectsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ProjectCard from "../components/ProjectCard";

export default function Projects() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchProjects = async () => {
    try {
      const res = await projectsAPI.getAll();
      setProjects(res.data.data);
    } catch {
      setError("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const openCreate = () => {
    setEditProject(null);
    setForm({ name: "", description: "" });
    setError("");
    setShowModal(true);
  };

  const openEdit = (project) => {
    setEditProject(project);
    setForm({ name: project.name, description: project.description || "" });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Project name is required."); return; }
    setSaving(true);
    setError("");

    try {
      if (editProject) {
        const res = await projectsAPI.update(editProject.id, form);
        setProjects((prev) => prev.map((p) => p.id === editProject.id ? res.data.data : p));
      } else {
        const res = await projectsAPI.create(form);
        setProjects((prev) => [{ ...res.data.data, task_count: 0 }, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      setError(err?.message || "Operation failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Projects</h1>
        <p>Organise your work into projects and track progress.</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <span style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </span>
        </div>
        {isAdmin && (
          <button id="btn-create-project" className="btn btn-primary" onClick={openCreate}>
            + New Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: "50vh" }}>
          <div className="spinner" />
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <h3>No projects yet</h3>
          <p>{isAdmin ? "Create your first project to get started." : "No projects have been created yet."}</p>
          {isAdmin && (
            <button className="btn btn-primary" onClick={openCreate}>Create Project</button>
          )}
        </div>
      ) : (
        <div className="grid-3">
          {projects.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={i}
              onClick={isAdmin ? openEdit : undefined}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editProject ? "Edit Project" : "New Project"}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {error && <div className="error-banner"><span>⚠️</span> {error}</div>}

            <form onSubmit={handleSubmit} id="project-form">
              <div className="form-group">
                <label htmlFor="project-name" className="form-label">Project Name *</label>
                <input
                  id="project-name"
                  className="form-input"
                  placeholder="e.g. Website Redesign"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="project-description" className="form-label">Description</label>
                <textarea
                  id="project-description"
                  className="form-textarea"
                  placeholder="What is this project about?"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button id="btn-save-project" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving…</> : editProject ? "Save Changes" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
