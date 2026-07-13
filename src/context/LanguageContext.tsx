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
    testConnection: "Verify Repository Credentials"
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
    testConnection: "रेपॉझिटरी क्रेडेंशियल तपासा"
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
