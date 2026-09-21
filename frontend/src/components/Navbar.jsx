import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", icon: "📊", label: "Dashboard" },
  { to: "/projects",  icon: "📁", label: "Projects"  },
  { to: "/tasks",     icon: "✅", label: "Tasks"     },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      {/* Brand */}
      <div className="navbar-brand">
        <div className="logo-icon">⚡</div>
        <span className="brand-name">TaskFlow</span>
      </div>

      {/* Navigation */}
      <p className="nav-section-label">Navigation</p>
      {NAV_ITEMS.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          id={`nav-${label.toLowerCase()}`}
          className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
        >
          <span className="nav-icon">{icon}</span>
          {label}
        </NavLink>
      ))}

      {/* User Info + Logout */}
      <div className="navbar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.name || "User"}</div>
            <div className="user-role">
              <span className={`role-badge ${user?.role || "member"}`}>
                {user?.role || "member"}
              </span>
            </div>
          </div>
        </div>
        <button
          id="btn-logout"
          className="btn btn-ghost btn-block"
          onClick={handleLogout}
          style={{ fontSize: "var(--text-xs)", justifyContent: "center" }}
        >
          🚪 Sign Out
        </button>
      </div>
    </nav>
  );
}
