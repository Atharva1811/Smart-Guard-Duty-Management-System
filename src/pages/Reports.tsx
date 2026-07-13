import React, { useState, useEffect } from "react";
import { dbHub } from "../db/dbHub";
import type { Guard, Location, RosterHistory } from "../db/mockDb";
import { 
  Download, 
  Printer, 
  Table, 
  TrendingUp, 
  ChevronRight
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useLanguage } from "../context/LanguageContext";

type ReportType = 
  | 'daily' 
  | 'weekly' 
  | 'monthly' 
  | 'attendance' 
  | 'guard_utilization' 
  | 'location_utilization' 
  | 'night_shift';

export const Reports: React.FC = () => {
  const { t } = useLanguage();
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [guards, setGuards] = useState<Guard[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [history, setHistory] = useState<RosterHistory[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);

  useEffect(() => {
    setGuards(dbHub.getGuards());
    setLocations(dbHub.getLocations());
    setHistory(dbHub.getRosterHistory());
  }, []);

  useEffect(() => {
    generateReportPreview();
  }, [reportType, targetDate, history, guards, locations]);

  const generateReportPreview = () => {
    switch (reportType) {
      case 'daily': {
        const dayRoster = history.find(h => h.date === targetDate);
        if (!dayRoster) {
          setPreviewData([]);
          return;
        }
        const data = Object.entries(dayRoster.roster).map(([locId, shifts]) => {
          const loc = locations.find(l => l.id === locId);
          return {
            location: loc?.name || locId,
            morning: shifts.Morning?.guardName || "Vacant",
            evening: shifts.Evening?.guardName || "Vacant",
            night: shifts.Night?.guardName || "Vacant",
            reserve: shifts.Reserve?.guardName || "None"
          };
        });
        setPreviewData(data);
        break;
      }
      case 'guard_utilization': {
        // Count shift assignments in history for each guard
        const counts: { [gId: string]: number } = {};
        guards.forEach(g => { counts[g.id] = 0; });

        history.forEach(h => {
          Object.values(h.roster).forEach(shifts => {
            (['Morning', 'Evening', 'Night', 'Reserve'] as const).forEach(s => {
              const gId = shifts[s]?.guardId;
              if (gId && counts[gId] !== undefined) {
                counts[gId]++;
              }
            });
          });
        });

        const data = guards.map(g => ({
          id: g.id,
          name: g.name,
          department: g.department,
          shiftsWorked: counts[g.id],
          utilizationRate: `${Math.min(Math.round((counts[g.id] / 10) * 100), 100)}%`
        }));
        setPreviewData(data);
        break;
      }
      case 'location_utilization': {
        const counts: { [locId: string]: { assigned: number; required: number } } = {};
        locations.forEach(l => {
          counts[l.id] = { assigned: 0, required: 0 };
        });

        history.forEach(h => {
          locations.forEach(loc => {
            let req = 0;
            let ass = 0;
            if (loc.shiftRequirement.Morning) {
              req++;
              if (h.roster[loc.id]?.Morning?.guardId) ass++;
            }
            if (loc.shiftRequirement.Evening) {
              req++;
              if (h.roster[loc.id]?.Evening?.guardId) ass++;
            }
            if (loc.shiftRequirement.Night) {
              req++;
              if (h.roster[loc.id]?.Night?.guardId) ass++;
            }
            counts[loc.id].assigned += ass;
            counts[loc.id].required += req;
          });
        });

        const data = locations.map(loc => {
          const rate = counts[loc.id].required > 0 
            ? Math.round((counts[loc.id].assigned / counts[loc.id].required) * 100) 
            : 100;
          return {
            id: loc.id,
            name: loc.name,
            security: loc.securityLevel,
            totalRequired: counts[loc.id].required,
            totalAssigned: counts[loc.id].assigned,
            occupancyRate: `${rate}%`
          };
        });
        setPreviewData(data);
        break;
      }
      case 'night_shift': {
        // Filter guards who worked Night shifts in history
        const nightCounts: { [gId: string]: number } = {};
        guards.forEach(g => { nightCounts[g.id] = 0; });

        history.forEach(h => {
          Object.values(h.roster).forEach(shifts => {
            const gId = shifts.Night?.guardId;
            if (gId && nightCounts[gId] !== undefined) {
              nightCounts[gId]++;
            }
          });
        });

        const data = guards
          .map(g => ({
            id: g.id,
            name: g.name,
            preference: g.shiftPreference,
            nightShiftsWorked: nightCounts[g.id]
          }))
          .filter(g => g.nightShiftsWorked > 0)
          .sort((a, b) => b.nightShiftsWorked - a.nightShiftsWorked);
        setPreviewData(data);
        break;
      }
      default:
        setPreviewData([]);
    }
  };

  // Trigger A4 native browser print
  const handlePrint = () => {
    window.print();
  };

  // Export to CSV/Excel simulator
  const handleExportCSV = () => {
    if (previewData.length === 0) return;
    
    // Create CSV content
    const headers = Object.keys(previewData[0]);
    const csvRows = [
      headers.join(","), // Headers
      ...previewData.map(row => 
        headers.map(fieldName => {
          const val = row[fieldName];
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(",")
      )
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `guard_duty_report_${reportType}_${targetDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'daily': return `Daily Guard Roster Report - ${targetDate}`;
      case 'guard_utilization': return 'Personnel Shift Allocation & Utilization Rates';
      case 'location_utilization': return 'Location Patrol Coverage & Occupancy Statistics';
      case 'night_shift': return 'Night Shift Work Distribution Audit';
      default: return 'Roster Analytics Report';
    }
  };

  // Recharts visualization data
  const chartData = previewData.slice(0, 8).map(d => {
    if (reportType === 'guard_utilization') {
      return { name: d.name, value: d.shiftsWorked };
    }
    if (reportType === 'location_utilization') {
      return { name: d.name.substring(0, 10), value: d.totalAssigned };
    }
    if (reportType === 'night_shift') {
      return { name: d.name, value: d.nightShiftsWorked };
    }
    return { name: d.location?.substring(0, 10), value: 1 };
  });

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("reportsTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("reportsSub")}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={previewData.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
            <span>{t("exportCsv")}</span>
          </button>
          <button
            onClick={handlePrint}
            disabled={previewData.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            <span>{t("printReport")}</span>
          </button>
        </div>
      </div>

      {/* Report selector */}
      <div className="grid gap-6 md:grid-cols-4 print:block">
        <div className="border border-border rounded-xl bg-card p-4 shadow-sm space-y-1 no-print">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block mb-2 px-1">Report Parameters</span>
          
          {[
            { id: 'daily', name: 'Daily Duty Roster', desc: 'Roster for a specific date' },
            { id: 'guard_utilization', name: 'Guard Utilization', desc: 'Duties completed per guard' },
            { id: 'location_utilization', name: 'Location Occupancy', desc: 'Roster coverage by location' },
            { id: 'night_shift', name: 'Night Shift Auditing', desc: 'Night duty balancing index' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setReportType(opt.id as ReportType)}
              className={`w-full text-left p-3 rounded-lg flex items-center justify-between group transition-colors ${reportType === opt.id ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:bg-muted text-muted-foreground'}`}
            >
              <div>
                <span className="text-xs font-bold text-foreground block">{opt.name}</span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">{opt.desc}</span>
              </div>
              <ChevronRight className="h-4 w-4 opacity-50 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}

          {reportType === 'daily' && (
            <div className="pt-4 border-t border-border mt-3 px-1">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Roster Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              />
            </div>
          )}
        </div>

        {/* Report Preview Panel */}
        <div className="md:col-span-3 space-y-6 print:w-full">
          {/* Chart preview */}
          {reportType !== 'daily' && previewData.length > 0 && (
            <div className="border border-border rounded-xl bg-card p-6 shadow-sm">
              <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-primary" /> Visual Statistics Summary</h3>
              <div className="h-48 text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={9} />
                    <YAxis stroke="#888888" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--card-foreground))" }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Table list preview */}
          <div className="border border-border rounded-xl bg-card shadow-sm p-6 print-card">
            {/* Printable header */}
            <div className="hidden print-only mb-6 border-b border-black pb-4 text-center">
              <h1 className="text-2xl font-bold text-black">SMART GUARD DUTY MANAGEMENT SYSTEM</h1>
              <p className="text-sm font-semibold text-gray-700 mt-1">{getReportTitle()}</p>
              <p className="text-xs text-gray-500 mt-1">Generated on: {new Date().toLocaleString()}</p>
            </div>

            <div className="flex justify-between items-center mb-4 no-print">
              <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Table className="h-4 w-4 text-primary" /> Table Preview</h3>
              <span className="text-[10px] text-muted-foreground">{previewData.length} records generated</span>
            </div>

            {previewData.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-12">No records generated for the selected report filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border text-[11px] text-center text-foreground print:text-black">
                  <thead>
                    <tr className="bg-muted/40 font-bold border-b border-border h-9 print:bg-gray-100">
                      {Object.keys(previewData[0]).map(h => (
                        <th key={h} className="border border-border p-2 capitalize">{h.replace(/([A-Z])/g, ' $1')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/5 border-b border-border h-8 print:hover:bg-transparent">
                        {Object.values(row).map((val: any, cellIdx) => (
                          <td key={cellIdx} className="border border-border p-2">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Reports;
