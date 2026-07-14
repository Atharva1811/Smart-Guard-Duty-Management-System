-- 002_indexes.sql
-- Create indexes for performance optimization

CREATE INDEX IF NOT EXISTS idx_guards_status ON Guards(status);
CREATE INDEX IF NOT EXISTS idx_guards_code ON Guards(guard_code);
CREATE INDEX IF NOT EXISTS idx_locations_status ON Locations(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_date ON LeaveRequests(leave_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_guard ON LeaveRequests(guard_id);
CREATE INDEX IF NOT EXISTS idx_assignments_date ON Assignments(assignment_date);
CREATE INDEX IF NOT EXISTS idx_assignments_guard_date ON Assignments(guard_id, assignment_date);
CREATE INDEX IF NOT EXISTS idx_assignments_location_date ON Assignments(location_id, assignment_date);
CREATE INDEX IF NOT EXISTS idx_assignment_history_date ON AssignmentHistory(assignment_date);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON Holidays(holiday_date);
