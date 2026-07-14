// worker/database.js
// Database CRUD operations using Cloudflare D1 (SQLite)

export const db = {
  // --- GUARDS ---
  getGuards: async (d1) => {
    const { results } = await d1.prepare('SELECT * FROM Guards ORDER BY guard_code ASC').all();
    return results.map(g => ({
      ...g,
      availability: !!g.availability, // Convert 0/1 to boolean
      experience: Number(g.experience)
    }));
  },

  insertGuard: async (d1, data) => {
    const query = `
      INSERT INTO Guards (guard_code, name, phone, email, gender, availability, shift_preference, weekly_off, experience, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await d1.prepare(query)
      .bind(
        data.guard_code,
        data.name,
        data.phone || null,
        data.email || null,
        data.gender || 'Male',
        data.availability ? 1 : 0,
        data.shift_preference || 'Any',
        data.weekly_off || '0',
        Number(data.experience) || 0,
        data.status || 'Available'
      )
      .run();
    return result;
  },

  updateGuard: async (d1, id, data) => {
    const query = `
      UPDATE Guards 
      SET name = ?, phone = ?, email = ?, gender = ?, availability = ?, shift_preference = ?, weekly_off = ?, experience = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    return await d1.prepare(query)
      .bind(
        data.name,
        data.phone || null,
        data.email || null,
        data.gender || 'Male',
        data.availability ? 1 : 0,
        data.shift_preference || 'Any',
        data.weekly_off || '0',
        Number(data.experience) || 0,
        data.status || 'Available',
        id
      )
      .run();
  },

  deleteGuard: async (d1, id) => {
    return await d1.prepare('DELETE FROM Guards WHERE id = ?').bind(id).run();
  },

  // --- LOCATIONS ---
  getLocations: async (d1) => {
    const { results } = await d1.prepare('SELECT * FROM Locations ORDER BY id ASC').all();
    return results.map(l => ({
      ...l,
      required_guards: Number(l.required_guards),
      priority: Number(l.priority)
    }));
  },

  insertLocation: async (d1, data) => {
    const query = `
      INSERT INTO Locations (location_name, required_guards, priority, shift, status)
      VALUES (?, ?, ?, ?, ?)
    `;
    return await d1.prepare(query)
      .bind(
        data.location_name,
        Number(data.required_guards) || 1,
        Number(data.priority) || 2,
        data.shift || 'Morning,Evening,Night',
        data.status || 'Active'
      )
      .run();
  },

  updateLocation: async (d1, id, data) => {
    const query = `
      UPDATE Locations 
      SET location_name = ?, required_guards = ?, priority = ?, shift = ?, status = ?
      WHERE id = ?
    `;
    return await d1.prepare(query)
      .bind(
        data.location_name,
        Number(data.required_guards) || 1,
        Number(data.priority) || 2,
        data.shift || 'Morning,Evening,Night',
        data.status || 'Active',
        id
      )
      .run();
  },

  deleteLocation: async (d1, id) => {
    return await d1.prepare('DELETE FROM Locations WHERE id = ?').bind(id).run();
  },

  // --- LEAVE REQUESTS ---
  getLeaveRequests: async (d1) => {
    const query = `
      SELECT lr.*, g.name as guard_name, g.guard_code
      FROM LeaveRequests lr
      JOIN Guards g ON lr.guard_id = g.id
      ORDER BY lr.leave_date DESC
    `;
    const { results } = await d1.prepare(query).all();
    return results;
  },

  insertLeaveRequest: async (d1, data) => {
    const query = `
      INSERT INTO LeaveRequests (guard_id, leave_date, reason, status)
      VALUES (?, ?, ?, ?)
    `;
    return await d1.prepare(query)
      .bind(
        data.guard_id,
        data.leave_date,
        data.reason || '',
        data.status || 'Pending'
      )
      .run();
  },

  updateLeaveStatus: async (d1, id, status) => {
    // 1. Get the leave request details
    const leave = await d1.prepare('SELECT * FROM LeaveRequests WHERE id = ?').bind(id).first();
    if (!leave) throw new Error('Leave request not found');

    // 2. Begin transaction/batch to update leave status and guard base status
    const updateLeave = d1.prepare('UPDATE LeaveRequests SET status = ? WHERE id = ?').bind(status, id);
    const statements = [updateLeave];

    if (status === 'Approved') {
      const updateGuard = d1.prepare("UPDATE Guards SET status = 'Leave' WHERE id = ?").bind(leave.guard_id);
      statements.push(updateGuard);
    } else if (status === 'Rejected' || status === 'Pending') {
      const updateGuard = d1.prepare("UPDATE Guards SET status = 'Available' WHERE id = ?").bind(leave.guard_id);
      statements.push(updateGuard);
    }

    return await d1.batch(statements);
  },

  // --- ASSIGNMENTS ---
  getAssignmentsForDate: async (d1, date) => {
    const query = `
      SELECT a.*, g.name as guard_name, g.guard_code, l.location_name
      FROM Assignments a
      LEFT JOIN Guards g ON a.guard_id = g.id
      JOIN Locations l ON a.location_id = l.id
      WHERE a.assignment_date = ?
    `;
    const { results } = await d1.prepare(query).bind(date).all();
    return results;
  },

  deleteAssignmentsForDate: async (d1, date) => {
    return await d1.prepare('DELETE FROM Assignments WHERE assignment_date = ?').bind(date).run();
  },

  saveAssignmentsBatch: async (d1, date, assignments) => {
    // Delete existing assignments for the date first
    await db.deleteAssignmentsForDate(d1, date);

    if (assignments.length === 0) return true;

    // Create bulk insert prepared statement
    const stmt = d1.prepare(`
      INSERT INTO Assignments (assignment_date, guard_id, location_id, shift, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    const batchStmts = assignments.map(a => 
      stmt.bind(date, a.guard_id || null, a.location_id, a.shift, a.status || 'Assigned')
    );

    return await d1.batch(batchStmts);
  },

  updateAssignment: async (d1, id, guardId, status) => {
    const query = `
      UPDATE Assignments 
      SET guard_id = ?, status = ?
      WHERE id = ?
    `;
    return await d1.prepare(query).bind(guardId || null, status || 'Assigned', id).run();
  },

  // --- ASSIGNMENT HISTORY & STATS ---
  getHistory: async (d1, limit = 500) => {
    const query = `
      SELECT ah.*, g.name as guard_name, g.guard_code, l.location_name
      FROM AssignmentHistory ah
      LEFT JOIN Guards g ON ah.guard_id = g.id
      LEFT JOIN Locations l ON ah.location_id = l.id
      ORDER BY ah.assignment_date DESC
      LIMIT ?
    `;
    const { results } = await d1.prepare(query).bind(limit).all();
    return results;
  },

  archiveAssignmentsToHistory: async (d1, date) => {
    const assignments = await db.getAssignmentsForDate(d1, date);
    if (assignments.length === 0) return;

    const stmt = d1.prepare(`
      INSERT INTO AssignmentHistory (assignment_id, guard_id, location_id, assignment_date, remarks)
      VALUES (?, ?, ?, ?, ?)
    `);

    const batchStmts = assignments.map(a => 
      stmt.bind(a.id, a.guard_id || null, a.location_id, a.assignment_date, a.status)
    );

    await d1.batch(batchStmts);
  },

  // --- HOLIDAYS ---
  getHolidays: async (d1) => {
    const { results } = await d1.prepare('SELECT * FROM Holidays ORDER BY holiday_date ASC').all();
    return results;
  },

  insertHoliday: async (d1, name, date) => {
    return await d1.prepare('INSERT INTO Holidays (holiday_name, holiday_date) VALUES (?, ?)')
      .bind(name, date)
      .run();
  },

  // --- SETTINGS ---
  getSettings: async (d1) => {
    const result = await d1.prepare('SELECT * FROM Settings WHERE id = 1').first();
    if (!result) {
      // Default fallback settings
      return {
        shiftTimings: {
          Morning: { start: "06:00", end: "14:00" },
          Evening: { start: "14:00", end: "22:00" },
          Night: { start: "22:00", end: "06:00" }
        },
        rotationRules: {
          maxConsecutiveDuties: 5,
          maxNightShiftsPerWeek: 3,
          restHoursBetweenShifts: 12
        },
        holidayCalendar: []
      };
    }
    return {
      shiftTimings: JSON.parse(result.shift_timings),
      rotationRules: JSON.parse(result.rotation_rules),
      holidayCalendar: JSON.parse(result.holiday_calendar || '[]')
    };
  },

  saveSettings: async (d1, shiftTimings, rotationRules, holidayCalendar) => {
    const check = await d1.prepare('SELECT 1 FROM Settings WHERE id = 1').first();
    if (check) {
      const query = `
        UPDATE Settings 
        SET shift_timings = ?, rotation_rules = ?, holiday_calendar = ?
        WHERE id = 1
      `;
      return await d1.prepare(query)
        .bind(JSON.stringify(shiftTimings), JSON.stringify(rotationRules), JSON.stringify(holidayCalendar))
        .run();
    } else {
      const query = `
        INSERT INTO Settings (id, shift_timings, rotation_rules, holiday_calendar)
        VALUES (1, ?, ?, ?)
      `;
      return await d1.prepare(query)
        .bind(JSON.stringify(shiftTimings), JSON.stringify(rotationRules), JSON.stringify(holidayCalendar))
        .run();
    }
  },

  // --- USER AUTHENTICATION ---
  getUser: async (d1, username) => {
    return await d1.prepare('SELECT * FROM Users WHERE username = ?').bind(username.toLowerCase()).first();
  },

  getUsers: async (d1) => {
    const { results } = await d1.prepare('SELECT id, username, name, role, email FROM Users').all();
    return results;
  },

  insertUser: async (d1, username, passcode, name, role, email) => {
    const query = `
      INSERT INTO Users (username, password_hash, name, role, email)
      VALUES (?, ?, ?, ?, ?)
    `;
    return await d1.prepare(query).bind(username.toLowerCase(), passcode, name, role, email).run();
  },

  deleteUser: async (d1, id) => {
    return await d1.prepare('DELETE FROM Users WHERE id = ?').bind(id).run();
  }
};
