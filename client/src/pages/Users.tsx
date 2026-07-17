// client/src/pages/Users.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from '../context/LanguageContext.tsx';
import { api } from '../config/api.ts';
import { Plus, Trash2 } from 'lucide-react';

export const Users: React.FC = () => {
  const { t } = useTranslation();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      username: '',
      password: '',
      name: '',
      email: '',
      role: 'VIEWER',
    }
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/users');
      if (res.data.success) {
        setUsersList(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load user accounts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openAddModal = () => {
    reset({
      username: '',
      password: '',
      name: '',
      email: '',
      role: 'VIEWER',
    });
    setShowModal(true);
  };

  const onSubmit = async (data: any) => {
    try {
      await api.post('/api/auth/register', data);
      setShowModal(false);
      loadUsers();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to create user account.');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this user profile? They will instantly lose application access.')) {
      try {
        await api.delete(`/api/users/${id}`);
        loadUsers();
      } catch (e: any) {
        alert(e.response?.data?.message || 'Delete operation failed.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('usersTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('usersSub')}</p>
        </div>

        <button 
          onClick={openAddModal}
          className="px-3 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:brightness-105 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>{t('addUser')}</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-sm text-muted-foreground">Loading accounts...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {usersList.map(u => (
            <div key={u.id} className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-white bg-slate-700">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{u.name}</h4>
                    <span className="px-1.5 py-0.5 rounded bg-muted text-[8px] font-bold uppercase border tracking-wider">
                      {u.role}
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-1 text-muted-foreground">
                  <div><strong>Username:</strong> {u.username}</div>
                  <div><strong>Email:</strong> {u.email || 'No email registered'}</div>
                </div>
              </div>

              {u.username !== 'admin' && (
                <div className="flex justify-end border-t border-border pt-3">
                  <button 
                    onClick={() => handleDelete(u.id)}
                    className="p-1 text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete User</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-md text-foreground">Add New User</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Full Name</label>
                <input 
                  type="text" 
                  {...register('name', { required: true })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-muted/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Username</label>
                <input 
                  type="text" 
                  {...register('username', { required: true })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-muted/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Password</label>
                <input 
                  type="password" 
                  {...register('password', { required: true })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-muted/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Email</label>
                <input 
                  type="email" 
                  {...register('email')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-muted/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Role Scope</label>
                <select 
                  {...register('role')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-muted/20"
                >
                  <option value="VIEWER">Viewer (Read Only)</option>
                  <option value="SUPERVISOR">Supervisor (Roster Assigns)</option>
                  <option value="ADMIN">Admin (Full access)</option>
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
