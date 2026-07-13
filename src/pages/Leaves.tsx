import React, { useState, useEffect } from "react";
import { dbHub } from "../db/dbHub";
import type { LeaveRequest, Guard } from "../db/mockDb";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translateContent } from "../utils/translator";
import { Plus, Check, X, FileText, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";

export const Leaves: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isReadOnly = false;

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [guards, setGuards] = useState<Guard[]>([]);
  const [showModal, setShowModal] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    guardId: string;
    startDate: string;
    endDate: string;
    reason: string;
  }>();

  useEffect(() => {
    setLeaves(dbHub.getLeaves());
    setGuards(dbHub.getGuards());
  }, []);

  const reloadLeaves = () => {
    setLeaves(dbHub.getLeaves());
  };

  const handleStatusChange = async (requestId: string, status: 'Approved' | 'Rejected') => {
    if (isReadOnly) return;
    const updated = leaves.map(req => {
      if (req.id === requestId) {
        return { ...req, status };
      }
      return req;
    });

    await dbHub.saveLeaves(updated);
    
    // If approved, update guard status to Leave automatically
    if (status === 'Approved') {
      const request = leaves.find(l => l.id === requestId);
      if (request) {
        const currentGuards = dbHub.getGuards();
        const updatedGuards = currentGuards.map(g => {
          if (g.id === request.guardId) {
            return { ...g, status: "Leave" as const };
          }
          return g;
        });
        await dbHub.saveGuards(updatedGuards);
      }
    }
    
    dbHub.addAuditLog(user?.username || "system", "Leave Status Updated", `Set leave request ID ${requestId} status to ${status}`);
    reloadLeaves();
  };

  const onSubmit = async (data: any) => {
    if (isReadOnly) return;
    const guard = guards.find(g => g.id === data.guardId);
    if (!guard) return;

    const newRequest: LeaveRequest = {
      id: "LR" + String(leaves.length + 1).padStart(3, "0"),
      guardId: data.guardId,
      guardName: guard.name,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      status: "Pending"
    };

    const updated = [newRequest, ...leaves];
    await dbHub.saveLeaves(updated);
    
    dbHub.addAuditLog(user?.username || "system", "Leave Requested", `Submitted leave request for guard ${guard.name}`);
    reloadLeaves();
    setShowModal(false);
    reset();
  };

  const getStatusBadgeClass = (status: LeaveRequest["status"]) => {
    switch (status) {
      case "Approved": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "Rejected": return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
      default: return "bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("leavesTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("leavesSub")}</p>
        </div>

        {!isReadOnly && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm shadow-md hover:scale-[1.02] transition-all"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>{t("applyLeave")}</span>
          </button>
        )}
      </div>

      {/* Leave request list table */}
      <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40 text-muted-foreground border-b border-border font-semibold h-11 text-center">
                <th className="text-left px-6">{t("guardNameCol")}</th>
                <th>{t("leavesTitle")}</th>
                <th className="w-80">{t("leaveReason")}</th>
                <th>{t("status")}</th>
                {!isReadOnly && <th className="w-36">{t("actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 4 : 5} className="text-center py-8 text-muted-foreground">No leave records registered.</td>
                </tr>
              ) : (
                leaves.map(req => (
                  <tr key={req.id} className="border-b border-border/70 hover:bg-muted/10 transition-colors h-14">
                    {/* Guard Name */}
                    <td className="px-6 text-left border-r border-border/50">
                      <div className="font-bold text-foreground">{translateContent(req.guardName, language)}</div>
                      <span className="text-[10px] text-muted-foreground">{req.guardId}</span>
                    </td>

                    {/* Date */}
                    <td className="px-4 text-center border-r border-border/50">
                      <div className="flex items-center justify-center gap-1.5 font-medium text-foreground">
                        <Calendar className="h-3.5 w-3.5 opacity-60 text-primary" />
                        <span>{req.startDate}</span>
                        <span className="text-muted-foreground font-light">to</span>
                        <span>{req.endDate}</span>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="px-4 text-left text-muted-foreground border-r border-border/50">
                      <p className="line-clamp-2 max-w-[300px]" title={req.reason}>{translateContent(req.reason, language)}</p>
                    </td>

                    {/* Status badge */}
                    <td className="px-4 text-center border-r border-border/50">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusBadgeClass(req.status)}`}>
                        {translateContent(req.status, language)}
                      </span>
                    </td>

                    {/* Actions */}
                    {!isReadOnly && (
                      <td className="px-4 text-center">
                        {req.status === "Pending" ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleStatusChange(req.id, "Approved")}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-colors"
                              title="Approve Leave"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(req.id, "Rejected")}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-colors"
                              title="Reject Leave"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Processed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border rounded-xl shadow-xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>Submit Leave Application</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Guard Profile</label>
                <select
                  {...register("guardId", { required: "Please select a guard" })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground"
                >
                  <option value="">Choose Guard...</option>
                  {guards.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.id})</option>
                  ))}
                </select>
                {errors.guardId && <p className="text-rose-500 text-[10px] mt-1">{errors.guardId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    {...register("startDate", { required: "Start date is required" })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground font-medium"
                  />
                  {errors.startDate && <p className="text-rose-500 text-[10px] mt-1">{errors.startDate.message}</p>}
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    {...register("endDate", { required: "End date is required" })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground font-medium"
                  />
                  {errors.endDate && <p className="text-rose-500 text-[10px] mt-1">{errors.endDate.message}</p>}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Reason / Justification</label>
                <textarea
                  {...register("reason", { required: "Reason is required" })}
                  rows={4}
                  placeholder="Medical checkup, annual vacation, urgent personal matter..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground resize-none"
                />
                {errors.reason && <p className="text-rose-500 text-[10px] mt-1">{errors.reason.message}</p>}
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
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
