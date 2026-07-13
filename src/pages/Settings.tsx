import React, { useState, useEffect } from "react";
import { dbHub } from "../db/dbHub";
import type { SystemSettings } from "../db/mockDb";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useForm } from "react-hook-form";
import { 
  Settings as SettingsIcon, 
  Save, 
  Database, 
  GitBranch, 
  Clock, 
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";
import { googleSheetsClient } from "../db/googleSheetsClient";
import { githubClient } from "../db/githubClient";

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isReadOnly = false;

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  
  // Connection testing states
  const [testingSheets, setTestingSheets] = useState(false);
  const [testingGithub, setTestingGithub] = useState(false);
  
  const [sheetsResult, setSheetsResult] = useState<"idle" | "success" | "error">("idle");
  const [githubResult, setGithubResult] = useState<"idle" | "success" | "error">("idle");
  
  const [showGithubToken, setShowGithubToken] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm<SystemSettings>();

  const sheetsEnabled = watch("googleSheets.enabled");
  const githubEnabled = watch("githubStorage.enabled");

  useEffect(() => {
    const s = dbHub.getSettings();
    setSettings(s);
    reset(s);
  }, []);

  // Save settings form
  const onSubmit = async (data: SystemSettings) => {
    if (isReadOnly) return;
    
    // Convert numerical values
    data.rotationRules.maxConsecutiveDuties = Number(data.rotationRules.maxConsecutiveDuties);
    data.rotationRules.maxNightShiftsPerWeek = Number(data.rotationRules.maxNightShiftsPerWeek);
    data.rotationRules.restHoursBetweenShifts = Number(data.rotationRules.restHoursBetweenShifts);

    // Save
    await dbHub.saveSettings(data);
    
    // Trigger sync sync pull if database provider is activated
    if (data.googleSheets.enabled && data.googleSheets.appsScriptUrl) {
      await googleSheetsClient.pullData().catch(e => console.warn("Pull after save sheets failed", e));
    } else if (data.githubStorage.enabled && data.githubStorage.token) {
      await githubClient.pullData().catch(e => console.warn("Pull after save github failed", e));
    }

    dbHub.addAuditLog(user?.username || "system", "Settings Saved", "System shift timing, rotation caps, and storage settings updated.");
    alert("Settings saved and synced successfully.");
  };

  // Test Sheets Connection
  const handleTestSheets = async () => {
    const url = watch("googleSheets.appsScriptUrl");
    if (!url) {
      alert("Please enter a valid Google Apps Script Web App URL first.");
      return;
    }
    setTestingSheets(true);
    setSheetsResult("idle");
    const ok = await googleSheetsClient.testConnection(url);
    setSheetsResult(ok ? "success" : "error");
    setTestingSheets(false);
  };

  // Test GitHub Connection
  const handleTestGithub = async () => {
    const owner = watch("githubStorage.repoOwner");
    const repo = watch("githubStorage.repoName");
    const token = watch("githubStorage.token");
    
    if (!owner || !repo || !token) {
      alert("Please configure Owner, Repo Name, and Personal Access Token first.");
      return;
    }
    setTestingGithub(true);
    setGithubResult("idle");
    const ok = await githubClient.testConnection(owner, repo, token);
    setGithubResult(ok ? "success" : "error");
    setTestingGithub(false);
  };

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("settingsTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("settingsSub")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-xs text-muted-foreground">
        {/* Core shift timings */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Shift hours card */}
          <div className="border border-border rounded-xl bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-primary" />
              <span>{t("shiftTimingSlots")}</span>
            </h3>

            <div className="grid gap-3">
              <div>
                <label className="block font-semibold mb-1 text-foreground">Morning Shift</label>
                <div className="flex gap-2">
                  <input type="time" {...register("shiftTimings.Morning.start")} className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-muted/20 text-foreground" />
                  <span className="self-center font-light">to</span>
                  <input type="time" {...register("shiftTimings.Morning.end")} className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-muted/20 text-foreground" />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-foreground">Evening Shift</label>
                <div className="flex gap-2">
                  <input type="time" {...register("shiftTimings.Evening.start")} className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-muted/20 text-foreground" />
                  <span className="self-center font-light">to</span>
                  <input type="time" {...register("shiftTimings.Evening.end")} className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-muted/20 text-foreground" />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-foreground">Night Shift</label>
                <div className="flex gap-2">
                  <input type="time" {...register("shiftTimings.Night.start")} className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-muted/20 text-foreground" />
                  <span className="self-center font-light">to</span>
                  <input type="time" {...register("shiftTimings.Night.end")} className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-muted/20 text-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Allocation rotation limits */}
          <div className="border border-border rounded-xl bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <SettingsIcon className="h-4.5 w-4.5 text-primary" />
              <span>{t("rotationRules")}</span>
            </h3>

            <div className="grid gap-4">
              <div>
                <label className="block font-semibold mb-1 text-foreground">Maximum Consecutive Duties (Days)</label>
                <input
                  type="number"
                  {...register("rotationRules.maxConsecutiveDuties")}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-foreground">Maximum Night Shifts per Week</label>
                <input
                  type="number"
                  {...register("rotationRules.maxNightShiftsPerWeek")}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-foreground">Minimum Rest Period between Shifts (Hours)</label>
                <input
                  type="number"
                  {...register("rotationRules.restHoursBetweenShifts")}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cloud database configurations */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Google Sheets config */}
          <div className="border border-border rounded-xl bg-card p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-emerald-500" />
                <span>{t("sheetsSync")}</span>
              </h3>
              <input
                type="checkbox"
                {...register("googleSheets.enabled")}
                className="rounded border-border text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-1 text-foreground">Spreadsheet ID</label>
                <input
                  type="text"
                  disabled={!sheetsEnabled}
                  {...register("googleSheets.spreadsheetId")}
                  placeholder="e.g. 1aBCDeFGHiJKlMnOpQRS..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-foreground">Google Apps Script API Web App URL</label>
                <input
                  type="text"
                  disabled={!sheetsEnabled}
                  {...register("googleSheets.appsScriptUrl")}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground disabled:opacity-50"
                />
              </div>

              {sheetsEnabled && (
                <button
                  type="button"
                  onClick={handleTestSheets}
                  disabled={testingSheets}
                  className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-muted text-foreground transition-all duration-200 ${sheetsResult === "success" ? "border-emerald-500 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10" : ""} ${sheetsResult === "error" ? "border-rose-500 text-rose-600 bg-rose-500/5 hover:bg-rose-500/10" : ""}`}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${testingSheets ? "animate-spin" : ""}`} />
                  <span>
                    {testingSheets ? "Pinging Apps Script..." : sheetsResult === "success" ? "Connection Successful!" : sheetsResult === "error" ? "Ping Failed!" : t("pingEndpoint")}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* GitHub storage config */}
          <div className="border border-border rounded-xl bg-card p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <GitBranch className="h-4.5 w-4.5 text-foreground" />
                <span>GitHub Repository Database</span>
              </h3>
              <input
                type="checkbox"
                {...register("githubStorage.enabled")}
                className="rounded border-border text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
              />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-foreground">Repo Owner (User/Org)</label>
                  <input
                    type="text"
                    disabled={!githubEnabled}
                    {...register("githubStorage.repoOwner")}
                    placeholder="e.g. security-officer"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-foreground">Repo Name</label>
                  <input
                    type="text"
                    disabled={!githubEnabled}
                    {...register("githubStorage.repoName")}
                    placeholder="e.g. guard-duty-data"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground disabled:opacity-50"
                  />
                </div>
              </div>
              
              <div>
                <label className="block font-semibold mb-1 text-foreground">Database JSON File Path</label>
                <input
                  type="text"
                  disabled={!githubEnabled}
                  {...register("githubStorage.filePath")}
                  placeholder="guard_duty_db.json"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-foreground">Personal Access Token (PAT) with Repo Access</label>
                <div className="relative">
                  <input
                    type={showGithubToken ? "text" : "password"}
                    disabled={!githubEnabled}
                    {...register("githubStorage.token")}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-border bg-muted/20 text-foreground disabled:opacity-50"
                  />
                  <button
                    type="button"
                    disabled={!githubEnabled}
                    onClick={() => setShowGithubToken(!showGithubToken)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  >
                    {showGithubToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {githubEnabled && (
                <button
                  type="button"
                  onClick={handleTestGithub}
                  disabled={testingGithub}
                  className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-muted text-foreground transition-all duration-200 ${githubResult === "success" ? "border-emerald-500 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10" : ""} ${githubResult === "error" ? "border-rose-500 text-rose-600 bg-rose-500/5 hover:bg-rose-500/10" : ""}`}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${testingGithub ? "animate-spin" : ""}`} />
                  <span>
                    {testingGithub ? "Testing Connection..." : githubResult === "success" ? "Connection Successful!" : githubResult === "error" ? "Connection Failed!" : t("testConnection")}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Form actions */}
        {!isReadOnly && (
          <div className="flex justify-end pt-4 border-t border-border">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <Save className="h-4.5 w-4.5" />
              <span>{t("applyChanges")}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
export default Settings;
