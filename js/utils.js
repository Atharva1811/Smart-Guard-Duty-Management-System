// js/utils.js
// Utility helpers, translation dictionary, transliteration, theme manager, and toast system

const TRANSLATIONS = {
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
    weeklyOff: "साप्ताहिक सुट्टी",
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

const D1_DICTIONARY = {
  "Elizabeth Wilson": "एलिझाबेथ विल्सन",
  "James Brown": "जेम्स ब्राऊन",
  "Michael Green": "मायकेल ग्रीन",
  "David Smith": "डेव्हिड स्मिथ",
  "John Doe": "जॉन डो",
  "Sarah Connor": "सारा कॉनर",
  "Robert Johnson": "रॉबर्ट जॉन्सन",
  "Patricia Davis": "पॅट्रिशिया डेव्हिस",
  "Linda Martinez": "लिंडा मार्टिनेझ",
  "William Anderson": "विलियम अँडरसन",
  "Main HQ Reception": "मुख्य मुख्यालय स्वागत कक्ष",
  "Front Gate Barrier": "मुख्य गेट अडथळा (Front Gate)",
  "South Warehouse Patrol": "दक्षिण वेअरहाऊस गस्त",
  "North Loading Dock": "उत्तर लोडिंग डॉक",
  "Server Room Entry": "सर्व्हर रूम प्रवेशद्वार",
  "CCTV Control Room": "सीसीटीव्ही नियंत्रण कक्ष",
  "Available": "उपलब्ध",
  "Leave": "रजा",
  "Absent": "गैरहजर",
  "Medical": "वैद्यकीय सुट्टी",
  "Holiday": "सुट्टी",
  "Training": "प्रशिक्षण",
  "Late Arrival": "उशिरा आगमन",
  "Early Exit": "लवकर निर्गमन",
  "Corporate Security": "कॉर्पोरेट सुरक्षा",
  "Patrol Security": "गस्त सुरक्षा",
  "Gate Control": "गेट नियंत्रण",
  "CCTV Operations": "सीसीटीव्ही ऑपरेशन्स",
  "High": "उच्च",
  "Medium": "मध्यम",
  "Low": "कमी",
  "Indoor": "अंतर्गत",
  "Outdoor": "बाह्य",
  "Morning": "सकाळ",
  "Evening": "दुपार",
  "Night": "रात्र",
  "Reserve": "राखीव"
};

// Vowel lists for transliteration
const vowels = {
  a: "अ", e: "ए", i: "इ", o: "ओ", u: "उ", 
  aa: "आ", ee: "ई", oo: "ऊ", ai: "ऐ", au: "औ"
};

const vowelModifiers = {
  a: "", e: "े", i: "ि", o: "ो", u: "ु",
  aa: "ा", ee: "ी", oo: "ू", ai: "ै", au: "ौ"
};

// Consonant lists
const consonants = {
  b: "ब", c: "क", d: "द", f: "फ", g: "ग", h: "ह", j: "ज", k: "क", l: "ल", m: "म",
  n: "न", p: "प", q: "क", r: "र", s: "स", t: "त", v: "व", w: "व", x: "क्ष", y: "य", z: "झ",
  ch: "च", sh: "श", kh: "ख", gh: "घ", th: "थ", dh: "ध", ph: "फ", bh: "भ"
};

// Transliterate function
export function transliterate(str) {
  if (!str) return "";
  if (/[\u0900-\u097F]/.test(str)) return str;

  const words = str.split(" ");
  const transliterateWord = (word) => {
    let wResult = "";
    let j = 0;
    const len = word.length;
    word = word.toLowerCase();

    while (j < len) {
      let char = word[j];
      let next = word[j+1] || "";
      let combo = char + next;
      let resolvedConsonant = "";
      let consumed = 1;

      if (consonants[combo]) {
        resolvedConsonant = consonants[combo];
        consumed = 2;
      } else if (consonants[char]) {
        resolvedConsonant = consonants[char];
        consumed = 1;
      }

      if (resolvedConsonant) {
        j += consumed;
        let vChar = word[j] || "";
        let vNext = word[j+1] || "";
        let vCombo = vChar + vNext;
        let resolvedVowelMod = "";
        let vConsumed = 0;

        if (vCombo && vowelModifiers[vCombo] !== undefined) {
          resolvedVowelMod = vowelModifiers[vCombo];
          vConsumed = 2;
        } else if (vChar && vowelModifiers[vChar] !== undefined) {
          resolvedVowelMod = vowelModifiers[vChar];
          vConsumed = 1;
        }

        wResult += resolvedConsonant + resolvedVowelMod;
        j += vConsumed;
      } else {
        let resolvedVowel = "";
        let vConsumed = 1;
        
        if (combo && vowels[combo]) {
          resolvedVowel = vowels[combo];
          vConsumed = 2;
        } else if (vowels[char]) {
          resolvedVowel = vowels[char];
          vConsumed = 1;
        }

        if (resolvedVowel) {
          wResult += resolvedVowel;
        } else {
          wResult += char;
        }
        j += vConsumed;
      }
    }
    return wResult;
  };
  return words.map(transliterateWord).join(" ");
}

export function translateContent(text, language) {
  if (!text) return "";
  if (language === "en") return text;
  if (D1_DICTIONARY[text]) {
    return D1_DICTIONARY[text];
  }
  return transliterate(text);
}

// Global localization dictionary translator helper
export function t(key) {
  const currentLang = localStorage.getItem("language") || "en";
  return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS["en"]?.[key] || key;
}

// Toast notification helper
export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `px-4 py-3 rounded-lg shadow-lg text-white font-medium text-sm flex items-center gap-2 transform translate-y-2 opacity-0 transition-all duration-300 pointer-events-auto max-w-sm `;
  
  if (type === 'success') {
    toast.className += 'bg-emerald-600 border border-emerald-500';
  } else if (type === 'error') {
    toast.className += 'bg-rose-600 border border-rose-500';
  } else if (type === 'warning') {
    toast.className += 'bg-amber-600 border border-amber-500';
  } else {
    toast.className += 'bg-slate-700 border border-slate-600';
  }

  toast.innerHTML = `
    <span>${message}</span>
    <button class="ml-auto hover:opacity-80 focus:outline-none">&times;</button>
  `;

  container.appendChild(toast);
  
  // Close action
  toast.querySelector('button').addEventListener('click', () => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  });

  // Slide-in animation
  setTimeout(() => {
    toast.classList.remove('opacity-0', 'translate-y-2');
  }, 10);

  // Auto disappear
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

// Theme settings helpers
export function initTheme() {
  const saved = localStorage.getItem("theme");
  const root = document.documentElement;
  
  if (saved === "dark" || (!saved && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    root.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    root.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
}

export function toggleTheme() {
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  
  if (isDark) {
    root.classList.remove("dark");
    localStorage.setItem("theme", "light");
    showToast(t("language") === "mr" ? "लाईट मोड सुरू केला" : "Theme switched to Light Mode");
  } else {
    root.classList.add("dark");
    localStorage.setItem("theme", "dark");
    showToast(t("language") === "mr" ? "डार्क मोड सुरू केला" : "Theme switched to Dark Mode");
  }
}

// JWT Parser helper
export function getLoggedInUser() {
  const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiry
    if (payload.exp && payload.exp < Date.now() / 1000) {
      localStorage.removeItem("auth_token");
      sessionStorage.removeItem("auth_token");
      return null;
    }
    return payload;
  } catch (e) {
    console.error("Failed to decode token:", e);
    return null;
  }
}

export function logout() {
  localStorage.removeItem("auth_token");
  sessionStorage.removeItem("auth_token");
  showToast(t("language") === "mr" ? "लॉगआउट यशस्वी" : "Logged out successfully");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 500);
}
