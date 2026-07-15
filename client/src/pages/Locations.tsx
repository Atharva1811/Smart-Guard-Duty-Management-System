// client/src/pages/Locations.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from '../context/LanguageContext.tsx';
import { api } from '../config/api.ts';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

export const Locations: React.FC = () => {
  const { t, translateText } = useTranslation();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Modal controls
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedLoc, setSelectedLoc] = useState<any | null>(null);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      locationName: '',
      requiredGuards: 1,
      priority: 2,
      securityLevel: 'Standard',
      shiftMorning: true,
      shiftEvening: true,
      shiftNight: true,
      status: 'Active',
    }
  });

  const loadLocations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/locations');
      if (res.data.success) {
        setLocations(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const openAddModal = () => {
    setSelectedLoc(null);
    reset({
      locationName: '',
      requiredGuards: 1,
      priority: 2,
      securityLevel: 'Standard',
      shiftMorning: true,
      shiftEvening: true,
      shiftNight: true,
      status: 'Active',
    });
    setShowModal(true);
  };

  const openEditModal = (loc: any) => {
    setSelectedLoc(loc);
    const shifts = (loc.shift || 'Morning,Evening,Night').split(',');
    reset({
      locationName: loc.locationName,
      requiredGuards: loc.requiredGuards,
      priority: loc.priority,
      securityLevel: loc.securityLevel,
      shiftMorning: shifts.includes('Morning'),
      shiftEvening: shifts.includes('Evening'),
      shiftNight: shifts.includes('Night'),
      status: loc.status,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: any) => {
    // Compile active shifts string
    const activeShifts = [];
    if (data.shiftMorning) activeShifts.push('Morning');
    if (data.shiftEvening) activeShifts.push('Evening');
    if (data.shiftNight) activeShifts.push('Night');

    const formatted = {
      locationName: data.locationName,
      requiredGuards: Number(data.requiredGuards),
      priority: Number(data.priority),
      securityLevel: data.securityLevel,
      shift: activeShifts.join(','),
      status: data.status,
    };

    try {
      if (selectedLoc) {
        await api.put(`/api/locations/${selectedLoc.id}`, formatted);
      } else {
        await api.post('/api/locations', formatted);
      }
      setShowModal(false);
      loadLocations();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to save location details');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this checkpoint point? All daily assignments matching it will be deleted.')) {
      try {
        await api.delete(`/api/locations/${id}`);
        loadLocations();
      } catch (e: any) {
        alert(e.response?.data?.message || 'Delete operation failed.');
      }
    }
  };

  const filtered = locations.filter(l => 
    l.locationName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('locationsTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('locationsSub')}</p>
        </div>

        <button 
          onClick={openAddModal}
          className="px-3 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:brightness-105 flex items-center gap-1.5 shadow-sm ml-auto sm:ml-0"
        >
          <Plus className="h-4 w-4" />
          <span>{t('addLocation')}</span>
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder={t('searchLocations')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Listing Grid */}
      {loading ? (
        <div className="text-center py-10 text-sm text-muted-foreground">Loading checkpoints...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">No checkpoints configured yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(loc => {
            const isCritical = loc.priority === 1;

            return (
              <div key={loc.id} className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{translateText(loc.locationName)}</h4>
                      {isCritical && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-rose-500/10 text-red-500 border border-red-500/20 uppercase mt-1">
                          Critical Node
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">Priority: {loc.priority === 1 ? 'High' : loc.priority === 2 ? 'Medium' : 'Low'}</span>
                  </div>

                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div><strong>Staffing:</strong> {loc.requiredGuards} guard(s) per shift</div>
                    <div><strong>Shifts slots:</strong> {loc.shift || 'Morning,Evening,Night'}</div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-3">
                  <button 
                    onClick={() => openEditModal(loc)}
                    className="p-1 text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(loc.id)}
                    className="p-1 text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CRUD MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-md text-foreground">
              {selectedLoc ? 'Edit Checkpoint Point' : 'Add Checkpoint Point'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Location Name</label>
                <input 
                  type="text" 
                  {...register('locationName', { required: true })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-muted/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Required Guards Count</label>
                  <input 
                    type="number" 
                    {...register('requiredGuards', { required: true })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-muted/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Priority Level</label>
                  <select 
                    {...register('priority')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-muted/20"
                  >
                    <option value={1}>High (Critical Check)</option>
                    <option value={2}>Medium (Standard Check)</option>
                    <option value={3}>Low (Low Priority Check)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Operational Shift Blocks</label>
                <div className="flex gap-4 items-center pt-1 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" {...register('shiftMorning')} />
                    <span>Morning</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" {...register('shiftEvening')} />
                    <span>Evening</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" {...register('shiftNight')} />
                    <span>Night</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 text-xs">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
