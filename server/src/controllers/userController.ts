// server/src/controllers/userController.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { Role } from '@prisma/client';

export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
    });
    const formatted = users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      email: u.email
    }));
    sendSuccess(res, 'User logins fetched successfully.', formatted);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);

    // Prevent deleting the primary admin account
    const user = await prisma.user.findUnique({ where: { id } });
    if (user && user.username === 'admin') {
      return sendError(res, 'The root admin account cannot be deleted.', 400, 'Bad Request');
    }

    await prisma.user.delete({ where: { id } });
    sendSuccess(res, 'User account deleted successfully.');
  } catch (error) {
    next(error);
  }
};
