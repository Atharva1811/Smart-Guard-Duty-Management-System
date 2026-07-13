import React, { createContext, useContext, useState, useEffect } from "react";
import { dbHub } from "../db/dbHub";
import type { SystemUser } from "../db/mockDb";

interface AuthContextType {
  user: SystemUser | null;
  token: string | null;
  login: (username: string, passcode: string, rememberMe: boolean) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to base64 encode mock JWT
const generateMockToken = (user: SystemUser) => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({
    username: user.username,
    name: user.name,
    role: user.role,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + (60 * 15) // 15 min expiry
  }));
  const signature = btoa("mock_signature_key");
  return `${header}.${payload}.${signature}`;
};

// Helper to decode mock JWT
const decodeMockToken = (token: string): SystemUser | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      console.warn("Session token expired");
      return null;
    }
    
    return {
      username: payload.username,
      name: payload.name,
      role: payload.role,
      email: payload.email
    };
  } catch (e) {
    return null;
  }
};

const safeGetItem = (type: "localStorage" | "sessionStorage", key: string): string | null => {
  try {
    return window[type].getItem(key);
  } catch (e) {
    return null;
  }
};

const safeSetItem = (type: "localStorage" | "sessionStorage", key: string, value: string): void => {
  try {
    window[type].setItem(key, value);
  } catch (e) {
    console.warn(`Could not set ${key} in ${type} due to restrictions.`);
  }
};

const safeRemoveItem = (type: "localStorage" | "sessionStorage", key: string): void => {
  try {
    window[type].removeItem(key);
  } catch (e) {
    // Ignore
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SystemUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check login status on load
  useEffect(() => {
    const savedToken = safeGetItem("localStorage", "auth_token") || safeGetItem("sessionStorage", "auth_token");
    if (savedToken) {
      const decodedUser = decodeMockToken(savedToken);
      if (decodedUser) {
        setUser(decodedUser);
        setToken(savedToken);
        
        // Refresh credentials or pull database if connected
        dbHub.pullCloudData().catch(e => console.warn("Failed automatic cloud pull on init", e));
      } else {
        safeRemoveItem("localStorage", "auth_token");
        safeRemoveItem("sessionStorage", "auth_token");
      }
    }
    setIsLoading(false);
  }, []);

  // Monitor user activity for session timeout (15 mins)
  useEffect(() => {
    if (!user) return;

    let timeoutId: number;

    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      // Log out after 15 minutes of inactivity
      timeoutId = window.setTimeout(() => {
        dbHub.addAuditLog(user.username, "Session Timeout", "Automatically logged out due to 15 minutes of inactivity.");
        logout();
      }, 15 * 60 * 1000);
    };

    // User interactions to track
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach(event => document.addEventListener(event, resetTimer));

    resetTimer(); // Initialize

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [user]);

  const login = async (username: string, passcode: string, rememberMe: boolean): Promise<boolean> => {
    // Look up users in DB
    const users = dbHub.getUsers();
    const match = users.find(u => u.username === username.toLowerCase());

    if (match) {
      // Validate simple passcode simulation:
      // admin -> admin123, supervisor -> supervisor123, viewer -> viewer123
      const expectedPasscode = username.toLowerCase() === "admin" ? "admin123" : 
                               username.toLowerCase() === "supervisor" ? "supervisor123" : "viewer123";
                               
      if (passcode === expectedPasscode) {
        const mockToken = generateMockToken(match);
        setUser(match);
        setToken(mockToken);

        if (rememberMe) {
          safeSetItem("localStorage", "auth_token", mockToken);
        } else {
          safeSetItem("sessionStorage", "auth_token", mockToken);
        }

        dbHub.addAuditLog(match.username, "User Logged In", `Logged in successfully. Role: ${match.role}`);
        
        // Pull latest database content
        await dbHub.pullCloudData().catch(e => console.warn("Could not sync cloud data on login", e));
        return true;
      }
    }
    
    return false;
  };

  const logout = () => {
    if (user) {
      dbHub.addAuditLog(user.username, "User Logged Out", "Logged out voluntarily.");
    }
    setUser(null);
    setToken(null);
    safeRemoveItem("localStorage", "auth_token");
    safeRemoveItem("sessionStorage", "auth_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
