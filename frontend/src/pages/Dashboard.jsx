import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { tasksAPI, projectsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          tasksAPI.getStats(),
          tasksAPI.getAll(),
        ]);
        setStats(statsRes.data.data);
        setRecentTasks(tasksRes.data.data.slice(0, 5));
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: "60vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Projects",
      value: stats?.totalProjects ?? 0,
      icon: "📁",
      variant: "primary",
    },
    {
      label: "Total Tasks",
      value: stats?.totalTasks ?? 0,
      icon: "✅",
      variant: "secondary",
    },
    {
      label: "In Progress",
      value: stats?.tasksByStatus?.in_progress ?? 0,
      icon: "⚙️",
      variant: "warning",
    },
    {
      label: "Completed",
      value: stats?.tasksByStatus?.done ?? 0,
      icon: "🎉",
      variant: "success",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1>Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
        <p>Here's what's happening with your projects today.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map((card) => (
          <div key={card.label} className={`stat-card ${card.variant}`}>
            <div className={`stat-icon ${card.variant}`}>{card.icon}</div>
            <div className="stat-content">
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      {stats && stats.totalTasks > 0 && (
        <div className="card" style={{ marginBottom: "var(--space-8)" }}>
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700, marginBottom: "var(--space-4)" }}>
            Task Progress Overview
          </h2>
          <div style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-3)", flexWrap: "wrap" }}>
            {[
              { label: "To Do",       count: stats.tasksByStatus.todo,        color: "#64748b" },
              { label: "In Progress", count: stats.tasksByStatus.in_progress, color: "#f59e0b" },
              { label: "Done",        count: stats.tasksByStatus.done,        color: "#10b981" },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
                <span style={{ color: "var(--text-secondary)" }}>{label}:</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
          {/* Stacked progress bar */}
          <div style={{ height: "10px", borderRadius: "999px", overflow: "hidden", background: "var(--color-bg-3)", display: "flex" }}>
            {[
              { count: stats.tasksByStatus.todo,        color: "#64748b" },
              { count: stats.tasksByStatus.in_progress, color: "#f59e0b" },
              { count: stats.tasksByStatus.done,        color: "#10b981" },
            ].map(({ count, color }, i) => (
              <div
                key={i}
                style={{
                  width: `${(count / stats.totalTasks) * 100}%`,
                  background: color,
                  transition: "width 0.6s ease",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-5)" }}>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700 }}>Recent Tasks</h2>
        <Link to="/tasks" className="btn btn-secondary btn-sm">View All →</Link>
      </div>

      {recentTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No tasks yet</h3>
          <p>Create a project and add your first task to get started.</p>
          <Link to="/projects" className="btn btn-primary">Go to Projects</Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {recentTasks.map((task, i) => (
            <div
              key={task.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "var(--space-4) var(--space-6)",
                borderBottom: i < recentTasks.length - 1 ? "1px solid var(--color-border)" : "none",
                gap: "var(--space-4)",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{task.title}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "2px" }}>
                  {task.project_name || "No Project"}
                </div>
              </div>
              <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                <span className={`badge badge-${task.status}`}>
                  {task.status === "in_progress" ? "In Progress" : task.status === "done" ? "Done" : "To Do"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
