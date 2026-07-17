// server/src/controllers/leaveController.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { LeaveStatus, GuardStatus } from '@prisma/client';

export const getAllLeaves = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const leaves = await prisma.leaveRequest.findMany({
      include: {
        guard: {
          select: { name: true, guardCode: true }
        }
      },
      orderBy: { leaveDate: 'desc' },
    });
    
    // Map response matching old UI format
    const formatted = leaves.map(l => ({
      id: l.id,
      guard_id: l.guardId,
      guard_name: l.guard.name,
      guard_code: l.guard.guardCode,
      leave_date: l.leaveDate,
      reason: l.reason || '',
      status: l.status,
    }));

    sendSuccess(res, 'Leave requests fetched successfully.', formatted);
  } catch (error) {
    next(error);
  }
};

export const createLeave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { guardId, leaveDate, reason } = req.body;

    const leave = await prisma.leaveRequest.create({
      data: {
        guardId,
        leaveDate,
        reason,
        status: LeaveStatus.PENDING,
      },
    });

    sendSuccess(res, 'Leave application submitted successfully.', leave, 201);
  } catch (error) {
    next(error);
  }
};

export const updateLeaveStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body; // APPROVED or REJECTED

    if (!Object.values(LeaveStatus).includes(status)) {
      return sendError(res, 'Invalid status parameter.', 400, 'Bad Request');
    }

    const leave = await prisma.leaveRequest.update({
      where: { id },
      data: { status: status as LeaveStatus },
    });

    // If leave is approved, also auto-register in Guard's attendance status
    if (status === LeaveStatus.APPROVED) {
      await prisma.attendance.upsert({
        where: {
          guardId_attendanceDate: {
            guardId: leave.guardId,
            attendanceDate: leave.leaveDate,
          }
        },
        update: { status: GuardStatus.LEAVE },
        create: {
          guardId: leave.guardId,
          attendanceDate: leave.leaveDate,
          status: GuardStatus.LEAVE,
          notes: 'Auto-approved Leave application',
        }
      });

      // Update basic Guard status
      await prisma.guard.update({
        where: { id: leave.guardId },
        data: { status: GuardStatus.LEAVE }
      });
    }

    sendSuccess(res, `Leave request status updated to ${status}.`, leave);
  } catch (error) {
    next(error);
  }
};
