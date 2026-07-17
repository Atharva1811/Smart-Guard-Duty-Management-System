// server/src/controllers/settingController.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { sendSuccess } from '../utils/response.js';

export const getSettings = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'system_config' } });
    if (!setting) {
      // Return default configuration
      const defaults = {
        shiftTimings: {
          Morning: { start: '06:00', end: '14:00' },
          Evening: { start: '14:00', end: '22:00' },
          Night: { start: '22:00', end: '06:00' },
        },
        rotationRules: {
          maxConsecutiveDuties: 5,
          maxNightShiftsPerWeek: 3,
          restHoursBetweenShifts: 12,
        },
        holidayCalendar: [],
      };
      return sendSuccess(res, 'Default settings loaded.', defaults);
    }
    sendSuccess(res, 'Settings configuration fetched.', JSON.parse(setting.value));
  } catch (error) {
    next(error);
  }
};

export const saveSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { shiftTimings, rotationRules, holidayCalendar } = req.body;

    const data = {
      shiftTimings,
      rotationRules,
      holidayCalendar: holidayCalendar || [],
    };

    const setting = await prisma.setting.upsert({
      where: { key: 'system_config' },
      update: { value: JSON.stringify(data) },
      create: { key: 'system_config', value: JSON.stringify(data) },
    });

    // Sync Holiday Calendar table
    if (Array.isArray(holidayCalendar)) {
      await prisma.holidayCalendar.deleteMany(); // Reset list
      for (const h of holidayCalendar) {
        if (h.date && h.name) {
          await prisma.holidayCalendar.create({
            data: {
              holidayDate: h.date,
              name: h.name
            }
          });
        }
      }
    }

    sendSuccess(res, 'Settings saved successfully.', JSON.parse(setting.value));
  } catch (error) {
    next(error);
  }
};
