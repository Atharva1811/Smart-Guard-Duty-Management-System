// client/src/pages/Reports.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext.tsx';
import { api } from '../config/api.ts';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/export.ts';
import { BarChart3, FileSpreadsheet, FileDown, Printer } from 'lucide-react';

export const Reports: React.FC = () => {
  const { t, translateText } = useTranslation();
  const [reportType, setReportType] = useState<string>('daily');
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [reportTitle, setReportTitle] = useState<string>('Report Preview');
  
  // Data cache
  const [guards, setGuards] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  const runReport = async () => {
    setLoading(true);
    try {
      if (reportType === 'daily') {
        setReportTitle(`Report: Daily Duty Roster - ${reportDate}`);
        const [rosterRes, locsRes] = await Promise.all([
          api.get(`/api/roster/assignments?date=${reportDate}`),
          api.get('/api/locations')
        ]);
        setRoster(rosterRes.data.data);
        setLocations(locsRes.data.data);
      } else if (reportType === 'utilization') {
        setReportTitle(`Report: Guard Utilization Stats`);
        const [guardsRes, historyRes] = await Promise.all([
          api.get('/api/guards'),
          api.get('/api/roster/history?limit=200')
        ]);
        setGuards(guardsRes.data.data);
        setHistory(historyRes.data.data.results || []);
      } else if (reportType === 'occupancy') {
        setReportTitle(`Report: Checkpoint Occupancy Setup`);
        const locsRes = await api.get('/api/locations');
        setLocations(locsRes.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runReport();
  }, [reportType, reportDate]);

  const handleExportCSV = () => {
    const { headers, rows } = compileReportData();
    exportToCSV(`${reportType}_report_${reportDate}.csv`, headers, rows);
  };

  const handleExportExcel = () => {
    const { headers, rows } = compileReportData();
    exportToExcel(`${reportType}_report_${reportDate}.xlsx`, 'Report', headers, rows);
  };

  const handleExportPDF = () => {
    const { headers, rows } = compileReportData();
    exportToPDF(`${reportType}_report_${reportDate}.pdf`, reportTitle, headers, rows);
  };

  const compileReportData = () => {
    let headers: string[] = [];
    let rows: any[][] = [];

    if (reportType === 'daily') {
      headers = ['Location Checkpoint', 'Morning Shift', 'Evening Shift', 'Night Shift'];
      rows = locations.map(loc => {
        const line = [translateText(loc.locationName)];
        ['Morning', 'Evening', 'Night'].forEach(shift => {
          const match = roster.find(r => r.location_id === loc.id && r.shift === shift);
          line.push(match && match.guard_name ? translateText(match.guard_name) : 'Vacant');
        });
        return line;
      });
    } else if (reportType === 'utilization') {
      headers = ['Guard Name', 'Guard Code', 'Status', 'Workload (Duties last 14d)'];
      rows = guards.map(g => {
        const workload = history.filter(h => h.guard_id === g.id).length;
        return [
          translateText(g.name),
          g.guardCode,
          translateText(g.status),
          workload
        ];
      });
    } else if (reportType === 'occupancy') {
      headers = ['Checkpoint Name', 'Required Guards', 'Active Shifts', 'Status'];
      rows = locations.map(loc => [
        translateText(loc.locationName),
        loc.requiredGuards,
        loc.shift || 'Morning,Evening,Night',
        loc.status
      ]);
    }

    return { headers, rows };
  };

  const renderTablePreview = () => {
    const { headers, rows } = compileReportData();

    if (rows.length === 0) {
      return <p className="text-center py-6 text-xs text-muted-foreground">No records found for this query.</p>;
    }

    return (
      <table className="roster-table text-[11px]">
        <thead>
          <tr>
            {headers.map((h, i) => <th key={i}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={j === 0 ? 'font-bold' : ''}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('reportsTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('reportsSub')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Selectors Sidebar */}
        <div className="md:col-span-1 rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-muted/20"
            >
              <option value="daily">Daily Duty Roster</option>
              <option value="utilization">Guard Workload Utilization</option>
              <option value="occupancy">Location Occupancy</option>
            </select>
          </div>

          {reportType === 'daily' && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Target Date</label>
              <input 
                type="date" 
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-muted/20"
              />
            </div>
          )}
        </div>

        {/* Preview and actions container */}
        <div className="md:col-span-3 rounded-xl border border-border bg-card p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <BarChart3 className="h-4.5 w-4.5 text-primary" />
                <span>{reportTitle}</span>
              </h3>

              <div className="flex gap-2 text-xs font-semibold">
                <button 
                  onClick={handleExportCSV}
                  className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>CSV</span>
                </button>
                <button 
                  onClick={handleExportExcel}
                  className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Excel</span>
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto min-h-[220px]">
              {loading ? (
                <p className="text-center py-10 text-xs text-muted-foreground">Running report query...</p>
              ) : (
                renderTablePreview()
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
