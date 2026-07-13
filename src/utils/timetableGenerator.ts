import type { Guard, Location, DayRoster, RosterHistory, AttendanceRecord } from "../db/mockDb";
import { dbHub } from "../db/dbHub";

export interface ShortageRecord {
  locationId: string;
  locationName: string;
  shift: 'Morning' | 'Evening' | 'Night';
  required: number;
  assigned: number;
}

export interface ConflictRecord {
  type: 'duplicate' | 'unavailable' | 'overworked' | 'weekly_off' | 'rest_period' | 'restricted_location';
  severity: 'high' | 'medium' | 'info';
  message: string;
  guardId: string;
  locationId?: string;
  shift?: 'Morning' | 'Evening' | 'Night';
}

// Helper to get day of week (0-6) for a date string
export const getDayOfWeek = (dateStr: string): number => {
  return new Date(dateStr).getDay();
};

// Main generator class
export const timetableGenerator = {
  // Generate roster for a target date
  generateRoster: (dateStr: string, _user: string = "system", currentRoster?: DayRoster): {
    roster: DayRoster;
    shortages: ShortageRecord[];
    vacantLocations: string[];
    conflicts: ConflictRecord[];
  } => {
    const guards = dbHub.getGuards();
    const locations = dbHub.getLocations();
    const history = dbHub.getRosterHistory();
    const attendance = dbHub.getAttendance(dateStr);
    
    const dayOfWeek = getDayOfWeek(dateStr);
    
    // 1. Initialize empty roster or load existing to preserve locked cells
    const existingRoster = dbHub.getRosterForDate(dateStr);
    const roster: DayRoster = {};
    const rosterToUse = currentRoster || (existingRoster ? existingRoster.roster : null);
    
    // Keep track of assigned guards on this day to avoid duplicate assignments
    const assignedGuardIds = new Set<string>();
    
    // Setup roster structure and collect locked assignments
    locations.forEach((loc: Location) => {
      roster[loc.id] = {
        Morning: { guardId: null, guardName: null, locked: false },
        Evening: { guardId: null, guardName: null, locked: false },
        Night: { guardId: null, guardName: null, locked: false },
        Reserve: { guardId: null, guardName: null, locked: false }
      };
      
      if (rosterToUse && rosterToUse[loc.id]) {
        const ext = rosterToUse[loc.id];
        (['Morning', 'Evening', 'Night', 'Reserve'] as const).forEach(shift => {
          if (ext[shift] && ext[shift].locked && ext[shift].guardId) {
            roster[loc.id][shift] = { ...ext[shift] };
            assignedGuardIds.add(ext[shift].guardId!);
          }
        });
      }
    });

    // 2. Identify available guards for this date
    // A guard must be active, not on leave/medical/absent/training in attendance
    const availableGuards = guards.filter((guard: Guard) => {
      // If already locked in today's roster, they are "available" but already assigned
      if (assignedGuardIds.has(guard.id)) return true;

      const attRecord = attendance.find((a: AttendanceRecord) => a.guardId === guard.id);
      if (attRecord) {
        // Must NOT be Absent, Leave, Medical, or Training
        const unavailableStatuses = ['Absent', 'Leave', 'Medical', 'Training', 'Holiday'];
        if (unavailableStatuses.includes(attRecord.status)) {
          return false;
        }
      }
      
      // Default to guard's own status if no attendance record
      if (guard.status !== 'Available') {
        return false;
      }

      // Check weekly off day constraint (can be overridden, but try to respect it)
      if (guard.weeklyOff === dayOfWeek) {
        return false;
      }
      
      return true;
    });

    // 3. Compute historical workload (total shifts worked) and location repetitions
    // We look back at history to balance the roster and rotate locations
    const workloadMap: { [guardId: string]: number } = {};
    const lastLocationMap: { [guardId: string]: { [locId: string]: number } } = {};
    const nightShiftStreakMap: { [guardId: string]: number } = {};
    
    guards.forEach((g: Guard) => {
      workloadMap[g.id] = 0;
      lastLocationMap[g.id] = {};
      nightShiftStreakMap[g.id] = 0;
    });

    // Scan last 14 days of history
    const recentHistory = history
      .filter((h: RosterHistory) => h.date < dateStr)
      .sort((a: RosterHistory, b: RosterHistory) => b.date.localeCompare(a.date)) // newest first
      .slice(0, 14);

    recentHistory.forEach((h: RosterHistory, index: number) => {
      Object.entries(h.roster).forEach(([locId, shifts]: [string, any]) => {
        (['Morning', 'Evening', 'Night', 'Reserve'] as const).forEach(shift => {
          const gId = shifts[shift]?.guardId;
          if (gId && workloadMap[gId] !== undefined) {
            workloadMap[gId]++;
            
            // Count location repetitions
            if (!lastLocationMap[gId][locId]) lastLocationMap[gId][locId] = 0;
            lastLocationMap[gId][locId]++;
            
            // Check consecutive night shifts streak (last 2 days)
            if (shift === 'Night' && index < 2) {
              nightShiftStreakMap[gId]++;
            }
          }
        });
      });
    });

    // 4. Fill Roster - Prioritize locations by Security Level (Critical first)
    const sortedLocations = [...locations].sort((a: Location, b: Location) => {
      const priorityWeight: { [key: string]: number } = { Critical: 3, Standard: 2, Low: 1 };
      const aWeight = priorityWeight[a.securityLevel] || 0;
      const bWeight = priorityWeight[b.securityLevel] || 0;
      return bWeight - aWeight; // higher weight first
    });

    const shiftsToFill = ['Morning', 'Evening', 'Night'] as const;

    sortedLocations.forEach((loc: Location) => {
      shiftsToFill.forEach(shift => {
        // If this location requires this shift
        if (loc.shiftRequirement[shift]) {
          const cell = roster[loc.id][shift];
          
          // If already locked, skip allocation
          if (cell.locked && cell.guardId) return;

          // Find candidate guards
          const candidates = availableGuards.filter((g: Guard) => {
            // Already assigned today?
            if (assignedGuardIds.has(g.id)) return false;
            
            // Restricted location?
            if (g.restrictedLocations.includes(loc.id)) return false;

            // Night shift streak limit? (Avoid more than 2 consecutive night shifts)
            if (shift === 'Night' && nightShiftStreakMap[g.id] >= 2) return false;

            // Rest period rule: if they worked Night yesterday, they shouldn't work Morning today
            if (shift === 'Morning') {
              const yesterdayRoster = history.find((h: RosterHistory) => {
                const yesterday = new Date(dateStr);
                yesterday.setDate(yesterday.getDate() - 1);
                const yDateStr = yesterday.toISOString().split('T')[0];
                return h.date === yDateStr;
              });
              if (yesterdayRoster) {
                let workedNightYesterday = false;
                Object.values(yesterdayRoster.roster).forEach((locShifts: any) => {
                  if (locShifts.Night?.guardId === g.id) workedNightYesterday = true;
                });
                if (workedNightYesterday) return false;
              }
            }

            return true;
          });

          if (candidates.length > 0) {
            // Score candidates to select the best match
            // Higher score = better candidate
            const scoredCandidates = candidates.map((g: Guard) => {
              let score = 100;

              // 1. Shift Preference Match (+30)
              if (g.shiftPreference === shift || g.shiftPreference === 'Any') {
                score += 30;
              }

              // 2. Preferred Location Match (+20)
              if (g.preferredLocations.includes(loc.id)) {
                score += 20;
              }

              // 3. Workload Balancing (Deduct based on shifts worked historically)
              // This pushes guards with lower workload to the top
              score -= workloadMap[g.id] * 5;

              // 4. Repeated Location Avoidance (Deduct if worked here recently)
              const repeatedTimes = lastLocationMap[g.id][loc.id] || 0;
              score -= repeatedTimes * 15;

              // 5. Seniority bonus (+1 per year of experience, up to +10)
              score += Math.min(g.experience, 10);

              return { guard: g, score };
            });

            // Sort by score descending
            scoredCandidates.sort((a: any, b: any) => b.score - a.score);
            const chosen = scoredCandidates[0].guard;

            // Assign
            roster[loc.id][shift] = {
              guardId: chosen.id,
              guardName: chosen.name,
              locked: false
            };
            assignedGuardIds.add(chosen.id);
          }
        }
      });
    });

    // 5. Allocate Reserve Guards for Critical/High Priority Locations
    // Reserve is filled from remaining available guards
    sortedLocations.forEach((loc: Location) => {
      if (loc.priority === 'High' && !roster[loc.id].Reserve.locked) {
        const candidates = availableGuards.filter((g: Guard) => !assignedGuardIds.has(g.id) && !g.restrictedLocations.includes(loc.id));
        if (candidates.length > 0) {
          // Sort by workload ascending (fewer duties first)
          candidates.sort((a: Guard, b: Guard) => workloadMap[a.id] - workloadMap[b.id]);
          const chosen = candidates[0];
          roster[loc.id].Reserve = {
            guardId: chosen.id,
            guardName: chosen.name,
            locked: false
          };
          assignedGuardIds.add(chosen.id);
        }
      }
    });

    // 6. Calculate Shortages and Vacant Locations
    const shortages: ShortageRecord[] = [];
    const vacantLocationsSet = new Set<string>();

    locations.forEach((loc: Location) => {
      shiftsToFill.forEach(shift => {
        if (loc.shiftRequirement[shift]) {
          const cell = roster[loc.id][shift];
          if (!cell.guardId) {
            shortages.push({
              locationId: loc.id,
              locationName: loc.name,
              shift,
              required: 1,
              assigned: 0
            });
            vacantLocationsSet.add(loc.id);
          }
        }
      });
    });

    const vacantLocations = Array.from(vacantLocationsSet);

    // 7. Perform Conflict Detection on the generated roster
    const conflicts = timetableGenerator.detectConflicts(dateStr, roster);

    return {
      roster,
      shortages,
      vacantLocations,
      conflicts
    };
  },

  // Perform complete conflict detection on a roster
  detectConflicts: (dateStr: string, roster: DayRoster): ConflictRecord[] => {
    const guards = dbHub.getGuards();
    const locations = dbHub.getLocations();
    const attendance = dbHub.getAttendance(dateStr);
    const dayOfWeek = getDayOfWeek(dateStr);
    
    const conflicts: ConflictRecord[] = [];
    const assignedCount: { [guardId: string]: { count: number; details: { locId: string; shift: string }[] } } = {};

    // Analyze daily assignments
    Object.entries(roster).forEach(([locId, shifts]) => {
      const loc = locations.find((l: Location) => l.id === locId);
      (['Morning', 'Evening', 'Night', 'Reserve'] as const).forEach(shift => {
        const cell = shifts[shift];
        if (cell && cell.guardId) {
          const gId = cell.guardId;
          const guard = guards.find((g: Guard) => g.id === gId);
          
          if (!guard) return;

          // Track multi-assignments
          if (!assignedCount[gId]) {
            assignedCount[gId] = { count: 0, details: [] };
          }
          assignedCount[gId].count++;
          assignedCount[gId].details.push({ locId, shift });

          // 1. Availability check: is guard marked Leave/Absent/Medical/Training?
          const att = attendance.find((a: AttendanceRecord) => a.guardId === gId);
          if (att && ['Absent', 'Leave', 'Medical', 'Training'].includes(att.status)) {
            conflicts.push({
              type: 'unavailable',
              severity: 'high',
              message: `Guard ${guard.name} is assigned to ${loc?.name || locId} (${shift} Shift) but is marked ${att.status} today.`,
              guardId: gId,
              locationId: locId,
              shift: shift !== 'Reserve' ? shift : undefined
            });
          }

          // 2. Restricted Location Check
          if (guard.restrictedLocations.includes(locId)) {
            conflicts.push({
              type: 'restricted_location',
              severity: 'high',
              message: `Guard ${guard.name} is assigned to ${loc?.name || locId} which is in their restricted list.`,
              guardId: gId,
              locationId: locId,
              shift: shift !== 'Reserve' ? shift : undefined
            });
          }

          // 3. Weekly Off Check
          if (guard.weeklyOff === dayOfWeek) {
            conflicts.push({
              type: 'weekly_off',
              severity: 'info',
              message: `Guard ${guard.name} is assigned to ${loc?.name || locId} on their scheduled Weekly Off.`,
              guardId: gId,
              locationId: locId,
              shift: shift !== 'Reserve' ? shift : undefined
            });
          }
        }
      });
    });

    // Detect duplicates (assigned to multiple slots in same day)
    Object.entries(assignedCount).forEach(([gId, data]) => {
      const guard = guards.find((g: Guard) => g.id === gId);
      if (data.count > 1 && guard) {
        const detailsStr = data.details.map((d: any) => {
          const loc = locations.find((l: Location) => l.id === d.locId);
          return `${loc?.name || d.locId} (${d.shift})`;
        }).join(', ');
        
        conflicts.push({
          type: 'duplicate',
          severity: 'high',
          message: `Guard ${guard.name} has duplicate assignments: assigned to ${detailsStr}.`,
          guardId: gId
        });
      }
    });

    // Detect Rest Period overlaps (e.g. Night shift yesterday followed by Morning shift today)
    const history = dbHub.getRosterHistory();
    const yesterday = new Date(dateStr);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayRoster = history.find((h: RosterHistory) => h.date === yesterdayStr);

    if (yesterdayRoster) {
      Object.entries(roster).forEach(([locId, shifts]) => {
        if (shifts.Morning?.guardId) {
          const morningGuardId = shifts.Morning.guardId;
          
          // Check if worked night shift yesterday
          let workedNightYesterday = false;
          let yLocName = "";
          Object.entries(yesterdayRoster.roster).forEach(([yLocId, yShifts]: [string, any]) => {
            if (yShifts.Night?.guardId === morningGuardId) {
              workedNightYesterday = true;
              const yLoc = locations.find((l: Location) => l.id === yLocId);
              yLocName = yLoc?.name || yLocId;
            }
          });

          if (workedNightYesterday) {
            const guard = guards.find((g: Guard) => g.id === morningGuardId);
            conflicts.push({
              type: 'rest_period',
              severity: 'high',
              message: `Guard ${guard?.name} worked Night Shift yesterday at ${yLocName} and is scheduled for Morning Shift today. Rest limit (<12h) violated.`,
              guardId: morningGuardId,
              locationId: locId,
              shift: 'Morning'
            });
          }
        }
      });
    }

    return conflicts;
  },

  // Suggest replacements for a vacant shift
  getReplacementSuggestions: (dateStr: string, locationId: string, shift: 'Morning' | 'Evening' | 'Night'): Guard[] => {
    const guards = dbHub.getGuards();
    const attendance = dbHub.getAttendance(dateStr);
    const currentRoster = dbHub.getRosterForDate(dateStr);
    const dayOfWeek = getDayOfWeek(dateStr);

    // Get list of guards already assigned on this day
    const assignedIds = new Set<string>();
    if (currentRoster) {
      Object.values(currentRoster.roster).forEach((shifts: any) => {
        (['Morning', 'Evening', 'Night', 'Reserve'] as const).forEach(s => {
          if (shifts[s]?.guardId) assignedIds.add(shifts[s].guardId!);
        });
      });
    }

    // Filter guards who:
    // 1. Are not already assigned
    // 2. Are not restricted from this location
    // 3. Are Available or Holiday in attendance (avoid Leave, Absent, Medical, Training)
    return guards.filter((g: Guard) => {
      if (assignedIds.has(g.id)) return false;
      if (g.restrictedLocations.includes(locationId)) return false;
      
      const att = attendance.find((a: AttendanceRecord) => a.guardId === g.id);
      if (att && ['Absent', 'Leave', 'Medical', 'Training'].includes(att.status)) {
        return false;
      }
      if (g.status !== 'Available' && (!att || att.status !== 'Available')) {
        return false;
      }

      return true;
    }).sort((a: Guard, b: Guard) => {
      // Score suggestions: shift preference match first, weekly off matches later
      let scoreA = 0;
      let scoreB = 0;

      if (a.shiftPreference === shift || a.shiftPreference === 'Any') scoreA += 10;
      if (b.shiftPreference === shift || b.shiftPreference === 'Any') scoreB += 10;

      // Prefer if preferred location
      if (a.preferredLocations.includes(locationId)) scoreA += 5;
      if (b.preferredLocations.includes(locationId)) scoreB += 5;

      // Penalize if it's their weekly off (they can work, but less preferred)
      if (a.weeklyOff === dayOfWeek) scoreA -= 5;
      if (b.weeklyOff === dayOfWeek) scoreB -= 5;

      return scoreB - scoreA;
    });
  }
};
