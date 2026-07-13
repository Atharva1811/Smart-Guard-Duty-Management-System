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
    todaysDuty: "आजचे वेळापत्रक",
    guards: "सुरक्षा रक्षक",
    locations: "सुरक्षा नाके (Locations)",
    availability: "उपस्थिती नोंदी",
    leaves: "रजा व्यवस्थापन",
    reports: "अहवाल (Reports)",
    users: "वापरकर्ते",
    settings: "सेटिंग्ज (Settings)",
    logout: "लॉगआउट",

    // Dashboard
    totalGuards: "एकूण सुरक्षा रक्षक",
    availableToday: "आज उपलब्ध रक्षक",
    guardsOnLeave: "आज रजेवर असलेले",
    vacantSpots: "रिक्त ड्युटी पॉइंट",
    morningShift: "सकाळची पाळी (Morning)",
    eveningShift: "दुपारची पाळी (Evening)",
    nightShift: "रात्रीची पाळी (Night)",
    rosterCoverage: "नियोजन कव्हरेज",
    availabilityBreakup: "रक्षकांची आजची उपस्थिती विभागणी",
    weeklyShiftDistribution: "साप्ताहिक पाळी वितरण",
    locationOccupancy: "सुरक्षा नाक्यानुसार रक्षक नियुक्ती",
    coverageHistory: "वेळापत्रक पूर्तता इतिहास",
    overview: "डॅशबोर्ड विहंगावलोकन",
    overviewSub: "ड्युटीची सद्यस्थिती आणि वेळापत्रकाची सांख्यिकी.",

    // Login Page
    loginTitle: "स्मार्ट ड्युटी नियोजन प्रणाली",
    loginSub: "सुरक्षा अधिकारी लॉगिन पोर्टल",
    username: "वापरकर्ता नाव (Username)",
    password: "पासवर्ड (Password)",
    rememberMe: "या संगणकावर लॉगिन माहिती लक्षात ठेवा",
    decryptTerminal: "पोर्टलमध्ये प्रवेश करा",
    forgotPassword: "पासवर्ड विसरलात?",
    quickLogin: "त्वरित लॉगिन प्रोफाइल",
    unexpectedError: "काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.",
    invalidCredentials: "चुकीचे वापरकर्ता नाव किंवा पासवर्ड. कृपया तपासून पुन्हा प्रयत्न करा.",

    // Today Duty Page
    rosterMgmt: "ड्यूटी वेळापत्रक नियोजन",
    rosterMgmtSub: "सुरक्षा रक्षकांच्या ड्युटी पाळ्यांचे पुनरावलोकन, वाटप आणि बदल करा.",
    autoAllocate: "स्वयंचलित नियुक्ती (Auto-Allocate)",
    save: "जतन करा (Save)",
    locationNode: "सुरक्षा नाका (Location)",
    reserveGuard: "राखीव सुरक्षा रक्षक",
    lock: "पाळी लॉक करा",
    conflictDetect: "वेळापत्रक विसंगती तपासणी",
    shortagesVacancies: "अपुऱ्या जागा आणि रिक्त पॉईंट्स",
    solveVacancy: "रिक्त जागा भरा",
    allClear: "वेळापत्रकात कोणतीही विसंगती किंवा ओव्हरलॅप आढळले नाही.",
    allStaffed: "आज सर्व सुरक्षा नाक्यांवर रक्षक नियुक्त केले आहेत.",

    // Common Controls
    search: "शोधा",
    applyChanges: "बदल लागू करा",
    cancel: "रद्द करा",
    saveChanges: "बदल जतन करा",
    pingEndpoint: "कनेक्शन तपासा (Ping)",
    testConnection: "गिटहब क्रेडेंशियल तपासा",
    add: "जोडा",
    edit: "बदला",
    delete: "हटवा",
    actions: "कृती",
    active: "सक्रिय",
    inactive: "निष्क्रिय",
    shiftTimingSlots: "पाळ्यांच्या वेळा",

    // Guards View
    guardsTitle: "सुरक्षा रक्षक डेटाबेस",
    guardsSub: "सर्व कर्मचाऱ्यांचे रेकॉर्ड, त्यांच्या आवडीच्या पाळी आणि सुट्ट्यांचे नियोजन.",
    addGuard: "रक्षक नोंदणी करा",
    bulkImport: "नावे एकत्रित आयात करा",
    searchGuards: "आयडी, नाव किंवा विभागाद्वारे शोधा...",
    guardName: "सुरक्षा रक्षकाचे नाव",
    department: "विभाग (Department)",
    shiftPreference: "पाळी प्राधान्य (Shift Preference)",
    weeklyOff: "साप्ताहिक सुट्टीचा दिवस (Weekly Off)",
    experience: "अनुभव (वर्षे)",
    age: "वय",

    // Locations View
    locationsTitle: "सुरक्षा नाके (Locations)",
    locationsSub: "ड्युटी पॉइंट नाके, पाळीच्या वेळा आणि मनुष्यबळ आवश्यकता कॉन्फिगर करा.",
    addLocation: "नाका नोंदणी करा",
    searchLocations: "नाके किंवा झोनद्वारे शोधा...",
    locationName: "नाक्याचे नाव",
    securityLevel: "सुरक्षा पातळी (Security Level)",
    requiredGuards: "आवश्यक सुरक्षा रक्षक संख्या",

    // Availability View
    availabilityTitle: "दैनिक उपस्थिती नोंदणी",
    availabilitySub: "रक्षकांची आजच्या ड्युटी पाळीसाठी हजेरी आणि सद्यस्थिती नोंदवा.",
    guardNameCol: "सुरक्षा रक्षकाचे नाव",
    statusCol: "उपस्थिती स्थिती",
    notesCol: "विशेष शेरा / नोंद",

    // Leaves View
    leavesTitle: "रजा व्यवस्थापन विभाग",
    leavesSub: "रक्षकांच्या रजा विनंत्या तपासा, मंजूर करा किंवा नाकारा.",
    applyLeave: "नवीन रजा नोंदवा",
    leaveReason: "रजेचे कारण",
    startDate: "सुरुवात तारीख",
    endDate: "अंतिम तारीख",
    approve: "मंजूर करा",
    reject: "नाकारा",

    // Reports View
    reportsTitle: "कार्य अहवाल व आकडेवारी",
    reportsSub: "अहवाल संकलित करा, पाळी नियोजन तपासा आणि CSV/A4 फाइल काढा.",
    exportCsv: "CSV फाईल काढा",
    printReport: "अहवाल मुद्रित करा (Print)",

    // Users View
    usersTitle: "वापरकर्ते व भूमिका व्यवस्थापन",
    usersSub: "वापरकर्त्यांच्या भूमिका (अॅडमीन / सुरक्षा अधिकारी) आणि लॉगिन माहिती व्यवस्थापित करा.",
    addUser: "नवीन वापरकर्ता जोडा",

    // Settings View
    settingsTitle: "सिस्टम सेटिंग्ज (Settings)",
    settingsSub: "पाळ्यांच्या वेळा, रोटेशन नियम आणि गिटहब स्टोरेज पर्याय व्यवस्थापित करा.",
    rotationRules: "कामाचे नियम आणि विश्रांती मर्यादा",
    sheetsSync: "गुगल शीट्स सिंक्रोनायझेशन",
    githubSync: "गिटहब डेटाबेस स्टोरेज (GitHub Storage)"
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
