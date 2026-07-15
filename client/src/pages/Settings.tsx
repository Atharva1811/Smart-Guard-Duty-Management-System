// client/src/pages/Settings.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext.tsx';
import { api } from '../config/api.ts';
import { Save, Clock, RefreshCw, Calendar } from 'lucide-react';

export const Settings: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Settings states
  const [shiftTimings, setShiftTimings] = useState({
    Morning: { start: '06:00', end: '14:00' },
    Evening: { start: '14:00', end: '22:00' },
    Night: { start: '22:00', end: '06:00' },
  });

  const [rotationRules, setRotationRules] = useState({
    maxConsecutiveDuties: 5,
    maxNightShiftsPerWeek: 3,
    restHoursBetweenShifts: 12,
  });

  const [holidayCalendar, setHolidayCalendar] = useState<any[]>([]);
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/settings');
      if (res.data.success) {
        const data = res.data.data;
        if (data.shiftTimings) setShiftTimings(data.shiftTimings);
        if (data.rotationRules) setRotationRules(data.rotationRules);
        if (data.holidayCalendar) setHolidayCalendar(data.holidayCalendar);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleTimingChange = (shift: 'Morning' | 'Evening' | 'Night', field: 'start' | 'end', val: string) => {
    const copy = { ...shiftTimings };
    copy[shift][field] = val;
    setShiftTimings(copy);
  };

  const handleRuleChange = (field: string, val: number) => {
    setRotationRules({
      ...rotationRules,
      [field]: val
    });
  };

  const handleAddHoliday = () => {
    if (!newHoliday.date || !newHoliday.name) return;
    setHolidayCalendar([...holidayCalendar, newHoliday]);
    setNewHoliday({ date: '', name: '' });
  };

  const handleRemoveHoliday = (idx: number) => {
    const copy = [...holidayCalendar];
    copy.splice(idx, 1);
    setHolidayCalendar(copy);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/api/settings', {
        shiftTimings,
        rotationRules,
        holidayCalendar,
      });
      if (res.data.success) {
        alert('System configuration settings saved successfully.');
        loadSettings();
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-sm text-muted-foreground">Loading settings console...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('settingsTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('settingsSub')}</p>
      </div>

      <form onSubmit={handleSave} className="grid gap-6 md:grid-cols-2">
        {/* SHIFT TIMINGS */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Clock className="h-4.5 w-4.5 text-primary" />
            <span>{t('shiftTimingSlots')}</span>
          </h3>

          <div className="space-y-3 text-xs">
            {['Morning', 'Evening', 'Night'].map((shift) => {
              const typedShift = shift as 'Morning' | 'Evening' | 'Night';
              return (
                <div key={shift} className="flex justify-between items-center gap-2">
                  <span className="font-semibold text-muted-foreground w-1/4">{shift} Shift</span>
                  <div className="flex-1 flex gap-2 items-center">
                    <input 
                      type="time" 
                      value={shiftTimings[typedShift].start}
                      onChange={(e) => handleTimingChange(typedShift, 'start', e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-border bg-muted/20"
                    />
                    <span>to</span>
                    <input 
                      type="time" 
                      value={shiftTimings[typedShift].end}
                      onChange={(e) => handleTimingChange(typedShift, 'end', e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-border bg-muted/20"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ROTATION RULES */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <RefreshCw className="h-4.5 w-4.5 text-primary" />
            <span>{t('rotationRules')}</span>
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Max Consecutive Shifts</label>
              <input 
                type="number" 
                value={rotationRules.maxConsecutiveDuties}
                onChange={(e) => handleRuleChange('maxConsecutiveDuties', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Max Night Shifts Per Week</label>
              <input 
                type="number" 
                value={rotationRules.maxNightShiftsPerWeek}
                onChange={(e) => handleRuleChange('maxNightShiftsPerWeek', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Rest Hours Between Shifts</label>
              <input 
                type="number" 
                value={rotationRules.restHoursBetweenShifts}
                onChange={(e) => handleRuleChange('restHoursBetweenShifts', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20"
              />
            </div>
          </div>
        </div>

        {/* HOLIDAY CALENDAR */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4 md:col-span-2">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Calendar className="h-4.5 w-4.5 text-primary" />
            <span>Holiday Calendar Configuration</span>
          </h3>

          <div className="grid gap-4 sm:grid-cols-3 text-xs border-b border-border pb-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Holiday Date</label>
              <input 
                type="date" 
                value={newHoliday.date}
                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Holiday Name</label>
              <input 
                type="text" 
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                placeholder="e.g. Independence Day"
                className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button 
                type="button"
                onClick={handleAddHoliday}
                className="px-4 py-2 font-semibold rounded-lg bg-primary text-primary-foreground hover:brightness-105"
              >
                Add Holiday
              </button>
            </div>
          </div>

          {/* Holiday List */}
          <div className="space-y-2 max-h-[160px] overflow-y-auto pt-2">
            {holidayCalendar.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center">No holidays configured.</p>
            ) : (
              holidayCalendar.map((h, idx) => (
                <div key={idx} className="flex justify-between items-center bg-muted/20 p-2.5 rounded-lg border border-border text-xs">
                  <span className="font-bold">{h.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{h.date}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveHoliday(idx)}
                      className="text-red-500 font-semibold hover:brightness-95"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SUBMIT BUTTON ROW */}
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold flex items-center gap-1.5 shadow-sm text-sm hover:bg-emerald-700"
          >
            <Save className="h-4.5 w-4.5" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
