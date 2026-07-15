// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, 'Access Token is missing in headers.', 401, 'Unauthorized');
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    const msg = error.name === 'TokenExpiredError' ? 'Access token has expired.' : 'Access token is invalid.';
    return sendError(res, msg, 403, 'Forbidden');
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return sendError(res, 'User identity not authenticated.', 401, 'Unauthorized');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, `User role (${req.user.role}) is unauthorized to perform this operation.`, 403, 'Forbidden');
    }

    next();
  };
};
