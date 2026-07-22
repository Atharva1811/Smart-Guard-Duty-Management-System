// client/src/context/LanguageContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
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
    guardsTitle: "Guards Roster Database",
    guardsSub: "Manage personnel records, shift schedules, and assignments preferences.",
    addGuard: "Add Guard Profile",
    bulkImport: "Bulk Import Names",
    searchGuards: "Search by ID, Name or Department...",
    guardName: "Guard Name",
    department: "Department",
    shiftPreference: "Shift Preference",
    weeklyOff: "Weekly Off Day",
    experience: "Experience (Years)",
    age: "Age",
    locationsTitle: "Operational Locations",
    locationsSub: "Configure security checkpoints, shifts timings, and staffing requirements.",
    addLocation: "Add Location",
    searchLocations: "Search by location name or zone...",
    locationName: "Location Name",
    securityLevel: "Security Level",
    requiredGuards: "Required Guards",
    availabilityTitle: "Daily Guard Attendance",
    availabilitySub: "Mark attendance, availability status, and remarks for today's shifts.",
    guardNameCol: "Guard Name",
    statusCol: "Status Code Call",
    notesCol: "Notes / Remarks",
    leavesTitle: "Leave Management Registry",
    leavesSub: "Submit, approve, or reject security guard leave requests.",
    applyLeave: "Request Leave",
    leaveReason: "Reason",
    startDate: "Start Date",
    endDate: "End Date",
    approve: "Approve",
    reject: "Reject",
    reportsTitle: "Analytics & Reports",
    reportsSub: "Compile stats, review coverage metrics, and export CSV/A4 documents.",
    exportCsv: "Export CSV",
    printReport: "Print Report",
    usersTitle: "User Management",
    usersSub: "Assign roles (Admin, Supervisor, Viewer) and credentials profiles.",
    addUser: "Add New User",
    settingsTitle: "System Settings Console",
    settingsSub: "Adjust shift schedules, rotation limits, and SQLite D1 API parameters.",
    rotationRules: "Rotation Rules & Rest Limits",
    sheetsSync: "Google Sheets Sync API",
    githubSync: "Cloudflare D1 Connection Sync"
  },
  mr: {
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
    inactive: "अक्रिय",
    shiftTimingSlots: "पाळीच्या वेळा",
    guardsTitle: "सुरक्षा रक्षकांची नोंदणी",
    guardsSub: "सुरक्षा रक्षकांचे रेकॉर्ड, शिफ्ट आवडीनिवडी आणि प्रोफाइल व्यवस्थापित करा.",
    addGuard: "नवीन रक्षक जोडा",
    bulkImport: "रक्षकांची नावे एकदम जोडा",
    searchGuards: "आयडी, नाव किंवा विभागाद्वारे शोधा...",
    guardName: "रक्षकाचे नाव",
    department: "विभाग (Department)",
    shiftPreference: "शिफ्ट पसंती",
    weeklyOff: "सातिरिक्त सुट्टी",
    experience: "अनुभव (वर्षे)",
    age: "वय",
    locationsTitle: "सुरक्षा नाके (Duty Points)",
    locationsSub: "चेकपॉइंट्स, शिफ्टच्या गरजा आणि आवश्यक रक्षक संख्या कॉन्फिगर करा.",
    addLocation: "नवीन नाका जोडा",
    searchLocations: "सुरक्षा नाक्याचे नाव किंवा झोन शोधा...",
    locationName: "नाक्याचे नाव",
    securityLevel: "सुरक्षा पातळी (Level)",
    requiredGuards: "आवश्यक सुरक्षा रक्षक संख्या",
    availabilityTitle: "रक्षकांची उपस्थिती आणि हजेरी",
    availabilitySub: "सुरक्षा रक्षकांची दैनिक हजेरी, गैरहजेरी आणि शेरे नोंदवा.",
    guardNameCol: "सुरक्षा रक्षकाचे नाव",
    statusCol: "उपस्थिती कोड",
    notesCol: "विशेष नोंद / शेरा",
    leavesTitle: "रजा मंजुरी आणि नोंदणी",
    leavesSub: "सुरक्षा रक्षकांच्या रजा अर्जांचे पुनरावलोकन, मंजुरी किंवा नकार नोंदवा.",
    applyLeave: "रजा अर्ज करा",
    leaveReason: "कारण",
    startDate: "सुरुवात तारीख",
    endDate: "शेवटची तारीख",
    approve: "मंजूर करा",
    reject: "नाकारून द्या",
    reportsTitle: "सांख्यिकी आणि वेळापत्रक अहवाल",
    reportsSub: "विविध अहवाल तपासा, पीडीएफ डाऊनलोड करा आणि ए४ फॉरमॅटमध्ये प्रिंट काढा.",
    exportCsv: "CSV मध्ये निर्यात करा",
    printReport: "रिपोर्ट प्रिंट करा",
    usersTitle: "वापरकर्ते व्यवस्थापन",
    usersSub: "वापरकर्त्यांना अधिकार (Admin, Supervisor, Viewer) द्या.",
    addUser: "नवीन युझर जोडा",
    settingsTitle: "सिस्टम सेटिंग्ज (Settings)",
    settingsSub: "कामाच्या पाळ्या, रोटेशन नियम आणि क्लाउड D1 डेटाबेस कनेक्शन सेट करा.",
    rotationRules: "रोटेशन मर्यादा आणि विश्रांतीचे तास",
    sheetsSync: "गुगल शीट्स सिंक्रोनायझेशन",
    githubSync: "क्लाउडफ्लेअर D1 डेटाबेस कनेक्शन"
  }
};

const PHONETIC_MAP: Record<string, string> = {
  // Guards names
  "Ramesh Shinde": "रमेश शिंदे",
  "Sanjay Patil": "संजय पाटील",
  "Aniket Kadam": "अनिकेत कदम",
  "Sunil Pawar": "सुनील पवार",
  "Pooja Sawant": "पूजा सावंत",
  "Vijay Rane": "विजय राणे",
  "Rahul More": "राहुल मोरे",
  "Snehal Jadhav": "स्नेहल जाधव",
  "Amol Deshmukh": "अमोल देशमुख",
  "Ganesh Joshi": "गणेश जोशी",
  "Dipak Koli": "दीपक कोळी",
  "Sandip Patil": "संदीप पाटील",
  "Priyanka Shinde": "प्रियंका शिंदे",
  "Prasad Rane": "प्रसाद राणे",
  "Nitin Kadam": "नितीन कदम",

  // Checkpoints names
  "Main Gate Checkpoint": "मुख्य गेट नाका",
  "East Gate Checkpoint": "पूर्व गेट नाका",
  "Corporate Office Entrance": "कॉर्पोरेट ऑफिस प्रवेशद्वार",
  "Rear Loading Dock": "मागील लोडिंग डॉक",
  "Parking Garage Area": "पार्किंग गॅरेज क्षेत्र",
  "Warehouse Perimeter Guard": "वेअरहाऊस सीमा सुरक्षा",

  // Statuses
  "AVAILABLE": "उपलब्ध",
  "LEAVE": "रजा",
  "ABSENT": "गैरहजर",
  "TRAINING": "प्रशिक्षण",
  "MEDICAL": "वैद्यकीय सुट्टी",
  "HOLIDAY": "सुट्टी",
  "Morning": "सकाळ",
  "Evening": "दुपार",
  "Night": "रात्र",
  "Reserve": "राखीव",
};

const WORD_TRANSLATIONS: Record<string, string> = {
  // Surnames
  "khandizhod": "खांडीझोड",
  "bhamare": "भामरे",
  "shinde": "शिंदे",
  "patil": "पाटील",
  "kadam": "कदम",
  "pawar": "पवार",
  "sawant": "सावंत",
  "rane": "राणे",
  "more": "मोरे",
  "jadhav": "जाधव",
  "deshmukh": "देशमुख",
  "joshi": "जोशी",
  "koli": "कोळी",
  "gaikwad": "गायकवाड",
  "chavan": "चव्हाण",
  "thakur": "ठाकूर",
  "shelar": "शेलार",
  "salunkhe": "सळुंखे",
  "nikam": "निकम",
  "sharma": "शर्मा",
  "singh": "सिंग",
  "tambe": "तांबे",
  "kale": "काळे",
  "phalke": "फाळके",
  "thorat": "थोरात",
  "bhagat": "भगत",
  "dhumal": "धुमाळ",
  "mulik": "मुळीक",
  "wagh": "वाघ",
  "mhatre": "म्हात्रे",
  "salve": "साळवे",
  "ghadge": "घाडगे",
  "ghadage": "घाडगे",

  // First names
  "suresh": "सुरेश",
  "dattu": "दत्तू",
  "sunil": "सुनील",
  "ramesh": "रमेश",
  "sanjay": "संजय",
  "aniket": "अनिकेत",
  "pooja": "पूजा",
  "vijay": "विजय",
  "rahul": "राहुल",
  "snehal": "स्नेहल",
  "amol": "अमोल",
  "ganesh": "गणेश",
  "dipak": "दीपक",
  "deepak": "दीपक",
  "sandip": "संदीप",
  "sandeep": "संदीप",
  "priyanka": "प्रियंका",
  "prasad": "प्रसाद",
  "nitin": "नितीन",
  "arjun": "अर्जुन",
  "ashok": "अशोक",
  "dilip": "दिलीप",
  "harsh": "हर्ष",
  "kishor": "किशोर",
  "mahesh": "महेश",
  "pradeep": "प्रदीप",
  "rajendra": "राजेन्द्र",
  "sachin": "सचिन",
  "vikram": "विक्रम",
  "yash": "यश",
  "prathamesh": "प्रथमेश",
  "anita": "अनिता",
  "savita": "सविता",
  "kavita": "कविता",
  "jyoti": "ज्योती",
  "swati": "स्वाती",
  "sheetal": "शीतल",
  "sunita": "सुनीता",
  "nisha": "निशा",
  "archana": "अर्चना",
  "prashant": "प्रशांत",
  "akshay": "अक्षय",
  "siddharth": "सिद्धार्थ",
  "karan": "करण",
  "amit": "अमित",
  "rohit": "रोहित",

  // Common checkpoints / locations
  "entry": "एंट्री",
  "gate": "गेट",
  "visitor": "व्हिजिटर",
  "pass": "पास",
  "in": "इन",
  "cc": "सीसी",
  "corner": "कॉर्नर",
  "parking": "पार्किंग",
  "college": "कॉलेज",
  "back": "मागील",
  "side": "बाजू",
  "society": "सोसायटी",
  "b": "बी",
  "pharmacy": "फार्मसी",
  "office": "ऑफिस",
  "ladies": "लेडीज",
  "hostel": "हॉस्टेल",
  "boys": "मुले",
  "canteen": "कॅन्टीन",
  "library": "लायब्ररी",
  "lab": "लॅब",
  "store": "स्टोअर",
  "ground": "मैदान",
  "main": "मुख्य",
  "building": "बिल्डिंग",
  "campus": "कॅम्पस",
  "quarter": "क्वार्टर",
  "quarters": "क्वार्टर्स",
  "security": "सुरक्षा",
  "cabin": "केबिन",
  "road": "रस्ता",
  "street": "गल्ली",
  "area": "क्षेत्र",
  "zone": "झोन",
  "cctv": "सीसीटीव्ही",
  "control": "नियंत्रण",
  "room": "रूम",
  "mess": "मेस",
  "gym": "जिम",
  "garden": "बाग",
  "temple": "मंदिर",
  "hospital": "रुग्णालय",
  "clinic": "क्लिनिक",
  "school": "शाळा",
  "class": "वर्ग",
  "department": "विभाग",
  "dept": "विभाग",
  "admin": "प्रशासन",
  "station": "स्टेशन",
  "pump": "पंप",
  "water": "पाणी",
  "tank": "टाकी",
  "power": "वीज",
  "house": "हाउस",
  "workshop": "कार्यशाळा"
};

const phoneticTransliterate = (word: string): string => {
  const cleanWord = word.trim();
  if (!cleanWord) return "";

  // Check code/number pattern (e.g. G012, 102, etc.)
  if (/^[a-zA-Z]\d+$/.test(cleanWord) || /^\d+$/.test(cleanWord)) {
    return word;
  }

  const lookupKey = cleanWord.toLowerCase();
  if (WORD_TRANSLATIONS[lookupKey]) {
    return WORD_TRANSLATIONS[lookupKey];
  }

  // Fallback to syllable mapping
  let res = lookupKey;

  const mappingRules: [string, string][] = [
    ["khandizhod", "खांडीझोड"],
    ["bhamare", "भामरे"],
    ["patil", "पाटील"],
    ["shinde", "शिंदे"],
    ["kadam", "कदम"],
    ["pawar", "पवार"],
    ["sawant", "सावंत"],
    ["rane", "राणे"],
    ["more", "मोरे"],
    ["jadhav", "जाधव"],
    ["deshmukh", "देशमुख"],
    ["joshi", "जोशी"],
    ["koli", "कोळी"],
    ["suresh", "सुरेश"],
    ["dattu", "दत्तू"],
    ["sunil", "सुनील"],
    ["ramesh", "रमेश"],
    ["sanjay", "संजय"],

    ["entry", "एंट्री"],
    ["visitor", "व्हिजिटर"],
    ["college", "कॉलेज"],

    ["ksh", "क्ष"],
    ["chh", "छ"],
    ["ch", "च"],
    ["kh", "ख"],
    ["gh", "घ"],
    ["jh", "झ"],
    ["th", "थ"],
    ["dh", "ध"],
    ["ph", "फ"],
    ["bh", "भ"],
    ["sh", "श"],
    ["gn", "ज्ञ"],

    ["k", "क"],
    ["g", "ग"],
    ["j", "ज"],
    ["t", "त"],
    ["d", "द"],
    ["n", "न"],
    ["p", "प"],
    ["f", "फ"],
    ["b", "ब"],
    ["m", "म"],
    ["y", "य"],
    ["r", "र"],
    ["l", "ल"],
    ["v", "व"],
    ["w", "व"],
    ["s", "स"],
    ["h", "ह"],
    ["z", "झ"],

    ["aa", "ा"],
    ["a", "ा"],
    ["ee", "ी"],
    ["i", "ि"],
    ["oo", "ू"],
    ["u", "ु"],
    ["e", "े"],
    ["o", "ो"],
    ["ai", "ै"],
    ["au", "ौ"]
  ];

  for (const [eng, mar] of mappingRules) {
    res = res.split(eng).join(mar);
  }

  return res;
};

interface LanguageContextType {
  language: 'en' | 'mr';
  setLanguage: (lang: 'en' | 'mr') => void;
  t: (key: string) => string;
  translateText: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<'en' | 'mr'>('en');

  useEffect(() => {
    const saved = localStorage.getItem('language') as 'en' | 'mr';
    if (saved === 'en' || saved === 'mr') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: 'en' | 'mr') => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string) => {
    return TRANSLATIONS[language]?.[key] || key;
  };

  const translateText = (text: string) => {
    if (language === 'en' || !text) return text;
    if (PHONETIC_MAP[text]) return PHONETIC_MAP[text];

    // Tokenize string including whitespaces and brackets to preserve formatting
    return text.split(/(\s+|[()])/g).map(part => {
      if (!part.trim()) return part;
      if (part === '(' || part === ')') return part;
      return phoneticTransliterate(part);
    }).join('');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateText }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useTranslation must be used within LanguageProvider');
  return context;
};
