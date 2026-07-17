// client/src/pages/TodayDuty.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext.tsx';
import { api } from '../config/api.ts';
import { exportToCSV } from '../utils/export.ts';
import { 
  Printer, 
  RefreshCw, 
  Save, 
  Trash2, 
  Lock, 
  Unlock, 
  Search,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';

export const TodayDuty: React.FC = () => {
  const { t, translateText } = useTranslation();
  const [activeDate, setActiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [locations, setLocations] = useState<any[]>([]);
  const [guards, setGuards] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  
  // Conflicts and shortages
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [shortages, setShortages] = useState<any[]>([]);
  
  // Loading and modals states
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  
  // Reassign Modal
  const [showOverride, setShowOverride] = useState<boolean>(false);
  const [overrideLoc, setOverrideLoc] = useState<any>(null);
  const [overrideShift, setOverrideShift] = useState<string>('');
  const [overrideGuardId, setOverrideGuardId] = useState<string>('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [candidateSearch, setCandidateSearch] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Drag and drop local state cache
  const [draggedCell, setDraggedCell] = useState<{ locationId: number; shift: string } | null>(null);

  // Lock Duration Modal
  const [lockModalCell, setLockModalCell] = useState<{ locationId: number; shift: string; guardId: number } | null>(null);
  
  // Location Level Locks
  const [lockedLocations, setLockedLocations] = useState<Record<number, boolean>>({});

  // Custom alert dialog state
  const [customAlert, setCustomAlert] = useState<{ title: string; message: string; type?: 'success' | 'info' | 'warning' } | null>(null);

  const showAlert = (message: string, title = 'Notification', type: 'success' | 'info' | 'warning' = 'info') => {
    setCustomAlert({ title, message, type });
  };

  const loadData = async (dateStr: string) => {
    setLoading(true);
    try {
      const [locsRes, guardsRes, rosterRes] = await Promise.all([
        api.get('/api/locations'),
        api.get('/api/guards'),
        api.get(`/api/roster/assignments?date=${dateStr}`)
      ]);

      const locs = locsRes.data.data;
      const gList = guardsRes.data.data;
      const assignments = rosterRes.data.data;

      setLocations(locs);
      setGuards(gList);

      // If no assignments exist on backend, pre-populate vacant structure
      if (assignments.length === 0) {
        const vacantRoster: any[] = [];
        locs.forEach((l: any) => {
          const activeShifts = (l.shift || 'Morning,Evening,Night').split(',');
          activeShifts.forEach((s: string) => {
            vacantRoster.push({
              location_id: l.id,
              location_name: l.locationName,
              shift: s,
              guard_id: null,
              guard_name: null,
              guard_code: null,
              status: 'Vacant',
              assignment_date: dateStr
            });
          });
          // Add Reserve shift
          vacantRoster.push({
            location_id: l.id,
            location_name: l.locationName,
            shift: 'Reserve',
            guard_id: null,
            guard_name: null,
            guard_code: null,
            status: 'Vacant',
            assignment_date: dateStr
          });
        });
        setRoster(vacantRoster);
      } else {
        setRoster(assignments);
      }

      // Compute initial lockedLocations state from loaded assignments
      const locLockMap: Record<number, boolean> = {};
      const activeAssignmentsList = assignments.length > 0 ? assignments : [];
      locs.forEach((l: any) => {
        const activeShifts = [...(l.shift || 'Morning,Evening,Night').split(','), 'Reserve'];
        const shiftsForLoc = activeAssignmentsList.filter((a: any) => a.location_id === l.id && activeShifts.includes(a.shift));
        if (shiftsForLoc.length > 0 && shiftsForLoc.every((s: any) => s.status === 'Locked')) {
          locLockMap[l.id] = true;
        }
      });
      setLockedLocations(locLockMap);
    } catch (err) {
      console.error('Failed to load roster data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeDate);
  }, [activeDate]);

  // Sync conflicts and shortages on roster changes
  useEffect(() => {
    if (roster.length > 0) {
      // 1. Detect shortages
      const shortList: any[] = [];
      
      locations.forEach(loc => {
        const activeShifts = (loc.shift || 'Morning,Evening,Night').split(',');

        activeShifts.forEach(s => {
          const match = roster.find(r => r.location_id === loc.id && r.shift === s);
          if (!match || !match.guard_id) {
            shortList.push({
              locationId: loc.id,
              locationName: loc.locationName,
              shift: s
            });
          }
        });
      });

      setShortages(shortList);

      // 2. Fetch conflicts list from backend
      api.post('/api/roster/conflicts', { date: activeDate, roster })
        .then(res => {
          if (res.data.success) setConflicts(res.data.data);
        })
        .catch(err => console.error('Error checking conflicts:', err));
    }
  }, [roster, locations, activeDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActiveDate(e.target.value);
  };

  // Trigger auto allocation from backend engine
  const handleAutoAllocate = async () => {
    setGenerating(true);
    try {
      const lockedList = roster
        .filter(r => r.status === 'Locked' && r.guard_id)
        .map(r => ({
          location_id: r.location_id,
          shift: r.shift,
          guard_id: r.guard_id,
          guard_name: r.guard_name
        }));

      const res = await api.post('/api/roster/generate', {
        date: activeDate,
        lockedAssignments: lockedList
      });

      if (res.data.success) {
        const generatedRoster = res.data.data.roster;
        const newRoster = roster.map(cell => {
          if (cell.status === 'Locked') return cell;

          const locationData = generatedRoster[cell.location_id];
          const shiftData = locationData ? locationData[cell.shift] : null;

          if (shiftData) {
            const guard = guards.find(g => g.id === shiftData.guard_id);
            return {
              ...cell,
              guard_id: shiftData.guard_id,
              guard_name: shiftData.guard_name,
              guard_code: guard ? guard.guardCode : '??',
              status: 'Assigned'
            };
          } else {
            return {
              ...cell,
              guard_id: null,
              guard_name: null,
              guard_code: null,
              status: 'Vacant'
            };
          }
        });

        setRoster(newRoster);
      }
    } catch (e) {
      console.error(e);
      showAlert('Timetable generation failed. Please try again.', 'Error', 'warning');
    } finally {
      setGenerating(false);
    }
  };

  // Save roster timetable to backend PostgreSQL
  const handleSaveRoster = async () => {
    setSaving(true);
    try {
      const formatted = roster.map(r => ({
        guard_id: r.guard_id || null,
        location_id: r.location_id,
        shift: r.shift,
        status: r.status || 'Assigned'
      }));

      const res = await api.post('/api/roster/save', {
        date: activeDate,
        assignments: formatted
      });

      if (res.data.success) {
        showAlert('Daily duty roster saved successfully.', 'Success', 'success');
        loadData(activeDate);
      }
    } catch (e) {
      console.error(e);
      showAlert('Failed to save assignments. Please check database connectivity.', 'Error', 'warning');
    } finally {
      setSaving(false);
    }
  };

  // Location Level Lock/Unlock
  const handleToggleLocationLock = async (locationId: number) => {
    const isLocked = !lockedLocations[locationId];

    setLockedLocations(prev => ({
      ...prev,
      [locationId]: isLocked
    }));

    // Set all shift cells for this location to Locked or Assigned/Vacant locally
    const copy = roster.map(cell => {
      if (cell.location_id === locationId) {
        return {
          ...cell,
          status: isLocked ? 'Locked' : (cell.guard_id ? 'Assigned' : 'Vacant')
        };
      }
      return cell;
    });
    setRoster(copy);
  };

  // Cell Lock/Unlock override
  const handleToggleLock = async (locationId: number, shift: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cell = roster.find(r => r.location_id === locationId && r.shift === shift);
    if (!cell || !cell.guard_id) return;

    if (cell.status === 'Locked') {
      try {
        await api.post('/api/roster/unlock', {
          date: activeDate,
          locationId,
          shift
        });
        
        const copy = [...roster];
        const idx = copy.findIndex(r => r.location_id === locationId && r.shift === shift);
        if (idx !== -1) {
          copy[idx] = {
            ...copy[idx],
            status: 'Assigned'
          };
          setRoster(copy);
        }
      } catch (err) {
        console.error('Failed to unlock:', err);
      }
    } else {
      setLockModalCell({
        locationId,
        shift,
        guardId: cell.guard_id
      });
    }
  };

  const handleLockDurationSubmit = async (duration: number) => {
    if (!lockModalCell) return;
    const { locationId, shift, guardId } = lockModalCell;

    try {
      await api.post('/api/roster/lock', {
        date: activeDate,
        locationId,
        shift,
        guardId,
        duration
      });

      const copy = [...roster];
      const idx = copy.findIndex(r => r.location_id === locationId && r.shift === shift);
      if (idx !== -1) {
        copy[idx] = {
          ...copy[idx],
          status: 'Locked'
        };
        setRoster(copy);
      }
      
      loadData(activeDate);
    } catch (err) {
      console.error('Failed to lock:', err);
    } finally {
      setLockModalCell(null);
    }
  };

  const handleClearRoster = () => {
    if (confirm('Are you sure you want to clear all unassigned/assigned duties? Locked duties will remain intact.')) {
      const copy = roster.map(cell => {
        if (cell.status === 'Locked') {
          return cell;
        }
        return {
          ...cell,
          guard_id: null,
          guard_name: null,
          guard_code: null,
          status: 'Vacant'
        };
      });
      setRoster(copy);
    }
  };

  // Open override picker modal
  const handleOpenOverride = async (locationId: number, shift: string) => {
    setCandidateSearch('');
    const loc = locations.find(l => l.id === locationId);
    setOverrideLoc(loc);
    setOverrideShift(shift);

    const cell = roster.find(r => r.location_id === locationId && r.shift === shift);
    setOverrideGuardId(cell?.guard_id ? String(cell.guard_id) : '');

    try {
      const res = await api.get(`/api/roster/suggestions?date=${activeDate}&locationId=${locationId}&shift=${shift}`);
      if (res.data.success) {
        setCandidates(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
    setShowOverride(true);
  };

  const handleApplyOverride = () => {
    if (!overrideLoc) return;

    const cellIndex = roster.findIndex(r => r.location_id === overrideLoc.id && r.shift === overrideShift);
    if (cellIndex !== -1) {
      const copy = [...roster];
      const selectedId = Number(overrideGuardId);
      const guard = guards.find(g => g.id === selectedId);

      if (guard) {
        // Find if this guard was previously assigned to another cell today (excluding target cell)
        const prevCellIndex = copy.findIndex(r => r.guard_id === selectedId && !(r.location_id === overrideLoc.id && r.shift === overrideShift));

        // Assign guard to target cell
        copy[cellIndex] = {
          ...copy[cellIndex],
          guard_id: guard.id,
          guard_name: guard.name,
          guard_code: guard.guardCode,
          status: 'Assigned'
        };

        if (prevCellIndex !== -1) {
          // Old cell is temporarily vacant
          copy[prevCellIndex] = {
            ...copy[prevCellIndex],
            guard_id: null,
            guard_name: null,
            guard_code: null,
            status: 'Vacant'
          };

          // Find occupied guard IDs to get a pool of free guards
          const occupiedIds = new Set<number>();
          copy.forEach(r => {
            if (r.guard_id) occupiedIds.add(r.guard_id);
          });

          // Filter candidates to get free guards
          const freeCandidates = candidates.filter(c => !occupiedIds.has(c.id));

          if (freeCandidates.length > 0) {
            const replacement = freeCandidates[0];
            copy[prevCellIndex] = {
              ...copy[prevCellIndex],
              guard_id: replacement.id,
              guard_name: replacement.name,
              guard_code: replacement.guardCode,
              status: 'Assigned'
            };
            showAlert(`Auto-staffed: ${replacement.name} has been assigned to ${translateText(copy[prevCellIndex].location_name)} (${copy[prevCellIndex].shift}) to replace ${guard.name}.`, 'Auto-Staffing Update', 'success');
          }
        }
      } else {
        copy[cellIndex] = {
          ...copy[cellIndex],
          guard_id: null,
          guard_name: null,
          guard_code: null,
          status: 'Vacant'
        };
      }
      setRoster(copy);
    }
    setShowOverride(false);
  };

  const handleClearOverride = () => {
    if (!overrideLoc) return;
    const cellIndex = roster.findIndex(r => r.location_id === overrideLoc.id && r.shift === overrideShift);
    if (cellIndex !== -1) {
      const copy = [...roster];
      copy[cellIndex] = {
        ...copy[cellIndex],
        guard_id: null,
        guard_name: null,
        guard_code: null,
        status: 'Vacant'
      };
      setRoster(copy);
    }
    setShowOverride(false);
  };

  // Drag and Drop implementation
  const handleDragStart = (_e: React.DragEvent, locationId: number, shift: string) => {
    setDraggedCell({ locationId, shift });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetLocId: number, targetShift: string) => {
    e.preventDefault();
    if (!draggedCell) return;

    const sourceLocId = draggedCell.locationId;
    const sourceShift = draggedCell.shift;

    if (sourceLocId === targetLocId && sourceShift === targetShift) return;

    const sourceIndex = roster.findIndex(r => r.location_id === sourceLocId && r.shift === sourceShift);
    const targetIndex = roster.findIndex(r => r.location_id === targetLocId && r.shift === targetShift);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const copy = [...roster];
      
      // Perform swap of guard properties
      const tempId = copy[sourceIndex].guard_id;
      const tempName = copy[sourceIndex].guard_name;
      const tempCode = copy[sourceIndex].guard_code;
      const tempStatus = copy[sourceIndex].status === 'Locked' ? 'Assigned' : copy[sourceIndex].status;

      copy[sourceIndex] = {
        ...copy[sourceIndex],
        guard_id: copy[targetIndex].guard_id,
        guard_name: copy[targetIndex].guard_name,
        guard_code: copy[targetIndex].guard_code,
        status: copy[targetIndex].status === 'Locked' ? 'Assigned' : copy[targetIndex].status
      };

      copy[targetIndex] = {
        ...copy[targetIndex],
        guard_id: tempId,
        guard_name: tempName,
        guard_code: tempCode,
        status: tempStatus
      };

      setRoster(copy);
    }
    setDraggedCell(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Checkpoint Point', 'Night Shift', 'Morning Shift', 'Evening Shift', 'Reserve'];
    const rows = locations.map(loc => {
      const line = [translateText(loc.locationName)];
      ['Night', 'Morning', 'Evening', 'Reserve'].forEach(s => {
        const match = roster.find(r => r.location_id === loc.id && r.shift === s);
        line.push(match?.guard_name ? `${translateText(match.guard_name)} (${match.guard_code})` : 'Vacant');
      });
      return line;
    });
    exportToCSV(`duty_roster_${activeDate}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('rosterMgmt')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('rosterMgmtSub')}</p>
        </div>

        <div className="flex items-center gap-2 no-print flex-wrap">
          <input 
            type="date" 
            value={activeDate}
            onChange={handleDateChange}
            className="px-3 py-2 text-sm rounded-lg border border-border bg-card"
          />
          <button 
            onClick={handleAutoAllocate}
            disabled={generating}
            className="px-3 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:brightness-105 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Calculating...' : t('autoAllocate')}</span>
          </button>
          <button 
            onClick={handleSaveRoster}
            disabled={saving}
            className="px-3 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : t('save')}</span>
          </button>
          <button 
            onClick={handleClearRoster}
            className="px-3 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center gap-1.5 shadow-sm"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear All</span>
          </button>
          <button 
            onClick={handlePrint}
            className="p-2 text-sm rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button 
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-2 no-print">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by checkpoint location name or assigned guard name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary focus:text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-sm text-muted-foreground">Loading duty grid...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-4">
          {/* TIMETABLE ROSTER GRID */}
          <div className="lg:col-span-3 overflow-x-auto">
            <table className="roster-table text-xs">
              <thead>
                <tr>
                  <th className="w-1/5">{t('locationNode')}</th>
                  <th>{t('nightShift')}</th>
                  <th>{t('morningShift')}</th>
                  <th>{t('eveningShift')}</th>
                  <th>{t('reserveGuard')}</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filteredLocations = locations.filter(loc => {
                    const query = searchQuery.toLowerCase();
                    const matchLoc = loc.locationName.toLowerCase().includes(query);
                    const matchGuard = roster.some(r => 
                      r.location_id === loc.id && 
                      r.guard_name && 
                      r.guard_name.toLowerCase().includes(query)
                    );
                    return matchLoc || matchGuard;
                  });
                  return filteredLocations.map(loc => {
                  const activeShifts = (loc.shift || 'Morning,Evening,Night').split(',');
                  const isLocLocked = !!lockedLocations[loc.id];
                  return (
                    <tr key={loc.id}>
                      <td className="font-bold text-foreground bg-muted/5 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className={isLocLocked ? "text-amber-500 line-through opacity-80" : ""}>
                            {translateText(loc.locationName)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleLocationLock(loc.id)}
                            title={isLocLocked ? "Unlock Checkpoint" : "Lock Checkpoint (Skip scheduling)"}
                            className="text-muted-foreground hover:text-foreground no-print focus:outline-none transition-all p-1"
                          >
                            {isLocLocked ? (
                              <Lock className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                            ) : (
                              <Unlock className="h-3.5 w-3.5 opacity-30 hover:opacity-100" />
                            )}
                          </button>
                        </div>
                      </td>
                      {['Night', 'Morning', 'Evening', 'Reserve'].map(s => {
                        const cell = roster.find(r => r.location_id === loc.id && r.shift === s);
                        const isActive = activeShifts.includes(s) || s === 'Reserve';
                        
                        if (!isActive) {
                          return <td key={s} className="bg-muted/10 text-muted-foreground/30 text-center">-</td>;
                        }

                        const isLocked = cell?.status === 'Locked';
                        const guardName = cell?.guard_name ? translateText(cell.guard_name) : '';
                        const hasGuard = !!cell?.guard_id;

                        let tdClass = 'status-vacant';
                        if (hasGuard) {
                          tdClass = isLocked ? 'status-locked font-semibold' : 'status-assigned cursor-grab active:cursor-grabbing';
                        }

                        return (
                          <td 
                            key={s}
                            className={`p-3 text-center transition-all ${tdClass}`}
                            onClick={() => handleOpenOverride(loc.id, s)}
                            draggable={hasGuard && !isLocked}
                            onDragStart={(e) => handleDragStart(e, loc.id, s)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, loc.id, s)}
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="flex-1 text-center font-medium">
                                {hasGuard ? `${guardName} (${cell.guard_code})` : 'Vacant'}
                              </span>
                              {hasGuard && (
                                <button 
                                  onClick={(e) => handleToggleLock(loc.id, s, e)}
                                  className="text-muted-foreground hover:text-foreground no-print"
                                >
                                  {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              })()}
              </tbody>
            </table>
          </div>

          {/* SIDEBAR SIDE CARDS */}
          <div className="space-y-4 no-print">
            {/* Conflict detections */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">⚠️ {t('conflictDetect')}</h4>
              <div className="space-y-2 max-h-[180px] overflow-y-auto">
                {conflicts.length === 0 ? (
                  <p className="text-xs text-emerald-600 font-medium bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 text-center">
                    {t('allClear')}
                  </p>
                ) : (
                  conflicts.map((c, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-600 font-medium">
                      {c.message}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Shortages */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">🚨 Shortages / Vacancies</h4>
              <div className="space-y-2 max-h-[180px] overflow-y-auto">
                {shortages.length === 0 ? (
                  <p className="text-xs text-emerald-600 font-medium bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 text-center">
                    {t('allStaffed')}
                  </p>
                ) : (
                  shortages.map((s, i) => (
                    <div key={i} className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-500 flex justify-between items-center">
                      <span><strong>{translateText(s.locationName)}</strong> - {s.shift}</span>
                      <button 
                        onClick={() => handleOpenOverride(s.locationId, s.shift)}
                        className="px-1.5 py-0.5 rounded bg-red-500 text-white font-bold text-[8px]"
                      >
                        Solve
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OVERRIDE MODAL DIALOG */}
      {showOverride && overrideLoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-md text-foreground">Manual Override</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Checkpoint: {translateText(overrideLoc.locationName)} ({overrideShift})
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground">Select Replacement Candidate</label>
              <input
                type="text"
                placeholder="Search candidates by name or code..."
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary focus:text-white placeholder-slate-500"
              />
              <select 
                value={overrideGuardId}
                onChange={(e) => setOverrideGuardId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-muted/20"
              >
                <option value="">-- Vacant / Unassigned --</option>
                {(() => {
                  const lockedGuardIds = roster
                    .filter(r => !(overrideLoc && r.location_id === overrideLoc.id && r.shift === overrideShift))
                    .filter(r => r.status === 'Locked')
                    .map(r => r.guard_id)
                    .filter(id => id !== null && id !== undefined);
                  
                  const query = candidateSearch.toLowerCase();
                  const filteredCandidates = candidates
                    .filter(c => !lockedGuardIds.includes(c.id))
                    .filter(c => c.name.toLowerCase().includes(query) || c.guardCode.toLowerCase().includes(query));

                  return filteredCandidates.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.guardCode})
                    </option>
                  ));
                })()}
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-2 text-xs">
              <button 
                onClick={() => setShowOverride(false)}
                className="px-3 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              {overrideGuardId && (
                <button 
                  onClick={handleClearOverride}
                  className="px-3 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear</span>
                </button>
              )}
              <button 
                onClick={handleApplyOverride}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* LOCK DURATION MODAL */}
      {lockModalCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-md text-foreground">Lock Guard Assignment</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select lock duration (1 to 6 days) for this guard's spot and shift.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map(days => (
                <button
                  key={days}
                  onClick={() => handleLockDurationSubmit(days)}
                  className="px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-muted/20 hover:bg-primary hover:text-white transition-all"
                >
                  {days} {days === 1 ? 'Day' : 'Days'}
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setLockModalCell(null)}
                className="px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM ALERT MODAL */}
      {customAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl p-6 shadow-2xl space-y-5 transform transition-all scale-100 duration-200 animate-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl shrink-0 ${
                customAlert.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                customAlert.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                'bg-primary/10 text-primary'
              }`}>
                {customAlert.type === 'success' ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : customAlert.type === 'warning' ? (
                  <AlertCircle className="h-6 w-6" />
                ) : (
                  <Info className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <h3 className="font-bold text-lg text-foreground leading-none">
                  {customAlert.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {customAlert.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setCustomAlert(null)}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:brightness-105 transition-all shadow-md focus:outline-none"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
