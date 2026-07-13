import React, { useState, useEffect } from "react";
import { dbHub } from "../db/dbHub";
import type { SystemUser } from "../db/mockDb";
import { ShieldCheck, ShieldAlert, Eye, User, Info } from "lucide-react";

export const Users: React.FC = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);

  useEffect(() => {
    setUsers(dbHub.getUsers());
  }, []);

  const getRoleIcon = (role: SystemUser["role"]) => {
    switch (role) {
      case "Admin": return <ShieldAlert className="h-5 w-5 text-rose-500" />;
      case "Supervisor": return <ShieldCheck className="h-5 w-5 text-amber-500" />;
      default: return <Eye className="h-5 w-5 text-blue-500" />;
    }
  };

  const getRoleDescription = (role: SystemUser["role"]) => {
    switch (role) {
      case "Admin": return "Full access: Manage guards, manage locations, auto-generate rosters, manual schedule overrides, user credentials audit, export reports, edit system configuration.";
      case "Supervisor": return "Moderate access: Mark daily attendance codes, request guard leave records, run auto-generation roster templates, execute cell swaps/overrides, edit shift timings.";
      default: return "Read-only access: View schedules, search guard duty allocations, review reports, and check audit trail logs.";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">User Profile Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Review operational roles and system credential access levels.</p>
      </div>

      {/* Info notice about single officer setup */}
      <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs flex gap-3 text-blue-750 dark:text-blue-300">
        <Info className="h-5 w-5 flex-shrink-0 text-blue-500 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Deployment Architecture Notice:</span> This application runs entirely inside the browser to host 100% free of charge. Role configurations are used to customize access features. To swap roles, click logout and sign in using the quick-select buttons on the login portal.
        </div>
      </div>

      {/* User listing */}
      <div className="grid gap-6 md:grid-cols-3">
        {users.map(u => (
          <div key={u.username} className="border border-border rounded-xl bg-card shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">{u.name}</h3>
                  <span className="text-[10px] text-muted-foreground">@{u.username}</span>
                </div>
              </div>
              {getRoleIcon(u.role)}
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground">Security Role:</span>
                <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/10 text-primary">
                  {u.role}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Notification Email:</span>
                <p className="font-medium text-foreground mt-0.5">{u.email}</p>
              </div>
              <div className="pt-2 border-t border-border/50">
                <span className="font-semibold block text-muted-foreground mb-1">Access Scope:</span>
                <p className="text-muted-foreground leading-relaxed text-[11px]">{getRoleDescription(u.role)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Users;
