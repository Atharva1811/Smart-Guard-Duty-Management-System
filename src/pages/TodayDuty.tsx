import React, { useState, useEffect } from "react";
import { dbHub } from "../db/dbHub";
import type { Guard, Location, DayRoster } from "../db/mockDb";
import { timetableGenerator } from "../utils/timetableGenerator";
import type { ConflictRecord, ShortageRecord } from "../utils/timetableGenerator";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translateContent } from "../utils/translator";
import { 
  Lock, 
  RotateCcw, 
  RotateCw, 
  Sparkles, 
  Save, 
  AlertTriangle,
  ArrowRightLeft,
  X,
  Plus
} from "lucide-react";
import confetti from "canvas-confetti";

export const TodayDuty: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isReadOnly = user?.role === "Viewer";
  
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [guards, setGuards] = useState<Guard[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  
  // Roster states
  const [roster, setRoster] = useState<DayRoster>({});
  const [shortages, setShortages] = useState<ShortageRecord[]>([]);
  const [vacantLocations, setVacantLocations] = useState<string[]>([]);
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);

  // Undo/Redo Stacks
  const [undoStack, setUndoStack] = useState<DayRoster[]>([]);
  const [redoStack, setRedoStack] = useState<DayRoster[]>([]);

  // Editing state
  const [activeCell, setActiveCell] = useState<{ locationId: string; shift: 'Morning' | 'Evening' | 'Night' | 'Reserve' } | null>(null);
  const [replacementSuggestions, setReplacementSuggestions] = useState<Guard[]>([]);
  const [draggedGuard, setDraggedGuard] = useState<{ locationId: string; shift: 'Morning' | 'Evening' | 'Night' | 'Reserve'; guardId: string } | null>(null);

  // Load basic data
  useEffect(() => {
    setGuards(dbHub.getGuards());
    setLocations(dbHub.getLocations());
  }, []);

  // Load roster when selectedDate changes
  useEffect(() => {
    loadRosterForDate(selectedDate);
  }, [selectedDate, guards, locations]);

  const loadRosterForDate = (dateStr: string) => {
    const data = dbHub.getRosterForDate(dateStr);
    if (data) {
      setRoster(data.roster);
      // Re-run conflict detection on loaded roster to ensure freshness
      const currentConflicts = timetableGenerator.detectConflicts(dateStr, data.roster);
      setConflicts(currentConflicts);

      // Compute shortages
      const currentShortages: ShortageRecord[] = [];
      const vacant: string[] = [];
      locations.forEach(loc => {
        (['Morning', 'Evening', 'Night'] as const).forEach(shift => {
          if (loc.shiftRequirement[shift] && !data.roster[loc.id]?.[shift]?.guardId) {
            currentShortages.push({
              locationId: loc.id,
              locationName: loc.name,
              shift,
              required: 1,
              assigned: 0
            });
            vacant.push(loc.id);
          }
        });
      });
      setShortages(currentShortages);
      setVacantLocations(Array.from(new Set(vacant)));
    } else {
      // Initialize blank structure
      const blank: DayRoster = {};
      locations.forEach(loc => {
        blank[loc.id] = {
          Morning: { guardId: null, guardName: null, locked: false },
          Evening: { guardId: null, guardName: null, locked: false },
          Night: { guardId: null, guardName: null, locked: false },
          Reserve: { guardId: null, guardName: null, locked: false }
        };
      });
      setRoster(blank);
      setShortages([]);
      setVacantLocations([]);
      setConflicts([]);
    }
    // Clear stacks on date change
    setUndoStack([]);
    setRedoStack([]);
  };

  // Run the Smart Timetable Generator
  const handleAutoGenerate = () => {
    if (isReadOnly) return;
    
    // Generate schedule, passing current roster to preserve UI-locked cells
    const result = timetableGenerator.generateRoster(selectedDate, user?.username || "supervisor", roster);
    
    // Save to history
    pushToUndoStack(roster);
    setRoster(result.roster);
    setShortages(result.shortages);
    setVacantLocations(result.vacantLocations);
    setConflicts(result.conflicts);
    setRedoStack([]);

    // Celebrate successful generation with confetti
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 }
    });
  };

  // Undo / Redo management
  const pushToUndoStack = (state: DayRoster) => {
    setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(state))]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, JSON.parse(JSON.stringify(roster))]);
    updateRosterState(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(roster))]);
    updateRosterState(next);
  };

  const updateRosterState = (newRoster: DayRoster) => {
    setRoster(newRoster);
    const currentConflicts = timetableGenerator.detectConflicts(selectedDate, newRoster);
    setConflicts(currentConflicts);

    // Shortages
    const currentShortages: ShortageRecord[] = [];
    const vacant: string[] = [];
    locations.forEach(loc => {
      (['Morning', 'Evening', 'Night'] as const).forEach(shift => {
        if (loc.shiftRequirement[shift] && !newRoster[loc.id]?.[shift]?.guardId) {
          currentShortages.push({
            locationId: loc.id,
            locationName: loc.name,
            shift,
            required: 1,
            assigned: 0
          });
          vacant.push(loc.id);
        }
      });
    });
    setShortages(currentShortages);
    setVacantLocations(Array.from(new Set(vacant)));
  };

  // Cell Locks
  const toggleCellLock = (locId: string, shift: 'Morning' | 'Evening' | 'Night' | 'Reserve') => {
    if (isReadOnly) return;
    const cell = roster[locId]?.[shift];
    if (!cell || !cell.guardId) return; // Cannot lock empty cell

    pushToUndoStack(roster);
    const updated = { ...roster };
    updated[locId][shift].locked = !cell.locked;
    setRoster(updated);
    dbHub.addAuditLog(user?.username || "system", "Lock Toggle", `${cell.locked ? "Unlocked" : "Locked"} cell for ${locId} (${shift})`);
  };

  // Save current schedule
  const handleSaveRoster = async () => {
    if (isReadOnly) return;
    await dbHub.saveRosterForDate(selectedDate, roster, shortages, vacantLocations, user?.username || "supervisor");
    alert("Duty schedule successfully synced and saved.");
  };

  // Click cell to edit reassignments
  const handleCellClick = (locId: string, shift: 'Morning' | 'Evening' | 'Night' | 'Reserve') => {
    if (isReadOnly) return;
    const cell = roster[locId]?.[shift];
    if (cell && cell.locked) return; // Cannot reassign locked cell

    setActiveCell({ locationId: locId, shift });
    const suggestions = timetableGenerator.getReplacementSuggestions(selectedDate, locId, shift === 'Reserve' ? 'Morning' : shift);
    setReplacementSuggestions(suggestions);
  };

  const handleSelectReplacement = (guardId: string | null) => {
    if (!activeCell) return;
    pushToUndoStack(roster);

    const { locationId, shift } = activeCell;
    const updated = { ...roster };

    if (guardId === null) {
      // Clear cell
      updated[locationId][shift] = { guardId: null, guardName: null, locked: false };
    } else {
      const guard = guards.find(g => g.id === guardId);
      if (guard) {
        updated[locationId][shift] = {
          guardId: guard.id,
          guardName: guard.name,
          locked: false
        };
      }
    }

    updateRosterState(updated);
    setActiveCell(null);
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, locId: string, shift: 'Morning' | 'Evening' | 'Night' | 'Reserve', guardId: string) => {
    if (isReadOnly) {
      e.preventDefault();
      return;
    }
    const cell = roster[locId]?.[shift];
    if (cell?.locked) {
      e.preventDefault();
      return;
    }
    setDraggedGuard({ locationId: locId, shift, guardId });
  };

  const handleDragOver = (e: React.DragEvent, _locId: string, _shift: 'Morning' | 'Evening' | 'Night' | 'Reserve') => {
    e.preventDefault(); // Required to allow drop
  };

  const handleDrop = (e: React.DragEvent, targetLocId: string, targetShift: 'Morning' | 'Evening' | 'Night' | 'Reserve') => {
    e.preventDefault();
    if (!draggedGuard || isReadOnly) return;

    const targetCell = roster[targetLocId]?.[targetShift];
    if (targetCell?.locked) return;

    // Perform swap or assign
    pushToUndoStack(roster);
    const updated = { ...roster };
    
    const sourceCell = updated[draggedGuard.locationId][draggedGuard.shift];
    const targetCellCopy = { ...updated[targetLocId][targetShift] };

    // Swap data
    updated[targetLocId][targetShift] = {
      guardId: sourceCell.guardId,
      guardName: sourceCell.guardName,
      locked: false
    };

    updated[draggedGuard.locationId][draggedGuard.shift] = {
      guardId: targetCellCopy.guardId,
      guardName: targetCellCopy.guardName,
      locked: false
    };

    updateRosterState(updated);
    setDraggedGuard(null);
  };

  const getCellColorClass = (locId: string, shift: 'Morning' | 'Evening' | 'Night' | 'Reserve', isRequired: boolean) => {
    const cell = roster[locId]?.[shift];
    if (!isRequired && (!cell || !cell.guardId)) return "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-750"; // Not required, empty
    
    if (!cell || !cell.guardId) return "status-vacant font-bold animate-pulse"; // Red vacant
    if (cell.locked) return "status-locked font-semibold"; // Blue locked
    return "status-assigned font-medium hover:scale-[1.01]"; // Green assigned
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("rosterMgmt")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("rosterMgmtSub")}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Picker */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3.5 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
            />
          </div>

          {!isReadOnly && (
            <>
              {/* Undo / Redo */}
              <div className="flex rounded-lg border border-border bg-card overflow-hidden">
                <button
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                  className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
                  title="Undo Change"
                >
                  <RotateCcw className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className="p-2 border-l border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
                  title="Redo Change"
                >
                  <RotateCw className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Generate timetable */}
              <button
                onClick={handleAutoGenerate}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-650 text-white font-semibold text-sm shadow-md hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Sparkles className="h-4.5 w-4.5" />
                <span>{t("autoAllocate")}</span>
              </button>

              {/* Save Roster */}
              <button
                onClick={handleSaveRoster}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Save className="h-4.5 w-4.5" />
                <span>{t("save")}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Excel-like roster table */}
      <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse roster-grid-table">
            <thead>
              <tr className="bg-muted/40 text-muted-foreground font-semibold">
                <th className="text-left w-64">{t("locationNode")}</th>
                <th>{t("morningShift")}</th>
                <th>{t("eveningShift")}</th>
                <th>{t("nightShift")}</th>
                <th>{t("reserveGuard")}</th>
                {!isReadOnly && <th className="w-20">{t("lock")}</th>}
              </tr>
            </thead>
            <tbody>
              {locations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">No duty locations configured.</td>
                </tr>
              ) : (
                locations.map(loc => (
                  <tr key={loc.id} className="hover:bg-muted/10 transition-colors">
                    {/* Location Cell */}
                    <td className="text-left font-semibold text-foreground bg-muted/5 pr-4 border-r border-border">
                      <div className="flex flex-col">
                        <span>{translateContent(loc.name, language)}</span>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${loc.priority === 'High' ? 'bg-rose-500/10 text-rose-500' : loc.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-500'}`}>
                            {translateContent(loc.priority, language)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{translateContent(loc.indoorOutdoor, language)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Morning Shift */}
                    <td
                      onClick={() => handleCellClick(loc.id, "Morning")}
                      onDragOver={(e) => handleDragOver(e, loc.id, "Morning")}
                      onDrop={(e) => handleDrop(e, loc.id, "Morning")}
                      className={`${getCellColorClass(loc.id, "Morning", loc.shiftRequirement.Morning)} cursor-pointer relative`}
                    >
                      {roster[loc.id]?.Morning?.guardId ? (
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, loc.id, "Morning", roster[loc.id].Morning.guardId!)}
                          className="flex items-center justify-center gap-1 cursor-grab"
                        >
                          <span className="truncate">{translateContent(roster[loc.id].Morning.guardName, language)}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] opacity-70">{loc.shiftRequirement.Morning ? t("vacantSpots") : "Off Duty"}</span>
                      )}
                    </td>

                    {/* Evening Shift */}
                    <td
                      onClick={() => handleCellClick(loc.id, "Evening")}
                      onDragOver={(e) => handleDragOver(e, loc.id, "Evening")}
                      onDrop={(e) => handleDrop(e, loc.id, "Evening")}
                      className={`${getCellColorClass(loc.id, "Evening", loc.shiftRequirement.Evening)} cursor-pointer`}
                    >
                      {roster[loc.id]?.Evening?.guardId ? (
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, loc.id, "Evening", roster[loc.id].Evening.guardId!)}
                          className="flex items-center justify-center gap-1 cursor-grab"
                        >
                          <span className="truncate">{translateContent(roster[loc.id].Evening.guardName, language)}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] opacity-70">{loc.shiftRequirement.Evening ? t("vacantSpots") : "Off Duty"}</span>
                      )}
                    </td>

                    {/* Night Shift */}
                    <td
                      onClick={() => handleCellClick(loc.id, "Night")}
                      onDragOver={(e) => handleDragOver(e, loc.id, "Night")}
                      onDrop={(e) => handleDrop(e, loc.id, "Night")}
                      className={`${getCellColorClass(loc.id, "Night", loc.shiftRequirement.Night)} cursor-pointer`}
                    >
                      {roster[loc.id]?.Night?.guardId ? (
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, loc.id, "Night", roster[loc.id].Night.guardId!)}
                          className="flex items-center justify-center gap-1 cursor-grab"
                        >
                          <span className="truncate">{translateContent(roster[loc.id].Night.guardName, language)}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] opacity-70">{loc.shiftRequirement.Night ? t("vacantSpots") : "Off Duty"}</span>
                      )}
                    </td>

                    {/* Reserve Guard */}
                    <td
                      onClick={() => handleCellClick(loc.id, "Reserve")}
                      onDragOver={(e) => handleDragOver(e, loc.id, "Reserve")}
                      onDrop={(e) => handleDrop(e, loc.id, "Reserve")}
                      className={`${getCellColorClass(loc.id, "Reserve", loc.priority === "High")} cursor-pointer`}
                    >
                      {roster[loc.id]?.Reserve?.guardId ? (
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, loc.id, "Reserve", roster[loc.id].Reserve.guardId!)}
                          className="flex items-center justify-center gap-1 cursor-grab text-slate-600 dark:text-slate-300"
                        >
                          <span className="truncate">{translateContent(roster[loc.id].Reserve.guardName, language)}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] opacity-40">None</span>
                      )}
                    </td>

                    {/* Lock Controls */}
                    {!isReadOnly && (
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => toggleCellLock(loc.id, "Morning")}
                            disabled={!roster[loc.id]?.Morning?.guardId}
                            className={`p-1 rounded hover:bg-muted ${roster[loc.id]?.Morning?.locked ? "text-indigo-500" : "text-muted-foreground opacity-30"}`}
                            title="Toggle Morning Lock"
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => toggleCellLock(loc.id, "Evening")}
                            disabled={!roster[loc.id]?.Evening?.guardId}
                            className={`p-1 rounded hover:bg-muted ${roster[loc.id]?.Evening?.locked ? "text-indigo-500" : "text-muted-foreground opacity-30"}`}
                            title="Toggle Evening Lock"
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => toggleCellLock(loc.id, "Night")}
                            disabled={!roster[loc.id]?.Night?.guardId}
                            className={`p-1 rounded hover:bg-muted ${roster[loc.id]?.Night?.locked ? "text-indigo-500" : "text-muted-foreground opacity-30"}`}
                            title="Toggle Night Lock"
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Allocation Drawer */}
      {activeCell && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border rounded-xl shadow-xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
                <span>Swap / Assign Guard</span>
              </h3>
              <button onClick={() => setActiveCell(null)} className="p-1 rounded hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Assign guard to {locations.find(l => l.id === activeCell.locationId)?.name} for the <span className="font-semibold text-primary">{activeCell.shift}</span> shift.
            </p>

            <div className="space-y-4">
              {/* Clear Option */}
              <button
                onClick={() => handleSelectReplacement(null)}
                className="w-full flex items-center justify-center p-2.5 rounded-lg border border-dashed border-border hover:bg-rose-500/5 hover:text-rose-500 hover:border-rose-500/30 text-xs font-semibold transition-colors"
              >
                Clear Roster Slot
              </button>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Suggested Replacements (Conflict-Free)</p>
                {replacementSuggestions.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-lg text-center">No available guards without conflicts found.</p>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {replacementSuggestions.map(g => (
                      <button
                        key={g.id}
                        onClick={() => handleSelectReplacement(g.id)}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/10 hover:bg-primary/5 hover:border-primary text-xs font-medium text-left transition-all"
                      >
                        <div>
                          <p className="font-bold text-foreground">{g.name}</p>
                          <span className="text-[10px] text-muted-foreground">Exp: {g.experience} yrs | Pref: {g.shiftPreference}</span>
                        </div>
                        <Plus className="h-4 w-4 text-primary opacity-60" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* All Guards option */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Assign Any Guard (Force Override)</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {guards
                    .filter(g => !replacementSuggestions.some(r => r.id === g.id))
                    .map(g => (
                      <button
                        key={g.id}
                        onClick={() => handleSelectReplacement(g.id)}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-amber-500/5 hover:border-amber-500/30 text-xs font-medium text-left transition-all"
                      >
                        <div>
                          <p className="font-bold text-foreground">{g.name}</p>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400">Forces assignment (may raise conflict)</span>
                        </div>
                        <Plus className="h-4 w-4 text-amber-500 opacity-60" />
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warnings & Conflicts list */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Conflict Warnings */}
        <div className="border border-border rounded-xl bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            <h3 className="font-bold text-base text-foreground">{t("conflictDetect")}</h3>
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {conflicts.length === 0 ? (
              <p className="text-xs text-muted-foreground italic bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg text-center">
                {t("allClear")}
              </p>
            ) : (
              conflicts.map((c, idx) => (
                <div key={idx} className="flex gap-2.5 p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-xs text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{c.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Shortages & suggestions */}
        <div className="border border-border rounded-xl bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="font-bold text-base text-foreground">{t("shortagesVacancies")}</h3>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {shortages.length === 0 ? (
              <p className="text-xs text-muted-foreground italic bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg text-center">
                {t("allStaffed")}
              </p>
            ) : (
              shortages.map((s, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs">
                  <div>
                    <span className="font-bold text-foreground">{s.locationName}</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Shift: {s.shift} (Needs 1 guard)</p>
                  </div>
                  <button 
                    onClick={() => handleCellClick(s.locationId, s.shift)}
                    className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold transition-colors"
                  >
                    {t("solveVacancy")}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
