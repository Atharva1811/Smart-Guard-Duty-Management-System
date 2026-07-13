import React, { useState, useEffect } from "react";
import { dbHub } from "../db/dbHub";
import type { Guard, Location } from "../db/mockDb";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translateContent } from "../utils/translator";
import { useForm } from "react-hook-form";
import { Plus, Search, Edit2, Trash2, X, ShieldAlert, Upload, ClipboardList } from "lucide-react";

export const Guards: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isReadOnly = false;
  
  const [guards, setGuards] = useState<Guard[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  
  // Search/Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [shiftFilter, setShiftFilter] = useState("All");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedGuards, setSelectedGuards] = useState<string[]>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditFields, setBulkEditFields] = useState({
    department: { enabled: false, value: "Corporate Security" },
    shiftPreference: { enabled: false, value: "Any" as const },
    weeklyOff: { enabled: false, value: 0 },
    status: { enabled: false, value: "Available" as const }
  });
  const [editingGuard, setEditingGuard] = useState<Guard | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkNames, setBulkNames] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Guard>({
    defaultValues: {
      id: "",
      name: "",
      phone: "",
      age: 30,
      experience: 5,
      department: "Corporate Security",
      shiftPreference: "Any",
      preferredLocations: [],
      restrictedLocations: [],
      weeklyOff: 0,
      maxConsecutiveDuties: 5,
      maxNightShifts: 2,
      status: "Available"
    }
  });

  useEffect(() => {
    setGuards(dbHub.getGuards());
    setLocations(dbHub.getLocations());
  }, []);

  const reloadGuards = () => {
    setGuards(dbHub.getGuards());
  };

  const handleBulkEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || selectedGuards.length === 0) return;
    const updated = guards.map(g => {
      if (selectedGuards.includes(g.id)) {
        const copy = { ...g };
        if (bulkEditFields.department.enabled) copy.department = bulkEditFields.department.value;
        if (bulkEditFields.shiftPreference.enabled) copy.shiftPreference = bulkEditFields.shiftPreference.value;
        if (bulkEditFields.weeklyOff.enabled) copy.weeklyOff = Number(bulkEditFields.weeklyOff.value);
        if (bulkEditFields.status.enabled) copy.status = bulkEditFields.status.value;
        return copy;
      }
      return g;
    });
    await dbHub.saveGuards(updated);
    dbHub.addAuditLog(user?.username || "system", "Guards Bulk Edited", `Edited ${selectedGuards.length} guards`);
    reloadGuards();
    setSelectedGuards([]);
    setShowBulkEditModal(false);
    alert(`Successfully updated ${selectedGuards.length} guards.`);
  };

  const handleBulkDelete = async () => {
    if (isReadOnly || selectedGuards.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedGuards.length} selected guards?`)) {
      const updated = guards.filter(g => !selectedGuards.includes(g.id));
      await dbHub.saveGuards(updated);
      dbHub.addAuditLog(user?.username || "system", "Guards Bulk Deleted", `Deleted ${selectedGuards.length} guards`);
      reloadGuards();
      setSelectedGuards([]);
      alert(`Successfully deleted ${selectedGuards.length} guards.`);
    }
  };

  // Open modal for adding
  const handleAddClick = () => {
    setEditingGuard(null);
    reset({
      id: "G" + String(guards.length + 1).padStart(3, "0"),
      name: "",
      phone: "",
      age: 30,
      experience: 5,
      department: "Corporate Security",
      shiftPreference: "Any",
      preferredLocations: [],
      restrictedLocations: [],
      weeklyOff: 0,
      maxConsecutiveDuties: 5,
      maxNightShifts: 2,
      status: "Available"
    });
    setShowModal(true);
  };

  // Open modal for editing
  const handleEditClick = (guard: Guard) => {
    setEditingGuard(guard);
    reset(guard);
    setShowModal(true);
  };

  // Delete guard
  const handleDeleteClick = async (guardId: string) => {
    if (isReadOnly) return;
    if (confirm("Are you sure you want to remove this guard profile from the system?")) {
      const updated = guards.filter(g => g.id !== guardId);
      await dbHub.saveGuards(updated);
      dbHub.addAuditLog(user?.username || "system", "Guard Deleted", `Removed guard profile ID ${guardId}`);
      reloadGuards();
    }
  };

  // Save form
  const onSubmit = async (data: Guard) => {
    if (isReadOnly) return;
    const updated = [...guards];
    
    // Parse numeric fields
    data.age = Number(data.age);
    data.experience = Number(data.experience);
    data.weeklyOff = Number(data.weeklyOff);
    data.maxConsecutiveDuties = Number(data.maxConsecutiveDuties);
    data.maxNightShifts = Number(data.maxNightShifts);

    // Make sure arrays are parsed correctly if coming from multi-selects
    // (normally react-hook-form handles array value directly)
    if (typeof data.preferredLocations === "string") {
      data.preferredLocations = [data.preferredLocations];
    }
    if (typeof data.restrictedLocations === "string") {
      data.restrictedLocations = [data.restrictedLocations];
    }

    if (editingGuard) {
      // Edit
      const idx = updated.findIndex(g => g.id === editingGuard.id);
      if (idx !== -1) {
        updated[idx] = data;
        dbHub.addAuditLog(user?.username || "system", "Guard Edited", `Updated guard profile ${data.name} (ID: ${data.id})`);
      }
    } else {
      // Add
      // Check duplicate ID
      if (updated.some(g => g.id === data.id)) {
        alert("Guard ID already exists. Please choose a unique ID.");
        return;
      }
      updated.push(data);
      dbHub.addAuditLog(user?.username || "system", "Guard Created", `Added new guard profile ${data.name} (ID: ${data.id})`);
    }

    await dbHub.saveGuards(updated);
    reloadGuards();
    setShowModal(false);
  };

  const handleBulkImport = async () => {
    if (isReadOnly) return;
    if (!bulkNames.trim()) return;

    const names = bulkNames
      .split("\n")
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (names.length === 0) return;

    const updated = [...guards];

    // Find highest current Gxxx numerical ID to auto-increment
    let nextNum = 1;
    updated.forEach(g => {
      const match = g.id.match(/^G(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= nextNum) {
          nextNum = num + 1;
        }
      }
    });

    names.forEach(name => {
      const formattedId = `G${String(nextNum).padStart(3, "0")}`;
      nextNum++;

      const newGuard: Guard = {
        id: formattedId,
        name,
        phone: "",
        age: 30,
        experience: 1,
        department: "Corporate Security",
        shiftPreference: "Any",
        preferredLocations: [],
        restrictedLocations: [],
        weeklyOff: 0,
        maxConsecutiveDuties: 5,
        maxNightShifts: 2,
        status: "Available"
      };
      updated.push(newGuard);
    });

    await dbHub.saveGuards(updated);
    dbHub.addAuditLog(user?.username || "system", "Guards Bulk Imported", `Imported ${names.length} guard profiles with sequential IDs`);
    
    reloadGuards();
    setBulkNames("");
    setShowBulkModal(false);
    alert(`Successfully imported ${names.length} guards.`);
  };

  // Filter guards
  const filteredGuards = guards.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase()) || 
                          g.id.toLowerCase().includes(search.toLowerCase()) ||
                          g.department.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || g.status === statusFilter;
    const matchesShift = shiftFilter === "All" || g.shiftPreference === shiftFilter;
    
    return matchesSearch && matchesStatus && matchesShift;
  });

  const getStatusColor = (status: Guard["status"]) => {
    switch (status) {
      case "Available": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "Leave": return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "Absent": return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
      case "Training": return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
      case "Medical": return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      default: return "bg-slate-500/10 text-slate-500";
    }
  };

  const getDayName = (dayNum: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dayNum] || "Sunday";
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("guardsTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("guardsSub")}</p>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground font-semibold text-sm shadow-sm transition-all"
            >
              <Upload className="h-4.5 w-4.5" />
              <span>{t("bulkImport")}</span>
            </button>
            <button
              onClick={handleAddClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>{t("addGuard")}</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter panel */}
      <div className="grid gap-4 md:grid-cols-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("searchGuards")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Leave">Leave</option>
            <option value="Absent">Absent</option>
            <option value="Training">Training</option>
            <option value="Medical">Medical</option>
          </select>
        </div>

        {/* Shift Filter */}
        <div>
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          >
            <option value="All">All Shift Preferences</option>
            <option value="Morning">Morning</option>
            <option value="Evening">Evening</option>
            <option value="Night">Night</option>
            <option value="Any">Any</option>
          </select>
        </div>
      </div>

      {/* Selection Summary Bar */}
      {selectedGuards.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs text-foreground shadow-sm">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              checked={selectedGuards.length === filteredGuards.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedGuards(filteredGuards.map(g => g.id));
                } else {
                  setSelectedGuards([]);
                }
              }}
              className="h-4 w-4 rounded border-border bg-muted/20 text-primary focus:ring-primary cursor-pointer"
            />
            <span className="font-semibold">{selectedGuards.length} guards selected</span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowBulkEditModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs transition-colors"
            >
              Bulk Edit
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive hover:bg-destructive/95 text-destructive-foreground font-semibold text-xs transition-colors"
            >
              Bulk Delete
            </button>
          </div>
        </div>
      )}

      {selectedGuards.length === 0 && filteredGuards.length > 0 && (
        <div className="flex justify-end select-none">
          <button
            onClick={() => setSelectedGuards(filteredGuards.map(g => g.id))}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Select All Filtered ({filteredGuards.length})
          </button>
        </div>
      )}

      {/* Roster Cards List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredGuards.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
            No guards match the selected search criteria.
          </div>
        ) : (
          filteredGuards.map(guard => (
            <div key={guard.id} className="border border-border rounded-xl bg-card shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] pointer-events-none group-hover:bg-primary/10 transition-colors" />
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {!isReadOnly && (
                      <input 
                        type="checkbox"
                        checked={selectedGuards.includes(guard.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGuards(prev => [...prev, guard.id]);
                          } else {
                            setSelectedGuards(prev => prev.filter(id => id !== guard.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-border bg-muted/20 text-primary focus:ring-primary cursor-pointer"
                      />
                    )}
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                      {guard.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{translateContent(guard.name, language)}</h3>
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase">{guard.id}</span>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(guard.status)}`}>
                    {translateContent(guard.status, language)}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-muted-foreground border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span>Department:</span>
                    <span className="font-medium text-foreground">{translateContent(guard.department, language)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shift Preference:</span>
                    <span className="font-medium text-foreground">{translateContent(guard.shiftPreference, language)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weekly Off:</span>
                    <span className="font-medium text-foreground">{translateContent(getDayName(guard.weeklyOff), language)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Experience:</span>
                    <span className="font-medium text-foreground">{guard.experience} years (Age: {guard.age})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Limits:</span>
                    <span className="font-medium text-foreground">Max Night: {guard.maxNightShifts} / Max Cons: {guard.maxConsecutiveDuties}</span>
                  </div>
                  
                  {guard.preferredLocations.length > 0 && (
                    <div className="flex justify-between">
                      <span>Pref Locations:</span>
                      <span className="font-medium text-foreground truncate max-w-[150px]" title={guard.preferredLocations.join(", ")}>
                        {guard.preferredLocations.join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {!isReadOnly && (
                <div className="flex gap-2 mt-5 border-t border-border pt-4">
                  <button
                    onClick={() => handleEditClick(guard)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(guard.id)}
                    className="p-1.5 rounded-lg border border-border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Edit/Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                <span>{editingGuard ? "Edit Guard Profile" : "Create New Guard Profile"}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Guard ID</label>
                  <input
                    type="text"
                    {...register("id", { required: "Guard ID is required" })}
                    disabled={!!editingGuard}
                    placeholder="G016"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground disabled:opacity-50"
                  />
                  {errors.id && <p className="text-rose-500 text-[10px] mt-1">{errors.id.message}</p>}
                </div>
                <div>
                  <label className="block font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    {...register("name", { required: "Full name is required" })}
                    placeholder="e.g. Samuel Jackson"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground"
                  />
                  {errors.name && <p className="text-rose-500 text-[10px] mt-1">{errors.name.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    {...register("phone")}
                    placeholder="+1 555-0199"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    {...register("department", { required: "Department is required" })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Age (Years)</label>
                  <input
                    type="number"
                    {...register("age", { valueAsNumber: true })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    {...register("experience", { valueAsNumber: true })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Shift Preference</label>
                  <select
                    {...register("shiftPreference")}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground"
                  >
                    <option value="Any">Any Shift</option>
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Weekly Off Day</label>
                  <select
                    {...register("weeklyOff", { valueAsNumber: true })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground"
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Max Consecutive Shifts</label>
                  <input
                    type="number"
                    {...register("maxConsecutiveDuties", { valueAsNumber: true })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Max Night Shifts / Week</label>
                  <input
                    type="number"
                    {...register("maxNightShifts", { valueAsNumber: true })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Preferred Locations</label>
                  <select
                    multiple
                    {...register("preferredLocations")}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground h-20"
                  >
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Hold Ctrl to select multiple</p>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Restricted Locations</label>
                  <select
                    multiple
                    {...register("restrictedLocations")}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground h-20"
                  >
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Hold Ctrl to select multiple</p>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Current Base Status</label>
                <select
                  {...register("status")}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground"
                >
                  <option value="Available">Available</option>
                  <option value="Leave">Leave</option>
                  <option value="Absent">Absent</option>
                  <option value="Training">Training</option>
                  <option value="Medical">Medical</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs transition-colors"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg relative text-foreground">
            <button 
              onClick={() => {
                setShowBulkModal(false);
                setBulkNames("");
              }}
              className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Bulk Upload Guard Names</h3>
                <p className="text-xs text-muted-foreground">Import multiple profiles at once with sequential IDs.</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* File Upload Option */}
              <div className="border border-dashed border-border rounded-lg p-4 bg-muted/15 flex flex-col items-center justify-center text-center">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs font-semibold">Upload Names List File</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Drag & drop or select a .txt or .csv list of names</p>
                <input 
                  type="file"
                  accept=".txt,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      const text = evt.target?.result;
                      if (typeof text === "string") {
                        setBulkNames(text);
                      }
                    };
                    reader.readAsText(file);
                  }}
                  className="mt-3 text-xs w-full max-w-xs text-muted-foreground file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                />
              </div>

              {/* Copy/Paste text area */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Or Paste Names (One name per line)
                </label>
                <textarea
                  value={bulkNames}
                  onChange={(e) => setBulkNames(e.target.value)}
                  placeholder="John Doe&#10;Jane Smith&#10;Robert Johnson"
                  className="w-full h-44 px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50 resize-none font-sans"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Guards will be automatically assigned sequential numerical IDs (e.g. G011, G012...)
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkModal(false);
                    setBulkNames("");
                  }}
                  className="flex-1 py-2.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={!bulkNames.trim()}
                  className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/95 disabled:bg-primary/50 text-primary-foreground font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4.5 w-4.5" />
                  Import ({bulkNames.split("\n").filter(n => n.trim().length > 0).length} guards)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg relative text-foreground">
            <button 
              onClick={() => setShowBulkEditModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Bulk Edit Guards</h3>
                <p className="text-xs text-muted-foreground">Modify specific fields for {selectedGuards.length} selected profiles.</p>
              </div>
            </div>

            <form onSubmit={handleBulkEditSubmit} className="space-y-4 text-xs">
              {/* Department */}
              <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/10">
                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={bulkEditFields.department.enabled}
                    onChange={(e) => setBulkEditFields(prev => ({ ...prev, department: { ...prev.department, enabled: e.target.checked } }))}
                    className="h-4.5 w-4.5 rounded border-border text-primary"
                  />
                  <span>Change Department</span>
                </label>
                {bulkEditFields.department.enabled && (
                  <input 
                    type="text"
                    value={bulkEditFields.department.value}
                    onChange={(e) => setBulkEditFields(prev => ({ ...prev, department: { ...prev.department, value: e.target.value } }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
                    placeholder="Enter department name..."
                  />
                )}
              </div>

              {/* Shift Preference */}
              <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/10">
                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={bulkEditFields.shiftPreference.enabled}
                    onChange={(e) => setBulkEditFields(prev => ({ ...prev, shiftPreference: { ...prev.shiftPreference, enabled: e.target.checked } }))}
                    className="h-4.5 w-4.5 rounded border-border text-primary"
                  />
                  <span>Change Shift Preference</span>
                </label>
                {bulkEditFields.shiftPreference.enabled && (
                  <select 
                    value={bulkEditFields.shiftPreference.value}
                    onChange={(e) => setBulkEditFields(prev => ({ ...prev, shiftPreference: { ...prev.shiftPreference, value: e.target.value as any } }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
                  >
                    <option value="Any">Any Shift</option>
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                )}
              </div>

              {/* Weekly Off Day */}
              <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/10">
                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={bulkEditFields.weeklyOff.enabled}
                    onChange={(e) => setBulkEditFields(prev => ({ ...prev, weeklyOff: { ...prev.weeklyOff, enabled: e.target.checked } }))}
                    className="h-4.5 w-4.5 rounded border-border text-primary"
                  />
                  <span>Change Weekly Off Day</span>
                </label>
                {bulkEditFields.weeklyOff.enabled && (
                  <select 
                    value={bulkEditFields.weeklyOff.value}
                    onChange={(e) => setBulkEditFields(prev => ({ ...prev, weeklyOff: { ...prev.weeklyOff, value: Number(e.target.value) } }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/10">
                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={bulkEditFields.status.enabled}
                    onChange={(e) => setBulkEditFields(prev => ({ ...prev, status: { ...prev.status, enabled: e.target.checked } }))}
                    className="h-4.5 w-4.5 rounded border-border text-primary"
                  />
                  <span>Change Availability Status</span>
                </label>
                {bulkEditFields.status.enabled && (
                  <select 
                    value={bulkEditFields.status.value}
                    onChange={(e) => setBulkEditFields(prev => ({ ...prev, status: { ...prev.status, value: e.target.value as any } }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
                  >
                    <option value="Available">Available</option>
                    <option value="Leave">Leave</option>
                    <option value="Absent">Absent</option>
                    <option value="Training">Training</option>
                    <option value="Medical">Medical</option>
                  </select>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setShowBulkEditModal(false)}
                  className="flex-1 py-2 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!Object.values(bulkEditFields).some(f => f.enabled)}
                  className="flex-1 py-2 rounded-lg bg-primary hover:bg-primary/95 disabled:bg-primary/50 text-primary-foreground font-semibold text-xs transition-colors"
                >
                  Apply to {selectedGuards.length} guards
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
