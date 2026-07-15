// server/src/scheduler/dutyScheduler.ts
import { prisma } from '../config/db.js';
import { GuardStatus, LeaveStatus } from '@prisma/client';

export interface LockedAssignmentInput {
  location_id: number;
  shift: string;
  guard_id: number;
  guard_name: string;
}

export interface ScoredCandidate {
  guard: any;
  score: number;
}

export const generateRosterSchedule = async (
  dateStr: string,
  lockedAssignments: LockedAssignmentInput[] = []
) => {
  // 1. Fetch system config rules
  const settingRecord = await prisma.setting.findUnique({ where: { key: 'system_config' } });
  let systemConfig = {
    rotationRules: {
      maxConsecutiveDuties: 5,
      maxNightShiftsPerWeek: 3,
      restHoursBetweenShifts: 12,
    }
  };
  if (settingRecord) {
    systemConfig = JSON.parse(settingRecord.value);
  }

  // 2. Fetch all locations and guards
  const locations = await prisma.location.findMany({ where: { status: 'Active' } });
  const guards = await prisma.guard.findMany();
  
  // 3. Fetch attendance & approved leaves for the date
  const attendance = await prisma.attendance.findMany({ where: { attendanceDate: dateStr } });
  const leaves = await prisma.leaveRequest.findMany({
    where: {
      leaveDate: dateStr,
      status: LeaveStatus.APPROVED,
    },
  });

  // 4. Fetch 14 days history prior to active date
  const dateObj = new Date(dateStr);
  const fourteenDaysAgoObj = new Date(dateObj.getTime() - 14 * 86400000);
  const fourteenDaysAgoStr = fourteenDaysAgoObj.toISOString().split('T')[0];

  const history = await prisma.assignmentHistory.findMany({
    where: {
      assignmentDate: {
        gte: fourteenDaysAgoStr,
        lt: dateStr,
      },
    },
    orderBy: { assignmentDate: 'desc' },
  });

  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday...
  const roster: Record<number, Record<string, any>> = {};
  const assignedGuardIds = new Set<number>();
  const shortages: any[] = [];
  const vacantLocations: string[] = [];

  // Initialize roster layout structure
  locations.forEach(loc => {
    roster[loc.id] = {
      Morning: null,
      Evening: null,
      Night: null,
      Reserve: null
    };
  });

  // Map Locked Overrides
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

  // Filter available guards (exclude approved leaves, absent attendance, weekly offs)
  const availableGuards = guards.filter(guard => {
    if (assignedGuardIds.has(guard.id)) return true; // Already locked in

    // Check approved leave
    const hasLeave = leaves.some(l => l.guardId === guard.id);
    if (hasLeave) return false;

    // Check attendance status
    const attRecord = attendance.find(a => a.guardId === guard.id);
    if (attRecord) {
      const unavailableStatuses: GuardStatus[] = [GuardStatus.ABSENT, GuardStatus.LEAVE, GuardStatus.MEDICAL, GuardStatus.TRAINING];
      if (unavailableStatuses.includes(attRecord.status)) {
        return false;
      }
    }

    // Check default guard status
    if (guard.status !== GuardStatus.AVAILABLE) {
      return false;
    }

    // Check weekly off day constraint
    if (guard.weeklyOff === dayOfWeek) {
      return false;
    }

    return true;
  });

  // Workload calculations maps
  const workloadMap: Record<number, number> = {};
  const lastLocationMap: Record<number, Record<number, number>> = {};
  const nightShiftStreakMap: Record<number, number> = {};

  guards.forEach(g => {
    workloadMap[g.id] = 0;
    lastLocationMap[g.id] = {};
    nightShiftStreakMap[g.id] = 0;
  });

  // Populate maps from database history
  history.forEach(h => {
    const gId = h.guardId;
    const locId = h.locationId;
    const shift = h.shift;

    if (gId && workloadMap[gId] !== undefined) {
      workloadMap[gId]++;

      if (!lastLocationMap[gId][locId]) {
        lastLocationMap[gId][locId] = 0;
      }
      lastLocationMap[gId][locId]++;

      // Night shift consecutive streaks (check if assigned night in recent history)
      if (shift === 'Night') {
        nightShiftStreakMap[gId]++;
      }
    }
  });

  // 4. Sticky assignment logic: Appoint yesterday's guard to the same spot/shift today (consecutive 6-day cycle)
  const yesterdayObj = new Date(dateObj.getTime() - 86400000);
  const yesterdayStr = yesterdayObj.toISOString().split('T')[0];

  availableGuards.forEach(g => {
    if (assignedGuardIds.has(g.id)) return;

    // Find yesterday's assignment in history logs
    const yesterdayAssign = history.find(h => h.assignmentDate === yesterdayStr && h.guardId === g.id);
    if (yesterdayAssign) {
      const locId = yesterdayAssign.locationId;
      const shift = yesterdayAssign.shift;

      const loc = locations.find(l => l.id === locId);
      if (loc) {
        const activeShifts = (loc.shift || 'Morning,Evening,Night').split(',');
        const isValidShift = activeShifts.includes(shift) || shift === 'Reserve';

        if (isValidShift) {
          const currentCell = roster[locId][shift];
          if (!currentCell || !currentCell.locked) {
            roster[locId][shift] = {
              guard_id: g.id,
              guard_name: g.name,
              guard_code: g.guardCode,
              locked: false
            };
            assignedGuardIds.add(g.id);
          }
        }
      }
    }
  });

  // Sort locations by priority (1 is highest priority Critical security check)
  const sortedLocations = [...locations].sort((a, b) => a.priority - b.priority);

  const shiftsToFill = ['Morning', 'Evening', 'Night'];

  sortedLocations.forEach(loc => {
    const activeShifts = (loc.shift || 'Morning,Evening,Night').split(',');

    shiftsToFill.forEach(shift => {
      if (!activeShifts.includes(shift)) return;

      // Skip if already locked by override
      if (roster[loc.id][shift] && roster[loc.id][shift].locked) return;

      // Find candidates matching shift rotation constraints
      const candidates = availableGuards.filter(g => {
        if (assignedGuardIds.has(g.id)) return false;

        // Avoid too many night shifts
        if (shift === 'Night' && nightShiftStreakMap[g.id] >= systemConfig.rotationRules.maxNightShiftsPerWeek) {
          return false;
        }

        // Rest period rule: worked night shift yesterday -> cannot work morning today
        if (shift === 'Morning') {
          const yesterdayObj = new Date(dateObj.getTime() - 86400000);
          const yesterdayStr = yesterdayObj.toISOString().split('T')[0];
          const workedYesterdayNight = history.some(h => 
            h.assignmentDate === yesterdayStr && 
            h.guardId === g.id && 
            h.shift === 'Night'
          );
          if (workedYesterdayNight) return false;
        }

        return true;
      });

      if (candidates.length === 0) {
        shortages.push({
          locationId: loc.id,
          locationName: loc.locationName,
          shift,
          required: loc.requiredGuards,
          assigned: 0
        });
        return;
      }

      // Compute scores
      const scoredCandidates: ScoredCandidate[] = candidates.map(g => {
        let score = 0;

        // Workload balance penalty (lower workload gives higher score)
        score -= (workloadMap[g.id] || 0) * 5;

        // Location repetition penalty
        const repCount = lastLocationMap[g.id][loc.id] || 0;
        score -= repCount * 15;

        return { guard: g, score };
      });

      scoredCandidates.sort((a, b) => b.score - a.score);
      const selected = scoredCandidates[0].guard;

      roster[loc.id][shift] = {
        guard_id: selected.id,
        guard_name: selected.name,
        guard_code: selected.guardCode,
        locked: false
      };
      assignedGuardIds.add(selected.id);
    });
  });

  // Reserve assignments (assign unassigned available guards to high-priority locations)
  const reserveLocations = sortedLocations.filter(l => l.priority === 1);
  const unassignedGuards = availableGuards
    .filter(g => !assignedGuardIds.has(g.id))
    .sort((a, b) => (workloadMap[a.id] || 0) - (workloadMap[b.id] || 0));

  reserveLocations.forEach(loc => {
    if (unassignedGuards.length === 0) return;

    const cell = roster[loc.id]['Reserve'];
    if (cell && cell.locked) return;

    const selected = unassignedGuards.shift();
    if (selected) {
      roster[loc.id]['Reserve'] = {
        guard_id: selected.id,
        guard_name: selected.name,
        guard_code: selected.guardCode,
        locked: false
      };
      assignedGuardIds.add(selected.id);
    }
  });

  // Find vacant checkpoints
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
      vacantLocations.push(loc.locationName);
    }
  });

  return {
    roster,
    shortages,
    vacantLocations
  };
};

// Check for timetable conflicts
export const detectTimetableConflicts = async (
  rosterList: any[],
  dateStr: string
) => {
  const conflicts: any[] = [];
  const guardAssignmentsMap: Record<number, string[]> = {};

  rosterList.forEach(a => {
    if (a.guard_id) {
      if (!guardAssignmentsMap[a.guard_id]) {
        guardAssignmentsMap[a.guard_id] = [];
      }
      guardAssignmentsMap[a.guard_id].push(a.shift);
    }
  });

  // 1. Double shift checks
  Object.entries(guardAssignmentsMap).forEach(([guardId, shifts]) => {
    if (shifts.length > 1) {
      conflicts.push({
        guardId: Number(guardId),
        type: 'DOUBLE_SHIFT',
        message: `Assigned to multiple shifts on this day: ${shifts.join(', ')}`
      });
    }
  });

  // 2. Rest hour check (worked night yesterday -> morning shift today)
  const yesterdayObj = new Date(new Date(dateStr).getTime() - 86400000);
  const yesterdayStr = yesterdayObj.toISOString().split('T')[0];

  const yesterdayAssignments = await prisma.assignmentHistory.findMany({
    where: { assignmentDate: yesterdayStr }
  });

  rosterList.forEach(a => {
    if (a.guard_id && a.shift === 'Morning') {
      const workedNightYesterday = yesterdayAssignments.some(y => 
        y.guardId === a.guard_id && y.shift === 'Night'
      );
      if (workedNightYesterday) {
        conflicts.push({
          guardId: a.guard_id,
          type: 'REST_CONSTRAINT',
          message: `Worked Night shift yesterday, violating 12h rest limit by working Morning shift today`
        });
      }
    }
  });

  return conflicts;
};

// Get replacement recommendations
export const getReplacementCandidates = async (
  dateStr: string,
  locationId: number,
  shift: string
) => {
  const guards = await prisma.guard.findMany();
  const attendance = await prisma.attendance.findMany({ where: { attendanceDate: dateStr } });
  const leaves = await prisma.leaveRequest.findMany({
    where: { leaveDate: dateStr, status: LeaveStatus.APPROVED }
  });

  // Check current allocations for this date to exclude active guards
  const activeAssignments = await prisma.dutyAssignment.findMany({
    where: { assignmentDate: dateStr }
  });

  const assignedGuardIds = new Set(
    activeAssignments.map(a => a.guardId).filter(id => id !== null) as number[]
  );

  const dayOfWeek = new Date(dateStr).getDay();

  return guards.filter(guard => {
    if (assignedGuardIds.has(guard.id)) return false;

    // Filter approved leaves
    const hasLeave = leaves.some(l => l.guardId === guard.id);
    if (hasLeave) return false;

    // Filter absent statuses
    const att = attendance.find(a => a.guardId === guard.id);
    if (att) {
      const bad: GuardStatus[] = [GuardStatus.ABSENT, GuardStatus.LEAVE, GuardStatus.MEDICAL, GuardStatus.TRAINING];
      if (bad.includes(att.status)) return false;
    }

    if (guard.status !== GuardStatus.AVAILABLE) return false;
    if (guard.weeklyOff === dayOfWeek) return false;

    return true;
  });
};
