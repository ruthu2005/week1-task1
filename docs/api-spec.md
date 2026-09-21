# TaskFlow — API Specification & Database Schema

## Database Schema

### Entity Relationship Diagram

```
┌──────────────────────┐         ┌────────────────────────────┐
│        users         │         │         projects            │
├──────────────────────┤         ├────────────────────────────┤
│ id          INTEGER PK│         │ id          INTEGER PK      │
│ name        TEXT      │         │ name        TEXT NOT NULL   │
│ email       TEXT UNIQ │         │ description TEXT            │
│ password    TEXT      │         │ owner_id    INTEGER FK→users│
│ role        TEXT      │         │ created_at  DATETIME        │
│ created_at  DATETIME  │         │ updated_at  DATETIME        │
└──────────────────────┘         └────────────────────────────┘
          │                                    │
          │                                    │
          │  ┌─────────────────────────────────┤
          │  │                                 │
          ▼  ▼                                 ▼
┌────────────────────────────────────────────────────────────┐
│                          tasks                             │
├────────────────────────────────────────────────────────────┤
│ id          INTEGER PK                                     │
│ title       TEXT NOT NULL                                  │
│ description TEXT                                           │
│ status      TEXT  ('todo' | 'in_progress' | 'done')        │
│ priority    TEXT  ('low' | 'medium' | 'high')              │
│ project_id  INTEGER FK → projects(id) ON DELETE CASCADE    │
│ assignee_id INTEGER FK → users(id)                         │
│ created_by  INTEGER FK → users(id)                         │
│ due_date    TEXT                                           │
│ created_at  DATETIME                                       │
│ updated_at  DATETIME                                       │
└────────────────────────────────────────────────────────────┘
```

### SQL Table Definitions

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL UNIQUE,
  password   TEXT    NOT NULL,
  role       TEXT    NOT NULL DEFAULT 'member' CHECK(role IN ('admin', 'member')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  description TEXT,
  owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  description TEXT,
  status      TEXT    NOT NULL DEFAULT 'todo'
                      CHECK(status IN ('todo', 'in_progress', 'done')),
  priority    TEXT    NOT NULL DEFAULT 'medium'
                      CHECK(priority IN ('low', 'medium', 'high')),
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id INTEGER REFERENCES users(id),
  created_by  INTEGER NOT NULL REFERENCES users(id),
  due_date    TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## RESTful API Endpoints

**Base URL:** `http://localhost:5000/api`

**Authentication:** All protected routes require the header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

### 🔐 Authentication

#### POST `/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "securePassword123"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "role": "member"
  }
}
```

**Errors:**
- `400` — Missing fields
- `409` — Email already registered

---

#### POST `/auth/login`
Login and receive a JWT token.

**Request Body:**
```json
{
  "email": "alice@example.com",
  "password": "securePassword123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "role": "member"
  }
}
```

**Errors:**
- `400` — Missing fields
- `401` — Invalid credentials

---

#### GET `/auth/me`
Get the authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response `200`:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "role": "member",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 📁 Projects

#### GET `/projects`
List all projects. Members see all projects; admins see ownership info.

**Headers:** `Authorization: Bearer <token>` ✅

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Website Redesign",
      "description": "Revamp the company website",
      "owner_id": 1,
      "owner_name": "Alice Johnson",
      "task_count": 5,
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

#### POST `/projects`
Create a new project. **Admin only.**

**Headers:** `Authorization: Bearer <token>` ✅

**Request Body:**
```json
{
  "name": "Mobile App",
  "description": "Build a cross-platform mobile app"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Project created",
  "data": { "id": 2, "name": "Mobile App", "description": "..." }
}
```

---

#### PUT `/projects/:id`
Update a project. **Admin only.**

**Request Body** (any combination of):
```json
{
  "name": "Updated Project Name",
  "description": "Updated description"
}
```

**Response `200`:**
```json
{ "success": true, "message": "Project updated", "data": { ... } }
```

---

#### DELETE `/projects/:id`
Delete a project and all its tasks. **Admin only.**

**Response `200`:**
```json
{ "success": true, "message": "Project deleted" }
```

---

### ✅ Tasks

#### GET `/tasks`
List tasks. Supports query params: `?project_id=1`, `?status=todo`, `?assignee_id=2`.

**Headers:** `Authorization: Bearer <token>` ✅

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Design landing page",
      "description": "Create Figma mockups",
      "status": "in_progress",
      "priority": "high",
      "project_id": 1,
      "project_name": "Website Redesign",
      "assignee_id": 2,
      "assignee_name": "Bob Smith",
      "due_date": "2024-02-01",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

#### POST `/tasks`
Create a new task.

**Headers:** `Authorization: Bearer <token>` ✅

**Request Body:**
```json
{
  "title": "Implement login form",
  "description": "Build the login page with validation",
  "project_id": 1,
  "assignee_id": 2,
  "priority": "high",
  "due_date": "2024-02-15"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Task created",
  "data": { "id": 5, "title": "Implement login form", ... }
}
```

---

#### PUT `/tasks/:id`
Update task details or status.

**Request Body** (any combination of):
```json
{
  "title": "Updated title",
  "status": "done",
  "priority": "low",
  "assignee_id": 3,
  "due_date": "2024-03-01"
}
```

---

#### DELETE `/tasks/:id`
Delete a task. **Admin only.**

**Response `200`:**
```json
{ "success": true, "message": "Task deleted" }
```

---

### 🏥 Health Check

#### GET `/health`
Check API availability (public).

**Response `200`:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

---

## Error Response Format

All errors follow this structure:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "OPTIONAL_ERROR_CODE"
}
```

### HTTP Status Codes Used

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 409 | Conflict (e.g. duplicate email) |
| 500 | Internal Server Error |
