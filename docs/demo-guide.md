# TaskFlow Capstone — 5-Minute Technical Demo Guide

This document provides a structured, 5-minute live demonstration script for the **TaskFlow Full-Stack Capstone Project** (Week 1 · Task 1).

---

## ⏱️ Demo Timeline & Walkthrough Script

### Minute 1: Introduction & Architecture Overview (0:00 - 1:00)
- **High-level concept**: TaskFlow is an enterprise project and placement tracking system designed for collaborative team environments.
- **Architecture**:
  - **Frontend**: Single Page Application built with React 18, Vite, React Router v6, and Axios.
  - **Backend**: RESTful API service built on Node.js and Express with async SQLite database access.
  - **Security**: Stateless JSON Web Tokens (JWT) with bcryptjs password hashing and role-based access control.
- **Showcase**: Briefly present the architecture diagram in `docs/architecture.md`.

### Minute 2: Authentication & Role-Based Access (1:00 - 2:00)
- Navigate to the register screen (`http://localhost:5173/register`).
- Register a new team member (`member` role) and log in.
- Show that JWT is safely stored in local client state and attached automatically via Axios request interceptors (`services/api.js`).
- Show that sensitive administration actions are protected by backend `adminOnly` middleware.

### Minute 3: Project Management & Task Collaboration (2:00 - 3:00)
- Log in as the lead administrator.
- Create a new project: *"Campus Recruitment Drive 2026"*.
- Create related tasks:
  - *"Resume Screening"* (Status: Todo, Priority: High)
  - *"Technical Assessment"* (Status: In Progress, Priority: Medium)
- Assign tasks to team members with due dates.

### Minute 4: Interactive Dashboard & Real-Time Stats (3:00 - 4:00)
- Open the Dashboard page.
- Demonstrate real-time aggregated metrics:
  - Total Projects Count
  - Active Tasks broken down by status (Todo, In Progress, Completed)
- Demonstrate instant task status updating with optimistic UI feedback.

### Minute 5: Automated Testing, Containerization & Q&A (4:00 - 5:00)
- Terminal demonstration:
  ```bash
  # Execute backend E2E integration test suite
  cd backend && npm test
  # Execute frontend build verification
  cd ../frontend && npm run build
  ```
- Point out Docker Compose configuration (`docker-compose.yml`) enabling multi-container orchestration.
- Conclude with technical takeaways and answer evaluator questions.

---

## 🚀 Live Demo Verification Checklist

- [x] Backend running on `http://localhost:5000` (`npm run dev`)
- [x] Frontend running on `http://localhost:5173` (`npm run dev`)
- [x] Health endpoint responsive: `curl http://localhost:5000/api/health`
- [x] Automated E2E test passing: `npm test` in `backend` (9/9 suites pass)
- [x] Production build passes without errors: `npm run build` in `frontend`
