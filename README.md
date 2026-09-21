# TaskFlow 🚀

> A full-stack team project & task management application — Capstone Project

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)

---

## 📋 Project Overview

**TaskFlow** is a production-ready, full-stack SaaS-style web application that enables teams to manage projects and tasks collaboratively. It features secure JWT authentication, role-based access control (Admin / Member), a RESTful API backend, and a sleek, responsive React frontend.

This project serves as the capstone deliverable demonstrating end-to-end full-stack development skills — from database design to cloud deployment.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 (Vite), React Router v6, Axios |
| **Backend** | Node.js 18+, Express 4 |
| **Database** | SQLite (via `better-sqlite3`) |
| **Authentication** | JWT (JSON Web Tokens) + bcryptjs |
| **Styling** | Vanilla CSS (dark glassmorphism theme) |
| **Frontend Deploy** | Vercel |
| **Backend Deploy** | Render |
| **Containerization** | Docker + Docker Compose |

---

## ✨ Features

- 🔐 **Secure Authentication** — Register, login, logout with JWT tokens
- 👥 **Role-Based Authorization** — Admin vs Member access control
- 📁 **Project Management** — Create, view, edit, and delete projects
- ✅ **Task Management** — Create tasks, assign members, update status
- 📊 **Dashboard** — Real-time stats (projects, tasks by status)
- 🔒 **Protected Routes** — Auth middleware on all sensitive endpoints
- 📱 **Responsive Design** — Works on desktop, tablet, and mobile

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/ruthu2005/week1-task1.git
cd week1-task1
```

### 2. Configure Environment

```bash
cp .env.example backend/.env
```

Edit `backend/.env` and set your `JWT_SECRET` to a strong random string.

### 3. Start the Backend

```bash
cd backend
npm install
npm run dev
```

The API will be running at `http://localhost:5000`.

### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be running at `http://localhost:5173`.

---

## 🐳 Docker (Optional)

Run the entire stack with Docker Compose:

```bash
docker-compose up --build
```

---

## 🌐 Live Demo

| Service | URL |
|---|---|
| **Frontend** | https://taskflow-capstone.vercel.app |
| **Backend API** | https://taskflow-api.onrender.com |

---

## 📁 Project Structure

```
week1-task1/
├── README.md
├── .env.example
├── docker-compose.yml
├── docs/
│   ├── api-spec.md          # API documentation & DB schema
│   └── architecture.md      # System architecture diagram
├── backend/
│   ├── package.json
│   └── src/
│       ├── server.js         # Express app entry point
│       ├── db.js             # SQLite database setup
│       ├── middleware/
│       │   └── auth.js       # JWT auth middleware
│       ├── routes/
│       │   ├── auth.js
│       │   ├── projects.js
│       │   └── tasks.js
│       └── controllers/
│           ├── authController.js
│           ├── projectController.js
│           └── taskController.js
└── frontend/
    ├── package.json
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── services/
        │   └── api.js          # Centralized Axios client
        ├── context/
        │   └── AuthContext.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── TaskCard.jsx
        │   └── ProjectCard.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx
            ├── Projects.jsx
            └── Tasks.jsx
```

---

## 🔑 API Endpoints

Full API documentation is available in [`docs/api-spec.md`](./docs/api-spec.md).

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & receive JWT |
| GET | `/api/auth/me` | Get current user profile |

### Projects
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/projects` | List all projects | ✅ |
| POST | `/api/projects` | Create a project | ✅ Admin |
| PUT | `/api/projects/:id` | Update a project | ✅ Admin |
| DELETE | `/api/projects/:id` | Delete a project | ✅ Admin |

### Tasks
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/tasks` | List all tasks | ✅ |
| POST | `/api/tasks` | Create a task | ✅ |
| PUT | `/api/tasks/:id` | Update task | ✅ |
| DELETE | `/api/tasks/:id` | Delete task | ✅ Admin |

---

## 🔐 Environment Variables

See [`.env.example`](./.env.example) for all required variables.

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `JWT_SECRET` | Secret key for signing JWTs | — (required) |
| `JWT_EXPIRES_IN` | JWT expiry duration | `7d` |
| `NODE_ENV` | Environment mode | `development` |

---

## 🧪 Testing the API

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'

# Get Projects (with token)
curl http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📖 Documentation

- [API Specification & Database Schema](./docs/api-spec.md)
- [Architecture Diagram & System Design](./docs/architecture.md)

---

## 🚀 Deployment

### Frontend → Vercel

1. Push code to GitHub
2. Import repo to [vercel.com](https://vercel.com)
3. Set root directory to `frontend`
4. Set `VITE_API_URL` environment variable to your backend URL

### Backend → Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Set root directory to `backend`
4. Build command: `npm install`
5. Start command: `node src/server.js`
6. Add environment variables from `.env.example`

---

## 👤 Author

**Ruthu** — Intern Capstone Project  
GitHub: [@ruthu2005](https://github.com/ruthu2005)

---

## 📄 License

This project is licensed under the MIT License.
