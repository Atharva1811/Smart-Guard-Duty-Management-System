// server/src/validators/schemas.ts
import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6),
  name: z.string().min(2),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'SUPERVISOR', 'VIEWER']).optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const guardSchema = z.object({
  guardCode: z.string().min(2).max(10),
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  gender: z.string().optional(),
  permanentLocationId: z.number().nullable().optional(),
  permanentShift: z.string().nullable().optional(),
  weeklyOff: z.number().int().min(-1).max(6).default(0),
  status: z.enum(['AVAILABLE', 'LEAVE', 'ABSENT', 'TRAINING', 'MEDICAL', 'HOLIDAY']).default('AVAILABLE'),
});

export const locationSchema = z.object({
  locationName: z.string().min(2),
  requiredGuards: z.number().int().min(1).default(1),
  priority: z.number().int().min(1).max(3).default(2),
  securityLevel: z.string().default('Standard'),
  shift: z.string().min(2), // Comma separated shifts like "Morning,Evening"
  shiftTimings: z.string().optional(),
  status: z.string().default('Active'),
});

export const leaveSchema = z.object({
  guardId: z.number().int(),
  leaveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  reason: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
});

export const attendanceSchema = z.object({
  guardId: z.number().int(),
  status: z.enum(['AVAILABLE', 'LEAVE', 'ABSENT', 'TRAINING', 'MEDICAL', 'HOLIDAY']),
  attendanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  notes: z.string().optional(),
});

export const assignmentSchema = z.object({
  guardId: z.number().int().nullable().optional(),
  locationId: z.number().int(),
  shift: z.enum(['Morning', 'Evening', 'Night', 'Reserve']),
  assignmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  status: z.string().default('Assigned'),
});
