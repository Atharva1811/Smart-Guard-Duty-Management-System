// server/src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../config/db.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password, name, email, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return sendError(res, 'Username is already taken.', 409, 'Conflict');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        name,
        email,
        role: role || 'VIEWER',
      },
    });

    sendSuccess(res, 'User registered successfully.', {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    }, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return sendError(res, 'Invalid credentials username or password.', 401, 'Unauthorized');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return sendError(res, 'Invalid credentials username or password.', 401, 'Unauthorized');
    }

    const payload = { userId: user.id, username: user.username, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save session in DB
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt,
      },
    });

    sendSuccess(res, 'Logged in successfully.', {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return sendError(res, 'Refresh token is required.', 400, 'Bad Request');
    }

    const session = await prisma.userSession.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) await prisma.userSession.delete({ where: { id: session.id } });
      return sendError(res, 'Session has expired or is invalid.', 403, 'Forbidden');
    }

    const payload = {
      userId: session.user.id,
      username: session.user.username,
      role: session.user.role,
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    // Swap refresh tokens
    await prisma.userSession.delete({ where: { id: session.id } });
    await prisma.userSession.create({
      data: {
        userId: session.user.id,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    sendSuccess(res, 'Tokens refreshed successfully.', {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.userSession.deleteMany({ where: { refreshToken } });
    }
    sendSuccess(res, 'Logged out successfully.');
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return sendError(res, 'Not authenticated', 401, 'Unauthorized');
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      return sendError(res, 'User profile not found.', 404, 'Not Found');
    }
    sendSuccess(res, 'User profile fetched.', {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};
