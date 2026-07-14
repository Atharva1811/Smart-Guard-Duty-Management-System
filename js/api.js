// js/api.js
// Client API layer for communications with the Cloudflare Worker D1 backend

import { CONFIG } from './config.js';

// Helper to make fetch requests with auth headers and error handling
async function request(path, options = {}) {
  const baseUrl = CONFIG.getApiUrl();
  const url = `${baseUrl}${path}`;
  
  // Get session token
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers
  };
  
  const response = await fetch(url, config);
  
  if (response.status === 401) {
    // Session expired or unauthorized
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
      window.location.href = 'index.html';
    }
    throw new Error('Session unauthorized. Please login.');
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'API Request failed');
    }
    return data;
  } else {
    if (!response.ok) {
      throw new Error('API Request returned error code ' + response.status);
    }
    return await response.text();
  }
}

export const api = {
  // --- AUTH ---
  login: async (username, passcode) => {
    return await request('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, passcode })
    });
  },

  // --- GUARDS ---
  getGuards: async () => request('/api/guards'),
  createGuard: async (data) => request('/api/guards', { method: 'POST', body: JSON.stringify(data) }),
  updateGuard: async (id, data) => request(`/api/guards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGuard: async (id) => request(`/api/guards/${id}`, { method: 'DELETE' }),

  // --- LOCATIONS ---
  getLocations: async () => request('/api/locations'),
  createLocation: async (data) => request('/api/locations', { method: 'POST', body: JSON.stringify(data) }),
  updateLocation: async (id, data) => request(`/api/locations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLocation: async (id) => request(`/api/locations/${id}`, { method: 'DELETE' }),

  // --- LEAVE REQUESTS ---
  getLeaves: async () => request('/api/leaves'),
  createLeave: async (data) => request('/api/leaves', { method: 'POST', body: JSON.stringify(data) }),
  updateLeaveStatus: async (id, status) => request(`/api/leaves/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // --- ASSIGNMENTS ---
  getAssignments: async (date) => request(`/api/assignments?date=${date}`),
  saveAssignments: async (date, assignments) => request('/api/assignments', {
    method: 'POST',
    body: JSON.stringify({ date, assignments })
  }),
  updateAssignment: async (id, guardId, status) => request(`/api/assignments/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ guard_id: guardId, status })
  }),

  // --- HISTORY ---
  getHistory: async (limit = 100) => request(`/api/history?limit=${limit}`),

  // --- GENERATOR ---
  generateRoster: async (date, lockedAssignments = [], save = false) => request('/api/generate', {
    method: 'POST',
    body: JSON.stringify({ date, lockedAssignments, save })
  }),

  // --- SETTINGS ---
  getSettings: async () => request('/api/settings'),
  saveSettings: async (shiftTimings, rotationRules, holidayCalendar) => request('/api/settings', {
    method: 'POST',
    body: JSON.stringify({ shiftTimings, rotationRules, holidayCalendar })
  }),

  // --- USERS MANAGEMENT ---
  getUsers: async () => request('/api/users'),
  createUser: async (username, passcode, name, role, email) => request('/api/users', {
    method: 'POST',
    body: JSON.stringify({ username, passcode, name, role, email })
  }),
  deleteUser: async (id) => request(`/api/users/${id}`, { method: 'DELETE' })
};
