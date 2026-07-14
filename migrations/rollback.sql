-- rollback.sql
-- Drop all tables created by schema migrations

DROP TABLE IF EXISTS AssignmentHistory;
DROP TABLE IF EXISTS Assignments;
DROP TABLE IF EXISTS LeaveRequests;
DROP TABLE IF EXISTS Holidays;
DROP TABLE IF EXISTS Settings;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Locations;
DROP TABLE IF EXISTS Guards;
