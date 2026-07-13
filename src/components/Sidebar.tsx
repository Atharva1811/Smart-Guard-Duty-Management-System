import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, 
  CalendarDays, 
  ShieldAlert, 
  UsersRound, 
  MapPin, 
  CheckSquare, 
  FileCheck, 
  Settings as SettingsIcon,
  LogOut,
  UserCheck
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { translateContent } from "../utils/translator";
interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { t, language } = useLanguage();

  const translationKeys: Record<string, string> = {
    "Dashboard": "dashboard",
    "Today's Duty": "todaysDuty",
    "Guards": "guards",
    "Locations": "locations",
    "Availability": "availability",
    "Leaves": "leaves",
    "Reports": "reports",
    "Users": "users",
    "Settings": "settings"
  };

  const navigation = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["Admin", "Supervisor", "Viewer"] },
    { name: "Today's Duty", path: "/duty", icon: CalendarDays, roles: ["Admin", "Supervisor", "Viewer"] },
    { name: "Guards", path: "/guards", icon: ShieldAlert, roles: ["Admin", "Supervisor", "Viewer"] },
    { name: "Locations", path: "/locations", icon: MapPin, roles: ["Admin", "Supervisor", "Viewer"] },
    { name: "Availability", path: "/availability", icon: CheckSquare, roles: ["Admin", "Supervisor"] },
    { name: "Leaves", path: "/leaves", icon: FileCheck, roles: ["Admin", "Supervisor", "Viewer"] },
    { name: "Reports", path: "/reports", icon: FileCheck, roles: ["Admin", "Supervisor", "Viewer"] },
    { name: "Users", path: "/users", icon: UsersRound, roles: ["Admin"] },
    { name: "Settings", path: "/settings", icon: SettingsIcon, roles: ["Admin", "Supervisor"] },
  ];

  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-card text-card-foreground border-r border-border transition-transform duration-300 md:relative md:translate-x-0 no-print ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-16 items-center justify-between px-6 border-b border-border">
        <Link to="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
          <UserCheck className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">SmartGuard</span>
        </Link>
        <button className="md:hidden p-1 rounded-md text-muted-foreground hover:bg-muted" onClick={() => setIsOpen(false)}>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto h-[calc(100vh-10rem)]">
        {navigation.map((item) => {
          if (user && !item.roles.includes(user.role)) return null;

          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {t(translationKeys[item.name] || item.name)}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
            {user?.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate text-foreground">{translateContent(user?.name, language)}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary uppercase">
              {translateContent(user?.role, language)}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          {t("logout")}
        </button>
      </div>
    </div>
  );
};
