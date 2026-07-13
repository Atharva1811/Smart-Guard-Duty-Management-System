import axios from "axios";
import { mockDb } from "./mockDb";
import type { Guard, Location, LeaveRequest, AttendanceRecord, RosterHistory, SystemSettings } from "./mockDb";

// Dynamic connector that fetches settings to make request to Google Sheets
const getApiConfig = () => {
  const settings = mockDb.getSettings();
  return {
    url: settings.googleSheets.appsScriptUrl,
    enabled: settings.googleSheets.enabled && !!settings.googleSheets.appsScriptUrl
  };
};

export const googleSheetsClient = {
  // Check connection
  testConnection: async (url: string): Promise<boolean> => {
    try {
      const response = await axios.get(`${url}?action=ping`);
      return response.data && response.data.status === "ok";
    } catch (e) {
      console.error("Sheets connection test failed", e);
      return false;
    }
  },

  // Pull all data from sheets and sync to mockDb (localStorage)
  pullData: async (): Promise<boolean> => {
    const config = getApiConfig();
    if (!config.enabled) return false;

    try {
      const response = await axios.get(`${config.url}?action=pullAll`);
      if (response.data && response.data.status === "success") {
        const { guards, locations, leaves, settings, rosterHistory, attendance } = response.data.data;
        
        if (guards) mockDb.saveGuards(guards);
        if (locations) mockDb.saveLocations(locations);
        if (leaves) mockDb.saveLeaves(leaves);
        if (rosterHistory) mockDb.saveRosterHistory(rosterHistory);
        if (settings) {
          // Merge with sheet settings but preserve the sheets config itself so it doesn't loop
          const localSettings = mockDb.getSettings();
          mockDb.saveSettings({
            ...settings,
            googleSheets: localSettings.googleSheets,
            githubStorage: localSettings.githubStorage
          });
        }
        
        // Sync attendance
        if (attendance) {
          localStorage.setItem("attendance", JSON.stringify(attendance));
        }
        
        mockDb.addAuditLog("system", "Google Sheets Sync", "Successfully pulled and updated all tables from Google Sheets.");
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to pull from Google Sheets", e);
      return false;
    }
  },

  // Push specific action/data to Google Sheets
  pushData: async (action: string, payload: any): Promise<boolean> => {
    const config = getApiConfig();
    if (!config.enabled) return false;

    try {
      // Google Apps Script requires content-type application/x-www-form-urlencoded or text/plain
      // to bypass CORS preflight redirect issues, so we post as a plain text string
      const response = await axios.post(config.url, {
        action,
        data: payload
      }, {
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        }
      });
      
      if (response.data && response.data.status === "success") {
        return true;
      }
      return false;
    } catch (e) {
      console.error(`Failed to push action ${action} to Google Sheets`, e);
      return false;
    }
  },

  // Sync individual tables
  syncGuards: (guards: Guard[]) => googleSheetsClient.pushData("syncGuards", guards),
  syncLocations: (locations: Location[]) => googleSheetsClient.pushData("syncLocations", locations),
  syncLeaves: (leaves: LeaveRequest[]) => googleSheetsClient.pushData("syncLeaves", leaves),
  syncRosterHistory: (roster: RosterHistory[]) => googleSheetsClient.pushData("syncRosterHistory", roster),
  syncAttendance: (date: string, records: AttendanceRecord[]) => googleSheetsClient.pushData("syncAttendance", { date, records }),
  syncSettings: (settings: SystemSettings) => googleSheetsClient.pushData("syncSettings", settings)
};
