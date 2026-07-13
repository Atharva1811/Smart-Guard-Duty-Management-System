import { mockDb } from "./mockDb";
import type { Guard, Location, LeaveRequest, AttendanceRecord, RosterHistory, SystemSettings, AuditLog, SystemUser } from "./mockDb";
import { googleSheetsClient } from "./googleSheetsClient";
import { githubClient } from "./githubClient";

export const dbHub = {
  // Users
  getUsers: (): SystemUser[] => mockDb.getUsers(),
  saveUsers: (users: SystemUser[]): void => mockDb.saveUsers(users),
  // Pull database from active cloud service
  pullCloudData: async (): Promise<boolean> => {
    const settings = mockDb.getSettings();
    if (settings.googleSheets.enabled) {
      return await googleSheetsClient.pullData();
    } else if (settings.githubStorage.enabled) {
      return await githubClient.pullData();
    }
    return false;
  },

  // Push all local data to active cloud service
  pushCloudData: async (): Promise<boolean> => {
    const settings = mockDb.getSettings();
    if (settings.googleSheets.enabled) {
      // Sync each table to Google Sheets
      try {
        await googleSheetsClient.syncGuards(mockDb.getGuards());
        await googleSheetsClient.syncLocations(mockDb.getLocations());
        await googleSheetsClient.syncLeaves(mockDb.getLeaves());
        await googleSheetsClient.syncRosterHistory(mockDb.getRosterHistory());
        await googleSheetsClient.syncSettings(mockDb.getSettings());
        return true;
      } catch (e) {
        console.error("Sheets push failed", e);
        return false;
      }
    } else if (settings.githubStorage.enabled) {
      return await githubClient.pushData();
    }
    return false;
  },

  // Guards
  getGuards: (): Guard[] => mockDb.getGuards(),
  saveGuards: async (guards: Guard[]): Promise<void> => {
    mockDb.saveGuards(guards);
    const settings = mockDb.getSettings();
    if (settings.googleSheets.enabled) {
      await googleSheetsClient.syncGuards(guards);
    } else if (settings.githubStorage.enabled) {
      await githubClient.pushData();
    }
  },

  // Locations
  getLocations: (): Location[] => mockDb.getLocations(),
  saveLocations: async (locations: Location[]): Promise<void> => {
    mockDb.saveLocations(locations);
    const settings = mockDb.getSettings();
    if (settings.googleSheets.enabled) {
      await googleSheetsClient.syncLocations(locations);
    } else if (settings.githubStorage.enabled) {
      await githubClient.pushData();
    }
  },

  // Leaves
  getLeaves: (): LeaveRequest[] => mockDb.getLeaves(),
  saveLeaves: async (leaves: LeaveRequest[]): Promise<void> => {
    mockDb.saveLeaves(leaves);
    const settings = mockDb.getSettings();
    if (settings.googleSheets.enabled) {
      await googleSheetsClient.syncLeaves(leaves);
    } else if (settings.githubStorage.enabled) {
      await githubClient.pushData();
    }
  },

  // Attendance
  getAttendance: (date: string): AttendanceRecord[] => mockDb.getAttendance(date),
  saveAttendance: async (date: string, records: AttendanceRecord[]): Promise<void> => {
    mockDb.saveAttendance(date, records);
    const settings = mockDb.getSettings();
    if (settings.googleSheets.enabled) {
      await googleSheetsClient.syncAttendance(date, records);
    } else if (settings.githubStorage.enabled) {
      await githubClient.pushData();
    }
  },

  // Settings
  getSettings: (): SystemSettings => mockDb.getSettings(),
  saveSettings: async (settings: SystemSettings): Promise<void> => {
    mockDb.saveSettings(settings);
    if (settings.googleSheets.enabled) {
      await googleSheetsClient.syncSettings(settings);
    } else if (settings.githubStorage.enabled) {
      await githubClient.pushData();
    }
  },

  // Roster History
  getRosterHistory: (): RosterHistory[] => mockDb.getRosterHistory(),
  getRosterForDate: (date: string): RosterHistory | null => mockDb.getRosterForDate(date),
  saveRosterForDate: async (
    date: string, 
    roster: any, 
    shortages: any[] = [], 
    vacantLocations: string[] = [], 
    user: string = "system"
  ): Promise<void> => {
    mockDb.saveRosterForDate(date, roster, shortages, vacantLocations, user);
    const settings = mockDb.getSettings();
    if (settings.googleSheets.enabled) {
      await googleSheetsClient.syncRosterHistory(mockDb.getRosterHistory());
    } else if (settings.githubStorage.enabled) {
      await githubClient.pushData();
    }
  },

  // Audit Logs
  getAuditLogs: (): AuditLog[] => mockDb.getAuditLogs(),
  addAuditLog: async (user: string, action: string, details: string): Promise<void> => {
    mockDb.addAuditLog(user, action, details);
    const settings = mockDb.getSettings();
    if (settings.githubStorage.enabled) {
      await githubClient.pushData();
    }
  }
};
