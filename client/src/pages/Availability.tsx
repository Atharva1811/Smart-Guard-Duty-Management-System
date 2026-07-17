// client/src/pages/Availability.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext.tsx';
import { api } from '../config/api.ts';
import { Save } from 'lucide-react';

export const Availability: React.FC = () => {
  const { t, translateText } = useTranslation();
  const [activeDate, setActiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [guards, setGuards] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const loadAttendance = async (_dateStr: string) => {
    setLoading(true);
    try {
      const guardsRes = await api.get('/api/guards');

      const gList = guardsRes.data.data;
      setGuards(gList);
      // Create local attendance statuses array
      const list = gList.map((g: any) => ({
        guardId: g.id,
        name: g.name,
        guardCode: g.guardCode,
        status: g.status, // Fallback to guard's default status
        notes: ''
      }));

      setAttendance(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance(activeDate);
  }, [activeDate]);

  const handleStatusChange = (guardId: number, status: string) => {
    const copy = [...attendance];
    const match = copy.find(item => item.guardId === guardId);
    if (match) {
      match.status = status;
      setAttendance(copy);
    }
  };

  const handleNotesChange = (guardId: number, notes: string) => {
    const copy = [...attendance];
    const match = copy.find(item => item.guardId === guardId);
    if (match) {
      match.notes = notes;
      setAttendance(copy);
    }
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      // Save/Update guard statuses
      for (const record of attendance) {
        const guard = guards.find(g => g.id === record.guardId);
        if (guard && guard.status !== record.status) {
          // Put update
          await api.put(`/api/guards/${guard.id}`, {
            ...guard,
            status: record.status
          });
        }
      }
      alert('Daily attendance statuses updated successfully.');
      loadAttendance(activeDate);
    } catch (e) {
      console.error(e);
      alert('Failed to save daily attendance records.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('availabilityTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('availabilitySub')}</p>
        </div>

        <div className="flex items-center gap-2 no-print ml-auto sm:ml-0">
          <input 
            type="date" 
            value={activeDate}
            onChange={(e) => setActiveDate(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-border bg-card"
          />
          <button 
            onClick={handleSaveAttendance}
            disabled={saving}
            className="px-3 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : t('save')}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-sm text-muted-foreground">Loading attendance board...</div>
      ) : attendance.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">No guards registered.</div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <table className="roster-table text-xs">
            <thead>
              <tr>
                <th>{t('guardNameCol')}</th>
                <th className="w-1/4">{t('statusCol')}</th>
                <th className="w-2/5">{t('notesCol')}</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map(record => (
                <tr key={record.guardId}>
                  <td className="font-bold text-foreground">{translateText(record.name)} ({record.guardCode})</td>
                  <td>
                    <select
                      value={record.status}
                      onChange={(e) => handleStatusChange(record.guardId, e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-muted/20 text-xs font-semibold"
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="LEAVE">On Leave</option>
                      <option value="ABSENT">Absent</option>
                      <option value="MEDICAL">Medical</option>
                      <option value="HOLIDAY">Holiday</option>
                      <option value="TRAINING">Training</option>
                    </select>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      placeholder="Enter attendance notes..."
                      value={record.notes}
                      onChange={(e) => handleNotesChange(record.guardId, e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-muted/20 text-xs focus:outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
