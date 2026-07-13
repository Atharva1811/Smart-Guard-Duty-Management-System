// Dictionary for static/pre-seeded content translation
const DICTIONARY: Record<string, string> = {
  // Guard Names
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

  // Location Names
  "Main Gate": "मुख्य प्रवेशद्वार (Main Gate)",
  "Control Room": "नियंत्रण कक्ष (Control Room)",
  "Server Room": "सर्व्हर रूम (Server Room)",
  "Parking Area": "पार्किंग क्षेत्र (Parking)",
  "Back Gate": "मागील प्रवेशद्वार (Back Gate)",
  "Patrol Zone A": "गस्त झोन अ (Patrol A)",

  // Statuses
  "Available": "उपलब्ध",
  "Leave": "रजा",
  "Absent": "गैरहजर",
  "Medical": "वैद्यकीय सुट्टी",
  "Holiday": "सुट्टी",
  "Training": "प्रशिक्षण",
  "Late Arrival": "उशिरा आगमन",
  "Early Exit": "लवकर निर्गमन",

  // Departments
  "Corporate Security": "कॉर्पोरेट सुरक्षा",
  "Patrol Division": "गस्त विभाग",
  "Control Operations": "नियंत्रण कार्ये",

  // Priorities & Zones
  "High": "उच्च (High)",
  "Medium": "मध्यम (Medium)",
  "Low": "कमी (Low)",
  "Indoor": "अंतर्गत",
  "Outdoor": "बाह्य",

  // Shifts
  "Morning": "सकाळ",
  "Evening": "दुपार",
  "Night": "रात्र",
  "Reserve": "राखीव"
};

// Vowel lists
const vowels: Record<string, string> = {
  a: "अ", e: "ए", i: "इ", o: "ओ", u: "उ", 
  aa: "आ", ee: "ई", oo: "ऊ", ai: "ऐ", au: "औ"
};

const vowelModifiers: Record<string, string> = {
  a: "", e: "े", i: "ि", o: "ो", u: "ु",
  aa: "ा", ee: "ी", oo: "ू", ai: "ै", au: "ौ"
};

// Consonant lists
const consonants: Record<string, string> = {
  b: "ब", c: "क", d: "द", f: "फ", g: "ग", h: "ह", j: "ज", k: "क", l: "ल", m: "म",
  n: "न", p: "प", q: "क", r: "र", s: "स", t: "त", v: "व", w: "व", x: "क्ष", y: "य", z: "झ",
  ch: "च", sh: "श", kh: "ख", gh: "घ", th: "थ", dh: "ध", ph: "फ", bh: "भ"
};

// Phonetic Latin-to-Marathi transliterator for names uploaded later
const transliterate = (str: string): string => {
  if (!str) return "";
  
  // If already Devanagari, return as-is
  if (/[\u0900-\u097F]/.test(str)) return str;

  const words = str.split(" ");

  const transliterateWord = (word: string): string => {
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

      // Check 2-character consonant combos
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
        // Standalone vowel or other char
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
          wResult += char; // Numbers or special symbols
        }
        j += vConsumed;
      }
    }

    return wResult;
  };

  return words.map(transliterateWord).join(" ");
};

// Main translation helper
export const translateContent = (text: string | undefined | null, language: "en" | "mr"): string => {
  if (!text) return "";
  if (language === "en") return text;

  // 1. Check in static dictionary
  if (DICTIONARY[text]) {
    return DICTIONARY[text];
  }

  // 2. Otherwise run phonetic transliteration (handles dynamic uploaded data)
  return transliterate(text);
};
