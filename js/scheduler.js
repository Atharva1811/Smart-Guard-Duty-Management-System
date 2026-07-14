// js/scheduler.js
// Client-side scheduler helpers and replacements suggester

import { api } from './api.js';

export const scheduler = {
  // Fetch roster suggestions for a cell
  getReplacementSuggestions: async (date, locationId, shift, guards, attendance) => {
    try {
      const activeRoster = await api.getAssignments(date);
      const assignedIds = new Set(
        activeRoster
          .filter(a => a.guard_id !== null && a.guard_id !== undefined)
          .map(a => Number(a.guard_id))
      );

      const dayOfWeek = new Date(date).getDay();

      return guards.filter(g => {
        // 1. Not already assigned today
        if (assignedIds.has(Number(g.id))) return false;

        // 2. Not restricted from this location
        const restricted = g.restrictedLocations || [];
        if (restricted.includes(String(locationId)) || restricted.includes(locationId)) return false;

        // 3. Status must be Available
        const att = attendance.find(a => Number(a.guard_id) === Number(g.id));
        if (att && ['Absent', 'Leave', 'Medical', 'Training'].includes(att.status)) {
          return false;
        }
        if (g.status !== 'Available' && (!att || att.status !== 'Available')) {
          return false;
        }

        return true;
      }).sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        if (a.shift_preference === shift || a.shift_preference === 'Any') scoreA += 10;
        if (b.shift_preference === shift || b.shift_preference === 'Any') scoreB += 10;

        const prefA = a.preferredLocations || [];
        const prefB = b.preferredLocations || [];
        if (prefA.includes(String(locationId)) || prefA.includes(locationId)) scoreA += 5;
        if (prefB.includes(String(locationId)) || prefB.includes(locationId)) scoreB += 5;

        const weeklyOffA = parseInt(a.weekly_off, 10);
        const weeklyOffB = parseInt(b.weekly_off, 10);
        if (weeklyOffA === dayOfWeek) scoreA -= 5;
        if (weeklyOffB === dayOfWeek) scoreB -= 5;

        return scoreB - scoreA;
      });
    } catch (e) {
      console.error('Failed to load replacement suggestions:', e);
      return [];
    }
  },

  // Client-side conflict detection tool (complements server checks)
  detectConflicts: (assignments, history, dateStr) => {
    const conflicts = [];
    const guardDutyCounts = {};

    assignments.forEach(a => {
      if (!a.guard_id) return;
      
      const gId = Number(a.guard_id);
      
      // 1. Check duplicate assignments (Double shifts)
      if (!guardDutyCounts[gId]) {
        guardDutyCounts[gId] = [];
      }
      guardDutyCounts[gId].push(a);
    });

    Object.entries(guardDutyCounts).forEach(([gId, assocAssignments]) => {
      if (assocAssignments.length > 1) {
        conflicts.push({
          type: 'duplicate',
          severity: 'high',
          message: `Guard assigned to multiple shifts: ${assocAssignments.map(a => a.shift).join(', ')}`,
          guardId: gId
        });
      }
    });

    return conflicts;
  }
};
