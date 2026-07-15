// server/src/controllers/guardController.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { GuardStatus } from '@prisma/client';

export const getAllGuards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const guards = await prisma.guard.findMany({
      orderBy: { guardCode: 'asc' },
    });
    sendSuccess(res, 'Guards fetched successfully.', guards);
  } catch (error) {
    next(error);
  }
};

export const getGuardById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const guard = await prisma.guard.findUnique({ where: { id } });
    if (!guard) {
      return sendError(res, 'Guard not found.', 404, 'Not Found');
    }
    sendSuccess(res, 'Guard details fetched.', guard);
  } catch (error) {
    next(error);
  }
};

export const createGuard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { guardCode, name, phone, email, age, experience, gender, shiftPreference, weeklyOff, status } = req.body;

    const existing = await prisma.guard.findUnique({ where: { guardCode } });
    if (existing) {
      return sendError(res, 'A guard with this guard code already exists.', 409, 'Conflict');
    }

    const guard = await prisma.guard.create({
      data: {
        guardCode,
        name,
        phone,
        email,
        age,
        experience,
        gender,
        shiftPreference,
        weeklyOff,
        status: status as GuardStatus,
      },
    });

    sendSuccess(res, 'Guard profile created successfully.', guard, 201);
  } catch (error) {
    next(error);
  }
};

export const updateGuard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { guardCode, name, phone, email, age, experience, gender, shiftPreference, weeklyOff, status } = req.body;

    const guard = await prisma.guard.update({
      where: { id },
      data: {
        guardCode,
        name,
        phone,
        email,
        age,
        experience,
        gender,
        shiftPreference,
        weeklyOff,
        status: status as GuardStatus,
      },
    });

    sendSuccess(res, 'Guard profile updated successfully.', guard);
  } catch (error) {
    next(error);
  }
};

export const deleteGuard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await prisma.guard.delete({ where: { id } });
    sendSuccess(res, 'Guard profile deleted successfully.');
  } catch (error) {
    next(error);
  }
};
