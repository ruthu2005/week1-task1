# TaskFlow — System Architecture

## Overview

TaskFlow follows a classic **3-tier architecture** pattern:

1. **Presentation Layer** — React SPA (Single Page Application)
2. **Application Layer** — Node.js/Express REST API
3. **Data Layer** — SQLite relational database

---

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USERS (Browser)                             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND  (Vercel CDN)                           │
│                                                                     │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│   │  React Pages │  │  AuthContext │  │  Axios API Service       │ │
│   │  - Login     │  │  (JWT Store) │  │  (api.js)                │ │
│   │  - Register  │  └──────────────┘  │  - Request interceptors  │ │
│   │  - Dashboard │                    │  - Auth header injection  │ │
│   │  - Projects  │                    │  - Error handling         │ │
│   │  - Tasks     │                    └──────────────────────────┘ │
│   └──────────────┘                                                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  HTTPS / REST API calls
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  BACKEND API  (Render Cloud)                        │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     Express.js Server                        │   │
│  │                                                             │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │                   Middleware Stack                    │   │   │
│  │  │  cors() → helmet() → express.json() → authMiddleware │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  │                                                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │   │
│  │  │  /api/auth   │  │ /api/projects│  │  /api/tasks    │   │   │
│  │  │  Routes      │  │  Routes      │  │  Routes        │   │   │
│  │  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘   │   │
│  │         │                 │                   │            │   │
│  │  ┌──────▼───────┐  ┌──────▼───────┐  ┌───────▼────────┐   │   │
│  │  │  Auth        │  │  Project     │  │  Task          │   │   │
│  │  │  Controller  │  │  Controller  │  │  Controller    │   │   │
│  │  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘   │   │
│  └─────────┼─────────────────┼───────────────────┼────────────┘   │
│            └─────────────────┴───────────────────┘                 │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      Database Layer                          │   │
│  │                  SQLite  (better-sqlite3)                    │   │
│  │                                                             │   │
│  │   ┌──────────┐   ┌──────────────┐   ┌────────────────┐     │   │
│  │   │  users   │   │   projects   │   │     tasks      │     │   │
│  │   └──────────┘   └──────────────┘   └────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

```
Client                        Server                      Database
  │                              │                             │
  │──POST /api/auth/login───────►│                             │
  │  { email, password }         │──SELECT user by email──────►│
  │                              │◄─────────────────user row───│
  │                              │                             │
  │                              │ bcrypt.compare(password)    │
  │                              │                             │
  │                              │ jwt.sign({ id, role })      │
  │◄─────────────────────────────│                             │
  │  { token, user }             │                             │
  │                              │                             │
  │  (stores token in            │                             │
  │   localStorage)              │                             │
  │                              │                             │
  │──GET /api/projects ─────────►│                             │
  │  Authorization: Bearer <JWT> │                             │
  │                              │ authMiddleware:             │
  │                              │ jwt.verify(token)           │
  │                              │ attach req.user             │
  │                              │──SELECT projects───────────►│
  │                              │◄────────────────projects────│
  │◄─────────────────────────────│                             │
  │  { success: true, data: [] } │                             │
```

---

## Role-Based Authorization

```
Request arrives
      │
      ▼
authMiddleware (verify JWT)
      │
      ├── Token missing/invalid → 401 Unauthorized
      │
      └── Token valid → attach req.user to request
                │
                ▼
            Route Handler
                │
                ├── Public operation (GET list) → proceed ✅
                │
                └── Admin operation (POST/PUT/DELETE)
                          │
                          ├── req.user.role === 'admin' → proceed ✅
                          │
                          └── req.user.role === 'member' → 403 Forbidden ❌
```

---

## Component Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     Frontend Data Flow                        │
│                                                              │
│  AuthContext                                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  state: { user, token, loading }                       │  │
│  │  actions: login(), logout(), register()                │  │
│  └────────────────────────────────────────────────────────┘  │
│              │ provides via React Context                     │
│              ▼                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  App.jsx — React Router                                │  │
│  │  /login  /register  /dashboard  /projects  /tasks      │  │
│  └────────────────────────────────────────────────────────┘  │
│              │                                               │
│              ▼                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Page Components (Dashboard, Projects, Tasks)          │  │
│  │  └── useEffect → api.js calls → render data            │  │
│  └────────────────────────────────────────────────────────┘  │
│              │                                               │
│              ▼                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  api.js (Axios instance)                               │  │
│  │  - baseURL: VITE_API_URL env variable                  │  │
│  │  - Request interceptor: inject Authorization header    │  │
│  │  - Response interceptor: handle 401 → auto logout      │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
  GitHub Repository
         │
         │ git push
         │
         ├────────────────────────────────────────────┐
         │                                            │
         ▼                                            ▼
  ┌─────────────┐                          ┌─────────────────┐
  │   Vercel    │                          │     Render      │
  │  (Frontend) │                          │   (Backend)     │
  │             │                          │                 │
  │  React SPA  │─────HTTPS API calls─────►│  Express API    │
  │  CDN-served │                          │  Port 5000      │
  └─────────────┘                          └────────┬────────┘
                                                    │
                                                    ▼
                                           ┌─────────────────┐
                                           │  SQLite DB file │
                                           │  (persistent    │
                                           │   disk volume)  │
                                           └─────────────────┘
```

---

## Security Considerations

| Concern | Solution |
|---|---|
| Password storage | bcryptjs (salt rounds: 10) |
| Auth tokens | JWT with expiry (`JWT_EXPIRES_IN`) |
| CORS | Configured to allow only the frontend origin |
| SQL injection | Parameterized queries via better-sqlite3 |
| Sensitive config | Environment variables, never committed |
| Role escalation | Server-side role check on every admin route |
