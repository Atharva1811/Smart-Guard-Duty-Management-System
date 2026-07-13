export interface Guard {
  id: string;
  name: string;
  phone: string;
  age: number;
  experience: number; // in years
  department: string;
  shiftPreference: 'Morning' | 'Evening' | 'Night' | 'Any';
  preferredLocations: string[]; // list of location IDs
  restrictedLocations: string[]; // list of location IDs
  weeklyOff: number; // 0 = Sunday, 1 = Monday, etc.
  maxConsecutiveDuties: number;
  maxNightShifts: number;
  status: 'Available' | 'Leave' | 'Training' | 'Absent' | 'Medical';
}

export interface Location {
  id: string;
  name: string;
  priority: 'High' | 'Medium' | 'Low';
  guardsRequired: number; // guards required per active shift
  shiftRequirement: {
    Morning: boolean;
    Evening: boolean;
    Night: boolean;
  };
  indoorOutdoor: 'Indoor' | 'Outdoor';
  securityLevel: 'Critical' | 'Standard' | 'Low';
  specialSkillsRequired: string[];
  availableTime: string; // e.g. "24/7", "06:00-22:00"
  notes: string;
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  guardId: string;
  status: 'Available' | 'Leave' | 'Absent' | 'Medical' | 'Holiday' | 'Training' | 'Late Arrival' | 'Early Exit';
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  guardId: string;
  guardName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface RosterCell {
  guardId: string | null;
  guardName: string | null;
  locked: boolean;
}

export interface DayRoster {
  [locationId: string]: {
    Morning: RosterCell;
    Evening: RosterCell;
    Night: RosterCell;
    Reserve: RosterCell;
  };
}

export interface RosterHistory {
  date: string; // YYYY-MM-DD
  roster: DayRoster;
  shortages: { locationId: string; shift: 'Morning' | 'Evening' | 'Night'; required: number; assigned: number }[];
  vacantLocations: string[]; // location IDs
  lastUpdated: string;
  updatedBy: string;
}

export interface SystemUser {
  username: string;
  name: string;
  role: 'Admin' | 'Security Officer';
  email: string;
}

export interface SystemSettings {
  shiftTimings: {
    Morning: { start: string; end: string };
    Evening: { start: string; end: string };
    Night: { start: string; end: string };
  };
  rotationRules: {
    maxConsecutiveDuties: number;
    maxNightShiftsPerWeek: number;
    restHoursBetweenShifts: number;
  };
  holidayCalendar: { date: string; name: string }[];
  autoGenerationTime: string; // e.g., "18:00"
  googleSheets: {
    spreadsheetId: string;
    appsScriptUrl: string;
    enabled: boolean;
  };
  githubStorage: {
    repoOwner: string;
    repoName: string;
    token: string;
    filePath: string;
    enabled: boolean;
  };
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

// Initial Mock Data
const INITIAL_GUARDS: Guard[] = [
  { id: "G001", name: "John Doe", phone: "+1 555-0101", age: 34, experience: 8, department: "Corporate Security", shiftPreference: "Morning", preferredLocations: ["L001", "L002"], restrictedLocations: ["L006"], weeklyOff: 0, maxConsecutiveDuties: 5, maxNightShifts: 2, status: "Available" },
  { id: "G002", name: "Robert Smith", phone: "+1 555-0102", age: 29, experience: 4, department: "Patrol Security", shiftPreference: "Night", preferredLocations: ["L003", "L004"], restrictedLocations: [], weeklyOff: 6, maxConsecutiveDuties: 4, maxNightShifts: 3, status: "Available" },
  { id: "G003", name: "Michael Johnson", phone: "+1 555-0103", age: 42, experience: 12, department: "Corporate Security", shiftPreference: "Evening", preferredLocations: ["L001"], restrictedLocations: ["L004"], weeklyOff: 1, maxConsecutiveDuties: 6, maxNightShifts: 1, status: "Available" },
  { id: "G004", name: "David Williams", phone: "+1 555-0104", age: 31, experience: 5, department: "Patrol Security", shiftPreference: "Morning", preferredLocations: ["L002", "L005"], restrictedLocations: [], weeklyOff: 2, maxConsecutiveDuties: 5, maxNightShifts: 2, status: "Available" },
  { id: "G005", name: "James Brown", phone: "+1 555-0105", age: 27, experience: 3, department: "Gate Control", shiftPreference: "Evening", preferredLocations: ["L005"], restrictedLocations: ["L001"], weeklyOff: 3, maxConsecutiveDuties: 5, maxNightShifts: 2, status: "Available" },
  { id: "G006", name: "Patricia Davis", phone: "+1 555-0106", age: 38, experience: 9, department: "CCTV Operations", shiftPreference: "Night", preferredLocations: ["L006"], restrictedLocations: [], weeklyOff: 4, maxConsecutiveDuties: 6, maxNightShifts: 4, status: "Available" },
  { id: "G007", name: "Linda Miller", phone: "+1 555-0107", age: 45, experience: 15, department: "Corporate Security", shiftPreference: "Any", preferredLocations: ["L001", "L003"], restrictedLocations: ["L005"], weeklyOff: 0, maxConsecutiveDuties: 5, maxNightShifts: 1, status: "Available" },
  { id: "G008", name: "Elizabeth Wilson", phone: "+1 555-0108", age: 33, experience: 7, department: "Patrol Security", shiftPreference: "Morning", preferredLocations: ["L004"], restrictedLocations: [], weeklyOff: 5, maxConsecutiveDuties: 5, maxNightShifts: 2, status: "Leave" },
  { id: "G009", name: "Richard Moore", phone: "+1 555-0109", age: 26, experience: 2, department: "Gate Control", shiftPreference: "Evening", preferredLocations: ["L002"], restrictedLocations: ["L003"], weeklyOff: 6, maxConsecutiveDuties: 4, maxNightShifts: 2, status: "Available" },
  { id: "G010", name: "Charles Taylor", phone: "+1 555-0110", age: 35, experience: 6, department: "Patrol Security", shiftPreference: "Night", preferredLocations: ["L003", "L006"], restrictedLocations: ["L002"], weeklyOff: 1, maxConsecutiveDuties: 5, maxNightShifts: 3, status: "Available" },
  { id: "G011", name: "Joseph Anderson", phone: "+1 555-0111", age: 40, experience: 11, department: "CCTV Operations", shiftPreference: "Any", preferredLocations: ["L006"], restrictedLocations: [], weeklyOff: 2, maxConsecutiveDuties: 6, maxNightShifts: 2, status: "Available" },
  { id: "G012", name: "Thomas Thomas", phone: "+1 555-0112", age: 28, experience: 4, department: "Gate Control", shiftPreference: "Morning", preferredLocations: ["L005"], restrictedLocations: [], weeklyOff: 3, maxConsecutiveDuties: 5, maxNightShifts: 2, status: "Available" },
  { id: "G013", name: "Christopher Jackson", phone: "+1 555-0113", age: 32, experience: 5, department: "Patrol Security", shiftPreference: "Evening", preferredLocations: ["L004"], restrictedLocations: ["L001"], weeklyOff: 4, maxConsecutiveDuties: 5, maxNightShifts: 2, status: "Training" },
  { id: "G014", name: "Daniel White", phone: "+1 555-0114", age: 37, experience: 9, department: "Corporate Security", shiftPreference: "Night", preferredLocations: ["L001", "L002"], restrictedLocations: [], weeklyOff: 5, maxConsecutiveDuties: 5, maxNightShifts: 3, status: "Available" },
  { id: "G015", name: "Matthew Harris", phone: "+1 555-0115", age: 30, experience: 4, department: "Patrol Security", shiftPreference: "Any", preferredLocations: ["L003", "L005"], restrictedLocations: ["L006"], weeklyOff: 6, maxConsecutiveDuties: 5, maxNightShifts: 2, status: "Available" }
];

const INITIAL_LOCATIONS: Location[] = [
  { id: "L001", name: "Main HQ Reception", priority: "High", guardsRequired: 1, shiftRequirement: { Morning: true, Evening: true, Night: false }, indoorOutdoor: "Indoor", securityLevel: "Critical", specialSkillsRequired: ["First Aid", "Visitor Management"], availableTime: "06:00-22:00", notes: "Requires sharp presentation and communication." },
  { id: "L002", name: "Front Gate Barrier", priority: "High", guardsRequired: 1, shiftRequirement: { Morning: true, Evening: true, Night: true }, indoorOutdoor: "Outdoor", securityLevel: "Critical", specialSkillsRequired: ["Vehicle Inspection"], availableTime: "24/7", notes: "Busy vehicle access point. Keep barrier working." },
  { id: "L003", name: "South Warehouse Patrol", priority: "Medium", guardsRequired: 1, shiftRequirement: { Morning: true, Evening: false, Night: true }, indoorOutdoor: "Outdoor", securityLevel: "Standard", specialSkillsRequired: ["Patrol Systems"], availableTime: "24/7", notes: "Check all locks and security seals during night rounds." },
  { id: "L004", name: "North Loading Dock", priority: "Medium", guardsRequired: 1, shiftRequirement: { Morning: true, Evening: true, Night: false }, indoorOutdoor: "Outdoor", securityLevel: "Standard", specialSkillsRequired: [], availableTime: "08:00-20:00", notes: "Supervise truck shipments and delivery documents." },
  { id: "L005", name: "Server Room Entry", priority: "High", guardsRequired: 1, shiftRequirement: { Morning: true, Evening: true, Night: true }, indoorOutdoor: "Indoor", securityLevel: "Critical", specialSkillsRequired: ["Access Control Logs"], availableTime: "24/7", notes: "Strict biometrics verification required." },
  { id: "L006", name: "CCTV Control Room", priority: "High", guardsRequired: 1, shiftRequirement: { Morning: true, Evening: true, Night: true }, indoorOutdoor: "Indoor", securityLevel: "Critical", specialSkillsRequired: ["CCTV Operation", "Radio Control"], availableTime: "24/7", notes: "Monitor video feeds, handle emergency comms." }
];

const INITIAL_USERS: SystemUser[] = [
  { username: "admin", name: "Chief Security Officer", role: "Admin", email: "chief@smartguard.com" },
  { username: "supervisor", name: "Shift Security Officer", role: "Security Officer", email: "officer@smartguard.com" }
];

const INITIAL_SETTINGS: SystemSettings = {
  shiftTimings: {
    Morning: { start: "06:00", end: "14:00" },
    Evening: { start: "14:00", end: "22:00" },
    Night: { start: "22:00", end: "06:00" }
  },
  rotationRules: {
    maxConsecutiveDuties: 5,
    maxNightShiftsPerWeek: 3,
    restHoursBetweenShifts: 12
  },
  holidayCalendar: [
    { date: "2026-01-01", name: "New Year's Day" },
    { date: "2026-07-04", name: "Independence Day" },
    { date: "2026-12-25", name: "Christmas Day" }
  ],
  autoGenerationTime: "18:00",
  googleSheets: {
    spreadsheetId: "",
    appsScriptUrl: "",
    enabled: false
  },
  githubStorage: {
    repoOwner: "",
    repoName: "",
    token: "",
    filePath: "guard_duty_db.json",
    enabled: false
  }
};

const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: "LR001", guardId: "G008", guardName: "Elizabeth Wilson", startDate: "2026-07-12", endDate: "2026-07-16", reason: "Annual Medical Checkup", status: "Approved" },
  { id: "LR002", guardId: "G005", guardName: "James Brown", startDate: "2026-07-20", endDate: "2026-07-22", reason: "Family event", status: "Pending" }
];

// Memory cache fallback for sandboxed environments
const memoryDbStore: { [key: string]: string } = {};

const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item);
  } catch {
    const item = memoryDbStore[key];
    if (!item) {
      memoryDbStore[key] = JSON.stringify(defaultValue);
      return defaultValue;
    }
    try {
      return JSON.parse(item);
    } catch {
      return defaultValue;
    }
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    memoryDbStore[key] = JSON.stringify(value);
  }
};

export const mockDb = {
  getGuards: (): Guard[] => getStorageItem("guards", INITIAL_GUARDS),
  saveGuards: (guards: Guard[]): void => setStorageItem("guards", guards),
  
  getLocations: (): Location[] => getStorageItem("locations", INITIAL_LOCATIONS),
  saveLocations: (locations: Location[]): void => setStorageItem("locations", locations),
  
  getSettings: (): SystemSettings => getStorageItem("settings", INITIAL_SETTINGS),
  saveSettings: (settings: SystemSettings): void => setStorageItem("settings", settings),
  
  getUsers: (): SystemUser[] => getStorageItem("users", INITIAL_USERS),
  saveUsers: (users: SystemUser[]): void => setStorageItem("users", users),

  getLeaves: (): LeaveRequest[] => getStorageItem("leaves", INITIAL_LEAVE_REQUESTS),
  saveLeaves: (leaves: LeaveRequest[]): void => setStorageItem("leaves", leaves),
  
  getAttendance: (date: string): AttendanceRecord[] => {
    const allRecords = getStorageItem<AttendanceRecord[]>("attendance", []);
    // Filter for current date, if none exist, initialize based on guards status
    const dayRecords = allRecords.filter(r => r.date === date);
    if (dayRecords.length === 0) {
      const guards = mockDb.getGuards();
      const newRecords: AttendanceRecord[] = guards.map(g => ({
        date,
        guardId: g.id,
        status: g.status === "Leave" ? "Leave" : g.status === "Training" ? "Training" : "Available",
      }));
      setStorageItem("attendance", [...allRecords, ...newRecords]);
      return newRecords;
    }
    return dayRecords;
  },
  saveAttendance: (date: string, records: AttendanceRecord[]): void => {
    const allRecords = getStorageItem<AttendanceRecord[]>("attendance", []);
    const filtered = allRecords.filter(r => r.date !== date);
    setStorageItem("attendance", [...filtered, ...records]);
  },
  
  getRosterHistory: (): RosterHistory[] => getStorageItem<RosterHistory[]>("rosterHistory", []),
  saveRosterHistory: (history: RosterHistory[]): void => setStorageItem("rosterHistory", history),
  
  getRosterForDate: (date: string): RosterHistory | null => {
    const history = mockDb.getRosterHistory();
    return history.find(h => h.date === date) || null;
  },
  saveRosterForDate: (date: string, roster: DayRoster, shortages: RosterHistory["shortages"] = [], vacantLocations: string[] = [], user: string = "system"): void => {
    const history = mockDb.getRosterHistory();
    const updatedHistory: RosterHistory = {
      date,
      roster,
      shortages,
      vacantLocations,
      lastUpdated: new Date().toISOString(),
      updatedBy: user
    };
    
    const filtered = history.filter(h => h.date !== date);
    mockDb.saveRosterHistory([...filtered, updatedHistory].sort((a, b) => a.date.localeCompare(b.date)));
    
    mockDb.addAuditLog(
      user,
      "Roster Saved",
      `Saved roster schedule for date ${date}. Assigned spots, vacant locations: ${vacantLocations.length}`
    );
  },

  getAuditLogs: (): AuditLog[] => getStorageItem<AuditLog[]>("auditLogs", [
    { id: "L_001", timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), user: "admin", action: "System Init", details: "Initial security roster template loaded." }
  ]),
  addAuditLog: (user: string, action: string, details: string): void => {
    const logs = mockDb.getAuditLogs();
    const newLog: AuditLog = {
      id: "L_" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      user,
      action,
      details
    };
    setStorageItem("auditLogs", [newLog, ...logs].slice(0, 200)); // Cap logs at 200 items
  }
};
