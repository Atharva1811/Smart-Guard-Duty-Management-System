// client/src/pages/Guards.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from '../context/LanguageContext.tsx';
import { api } from '../config/api.ts';
import { Plus, Search, Edit, Trash2, Users, FileInput } from 'lucide-react';

export const Guards: React.FC = () => {
  const { t, translateText } = useTranslation();
  const [guards, setGuards] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modal control
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [selectedGuard, setSelectedGuard] = useState<any | null>(null);
  const [bulkNames, setBulkNames] = useState<string>('');

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      guardCode: '',
      name: '',
      phone: '',
      email: '',
      gender: 'Male',
      weeklyOff: 0,
      status: 'AVAILABLE',
    }
  });

  const loadGuards = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/guards');
      if (res.data.success) {
        setGuards(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuards();
  }, []);

  const openAddModal = () => {
    setSelectedGuard(null);
    const maxNum = guards.reduce((acc, curr) => {
      const num = parseInt(curr.guardCode.replace(/\D/g, ''), 10);
      return isNaN(num) ? acc : Math.max(acc, num);
    }, 0);
    const nextCode = `G${String(maxNum + 1).padStart(3, '0')}`;

    reset({
      guardCode: nextCode,
      name: '',
      phone: '',
      email: '',
      gender: 'Male',
      weeklyOff: 0,
      status: 'AVAILABLE',
    });
    setShowModal(true);
  };

  const openEditModal = (guard: any) => {
    setSelectedGuard(guard);
    reset({
      guardCode: guard.guardCode,
      name: guard.name,
      phone: guard.phone || '',
      email: guard.email || '',
      gender: guard.gender || 'Male',
      weeklyOff: guard.weeklyOff,
      status: guard.status,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: any) => {
    try {
      if (selectedGuard) {
        // Edit update
        await api.put(`/api/guards/${selectedGuard.id}`, data);
      } else {
        // Add create
        await api.post('/api/guards', data);
      }
      setShowModal(false);
      loadGuards();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to save guard profile');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this guard profile?')) {
      try {
        await api.delete(`/api/guards/${id}`);
        loadGuards();
      } catch (e: any) {
        alert(e.response?.data?.message || 'Delete operation failed.');
      }
    }
  };

  const handleBulkSubmit = async () => {
    const names = bulkNames.split(/,|\n/).map(n => n.trim()).filter(n => n.length > 0);
    if (names.length === 0) return;

    try {
      let currentNum = guards.reduce((acc, curr) => {
        const num = parseInt(curr.guardCode.replace(/\D/g, ''), 10);
        return isNaN(num) ? acc : Math.max(acc, num);
      }, 0);

      for (const name of names) {
        currentNum++;
        const code = `G${String(currentNum).padStart(3, '0')}`;
        await api.post('/api/guards', {
          guardCode: code,
          name,
          gender: 'Male',
          weeklyOff: 0,
          status: 'AVAILABLE',
        });
      }
      setShowBulkModal(false);
      setBulkNames('');
      loadGuards();
    } catch (e) {
      console.error(e);
      alert('Bulk import execution failed.');
    }
  };

  // Filter list
  const filtered = guards.filter(g => {
    const query = search.toLowerCase();
    const matchSearch = g.name.toLowerCase().includes(query) || g.guardCode.toLowerCase().includes(query);
    const matchStatus = statusFilter === 'All' || g.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getDayName = (dayIndex: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('guardsTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('guardsSub')}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={openAddModal}
            className="px-3 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:brightness-105 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>{t('addGuard')}</span>
          </button>
          <button 
            onClick={() => setShowBulkModal(true)}
            className="px-3 py-2 text-sm font-semibold rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground flex items-center gap-1.5 shadow-sm"
          >
            <FileInput className="h-4 w-4" />
            <span>Bulk Names</span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 bg-card p-4 rounded-xl border border-border">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder={t('searchGuards')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-muted/20"
        >
          <option value="All">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="LEAVE">On Leave</option>
          <option value="ABSENT">Absent</option>
          <option value="TRAINING">Training</option>
          <option value="MEDICAL">Medical</option>
        </select>
      </div>

      {/* Grid listing */}
      {loading ? (
        <div className="text-center py-10 text-sm text-muted-foreground">Loading guards register...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">No guards found matching filter criteria.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(g => {
            let statusBadgeColor = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            if (g.status === 'LEAVE') statusBadgeColor = 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            else if (g.status === 'ABSENT') statusBadgeColor = 'bg-rose-500/10 text-rose-600 border-rose-500/20';
            else if (g.status === 'TRAINING') statusBadgeColor = 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
            else if (g.status === 'MEDICAL') statusBadgeColor = 'bg-amber-500/10 text-amber-600 border-amber-500/20';

            return (
              <div key={g.id} className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-white bg-slate-700">{g.name.charAt(0)}</div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{translateText(g.name)}</h4>
                        <p className="text-[10px] text-muted-foreground">{g.guardCode}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border uppercase ${statusBadgeColor}`}>
                      {translateText(g.status)}
                    </span>
                  </div>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div><strong>Weekly Off:</strong> {getDayName(g.weeklyOff)}</div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-3">
                  <button 
                    onClick={() => openEditModal(g)}
                    className="p-1 text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(g.id)}
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
              {selectedGuard ? 'Edit Guard Profile' : 'Add Guard Profile'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Guard Code</label>
                  <input 
                    type="text" 
                    {...register('guardCode', { required: true })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-muted/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Full Name</label>
                  <input 
                    type="text" 
                    {...register('name', { required: true })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-muted/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Gender</label>
                  <select 
                    {...register('gender')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-muted/20"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Weekly Off Day</label>
                  <select 
                    {...register('weeklyOff', { valueAsNumber: true })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-muted/20"
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

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Status</label>
                <select 
                  {...register('status')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-muted/20"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="LEAVE">On Leave</option>
                  <option value="ABSENT">Absent</option>
                  <option value="TRAINING">Training</option>
                  <option value="MEDICAL">Medical</option>
                </select>
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

      {/* BULK IMPORT MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-md text-foreground">Bulk Import Guards</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Separate names using commas or newlines.</p>
            </div>
            <textarea 
              rows={5}
              value={bulkNames}
              onChange={(e) => setBulkNames(e.target.value)}
              placeholder="e.g. Ramesh Shinde, Amit Patil, Prasad Rane"
              className="w-full p-3 text-xs rounded-lg border border-border bg-muted/20"
            />
            <div className="flex gap-2 justify-end pt-2 text-xs">
              <button 
                onClick={() => setShowBulkModal(false)}
                className="px-3 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button 
                onClick={handleBulkSubmit}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
