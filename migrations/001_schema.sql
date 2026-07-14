-- 001_schema.sql
-- Create database schema for Guard Duty Management System

-- Table: Guards
CREATE TABLE IF NOT EXISTS Guards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guard_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    gender TEXT,
    availability BOOLEAN DEFAULT 1,
    shift_preference TEXT DEFAULT 'Any',
    weekly_off TEXT, -- e.g. '0' for Sunday, or Day name 'Sunday'
    experience INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Locations
CREATE TABLE IF NOT EXISTS Locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_name TEXT NOT NULL,
    required_guards INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 2, -- 1 = High, 2 = Medium, 3 = Low
    shift TEXT DEFAULT 'Morning,Evening,Night', -- comma separated shifts
    status TEXT DEFAULT 'Active'
);

-- Table: LeaveRequests
CREATE TABLE IF NOT EXISTS LeaveRequests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guard_id INTEGER NOT NULL,
    leave_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
    FOREIGN KEY(guard_id) REFERENCES Guards(id) ON DELETE CASCADE
);

-- Table: Assignments
CREATE TABLE IF NOT EXISTS Assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_date DATE NOT NULL,
    guard_id INTEGER,
    location_id INTEGER NOT NULL,
    shift TEXT NOT NULL, -- Morning, Evening, Night, Reserve
    status TEXT DEFAULT 'Assigned', -- Assigned, Locked, Shortage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(guard_id) REFERENCES Guards(id) ON DELETE SET NULL,
    FOREIGN KEY(location_id) REFERENCES Locations(id) ON DELETE CASCADE
);

-- Table: AssignmentHistory
CREATE TABLE IF NOT EXISTS AssignmentHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER,
    guard_id INTEGER,
    location_id INTEGER,
    assignment_date DATE NOT NULL,
    remarks TEXT,
    FOREIGN KEY(guard_id) REFERENCES Guards(id) ON DELETE SET NULL,
    FOREIGN KEY(location_id) REFERENCES Locations(id) ON DELETE SET NULL
);

-- Table: Holidays
CREATE TABLE IF NOT EXISTS Holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    holiday_name TEXT NOT NULL,
    holiday_date DATE NOT NULL UNIQUE
);

-- Table: Settings
CREATE TABLE IF NOT EXISTS Settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    shift_timings TEXT NOT NULL, -- JSON string representing morning/evening/night start & end
    rotation_rules TEXT NOT NULL, -- JSON string representing max Night shifts, consecutive, etc.
    holiday_calendar TEXT -- JSON list of holidays
);

-- Table: Users
CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- plain passcode in placeholder architecture
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- Admin, Supervisor, Viewer
    email TEXT
);
