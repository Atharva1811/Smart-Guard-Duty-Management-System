// server/src/controllers/locationController.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getAllLocations = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { id: 'asc' },
    });
    sendSuccess(res, 'Locations fetched successfully.', locations);
  } catch (error) {
    next(error);
  }
};

export const getLocationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const location = await prisma.location.findUnique({ where: { id } });
    if (!location) {
      return sendError(res, 'Location not found.', 404, 'Not Found');
    }
    sendSuccess(res, 'Location details fetched.', location);
  } catch (error) {
    next(error);
  }
};

export const createLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { locationName, requiredGuards, priority, securityLevel, shift, status } = req.body;

    const location = await prisma.location.create({
      data: {
        locationName,
        requiredGuards,
        priority,
        securityLevel,
        shift,
        status: status || 'Active',
      },
    });

    sendSuccess(res, 'Location checkpoint created successfully.', location, 201);
  } catch (error) {
    next(error);
  }
};

export const updateLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { locationName, requiredGuards, priority, securityLevel, shift, status } = req.body;

    const location = await prisma.location.update({
      where: { id },
      data: {
        locationName,
        requiredGuards,
        priority,
        securityLevel,
        shift,
        status,
      },
    });

    sendSuccess(res, 'Location updated successfully.', location);
  } catch (error) {
    next(error);
  }
};

export const deleteLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await prisma.location.delete({ where: { id } });
    sendSuccess(res, 'Location deleted successfully.');
  } catch (error) {
    next(error);
  }
};
