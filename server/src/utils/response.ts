// server/src/utils/response.ts
import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export const sendSuccess = <T>(res: Response, message: string, data?: T, statusCode = 200): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res: Response, error: string, statusCode = 500, message = 'An error occurred'): void => {
  res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};
