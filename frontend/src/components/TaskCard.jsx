import { useState } from "react";
import { tasksAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS_LABELS = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const NEXT_STATUS = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

export default function TaskCard({ task, onUpdate, onDelete }) {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await tasksAPI.update(task.id, { status: NEXT_STATUS[task.status] });
      onUpdate?.(res.data.data);
    } catch {
      // silently fail; parent will re-fetch
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`Delete task "${task.title}"?`)) return;
    try {
      await tasksAPI.delete(task.id);
      onDelete?.(task.id);
    } catch {
      alert("Could not delete task.");
    }
  };

  return (
    <div className="task-card slide-up" id={`task-card-${task.id}`}>
      <div className="task-card-meta">
        <span className={`badge badge-${task.priority}`}>
          {task.priority === "high" ? "🔴" : task.priority === "medium" ? "🟡" : "⚪"}{" "}
          {task.priority}
        </span>
        {isAdmin && (
          <button
            id={`btn-delete-task-${task.id}`}
            className="btn btn-ghost btn-sm"
            onClick={handleDelete}
            title="Delete task"
            style={{ padding: "2px 6px" }}
          >
            🗑
          </button>
        )}
      </div>

      <div className="task-card-title">{task.title}</div>

      {task.description && (
        <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: "var(--space-2)", lineHeight: 1.5 }}>
          {task.description}
        </p>
      )}

      {task.due_date && (
        <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
          📅 Due: {new Date(task.due_date).toLocaleDateString()}
        </p>
      )}

      <div className="task-card-footer">
        {task.assignee_name ? (
          <div className="task-assignee">
            <div className="task-assignee-avatar">{task.assignee_name.charAt(0)}</div>
            <span>{task.assignee_name}</span>
          </div>
        ) : (
          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Unassigned</span>
        )}

        <button
          id={`btn-status-${task.id}`}
          className="btn btn-secondary btn-sm"
          onClick={handleStatusChange}
          disabled={loading}
          title="Advance status"
        >
          {loading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : "→"}
        </button>
      </div>
    </div>
  );
}
