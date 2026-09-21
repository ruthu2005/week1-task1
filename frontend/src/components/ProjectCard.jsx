import { useAuth } from "../context/AuthContext";
import { projectsAPI } from "../services/api";

const PROJECT_ICONS = ["📁", "🚀", "💡", "🎯", "⚡", "🔥", "🌟", "🎨"];

export default function ProjectCard({ project, index, onClick, onDelete }) {
  const { isAdmin } = useAuth();

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`Delete project "${project.name}" and all its tasks?`)) return;
    try {
      await projectsAPI.delete(project.id);
      onDelete?.(project.id);
    } catch {
      alert("Could not delete project.");
    }
  };

  const icon = PROJECT_ICONS[index % PROJECT_ICONS.length];

  return (
    <div
      className="project-card"
      id={`project-card-${project.id}`}
      onClick={() => onClick?.(project)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.(project)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="project-card-icon">{icon}</div>
        {isAdmin && (
          <button
            id={`btn-delete-project-${project.id}`}
            className="btn btn-ghost btn-sm"
            onClick={handleDelete}
            title="Delete project"
            style={{ padding: "4px 8px" }}
          >
            🗑
          </button>
        )}
      </div>

      <div className="project-card-name">{project.name}</div>
      <div className="project-card-desc">{project.description || "No description provided."}</div>

      <div className="project-card-footer">
        <div className="project-task-count">
          <span>✅</span>
          <span>{project.task_count || 0} task{project.task_count !== 1 ? "s" : ""}</span>
        </div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
          by {project.owner_name || "Unknown"}
        </div>
      </div>
    </div>
  );
}
