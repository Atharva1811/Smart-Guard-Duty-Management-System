import React, { useState, useEffect } from "react";
import { dbHub } from "../db/dbHub";
import type { Location } from "../db/mockDb";
import { useAuth } from "../context/AuthContext";
import { useForm } from "react-hook-form";
import { Plus, Search, Edit2, Trash2, X, MapPin, ShieldAlert } from "lucide-react";

export const Locations: React.FC = () => {
  const { user } = useAuth();
  const isReadOnly = user?.role === "Viewer";
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Location>({
    defaultValues: {
      id: "",
      name: "",
      priority: "Medium",
      guardsRequired: 1,
      shiftRequirement: {
        Morning: true,
        Evening: true,
        Night: false
      },
      indoorOutdoor: "Indoor",
      securityLevel: "Standard",
      specialSkillsRequired: [],
      availableTime: "24/7",
      notes: ""
    }
  });

  useEffect(() => {
    setLocations(dbHub.getLocations());
  }, []);

  const reloadLocations = () => {
    setLocations(dbHub.getLocations());
  };

  const handleAddClick = () => {
    setEditingLocation(null);
    reset({
      id: "L" + String(locations.length + 1).padStart(3, "0"),
      name: "",
      priority: "Medium",
      guardsRequired: 1,
      shiftRequirement: {
        Morning: true,
        Evening: true,
        Night: false
      },
      indoorOutdoor: "Indoor",
      securityLevel: "Standard",
      specialSkillsRequired: [],
      availableTime: "24/7",
      notes: ""
    });
    setShowModal(true);
  };

  const handleEditClick = (loc: Location) => {
    setEditingLocation(loc);
    reset(loc);
    setShowModal(true);
  };

  const handleDeleteClick = async (locId: string) => {
    if (isReadOnly) return;
    if (confirm("Are you sure you want to delete this duty location?")) {
      const updated = locations.filter(l => l.id !== locId);
      await dbHub.saveLocations(updated);
      dbHub.addAuditLog(user?.username || "system", "Location Deleted", `Removed duty location ID ${locId}`);
      reloadLocations();
    }
  };

  const onSubmit = async (data: Location) => {
    if (isReadOnly) return;
    const updated = [...locations];
    
    // Parse numbers
    data.guardsRequired = Number(data.guardsRequired);
    
    // Skill tags parse
    if (typeof data.specialSkillsRequired === "string") {
      data.specialSkillsRequired = (data.specialSkillsRequired as string)
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }

    if (editingLocation) {
      const idx = updated.findIndex(l => l.id === editingLocation.id);
      if (idx !== -1) {
        updated[idx] = data;
        dbHub.addAuditLog(user?.username || "system", "Location Edited", `Updated location ${data.name} (ID: ${data.id})`);
      }
    } else {
      if (updated.some(l => l.id === data.id)) {
        alert("Location ID already exists. Please choose a unique ID.");
        return;
      }
      updated.push(data);
      dbHub.addAuditLog(user?.username || "system", "Location Created", `Created location ${data.name} (ID: ${data.id})`);
    }

    await dbHub.saveLocations(updated);
    reloadLocations();
    setShowModal(false);
  };

  const filteredLocations = locations.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || 
                          l.id.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter === "All" || l.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const getPriorityColor = (priority: Location["priority"]) => {
    switch (priority) {
      case "High": return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
      case "Medium": return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "Low": return "bg-slate-500/10 text-slate-500";
      default: return "bg-slate-500/10 text-slate-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Duty Locations Config</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure duty posts, shift requirements, and security levels.</p>
        </div>

        {!isReadOnly && (
          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Location</span>
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="grid gap-4 md:grid-cols-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by ID or Location Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
        </div>

        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Grid of locations */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredLocations.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
            No locations matching search.
          </div>
        ) : (
          filteredLocations.map(loc => (
            <div key={loc.id} className="border border-border rounded-xl bg-card shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{loc.name}</h3>
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase">{loc.id}</span>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getPriorityColor(loc.priority)}`}>
                    {loc.priority} Priority
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-muted-foreground border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span>Security Level:</span>
                    <span className={`font-semibold ${loc.securityLevel === 'Critical' ? 'text-rose-500' : 'text-foreground'}`}>
                      {loc.securityLevel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Guards Required:</span>
                    <span className="font-medium text-foreground">{loc.guardsRequired} per active shift</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Indoor/Outdoor:</span>
                    <span className="font-medium text-foreground">{loc.indoorOutdoor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Operational Shifts:</span>
                    <span className="font-medium text-foreground">
                      {[
                        loc.shiftRequirement.Morning ? "Morning" : null,
                        loc.shiftRequirement.Evening ? "Evening" : null,
                        loc.shiftRequirement.Night ? "Night" : null
                      ].filter(Boolean).join(", ") || "None"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available Hours:</span>
                    <span className="font-medium text-foreground">{loc.availableTime}</span>
                  </div>
                  {loc.specialSkillsRequired.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <span>Required Skills:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {loc.specialSkillsRequired.map(skill => (
                          <span key={skill} className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-foreground font-medium">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {loc.notes && (
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Notes:</span>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{loc.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {!isReadOnly && (
                <div className="flex gap-2 mt-5 border-t border-border pt-4">
                  <button
                    onClick={() => handleEditClick(loc)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit Config</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(loc.id)}
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
                <span>{editingLocation ? "Edit Duty Location" : "Create Duty Location"}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Location ID</label>
                  <input
                    type="text"
                    {...register("id", { required: "Location ID is required" })}
                    disabled={!!editingLocation}
                    placeholder="L007"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground disabled:opacity-50"
                  />
                  {errors.id && <p className="text-rose-500 text-[10px] mt-1">{errors.id.message}</p>}
                </div>
                <div>
                  <label className="block font-semibold mb-1">Location Name</label>
                  <input
                    type="text"
                    {...register("name", { required: "Name is required" })}
                    placeholder="e.g. South Warehouse Gate"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground"
                  />
                  {errors.name && <p className="text-rose-500 text-[10px] mt-1">{errors.name.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Priority</label>
                  <select
                    {...register("priority")}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Security Level</label>
                  <select
                    {...register("securityLevel")}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground"
                  >
                    <option value="Critical">Critical</option>
                    <option value="Standard">Standard</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Guards Required (Per Shift)</label>
                  <input
                    type="number"
                    {...register("guardsRequired", { valueAsNumber: true, min: 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Indoor / Outdoor</label>
                  <select
                    {...register("indoorOutdoor")}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground"
                  >
                    <option value="Indoor">Indoor</option>
                    <option value="Outdoor">Outdoor</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <label className="block font-semibold mb-2">Operational Shift Requirements</label>
                <div className="flex gap-6 items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("shiftRequirement.Morning")}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <span>Morning Shift</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("shiftRequirement.Evening")}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <span>Evening Shift</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("shiftRequirement.Night")}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <span>Night Shift</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Available Hours</label>
                  <input
                    type="text"
                    {...register("availableTime")}
                    placeholder="e.g. 24/7, 08:00-18:00"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Special Skills Required (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="Visitor Log, First Aid"
                    onChange={(e) => setValue("specialSkillsRequired", e.target.value.split(","))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Notes / Instructions</label>
                <textarea
                  {...register("notes")}
                  rows={3}
                  placeholder="Specific duty descriptions..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground resize-none"
                />
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
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
