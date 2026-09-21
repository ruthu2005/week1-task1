/**
 * AuthContext.jsx — Authentication Context
 *
 * Provides global authentication state (user, token) and actions
 * (login, logout, register) to the entire React application via Context API.
 */

import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while restoring session

  // ── Restore session from localStorage on mount ─────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("taskflow_token");
    const savedUser = localStorage.getItem("taskflow_user");

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        // Corrupt data — clear it
        localStorage.removeItem("taskflow_token");
        localStorage.removeItem("taskflow_user");
      }
    }
    setLoading(false);
  }, []);

  // ── Register ───────────────────────────────────────────────────────────────
  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    const { token, user: newUser } = res.data;
    localStorage.setItem("taskflow_token", token);
    localStorage.setItem("taskflow_user", JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user: loggedInUser } = res.data;
    localStorage.setItem("taskflow_token", token);
    localStorage.setItem("taskflow_user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("taskflow_token");
    localStorage.removeItem("taskflow_user");
    setUser(null);
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth — Custom hook to access auth context.
 * Must be used within an <AuthProvider>.
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};

export default AuthContext;
