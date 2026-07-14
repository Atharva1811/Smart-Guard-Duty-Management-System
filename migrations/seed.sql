-- seed.sql
-- Seed database with initial sample data

-- Seed: Users
INSERT INTO Users (id, username, password_hash, name, role, email) VALUES
(1, 'admin', 'admin123', 'Chief Security Officer', 'Admin', 'chief@smartguard.com'),
(2, 'supervisor', 'supervisor123', 'Shift Security Officer', 'Supervisor', 'officer@smartguard.com');

-- Seed: Settings
INSERT INTO Settings (id, shift_timings, rotation_rules, holiday_calendar) VALUES
(1, 
 '{"Morning":{"start":"06:00","end":"14:00"},"Evening":{"start":"14:00","end":"22:00"},"Night":{"start":"22:00","end":"06:00"}}',
 '{"maxConsecutiveDuties":5,"maxNightShiftsPerWeek":3,"restHoursBetweenShifts":12}',
 '[{"date":"2026-01-01","name":"New Year''s Day"},{"date":"2026-07-04","name":"Independence Day"},{"date":"2026-12-25","name":"Christmas Day"}]'
);

-- Seed: Holidays
INSERT INTO Holidays (id, holiday_name, holiday_date) VALUES
(1, 'New Year''s Day', '2026-01-01'),
(2, 'Independence Day', '2026-07-04'),
(3, 'Christmas Day', '2026-12-25');

-- Seed: Locations
INSERT INTO Locations (id, location_name, required_guards, priority, shift, status) VALUES
(1, 'Main HQ Reception', 1, 1, 'Morning,Evening', 'Active'),
(2, 'Front Gate Barrier', 1, 1, 'Morning,Evening,Night', 'Active'),
(3, 'South Warehouse Patrol', 1, 2, 'Morning,Night', 'Active'),
(4, 'North Loading Dock', 1, 2, 'Morning,Evening', 'Active'),
(5, 'Server Room Entry', 1, 1, 'Morning,Evening,Night', 'Active'),
(6, 'CCTV Control Room', 1, 1, 'Morning,Evening,Night', 'Active');

-- Seed: Guards
INSERT INTO Guards (id, guard_code, name, phone, email, gender, availability, shift_preference, weekly_off, experience, status) VALUES
(1, 'G001', 'John Doe', '+1 555-0101', 'john.doe@smartguard.com', 'Male', 1, 'Morning', '0', 8, 'Available'),
(2, 'G002', 'Robert Smith', '+1 555-0102', 'robert.smith@smartguard.com', 'Male', 1, 'Night', '6', 4, 'Available'),
(3, 'G003', 'Michael Johnson', '+1 555-0103', 'michael.j@smartguard.com', 'Male', 1, 'Evening', '1', 12, 'Available'),
(4, 'G004', 'David Williams', '+1 555-0104', 'david.w@smartguard.com', 'Male', 1, 'Morning', '2', 5, 'Available'),
(5, 'G005', 'James Brown', '+1 555-0105', 'james.b@smartguard.com', 'Male', 1, 'Evening', '3', 3, 'Available'),
(6, 'G006', 'Patricia Davis', '+1 555-0106', 'patricia.d@smartguard.com', 'Female', 1, 'Night', '4', 9, 'Available'),
(7, 'G007', 'Linda Miller', '+1 555-0107', 'linda.m@smartguard.com', 'Female', 1, 'Any', '0', 15, 'Available'),
(8, 'G008', 'Elizabeth Wilson', '+1 555-0108', 'elizabeth.w@smartguard.com', 'Female', 1, 'Morning', '5', 7, 'Leave'),
(9, 'G009', 'Richard Moore', '+1 555-0109', 'richard.m@smartguard.com', 'Male', 1, 'Evening', '6', 2, 'Available'),
(10, 'G010', 'Charles Taylor', '+1 555-0110', 'charles.t@smartguard.com', 'Male', 1, 'Night', '1', 6, 'Available'),
(11, 'G011', 'Joseph Anderson', '+1 555-0111', 'joseph.a@smartguard.com', 'Male', 1, 'Any', '2', 11, 'Available'),
(12, 'G012', 'Thomas Thomas', '+1 555-0112', 'thomas.t@smartguard.com', 'Male', 1, 'Morning', '3', 4, 'Available'),
(13, 'G013', 'Christopher Jackson', '+1 555-0113', 'chris.j@smartguard.com', 'Male', 1, 'Evening', '4', 5, 'Training'),
(14, 'G014', 'Daniel White', '+1 555-0114', 'daniel.w@smartguard.com', 'Male', 1, 'Night', '5', 9, 'Available'),
(15, 'G015', 'Matthew Harris', '+1 555-0115', 'matthew.h@smartguard.com', 'Male', 1, 'Any', '6', 4, 'Available');

-- Seed: LeaveRequests
INSERT INTO LeaveRequests (id, guard_id, leave_date, reason, status) VALUES
(1, 8, '2026-07-12', 'Annual Medical Checkup', 'Approved'),
(2, 8, '2026-07-13', 'Annual Medical Checkup', 'Approved'),
(3, 8, '2026-07-14', 'Annual Medical Checkup', 'Approved'),
(4, 8, '2026-07-15', 'Annual Medical Checkup', 'Approved'),
(5, 8, '2026-07-16', 'Annual Medical Checkup', 'Approved'),
(6, 5, '2026-07-20', 'Family event', 'Pending'),
(7, 5, '2026-07-21', 'Family event', 'Pending'),
(8, 5, '2026-07-22', 'Family event', 'Pending');
