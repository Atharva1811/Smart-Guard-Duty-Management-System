// worker/scheduler.js
// Cloudflare Worker scheduling engine

export const scheduler = {
  generateRoster: (dateStr, guards, locations, history, attendance, lockedAssignments = []) => {
    const dayOfWeek = new Date(dateStr).getDay(); // 0 = Sunday, 1 = Monday, etc.
    const roster = {};
    const assignedGuardIds = new Set();
    const shortages = [];
    const vacantLocations = [];

    // 1. Initialize roster structure and restore locked assignments
    locations.forEach(loc => {
      roster[loc.id] = {
        Morning: null,
        Evening: null,
        Night: null,
        Reserve: null
      };
    });

    // Populate locked assignments (manual overrides)
    lockedAssignments.forEach(la => {
      if (roster[la.location_id]) {
        roster[la.location_id][la.shift] = {
          guard_id: la.guard_id,
          guard_name: la.guard_name,
          locked: true
        };
        if (la.guard_id) {
          assignedGuardIds.add(la.guard_id);
        }
      }
    });

    // 2. Identify available guards for this date
    const availableGuards = guards.filter(guard => {
      if (assignedGuardIds.has(guard.id)) return true; // Already assigned locked position

      // Check attendance status for the target date
      const attRecord = attendance.find(a => Number(a.guard_id) === Number(guard.id));
      if (attRecord) {
        const unavailableStatuses = ['Absent', 'Leave', 'Medical', 'Training', 'Holiday'];
        if (unavailableStatuses.includes(attRecord.status)) {
          return false;
        }
      }

      // Check base status if no attendance record
      if (guard.status !== 'Available') {
        return false;
      }

      // Check weekly off day constraint (respect, but can be overridden)
      if (guard.weekly_off !== null && guard.weekly_off !== undefined) {
        const weeklyOffNum = parseInt(guard.weekly_off, 10);
        if (weeklyOffNum === dayOfWeek) {
          return false; // Exclude on weekly off day
        }
      }

      return true;
    });

    // 3. Compute workload and location repetition maps from last 14 days of history
    const workloadMap = {};
    const lastLocationMap = {};
    const nightShiftStreakMap = {};

    guards.forEach(g => {
      workloadMap[g.id] = 0;
      lastLocationMap[g.id] = {};
      nightShiftStreakMap[g.id] = 0;
    });

    // Scan recent history (newest first, up to 14 days)
    const recentHistory = history
      .filter(h => h.assignment_date < dateStr)
      .sort((a, b) => b.assignment_date.localeCompare(a.assignment_date))
      .slice(0, 14);

    recentHistory.forEach((h, index) => {
      const gId = h.guard_id;
      const locId = h.location_id;
      const shift = h.shift;

      if (gId && workloadMap[gId] !== undefined) {
        workloadMap[gId]++;

        if (!lastLocationMap[gId][locId]) {
          lastLocationMap[gId][locId] = 0;
        }
        lastLocationMap[gId][locId]++;

        // Consecutive night shift streak (check last 2 days)
        if (shift === 'Night' && index < 2) {
          nightShiftStreakMap[gId]++;
        }
      }
    });

    // 4. Sort locations by security level (Critical -> Standard -> Low)
    const sortedLocations = [...locations].sort((a, b) => {
      const priorityWeight = { Critical: 3, Standard: 2, Low: 1 };
      const aWeight = priorityWeight[a.securityLevel] || 2;
      const bWeight = priorityWeight[b.securityLevel] || 2;
      return bWeight - aWeight;
    });

    // 5. Fill Required Shifts
    const shiftsToFill = ['Morning', 'Evening', 'Night'];

    sortedLocations.forEach(loc => {
      const activeShifts = (loc.shift || 'Morning,Evening,Night').split(',');

      shiftsToFill.forEach(shift => {
        if (!activeShifts.includes(shift)) return;

        // Skip if already locked
        if (roster[loc.id][shift] && roster[loc.id][shift].locked) return;

        // Filter candidate guards for this location & shift
        const candidates = availableGuards.filter(g => {
          if (assignedGuardIds.has(g.id)) return false;

          // Restricted location rule
          const restricted = (g.restrictedLocations || []);
          if (restricted.includes(String(loc.id)) || restricted.includes(loc.id)) return false;

          // Night shift streak limit (avoid more than 2 consecutive night shifts)
          if (shift === 'Night' && nightShiftStreakMap[g.id] >= 2) return false;

          // Rest period rule: if worked Night yesterday, no Morning today
          if (shift === 'Morning') {
            const yesterdayStr = new Date(new Date(dateStr) - 86400000).toISOString().split('T')[0];
            const yesterdayWorkedNight = history.some(h => 
              h.assignment_date === yesterdayStr && 
              Number(h.guard_id) === Number(g.id) && 
              h.shift === 'Night'
            );
            if (yesterdayWorkedNight) return false;
          }

          return true;
        });

        if (candidates.length === 0) {
          // Record shortage
          shortages.push({
            locationId: loc.id,
            locationName: loc.location_name,
            shift: shift,
            required: loc.required_guards || 1,
            assigned: 0
          });
          return;
        }

        // Score candidates
        const scoredCandidates = candidates.map(g => {
          let score = 0;

          // Shift preference match
          if (g.shift_preference === shift || g.shift_preference === 'Any') {
            score += 30;
          }

          // Preferred location match
          const preferred = (g.preferredLocations || []);
          if (preferred.includes(String(loc.id)) || preferred.includes(loc.id)) {
            score += 20;
          }

          // Workload balance penalty
          score -= (workloadMap[g.id] || 0) * 5;

          // Location repetition penalty
          const repCount = lastLocationMap[g.id][loc.id] || 0;
          score -= repCount * 15;

          // Experience bonus (seniority)
          score += Math.min(Number(g.experience) || 0, 10);

          return { guard: g, score };
        });

        // Pick the highest scoring guard
        scoredCandidates.sort((a, b) => b.score - a.score);
        const selected = scoredCandidates[0].guard;

        roster[loc.id][shift] = {
          guard_id: selected.id,
          guard_name: selected.name,
          locked: false
        };
        assignedGuardIds.add(selected.id);
      });
    });

    // 6. Assign Reserve Guards (from unassigned available guards, lowest workload first)
    const reserveLocations = sortedLocations.filter(l => l.priority === 1); // High priority locations
    const unassignedGuards = availableGuards
      .filter(g => !assignedGuardIds.has(g.id))
      .sort((a, b) => (workloadMap[a.id] || 0) - (workloadMap[b.id] || 0));

    reserveLocations.forEach(loc => {
      if (unassignedGuards.length === 0) return;

      const cell = roster[loc.id]['Reserve'];
      if (cell && cell.locked) return;

      // Filter restricted guards
      const index = unassignedGuards.findIndex(g => {
        const restricted = (g.restrictedLocations || []);
        return !restricted.includes(String(loc.id)) && !restricted.includes(loc.id);
      });

      if (index !== -1) {
        const selected = unassignedGuards.splice(index, 1)[0];
        roster[loc.id]['Reserve'] = {
          guard_id: selected.id,
          guard_name: selected.name,
          locked: false
        };
        assignedGuardIds.add(selected.id);
      }
    });

    // 7. Find vacant locations (where critical or standard shifts are unfilled)
    locations.forEach(loc => {
      const activeShifts = (loc.shift || 'Morning,Evening,Night').split(',');
      let isVacant = false;

      activeShifts.forEach(shift => {
        const cell = roster[loc.id][shift];
        if (!cell || !cell.guard_id) {
          isVacant = true;
        }
      });

      if (isVacant) {
        vacantLocations.push(loc.location_name);
      }
    });

    return {
      roster,
      shortages,
      vacantLocations
    };
  }
};
