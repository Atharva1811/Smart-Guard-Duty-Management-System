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

    // Save using database transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete existing for that date
      await tx.dutyAssignment.deleteMany({ where: { assignmentDate: date } });

      // 2. Insert new records
      for (const a of assignments) {
        await tx.dutyAssignment.create({
          data: {
            guardId: a.guard_id || null,
            locationId: a.location_id,
            shift: a.shift,
            assignmentDate: date,
            status: a.status || 'Assigned'
          }
        });

        // 3. Log to History trail
        if (a.guard_id) {
          const guard = await tx.guard.findUnique({ where: { id: a.guard_id } });
          const location = await tx.location.findUnique({ where: { id: a.location_id } });
          await tx.assignmentHistory.create({
            data: {
              guardId: a.guard_id,
              locationId: a.location_id,
              shift: a.shift,
              assignmentDate: date,
              remarks: `Assigned to ${location?.locationName || 'checkpoint'} on ${shiftFriendly(a.shift)}`
            }
          });
        }
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
