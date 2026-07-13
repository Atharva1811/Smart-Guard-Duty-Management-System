import React, { createContext, useContext, useState } from "react";

type Language = "en" | "mr";

// Translation dictionary definition
const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    todaysDuty: "Today's Duty",
    guards: "Guards",
    locations: "Locations",
    availability: "Availability",
    leaves: "Leaves",
    reports: "Reports",
    users: "Users",
    settings: "Settings",
    logout: "Logout",

    // Dashboard
    totalGuards: "Total Guards",
    availableToday: "Available Today",
    guardsOnLeave: "Guards on Leave",
    vacantSpots: "Vacant Spots",
    morningShift: "Morning Shift",
    eveningShift: "Evening Shift",
    nightShift: "Night Shift",
    rosterCoverage: "Roster Coverage",
    availabilityBreakup: "Guard Availability Breakup",
    weeklyShiftDistribution: "Weekly Shift Distribution",
    locationOccupancy: "Location Guard Occupancy",
    coverageHistory: "Roster Coverage History",
    overview: "Operational Overview",
    overviewSub: "Real-time status updates and scheduling statistics dashboard.",

    // Login Page
    loginTitle: "Smart Guard Duty System",
    loginSub: "Authorized Personnel Security Terminal",
    username: "Username",
    password: "Password",
    rememberMe: "Remember security profile on this machine",
    decryptTerminal: "Decrypt Terminal",
    forgotPassword: "Forgot Password?",
    quickLogin: "Quick-login Profiles (Evaluation)",
    unexpectedError: "An unexpected error occurred. Please try again.",
    invalidCredentials: "Invalid username or password credentials. Please try again.",

    // Today Duty Page
    rosterMgmt: "Roster Management",
    rosterMgmtSub: "Review, generate, and customize security guard shifts.",
    autoAllocate: "Auto-Allocate",
    save: "Save",
    locationNode: "Location Node",
    reserveGuard: "Reserve Guard",
    lock: "Lock",
    conflictDetect: "Conflict Detection",
    shortagesVacancies: "Shortages & Vacant Locations",
    solveVacancy: "Solve Vacancy",
    allClear: "All assigned cells are verified conflict-free.",
    allStaffed: "All required locations are fully staffed today.",

    // Common Controls
    search: "Search",
    applyChanges: "Apply Changes",
    cancel: "Cancel",
    saveChanges: "Save Changes",
    pingEndpoint: "Test API Endpoint",
    testConnection: "Verify Repository Credentials",
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    actions: "Actions",
    active: "Active",
    inactive: "Inactive",
    shiftTimingSlots: "Shift Timing Slots",

    // Guards View
    guardsTitle: "Guards Roster Database",
    guardsSub: "Manage personnel records, shift schedules, and assignments preferences.",
    addGuard: "Add Guard Profile",
    bulkImport: "Bulk Import Names",
    searchGuards: "Search by ID, Name or Department...",
    guardName: "Guard Name",
    department: "Department",
    shiftPreference: "Shift Preference",
    weeklyOff: "Weekly Off Day",
    experience: "Experience",
    age: "Age",

    // Locations View
    locationsTitle: "Operational Locations",
    locationsSub: "Configure security checkpoints, shifts timings, and staffing requirements.",
    addLocation: "Add Location",
    searchLocations: "Search by location name or zone...",
    locationName: "Location Name",
    securityLevel: "Security Level",
    requiredGuards: "Required Guards",

    // Availability View
    availabilityTitle: "Daily Guard Attendance",
    availabilitySub: "Mark attendance, availability status, and remarks for today's shifts.",
    guardNameCol: "Guard Name",
    statusCol: "Status Code Call",
    notesCol: "Notes / Remarks",

    // Leaves View
    leavesTitle: "Leave Management Registry",
    leavesSub: "Submit, approve, or reject security guard leave requests.",
    applyLeave: "Request Leave",
    leaveReason: "Reason",
    startDate: "Start Date",
    endDate: "End Date",
    approve: "Approve",
    reject: "Reject",

    // Reports View
    reportsTitle: "Analytics & Operational Reports",
    reportsSub: "Compile stats, review coverage metrics, and export CSV/A4 documents.",
    exportCsv: "Export CSV",
    printReport: "Print Report",

    // Users View
    usersTitle: "User Management",
    usersSub: "Assign roles (Admin, Supervisor, Viewer) and credentials profiles.",
    addUser: "Add New User",

    // Settings View
    settingsTitle: "System Settings Console",
    settingsSub: "Adjust shift schedules, rotation limits, and spreadsheet API keys.",
    rotationRules: "Rotation Rules & Rest Limits",
    sheetsSync: "Google Sheets Sync API",
    githubSync: "GitHub Database Repository Storage"
  },
  mr: {
    // Navigation
    dashboard: "डॅशबोर्ड",
    todaysDuty: "आजची ड्युटी",
    guards: "रक्षक",
    locations: "ठिकाणे",
    availability: "उपलब्धता",
    leaves: "रजा",
    reports: "अहवाल",
    users: "वापरकर्ते",
    settings: "सेटिंग्ज",
    logout: "लॉगआउट",

    // Dashboard
    totalGuards: "एकूण रक्षक",
    availableToday: "आज उपलब्ध रक्षक",
    guardsOnLeave: "रजेवर असलेले रक्षक",
    vacantSpots: "रिकाम्या जागा",
    morningShift: "सकाळची पाळी",
    eveningShift: "दुपारची पाळी",
    nightShift: "रात्रीची पाळी",
    rosterCoverage: "रोस्टर कव्हरेज",
    availabilityBreakup: "रक्षकांची उपलब्धता विभागणी",
    weeklyShiftDistribution: "साप्ताहिक पाळी वितरण",
    locationOccupancy: "ठिकाणानुसार रक्षक संख्या",
    coverageHistory: "रोस्टर कव्हरेज इतिहास",
    overview: "कार्यरत विहंगावलोकन",
    overviewSub: "रिअल-टाइम स्थिती अद्यतने आणि वेळापत्रक आकडेवारी डॅशबोर्ड.",

    // Login Page
    loginTitle: "स्मार्ट रक्षक ड्युटी प्रणाली",
    loginSub: "अधिकृत सुरक्षा अधिकारी टर्मिनल",
    username: "वापरकर्ता नाव",
    password: "पासवर्ड",
    rememberMe: "या संगणकावर सुरक्षा माहिती लक्षात ठेवा",
    decryptTerminal: "टर्मिनल उघडा",
    forgotPassword: "पासवर्ड विसरलात?",
    quickLogin: "त्वरित लॉगिन प्रोफाइल (मूल्यांकन)",
    unexpectedError: "एक अनपेक्षित त्रुटी आली. कृपया पुन्हा प्रयत्न करा.",
    invalidCredentials: "चुकीचे वापरकर्ता नाव किंवा पासवर्ड. कृपया पुन्हा प्रयत्न करा.",

    // Today Duty Page
    rosterMgmt: "वेळापत्रक व्यवस्थापन",
    rosterMgmtSub: "सुरक्षा रक्षक पाळ्यांचे पुनरावलोकन, निर्मिती आणि सानुकूलन करा.",
    autoAllocate: "स्वयंचलित वाटप",
    save: "जतन करा",
    locationNode: "ड्यूटी ठिकाण",
    reserveGuard: "राखीव रक्षक",
    lock: "कुलूप लावा",
    conflictDetect: "संघर्ष शोधणे",
    shortagesVacancies: "कमतरता आणि रिक्त ठिकाणे",
    solveVacancy: "रिक्त जागा भरा",
    allClear: "सर्व नियुक्त जागा संघर्ष-मुक्त आहेत.",
    allStaffed: "सर्व आवश्यक ठिकाणी आज पूर्ण रक्षक नियुक्त आहेत.",

    // Common Controls
    search: "शोधा",
    applyChanges: "बदल लागू करा",
    cancel: "रद्द करा",
    saveChanges: "बदल जतन करा",
    pingEndpoint: "API चाचणी करा",
    testConnection: "रेपॉझिटरी क्रेडेंशियल तपासा",
    add: "जोडा",
    edit: "संपादित करा",
    delete: "हटवा",
    actions: "कृती",
    active: "सक्रिय",
    inactive: "निष्क्रिय",
    shiftTimingSlots: "शिफ्टच्या वेळा",

    // Guards View
    guardsTitle: "सुरक्षा रक्षक डेटाबेस",
    guardsSub: "कर्मचारी रेकॉर्ड, शिफ्ट वेळापत्रक आणि प्राधान्ये व्यवस्थापित करा.",
    addGuard: "सुरक्षा रक्षक प्रोफाइल जोडा",
    bulkImport: "नावे एकत्रित आयात करा",
    searchGuards: "आयडी, नाव किंवा विभागाद्वारे शोधा...",
    guardName: "रक्षकाचे नाव",
    department: "विभाग",
    shiftPreference: "पाळी प्राधान्य",
    weeklyOff: "साप्ताहिक सुट्टीचा दिवस",
    experience: "अनुभव",
    age: "वय",

    // Locations View
    locationsTitle: "operational ठिकाणे",
    locationsSub: "सुरक्षा नाके, शिफ्टच्या वेळा आणि कर्मचाऱ्यांची आवश्यकता कॉन्फिगर करा.",
    addLocation: "नवीन ठिकाण जोडा",
    searchLocations: "ठिकाण किंवा झोनद्वारे शोधा...",
    locationName: "ठिकाणाचे नाव",
    securityLevel: "सुरक्षा पातळी",
    requiredGuards: "आवश्यक रक्षक संख्या",

    // Availability View
    availabilityTitle: "सुरक्षा रक्षक दैनिक उपस्थिती",
    availabilitySub: "आजच्या पाळीसाठी उपस्थिती, उपलब्धता स्थिती आणि शेरा नोंदवा.",
    guardNameCol: "रक्षकाचे नाव",
    statusCol: "उपस्थिती कोड",
    notesCol: "नोंद / शेरा",

    // Leaves View
    leavesTitle: "रजा व्यवस्थापन नोंदणी",
    leavesSub: "सुरक्षा रक्षकांच्या रजा विनंत्या सबमिट करा, मंजूर करा किंवा नाकारा.",
    applyLeave: "रजेसाठी अर्ज करा",
    leaveReason: "कारण",
    startDate: "सुरुवात तारीख",
    endDate: "शेवटची तारीख",
    approve: "मंजूर करा",
    reject: "नाकारा",

    // Reports View
    reportsTitle: "विश्लेषण आणि कार्यरत अहवाल",
    reportsSub: "आकडेवारी संकलित करा, कव्हरेजचे पुनरावलोकन करा आणि CSV/A4 दस्तऐवज निर्यात करा.",
    exportCsv: "CSV निर्यात करा",
    printReport: "अहवाल मुद्रित करा (Print)",

    // Users View
    usersTitle: "वापरकर्ते व्यवस्थापन",
    usersSub: "भूमिका (अॅडमीन, सुपरवायझर, व्ह्यूवर) आणि क्रेडेंशियल व्यवस्थापित करा.",
    addUser: "नवीन वापरकर्ता जोडा",

    // Settings View
    settingsTitle: "प्रणाली सेटिंग्ज",
    settingsSub: "शिफ्ट वेळापत्रक, रोटेशन मर्यादा आणि स्प्रेडशीट API की जुळवा.",
    rotationRules: "रोटेशन नियम आणि विश्रांती मर्यादा",
    sheetsSync: "गुगल शीट्स सिंक एपीआय",
    githubSync: "गिटहब डेटाबेस स्टोरेज"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    if (saved === "en" || saved === "mr") return saved;
    return "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS["en"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
