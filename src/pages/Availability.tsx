import React, { useState, useEffect } from "react";
import { dbHub } from "../db/dbHub";
import type { Guard, AttendanceRecord } from "../db/mockDb";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translateContent } from "../utils/translator";
import { Search, Save, CheckSquare, Clock } from "lucide-react";

export const Availability: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isReadOnly = false;

  const [guards, setGuards] = useState<Guard[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setGuards(dbHub.getGuards());
  }, []);

  // Reload attendance when date changes
  useEffect(() => {
    loadAttendanceForDate(selectedDate);
  }, [selectedDate, guards]);

  const loadAttendanceForDate = (dateStr: string) => {
    const records = dbHub.getAttendance(dateStr);
    setAttendance(records);
  };

  const handleStatusChange = (guardId: string, status: AttendanceRecord["status"]) => {
    if (isReadOnly) return;
    const updated = attendance.map(a => {
      if (a.guardId === guardId) {
        return { ...a, status };
      }
      return a;
    });
    setAttendance(updated);
  };

  const handleNotesChange = (guardId: string, notes: string) => {
    if (isReadOnly) return;
    const updated = attendance.map(a => {
      if (a.guardId === guardId) {
        return { ...a, notes };
      }
      return a;
    });
    setAttendance(updated);
  };

  const handleSaveAttendance = async () => {
    if (isReadOnly) return;
    await dbHub.saveAttendance(selectedDate, attendance);
    
    // Sync single guard status if status changed
    const updatedGuards = guards.map(g => {
      const att = attendance.find(a => a.guardId === g.id);
      if (att && ['Available', 'Leave', 'Absent', 'Medical', 'Training'].includes(att.status)) {
        return { ...g, status: att.status as Guard["status"] };
      }
      return g;
    });
    await dbHub.saveGuards(updatedGuards);
    setGuards(updatedGuards);

    dbHub.addAuditLog(user?.username || "system", "Attendance Saved", `Updated daily attendance roll for ${selectedDate}`);
    alert("Attendance sheet saved successfully.");
  };

  // Filter guards
  const filteredGuards = guards.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.id.toLowerCase().includes(search.toLowerCase()) ||
    g.department.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusButtonClass = (isActive: boolean, type: AttendanceRecord["status"]) => {
    const base = "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ";
    if (!isActive) return base + "border-border hover:bg-muted text-muted-foreground bg-transparent";

    switch (type) {
      case "Available": return base + "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
      case "Leave": return base + "bg-blue-500/10 text-blue-600 border-blue-500/30";
      case "Absent": return base + "bg-rose-500/10 text-rose-600 border-rose-500/30";
      case "Medical": return base + "bg-amber-500/10 text-amber-600 border-amber-500/30";
      case "Holiday": return base + "bg-slate-500/10 text-slate-600 border-slate-500/30";
      case "Training": return base + "bg-purple-500/10 text-purple-600 border-purple-500/30";
      case "Late Arrival": return base + "bg-orange-500/10 text-orange-600 border-orange-500/30";
      case "Early Exit": return base + "bg-cyan-500/10 text-cyan-600 border-cyan-500/30";
      default: return base + "bg-slate-500/10 border-slate-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("availabilityTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("availabilitySub")}</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
          />

          {!isReadOnly && (
            <button
              onClick={handleSaveAttendance}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md hover:scale-[1.02] transition-all"
            >
              <Save className="h-4.5 w-4.5" />
              <span>{t("saveChanges")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and stats */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search guards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
        </div>

        {/* Short stats summary */}
        <div className="flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5"><CheckSquare className="h-4 w-4 text-emerald-500" /> Available: {attendance.filter(a => ['Available', 'Late Arrival', 'Early Exit'].includes(a.status)).length}</span>
          <span className="flex items-center gap-1.5"><CheckSquare className="h-4 w-4 text-blue-500" /> Leave: {attendance.filter(a => a.status === 'Leave').length}</span>
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-rose-500" /> Absent: {attendance.filter(a => a.status === 'Absent').length}</span>
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-purple-500" /> Training: {attendance.filter(a => a.status === 'Training').length}</span>
        </div>
      </div>

      {/* Attendance listing */}
      <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40 text-muted-foreground border-b border-border font-semibold h-11 text-center">
                <th className="text-left w-52 px-6">{t("guardNameCol")}</th>
                <th className="text-left w-36">{t("department")}</th>
                <th>{t("statusCol")}</th>
                <th className="w-64 px-6">{t("notesCol")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuards.map(guard => {
                const record = attendance.find(a => a.guardId === guard.id) || { guardId: guard.id, date: selectedDate, status: "Available" as const, notes: "" };
                const currentStatus = record.status;
                
                return (
                  <tr key={guard.id} className="border-b border-border/70 hover:bg-muted/10 transition-colors h-14">
                    {/* Guard info */}
                    <td className="px-6 text-left border-r border-border/50">
                      <div className="font-bold text-foreground">{translateContent(guard.name, language)}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{guard.id} | Pref: {translateContent(guard.shiftPreference, language)}</div>
                    </td>

                    {/* Department */}
                    <td className="text-left text-muted-foreground border-r border-border/50">
                      {translateContent(guard.department, language)}
                    </td>

                    {/* Status grid buttons */}
                    <td className="px-4">
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {([
                          "Available", "Leave", "Absent", "Medical", 
                          "Holiday", "Training", "Late Arrival", "Early Exit"
                        ] as const).map(statusType => (
                          <button
                            key={statusType}
                            onClick={() => handleStatusChange(guard.id, statusType)}
                            disabled={isReadOnly}
                            className={getStatusButtonClass(currentStatus === statusType, statusType)}
                          >
                            {statusType}
                          </button>
                        ))}
                      </div>
                    </td>

                    {/* Notes */}
                    <td className="px-6 text-center">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={record.notes || ""}
                        onChange={(e) => handleNotesChange(guard.id, e.target.value)}
                        placeholder="Add remarks..."
                        className="w-full px-2.5 py-1.5 rounded bg-muted/30 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground text-xs"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
