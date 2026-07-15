# Smart Guard Duty Management System - Express & PostgreSQL Migration

This project is a modern, production-ready, full-stack Guard Duty Management Dashboard. It has been successfully migrated from a Cloudflare Workers/D1 setup to a robust **Node.js + Express + PostgreSQL + Prisma ORM** backend and a **React + Vite + Tailwind CSS** frontend.

---

## 🏗️ Project Architecture

```
guard-management-system/
├── client/                      # React + Vite Frontend App
│   ├── src/
│   │   ├── config/api.ts        # Axios API client (JWT refresh rotation)
│   │   ├── context/             # Auth Context, Language Translation Context
│   │   ├── components/          # Sidebar Navigation, Navbar Header, Audit Logs
│   │   ├── pages/               # Dashboard, Today's Duty, Guards, Checkpoints
│   │   └── utils/export.ts      # CSV, Excel (SheetJS), and PDF (jsPDF) exports
│   ├── index.html               # Vite Entrypoint
│   └── package.json
│
├── server/                      # Node.js + Express.js API Backend
│   ├── src/
│   │   ├── config/db.ts         # Prisma Client Connection Manager
│   │   ├── controllers/         # Auth, Guards, Locations, Leaves, Timetables
│   │   ├── middleware/          # Auth JWT validation, Zod Validator, Rate Limiters
│   │   ├── routes/              # Express API Routes Mapping
│   │   ├── scheduler/           # Guard Duty Auto-Allocation Shift Algorithm
│   │   ├── utils/               # JWT token signatures, bcrypt password hashing
│   │   └── validators/          # Zod Input Verification Schemas
│   ├── prisma/
│   │   ├── schema.prisma        # PostgreSQL Schema Models
│   │   └── seed.ts              # System Seed Scripts (Guards, Locations, Timings)
│   └── package.json
│
├── README.md                    # Installation & API Documentation
└── .env.example                 # Environment parameters template
```

---

## 📊 Database ER Diagram

```mermaid
erDiagram
    User ||--o{ UserSession : "has"
    User ||--o{ AuditLog : "logs"
    Guard ||--o{ Attendance : "records"
    Guard ||--o{ LeaveRequest : "applies"
    Guard ||--o{ DutyAssignment : "works"
    Location ||--o{ DutyAssignment : "houses"
    Guard ||--o{ AssignmentHistory : "tracks"
    Location ||--o{ AssignmentHistory : "tracks"

    User {
        int id PK
        string username
        string passwordHash
        string name
        string role
        string email
        DateTime createdAt
        DateTime updatedAt
    }

    UserSession {
        int id PK
        int userId FK
        string refreshToken
        DateTime expiresAt
        DateTime createdAt
    }

    Guard {
        int id PK
        string guardCode
        string name
        string phone
        string email
        int age
        int experience
        string gender
        string shiftPreference
        int weeklyOff
        string status
        boolean availability
        DateTime createdAt
    }

    Location {
        int id PK
        string locationName
        int requiredGuards
        int priority
        string securityLevel
        string shift
        string status
        DateTime createdAt
    }

    Attendance {
        int id PK
        int guardId FK
        string status
        string attendanceDate
        string notes
    }

    LeaveRequest {
        int id PK
        int guardId FK
        string leaveDate
        string reason
        string status
    }

    DutyAssignment {
        int id PK
        int guardId FK
        int locationId FK
        string shift
        string assignmentDate
        string status
    }

    AssignmentHistory {
        int id PK
        int guardId FK
        int locationId FK
        string shift
        string assignmentDate
        string remarks
    }
```

---

## ⚡ Setup & Installation

### 1. Prerequisites
Install [Node.js](https://nodejs.org) (v20+ recommended) and a **PostgreSQL** database (e.g. Supabase or a local installation).

### 2. Configure Environment Parameters
Create a `.env` file in the project root:
```bash
cp .env.example .env
```
Open `.env` and fill in your details:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/sgds?schema=public"
JWT_SECRET="generate-a-secure-secret-key-for-access-tokens"
JWT_REFRESH_SECRET="generate-a-secure-secret-key-for-refresh-tokens"
PORT=5000
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
```

### 3. Install Workspace Dependencies
Install packages for both the client and server workspaces:
```bash
npm install
```

### 4. Run Schema Migrations & DB Seeding
Initialize the PostgreSQL tables and populate seed data (15 guards, 6 locations, timings, and credentials):
```bash
# Apply Prisma Schema Migrations
npm run migrate

# Seed default system entries
npm run seed
```

### 5. Start Development Servers
Run both the React frontend and Express backend concurrently:
```bash
npm run dev
```
- Client runs on: `http://localhost:5173`
- Server API runs on: `http://localhost:5000`

---

## 🔒 JWT Token Authentication Flow

This project implements a secure Access / Refresh JWT token rotation mechanism:
1. **Login (`POST /api/auth/login`)**: Returns a short-lived `accessToken` (15m expiry) and a long-lived `refreshToken` (7d expiry, stored in the PostgreSQL `UserSession` table).
2. **Accessing Routes**: The React client attaches the `accessToken` in the `Authorization: Bearer <token>` header of every Axios request.
3. **Token Rotation (`POST /api/auth/refresh`)**: If a request fails with a `401 Unauthorized` status (due to an expired access token), the client’s Axios response interceptor intercepts the error, calls the refresh endpoint with the stored `refreshToken`, receives a new pair of tokens, and retries the original request seamlessly.

---

## 🌐 API Documentation

### 1. Authentication Endpoints
- **`POST /api/auth/register`**: Creates a new supervisor/viewer login (Admin authorization required).
- **`POST /api/auth/login`**: Authenticates user and returns Access/Refresh tokens.
- **`POST /api/auth/refresh`**: Exchanges a refresh token for a new access token.
- **`POST /api/auth/logout`**: Invalidates the active session refresh token in the database.
- **`GET /api/auth/profile`**: Returns credentials info for the currently authenticated user.

### 2. Guard Profiles
- **`GET /api/guards`**: Returns list of all guards.
- **`GET /api/guards/:id`**: Returns details for a specific guard profile.
- **`POST /api/guards`**: Creates a new guard entry.
- **`PUT /api/guards/:id`**: Updates an existing guard's details or status.
- **`DELETE /api/guards/:id`**: Deletes a guard profile (restricted to Admin).

### 3. Location Checkpoints
- **`GET /api/locations`**: Returns all active operational locations.
- **`POST /api/locations`**: Adds a new security checkpoint with staffing settings.
- **`PUT /api/locations/:id`**: Modifies checkpoint details or shift requirements.
- **`DELETE /api/locations/:id`**: Removes a location.

### 4. Leaves & Availability
- **`GET /api/leaves`**: Returns list of all leave requests.
- **`POST /api/leaves`**: Submits a new leave request (status set to `PENDING`).
- **`PUT /api/leaves/:id/status`**: Updates leave status (`APPROVED`/`REJECTED`) and marks the guard's status accordingly.

### 5. Timetable Scheduler
- **`GET /api/roster/assignments?date=YYYY-MM-DD`**: Fetches duty allocations for the target date.
- **`POST /api/roster/generate`**: Runs the scheduling engine, taking into account guard preferences, rest requirements, and consecutive shift limits.
- **`POST /api/roster/save`**: Saves allocations to `DutyAssignment` and updates history logs.
- **`GET /api/roster/suggestions?date=YYYY-MM-DD&locationId=ID&shift=SHIFT`**: Recommends available candidate guards for override slots.
- **`POST /api/roster/conflicts`**: Run timetable double-shift and rest-period checks.
