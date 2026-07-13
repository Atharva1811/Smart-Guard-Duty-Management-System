import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { dbHub } from "../db/dbHub";
import { 
  Sun, 
  Moon, 
  Bell, 
  Menu, 
  RefreshCw, 
  Database, 
  FileText,
  AlertTriangle,
  X
} from "lucide-react";
import type { AuditLog } from "../db/mockDb";

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<{ id: string; title: string; desc: string; type: string }[]>([]);

  // Periodically scan for notifications and load logs
  const checkRosterAlerts = () => {
    const today = new Date().toISOString().split("T")[0];
    const rosterHistory = dbHub.getRosterHistory();
    const todayRoster = rosterHistory.find(h => h.date === today);
    const list: typeof notifications = [];

    // Check sheets config
    const settings = dbHub.getSettings();
    if (settings.googleSheets.enabled && !settings.googleSheets.appsScriptUrl) {
      list.push({
        id: "n_sheets",
        title: "Sheets Config Incomplete",
        desc: "Google Sheets enabled but Apps Script URL is missing.",
        type: "warning"
      });
    }

    if (todayRoster) {
      if (todayRoster.vacantLocations.length > 0) {
        list.push({
          id: "n_vacancies",
          title: "Vacant Duty Spots",
          desc: `There are ${todayRoster.vacantLocations.length} vacant spots in today's duty roster!`,
          type: "error"
        });
      }
      if (todayRoster.shortages.length > 0) {
        list.push({
          id: "n_shortages",
          title: "Guard Shortage Detect",
          desc: "Shift requirements exceed active available guards count.",
          type: "warning"
        });
      }
    } else {
      list.push({
        id: "n_noroster",
        title: "Roster Missing",
        desc: "No guard duty timetable has been generated for today.",
        type: "info"
      });
    }

    // Add some leaves notifications
    const pendingLeaves = dbHub.getLeaves().filter(l => l.status === "Pending");
    if (pendingLeaves.length > 0) {
      list.push({
        id: "n_leaves",
        title: "Pending Leave Requests",
        desc: `There are ${pendingLeaves.length} leave requests awaiting approval.`,
        type: "info"
      });
    }

    setNotifications(list);
  };

  useEffect(() => {
    checkRosterAlerts();
    if (showAuditLogs) {
      setAuditLogs(dbHub.getAuditLogs());
    }
  }, [showAuditLogs]);

  // Sync click handler
  const handleCloudSync = async () => {
    setSyncing(true);
    setSyncStatus("idle");
    try {
      const settings = dbHub.getSettings();
      if (settings.googleSheets.enabled || settings.githubStorage.enabled) {
        const pullOk = await dbHub.pullCloudData();
        if (pullOk) {
          setSyncStatus("success");
          checkRosterAlerts();
        } else {
          setSyncStatus("error");
        }
      } else {
        // Mock local sync
        await new Promise(r => setTimeout(r, 1000));
        setSyncStatus("success");
      }
    } catch {
      setSyncStatus("error");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncStatus("idle"), 3000);
    }
  };

  const getSyncTooltip = () => {
    const settings = dbHub.getSettings();
    if (settings.googleSheets.enabled) return "Sync with Google Sheets";
    if (settings.githubStorage.enabled) return "Sync with GitHub Repository";
    return "Local Storage Mode (All saved locally)";
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border bg-card/85 backdrop-blur-md px-6 text-card-foreground no-print">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-md hover:bg-muted md:hidden text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="hidden sm:block">
          <p className="text-xs text-muted-foreground">Smart Guard Duty System</p>
          <p className="text-sm font-medium text-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Sync Button */}
        <button
          onClick={handleCloudSync}
          disabled={syncing}
          title={getSyncTooltip()}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 ${syncStatus === "success" ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5" : ""} ${syncStatus === "error" ? "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5" : ""}`}
        >
          <RefreshCw className={`h-4.5 w-4.5 ${syncing ? "animate-spin text-primary" : ""}`} />
          <span className="hidden md:inline">
            {syncing ? "Syncing..." : syncStatus === "success" ? "Synced" : syncStatus === "error" ? "Sync Failed" : "Sync Cloud"}
          </span>
          <Database className="h-4 w-4 opacity-70" />
        </button>

        {/* Language Toggle */}
        <button
          onClick={() => setLanguage(language === "en" ? "mr" : "en")}
          className="px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground font-semibold text-xs transition-colors"
          title="Switch Language / भाषा बदला"
        >
          {language === "en" ? "मराठी" : "English"}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Toggle Light/Dark Mode"
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowAuditLogs(false);
            }}
            className="p-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative"
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-card animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 rounded-xl border border-border bg-card p-4 shadow-xl ring-1 ring-black/5 z-50">
              <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                <h4 className="text-sm font-semibold">Duty Schedule Alerts</h4>
                <span className="text-xs text-muted-foreground">{notifications.length} Active</span>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No issues detected.</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="flex gap-2.5 p-2 rounded-lg bg-muted/30 border border-border/50">
                      <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${n.type === 'error' ? 'text-rose-500' : n.type === 'warning' ? 'text-amber-500' : 'text-blue-500'}`} />
                      <div>
                        <p className="text-xs font-semibold text-foreground">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{n.desc}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Audit Log Trigger */}
        <button
          onClick={() => {
            setShowAuditLogs(!showAuditLogs);
            setShowNotifications(false);
          }}
          className="p-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="View System Audit Logs"
        >
          <FileText className="h-5 w-5" />
        </button>

        {/* Audit Log Drawer */}
        {showAuditLogs && (
          <div className="fixed inset-y-0 right-0 z-50 w-96 border-l border-border bg-card p-6 shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <h3 className="font-bold text-lg">System Audit Log</h3>
              <button 
                onClick={() => setShowAuditLogs(false)} 
                className="p-1 rounded-md text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto h-[calc(100vh-8rem)] pr-1">
              {auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No log entries found.</p>
              ) : (
                auditLogs.map(log => (
                  <div key={log.id} className="p-3 rounded-lg bg-muted/50 border border-border/80 text-xs">
                    <div className="flex justify-between font-semibold mb-1 text-foreground">
                      <span>@{log.user}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="font-medium text-primary mb-1">{log.action}</p>
                    <p className="text-muted-foreground leading-relaxed">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
