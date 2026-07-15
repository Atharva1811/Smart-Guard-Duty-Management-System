// client/src/components/AuditDrawer.tsx
import React, { useState, useEffect } from 'react';
import { Shield, X } from 'lucide-react';
import { api } from '../config/api.ts';
import { useTranslation } from '../context/LanguageContext.tsx';

interface AuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditDrawer: React.FC<AuditDrawerProps> = ({ isOpen, onClose }) => {
  const { translateText } = useTranslation();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.get('/api/roster/history?limit=30')
        .then(res => {
          if (res.data.success) {
            setLogs(res.data.data.results || []);
          }
        })
        .catch(err => console.error('Failed to load audit trail:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm transition-all"
          onClick={onClose}
        />
      )}

      {/* Drawer Body */}
      <div className={`
        fixed top-0 bottom-0 right-0 z-50 w-85 max-w-sm bg-card border-l border-border shadow-2xl transition-transform duration-300 flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Shield className="h-5 w-5 text-primary" />
            <span>Audit Trail Log</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {loading ? (
            <p className="text-center py-6 text-xs text-muted-foreground">Syncing logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-center py-6 text-xs text-muted-foreground">No recent events logged.</p>
          ) : (
            logs.map(log => (
              <div key={log.id} className="text-xs border-b border-border pb-3 last:border-0">
                <div className="flex justify-between items-center font-semibold mb-1">
                  <span className="text-primary font-bold">{translateText(log.guard_name)}</span>
                  <span className="text-[9px] text-muted-foreground">{log.assignment_date}</span>
                </div>
                <p className="text-foreground leading-relaxed font-medium">{log.remarks}</p>
                <div className="text-[10px] text-muted-foreground/80 mt-1">
                  Checkpoint: <span className="font-semibold">{translateText(log.location_name)}</span> - {log.shift}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
