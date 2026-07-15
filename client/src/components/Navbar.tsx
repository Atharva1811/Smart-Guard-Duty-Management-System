// client/src/components/Navbar.tsx
import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon, Bell, Shield } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext.tsx';
import { api } from '../config/api.ts';

interface NavbarProps {
  onMenuClick: () => void;
  onAuditClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick, onAuditClick }) => {
  const { t, language } = useTranslation();
  const [time, setTime] = useState<string>('');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [alertsCount, setAlertsCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notificationsList, setNotificationsList] = useState<string[]>([]);

  // Ticking Clock
  useEffect(() => {
    const updateTime = () => {
      const formatted = new Date().toLocaleTimeString();
      setTime(`${language === 'mr' ? 'वेळ' : 'Time'}: ${formatted}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [language]);

  // Initial Theme Check
  useEffect(() => {
    const isDarkClass = document.documentElement.classList.contains('dark');
    setIsDark(isDarkClass);
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
      localStorage.setItem('theme', 'dark');
    }
  };

  // Fetch quick alerts count (shortages and pending leaves)
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const leavesRes = await api.get('/api/leaves');
        const activeLeaves = leavesRes.data.data.filter((l: any) => l.status === 'PENDING').length;
        
        const list: string[] = [];
        if (activeLeaves > 0) {
          list.push(language === 'mr' 
            ? `${activeLeaves} रजा मंजुरीसाठी प्रलंबित आहेत` 
            : `${activeLeaves} leave requests are pending approval`
          );
        }

        setNotificationsList(list);
        setAlertsCount(list.length);
      } catch (e) {
        console.error('Failed to load alert statuses:', e);
      }
    };
    fetchAlerts();
  }, [language]);

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 no-print">
      {/* Mobile Burger Menu */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick} 
          className="p-2 rounded hover:bg-muted lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-xs text-muted-foreground font-semibold hidden md:inline">{time}</span>
      </div>

      {/* Toolbar actions */}
      <div className="flex items-center gap-4">
        {/* Audit Log button */}
        <button 
          onClick={onAuditClick}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs font-semibold"
          title="Security Logs"
        >
          <Shield className="h-4.5 w-4.5" />
          <span className="hidden sm:inline">Audit Trail</span>
        </button>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          {isDark ? <Sun className="h-4.5 w-4.5 text-yellow-500" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Alert Notifications dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground relative"
          >
            <Bell className="h-4.5 w-4.5" />
            {alertsCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg border border-border bg-card p-3 shadow-lg z-50 text-xs">
              <h5 className="font-bold border-b pb-2 mb-2">System Alerts</h5>
              {notificationsList.length === 0 ? (
                <p className="text-muted-foreground text-center py-2">No active system warnings.</p>
              ) : (
                <div className="space-y-1.5">
                  {notificationsList.map((notif, index) => (
                    <div key={index} className="flex gap-2 text-red-500 font-medium">
                      <span>⚠️</span>
                      <span>{notif}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
