/**
 * api.js — Centralized Axios API Client
 *
 * This module provides a configured Axios instance for all HTTP requests
 * to the TaskFlow backend API. It handles:
 *
 *  - Base URL configuration (from VITE_API_URL environment variable)
 *  - Automatic Authorization header injection from localStorage
 *  - Global response error handling (401 auto-logout, network errors)
 *  - Consistent request/response interceptors
 *
 * Usage:
 *   import api from '../services/api';
 *   const { data } = await api.get('/projects');
 *   const { data } = await api.post('/tasks', { title: 'New task', project_id: 1 });
 */

import axios from "axios";

// ─── Axios Instance ───────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Automatically attaches the JWT token to every outgoing request

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("taskflow_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Handles global errors (e.g., expired tokens → auto logout)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      // 401 Unauthorized — token expired or invalid → force logout
      if (status === 401) {
        localStorage.removeItem("taskflow_token");
        localStorage.removeItem("taskflow_user");
        // Redirect to login if not already there
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }

      // Return the server's error message if available
      return Promise.reject(error.response.data || error);
    }

    // Network error (no response from server)
    if (error.request) {
      return Promise.reject({
        success: false,
        message: "Network error. Please check your connection.",
      });
    }

    return Promise.reject(error);
  }
);

// ─── Convenience Methods ──────────────────────────────────────────────────────

/**
 * Auth API
 */
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  getUsers: () => api.get("/auth/users"),
};

/**
 * Projects API
 */
export const projectsAPI = {
  getAll: () => api.get("/projects"),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post("/projects", data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

/**
 * Tasks API
 */
export const tasksAPI = {
  getAll: (params) => api.get("/tasks", { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post("/tasks", data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  getStats: () => api.get("/tasks/stats"),
};

export default api;
