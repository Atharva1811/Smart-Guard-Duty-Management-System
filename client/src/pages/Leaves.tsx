// client/src/pages/Leaves.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../config/api.ts';
import { Plus, Check, X } from 'lucide-react';

export const Leaves: React.FC = () => {
  const { t, translateText } = useTranslation();
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [guards, setGuards] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      guardId: '',
      leaveDate: new Date().toISOString().split('T')[0],
      reason: '',
    }
  });

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const [leavesRes, guardsRes] = await Promise.all([
        api.get('/api/leaves'),
        api.get('/api/guards')
      ]);
      if (leavesRes.data.success) setLeaves(leavesRes.data.data);
      if (guardsRes.data.success) setGuards(guardsRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const openApplyModal = () => {
    reset({
      guardId: guards[0]?.id ? String(guards[0].id) : '',
      leaveDate: new Date().toISOString().split('T')[0],
      reason: '',
    });
    setShowModal(true);
  };

  const onSubmit = async (data: any) => {
    try {
      const formatted = {
        guardId: Number(data.guardId),
        leaveDate: data.leaveDate,
        reason: data.reason
      };
      await api.post('/api/leaves', formatted);
      setShowModal(false);
      loadLeaves();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to submit leave request');
    }
  };

  const handleUpdateStatus = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.put(`/api/leaves/${id}/status`, { status });
      loadLeaves();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Status update failed.');
    }
  };

  const isSupervisorOrAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPERVISOR');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('leavesTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('leavesSub')}</p>
        </div>

        <button 
          onClick={openApplyModal}
          className="px-3 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:brightness-105 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>{t('applyLeave')}</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-sm text-muted-foreground">Loading leaves register...</div>
      ) : leaves.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">No leave requests logged in system.</div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <table className="roster-table text-xs">
            <thead>
              <tr>
                <th>Guard Name</th>
                <th>Leave Date</th>
                <th>Reason</th>
                <th>Status</th>
                {isSupervisorOrAdmin && <th className="w-1/6">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {leaves.map(l => {
                let badgeColor = 'bg-amber-500/10 text-amber-600 border-amber-500/20';
                if (l.status === 'APPROVED') badgeColor = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
                else if (l.status === 'REJECTED') badgeColor = 'bg-rose-500/10 text-rose-600 border-rose-500/20';

                return (
                  <tr key={l.id}>
                    <td className="font-bold text-foreground">{translateText(l.guard_name)} ({l.guard_code})</td>
                    <td>{l.leave_date}</td>
                    <td>{l.reason}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border uppercase ${badgeColor}`}>
                        {translateText(l.status)}
                      </span>
                    </td>
                    {isSupervisorOrAdmin && (
                      <td>
                        {l.status === 'PENDING' ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleUpdateStatus(l.id, 'APPROVED')}
                              className="p-1 rounded bg-emerald-600 text-white font-bold text-[9px] hover:brightness-105 flex items-center gap-0.5"
                            >
                              <Check className="h-3 w-3" />
                              <span>Approve</span>
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(l.id, 'REJECTED')}
                              className="p-1 rounded bg-rose-600 text-white font-bold text-[9px] hover:brightness-105 flex items-center gap-0.5"
                            >
                              <X className="h-3 w-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : '-'}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* REQUEST MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-md text-foreground">Apply Leave Request</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Select Guard</label>
                <select 
                  {...register('guardId', { required: true })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-muted/20"
                >
                  <option value="">-- Select Guard --</option>
                  {guards.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.guardCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Leave Date</label>
                <input 
                  type="date" 
                  {...register('leaveDate', { required: true })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-muted/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Reason for Leave</label>
                <input 
                  type="text" 
                  {...register('reason')}
                  placeholder="Specify emergency reason..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-muted/20 text-xs focus:outline-none"
                />
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
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
