// worker/routes.js
// Routes handler for Guard Duty API

import { db } from './database.js';
import { scheduler } from './scheduler.js';
import { jsonResponse, errorResponse, parseBody } from './helpers.js';

export async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const d1 = env.DB; // Binding for D1

  // Handle OPTIONS preflight requests for CORS
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  try {
    // --- AUTHENTICATION ---
    if (path === '/api/login' && method === 'POST') {
      const body = await parseBody(request);
      const user = await db.getUser(d1, body.username);
      if (user && body.passcode === user.password_hash) {
        // Generate simple mock JWT token
        const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
        const payload = btoa(JSON.stringify({
          username: user.username,
          name: user.name,
          role: user.role,
          email: user.email,
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 12) // 12 hour expiry
        }));
        const signature = btoa("mock_d1_workers_signature");
        const token = `${header}.${payload}.${signature}`;

        return jsonResponse({
          token,
          user: {
            username: user.username,
            name: user.name,
            role: user.role,
            email: user.email
          }
        });
      }
      return errorResponse('Invalid username or passcode', 401);
    }

    // --- SETTINGS ---
    if (path === '/api/settings') {
      if (method === 'GET') {
        const settings = await db.getSettings(d1);
        return jsonResponse(settings);
      }
      if (method === 'POST') {
        const body = await parseBody(request);
        await db.saveSettings(d1, body.shiftTimings, body.rotationRules, body.holidayCalendar);
        return jsonResponse({ success: true });
      }
    }

    // --- GUARDS ---
    if (path === '/api/guards') {
      if (method === 'GET') {
        const guards = await db.getGuards(d1);
        return jsonResponse(guards);
      }
      if (method === 'POST') {
        const body = await parseBody(request);
        await db.insertGuard(d1, body);
        return jsonResponse({ success: true }, 201);
      }
    }

    if (path.startsWith('/api/guards/')) {
      const id = path.split('/').pop();
      if (method === 'PUT') {
        const body = await parseBody(request);
        await db.updateGuard(d1, id, body);
        return jsonResponse({ success: true });
      }
      if (method === 'DELETE') {
        await db.deleteGuard(d1, id);
        return jsonResponse({ success: true });
      }
    }

    // --- LOCATIONS ---
    if (path === '/api/locations') {
      if (method === 'GET') {
        const locations = await db.getLocations(d1);
        return jsonResponse(locations);
      }
      if (method === 'POST') {
        const body = await parseBody(request);
        await db.insertLocation(d1, body);
        return jsonResponse({ success: true }, 201);
      }
    }

    if (path.startsWith('/api/locations/')) {
      const id = path.split('/').pop();
      if (method === 'PUT') {
        const body = await parseBody(request);
        await db.updateLocation(d1, id, body);
        return jsonResponse({ success: true });
      }
      if (method === 'DELETE') {
        await db.deleteLocation(d1, id);
        return jsonResponse({ success: true });
      }
    }

    // --- LEAVE REQUESTS ---
    if (path === '/api/leaves') {
      if (method === 'GET') {
        const leaves = await db.getLeaveRequests(d1);
        return jsonResponse(leaves);
      }
      if (method === 'POST') {
        const body = await parseBody(request);
        await db.insertLeaveRequest(d1, body);
        return jsonResponse({ success: true }, 201);
      }
    }

    if (path.startsWith('/api/leaves/')) {
      const id = path.split('/').pop();
      if (method === 'PUT') {
        const body = await parseBody(request);
        await db.updateLeaveStatus(d1, id, body.status);
        return jsonResponse({ success: true });
      }
    }

    // --- ASSIGNMENTS ---
    if (path === '/api/assignments') {
      if (method === 'GET') {
        const date = url.searchParams.get('date');
        if (!date) return errorResponse('Missing date parameter', 400);
        const assignments = await db.getAssignmentsForDate(d1, date);
        return jsonResponse(assignments);
      }
      if (method === 'POST') {
        const body = await parseBody(request);
        if (!body.date || !body.assignments) return errorResponse('Missing parameters', 400);
        await db.saveAssignmentsBatch(d1, body.date, body.assignments);
        return jsonResponse({ success: true });
      }
    }

    if (path.startsWith('/api/assignments/')) {
      const id = path.split('/').pop();
      if (method === 'PUT') {
        const body = await parseBody(request);
        await db.updateAssignment(d1, id, body.guard_id, body.status);
        return jsonResponse({ success: true });
      }
    }

    // --- ASSIGNMENT HISTORY ---
    if (path === '/api/history') {
      if (method === 'GET') {
        const limit = Number(url.searchParams.get('limit')) || 500;
        const history = await db.getHistory(d1, limit);
        return jsonResponse(history);
      }
    }

    // --- DUTY TIMETABLE GENERATOR ENGINE ---
    if (path === '/api/generate' && method === 'POST') {
      const body = await parseBody(request);
      const date = body.date;
      if (!date) return errorResponse('Missing date parameter', 400);

      // 1. Fetch parameters
      const guards = await db.getGuards(d1);
      const locations = await db.getLocations(d1);
      const history = await db.getHistory(d1); // Get history to check rest periods

      // Create attendance list for this date (fetch guards who are not available)
      // Note: we fetch attendance records on this date
      const { results: attendance } = await d1.prepare('SELECT * FROM LeaveRequests WHERE status = "Approved" AND leave_date = ?').bind(date).all();
      
      const mappedAttendance = attendance.map(a => ({
        guard_id: a.guard_id,
        status: 'Leave'
      }));

      // Find holidays
      const holiday = await d1.prepare('SELECT * FROM Holidays WHERE holiday_date = ?').bind(date).first();
      
      // Merge with custom locked assignments passed in
      const lockedAssignments = body.lockedAssignments || [];

      // 2. Generate roster
      const rosterData = scheduler.generateRoster(
        date, 
        guards, 
        locations, 
        history, 
        mappedAttendance, 
        lockedAssignments
      );

      // If requested, auto-save assignments to D1
      if (body.save) {
        const formattedAssignments = [];
        Object.entries(rosterData.roster).forEach(([locId, shifts]) => {
          Object.entries(shifts).forEach(([shift, info]) => {
            if (info) {
              formattedAssignments.push({
                guard_id: info.guard_id,
                location_id: locId,
                shift: shift,
                status: info.locked ? 'Locked' : 'Assigned'
              });
            }
          });
        });
        await db.saveAssignmentsBatch(d1, date, formattedAssignments);
      }

      return jsonResponse(rosterData);
    }

    // --- USERS MANAGEMENT ---
    if (path === '/api/users') {
      if (method === 'GET') {
        const users = await db.getUsers(d1);
        return jsonResponse(users);
      }
      if (method === 'POST') {
        const body = await parseBody(request);
        await db.insertUser(d1, body.username, body.passcode, body.name, body.role, body.email);
        return jsonResponse({ success: true }, 201);
      }
    }

    if (path.startsWith('/api/users/')) {
      const id = path.split('/').pop();
      if (method === 'DELETE') {
        await db.deleteUser(d1, id);
        return jsonResponse({ success: true });
      }
    }

    return errorResponse(`Route ${method} ${path} not found`, 404);

  } catch (err) {
    console.error('Request processing error:', err);
    return errorResponse(err.message || 'Server error', 500);
  }
}
