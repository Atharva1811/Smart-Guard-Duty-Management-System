// server/src/controllers/rosterController.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { generateRosterSchedule, detectTimetableConflicts, getReplacementCandidates } from '../scheduler/dutyScheduler.js';

export const getAssignments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const date = req.query.date as string;
    if (!date) {
      return sendError(res, 'Date parameter is required.', 400, 'Bad Request');
    }

    const assignments = await prisma.dutyAssignment.findMany({
      where: { assignmentDate: date },
      include: {
        guard: { select: { name: true, guardCode: true } },
        location: { select: { locationName: true } }
      }
    });

    // Map to simple JSON format expected by frontend
    const formatted = assignments.map(a => ({
      id: a.id,
      location_id: a.locationId,
      location_name: a.location.locationName,
      shift: a.shift,
      guard_id: a.guardId || null,
      guard_name: a.guard ? a.guard.name : null,
      guard_code: a.guard ? a.guard.guardCode : null,
      status: a.status,
      assignment_date: a.assignmentDate
    }));

    sendSuccess(res, 'Timetable assignments fetched.', formatted);
  } catch (error) {
    next(error);
  }
};

export const generateRoster = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date, lockedAssignments } = req.body;
    if (!date) {
      return sendError(res, 'Date parameter is required.', 400, 'Bad Request');
    }

    const result = await generateRosterSchedule(date, lockedAssignments || []);
    sendSuccess(res, 'Timetable roster generated successfully.', result);
  } catch (error) {
    next(error);
  }
};

export const saveAssignments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date, assignments } = req.body; // array of assignments [{ guard_id, location_id, shift, status }]
    if (!date || !Array.isArray(assignments)) {
      return sendError(res, 'Date and assignments list are required.', 400, 'Bad Request');
    }

    // 1. Fetch lookup records beforehand to avoid N+1 queries inside transaction
    const [guardsList, locationsList] = await Promise.all([
      prisma.guard.findMany(),
      prisma.location.findMany()
    ]);

    const guardsMap = new Map(guardsList.map(g => [g.id, g]));
    const locationsMap = new Map(locationsList.map(l => [l.id, l]));

    const assignmentsToInsert = assignments.map(a => ({
      guardId: a.guard_id || null,
      locationId: a.location_id,
      shift: a.shift,
      assignmentDate: date,
      status: a.status || 'Assigned'
    }));

    const historyToInsert = assignments
      .filter(a => a.guard_id)
      .map(a => {
        const guard = guardsMap.get(a.guard_id);
        const location = locationsMap.get(a.location_id);
        return {
          guardId: a.guard_id,
          locationId: a.location_id,
          shift: a.shift,
          assignmentDate: date,
          remarks: `Assigned to ${location?.locationName || 'checkpoint'} on ${shiftFriendly(a.shift)}`
        };
      });

    // 2. Perform DB operations inside transaction
    await prisma.$transaction(async (tx) => {
      // Delete existing for target date
      await tx.dutyAssignment.deleteMany({ where: { assignmentDate: date } });

      // Prune records older than 3 days before target date
      const currentDate = new Date(date);
      const thresholdDate = new Date(currentDate);
      thresholdDate.setDate(currentDate.getDate() - 3);
      const thresholdDateStr = thresholdDate.toISOString().split('T')[0];

      await tx.dutyAssignment.deleteMany({
        where: {
          assignmentDate: {
            lt: thresholdDateStr
          }
        }
      });

      await tx.assignmentHistory.deleteMany({
        where: {
          assignmentDate: {
            lt: thresholdDateStr
          }
        }
      });

      // Bulk Insert assignments
      if (assignmentsToInsert.length > 0) {
        await tx.dutyAssignment.createMany({ data: assignmentsToInsert });
      }

      // Bulk Insert history
      if (historyToInsert.length > 0) {
        await tx.assignmentHistory.createMany({ data: historyToInsert });
      }
    });

    sendSuccess(res, 'Daily duty timetable saved successfully.');
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = Number(req.query.limit) || 100;
    const history = await prisma.assignmentHistory.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        guard: { select: { name: true, guardCode: true } },
        location: { select: { locationName: true } }
      }
    });

    const formatted = history.map(h => ({
      id: h.id,
      guard_id: h.guardId,
      guard_name: h.guard ? h.guard.name : 'Unknown',
      guard_code: h.guard ? h.guard.guardCode : '??',
      location_id: h.locationId,
      location_name: h.location.locationName,
      shift: h.shift,
      assignment_date: h.assignmentDate,
      remarks: h.remarks
    }));

    sendSuccess(res, 'History events fetched.', { results: formatted });
  } catch (error) {
    next(error);
  }
};

export const getReplacementSuggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date, locationId, shift } = req.query;
    if (!date || !locationId || !shift) {
      return sendError(res, 'Parameters date, locationId, and shift are required.', 400, 'Bad Request');
    }

    const candidates = await getReplacementCandidates(
      date as string,
      Number(locationId),
      shift as string
    );
    sendSuccess(res, 'Replacement candidates fetched.', candidates);
  } catch (error) {
    next(error);
  }
};

export const checkConflicts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date, roster } = req.body;
    if (!date || !Array.isArray(roster)) {
      return sendError(res, 'Date and roster elements array are required.', 400, 'Bad Request');
    }

    const conflicts = await detectTimetableConflicts(roster, date);
    sendSuccess(res, 'Conflicts analyzed.', conflicts);
  } catch (error) {
    next(error);
  }
};

const shiftFriendly = (shift: string) => {
  return shift === 'Morning' ? 'Morning Shift' : shift === 'Evening' ? 'Evening Shift' : 'Night Shift';
};
