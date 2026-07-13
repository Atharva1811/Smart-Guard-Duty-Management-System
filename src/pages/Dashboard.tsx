import React, { useState, useEffect } from "react";
import { dbHub } from "../db/dbHub";
import type { Guard, Location, AttendanceRecord, RosterHistory } from "../db/mockDb";
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  ShieldAlert 
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line 
} from "recharts";

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const [guards, setGuards] = useState<Guard[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [rosterHistory, setRosterHistory] = useState<RosterHistory[]>([]);
  const [todayRoster, setTodayRoster] = useState<RosterHistory | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setGuards(dbHub.getGuards());
    setLocations(dbHub.getLocations());
    setAttendance(dbHub.getAttendance(today));
    
    const hist = dbHub.getRosterHistory();
    setRosterHistory(hist);
    setTodayRoster(dbHub.getRosterForDate(today));
  }, []);

  // Compute stat card numbers
  const totalGuards = guards.length;
  
  // Available today
  const availableToday = attendance.filter(a => ['Available', 'Late Arrival', 'Early Exit'].includes(a.status)).length;
  
  // On Leave
  const onLeave = attendance.filter(a => a.status === 'Leave').length;
  
  // Shift count assignments for today's active roster
  let morningShifts = 0;
  let eveningShifts = 0;
  let nightShifts = 0;
  let vacantCount = 0;

  if (todayRoster) {
    Object.values(todayRoster.roster).forEach(shifts => {
      if (shifts.Morning?.guardId) morningShifts++;
      else if (todayRoster.shortages.some(s => s.shift === "Morning")) vacantCount++;

      if (shifts.Evening?.guardId) eveningShifts++;
      else if (todayRoster.shortages.some(s => s.shift === "Evening")) vacantCount++;

      if (shifts.Night?.guardId) nightShifts++;
      else if (todayRoster.shortages.some(s => s.shift === "Night")) vacantCount++;
    });
  } else {
    // If no roster has been generated, count the required positions
    locations.forEach(loc => {
      if (loc.shiftRequirement.Morning) vacantCount++;
      if (loc.shiftRequirement.Evening) vacantCount++;
      if (loc.shiftRequirement.Night) vacantCount++;
    });
  }

  const attendanceRate = totalGuards > 0 
    ? Math.round(((totalGuards - attendance.filter(a => ['Absent', 'Leave'].includes(a.status)).length) / totalGuards) * 100) 
    : 0;

  // Chart 1: Daily Guard Status Distribution
  const guardStatusData = [
    { name: "Available", value: attendance.filter(a => ['Available', 'Late Arrival', 'Early Exit'].includes(a.status)).length, color: "#10b981" },
    { name: "On Leave", value: attendance.filter(a => a.status === 'Leave').length, color: "#3b82f6" },
    { name: "Absent", value: attendance.filter(a => a.status === 'Absent').length, color: "#f43f5e" },
    { name: "Training", value: attendance.filter(a => a.status === 'Training').length, color: "#a855f7" },
    { name: "Medical", value: attendance.filter(a => a.status === 'Medical').length, color: "#f59e0b" }
  ].filter(item => item.value > 0);

  // Chart 2: Weekly Shift Chart (Roster history for past 7 records)
  const weeklyShiftData = rosterHistory.slice(-7).map(h => {
    let morning = 0;
    let evening = 0;
    let night = 0;
    Object.values(h.roster).forEach(shifts => {
      if (shifts.Morning?.guardId) morning++;
      if (shifts.Evening?.guardId) evening++;
      if (shifts.Night?.guardId) night++;
    });
    // Format date to MM/DD
    const dateFormatted = h.date.split("-").slice(1).join("/");
    return {
      name: dateFormatted,
      Morning: morning,
      Evening: evening,
      Night: night
    };
  });

  // Chart 3: Location Occupancy
  const locationOccupancyData = locations.map(loc => {
    let assigned = 0;
    let required = 0;

    if (loc.shiftRequirement.Morning) required++;
    if (loc.shiftRequirement.Evening) required++;
    if (loc.shiftRequirement.Night) required++;

    if (todayRoster && todayRoster.roster[loc.id]) {
      const shifts = todayRoster.roster[loc.id];
      if (shifts.Morning?.guardId) assigned++;
      if (shifts.Evening?.guardId) assigned++;
      if (shifts.Night?.guardId) assigned++;
    }

    return {
      name: loc.name.length > 15 ? loc.name.substring(0, 15) + "..." : loc.name,
      Assigned: assigned,
      Required: required
    };
  });

  // Chart 4: Guard Availability Trend (Past 7 days availability vs. total)
  const availabilityTrendData = rosterHistory.slice(-7).map(h => {
    // Look up attendance records matching that historical date
    const dateStr = h.date;
    const historyRoster = rosterHistory.find(hist => hist.date === dateStr);
    let vacantCount = historyRoster ? historyRoster.vacantLocations.length : 0;
    let totalAssignments = 0;
    
    if (historyRoster) {
      Object.values(historyRoster.roster).forEach(shifts => {
        if (shifts.Morning?.guardId) totalAssignments++;
        if (shifts.Evening?.guardId) totalAssignments++;
        if (shifts.Night?.guardId) totalAssignments++;
      });
    }

    const dateFormatted = dateStr.split("-").slice(1).join("/");
    return {
      name: dateFormatted,
      Filled: totalAssignments,
      Vacancies: vacantCount
    };
  });

  return (
    <div className="space-y-8">
      {/* Upper header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("overview")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("overviewSub")}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Guards */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("totalGuards")}</p>
            <p className="text-2xl font-bold mt-1">{totalGuards}</p>
          </div>
        </div>

        {/* Guards Available */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("availableToday")}</p>
            <p className="text-2xl font-bold mt-1">{availableToday}</p>
          </div>
        </div>

        {/* Guards on Leave */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
            <UserMinus className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("guardsOnLeave")}</p>
            <p className="text-2xl font-bold mt-1">{onLeave}</p>
          </div>
        </div>

        {/* Vacant Locations */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-lg ${vacantCount > 0 ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : "bg-emerald-500/10 text-emerald-600"}`}>
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("vacantSpots")}</p>
            <p className="text-2xl font-bold mt-1">{vacantCount}</p>
          </div>
        </div>
      </div>

      {/* Roster Shift Statistics Card Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <div className="border border-border rounded-xl bg-card p-5 shadow-sm text-center">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">{t("morningShift")}</span>
          <p className="text-xl font-bold text-foreground mt-1">{morningShifts}</p>
        </div>
        <div className="border border-border rounded-xl bg-card p-5 shadow-sm text-center">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">{t("eveningShift")}</span>
          <p className="text-xl font-bold text-foreground mt-1">{eveningShifts}</p>
        </div>
        <div className="border border-border rounded-xl bg-card p-5 shadow-sm text-center">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">{t("nightShift")}</span>
          <p className="text-xl font-bold text-foreground mt-1">{nightShifts}</p>
        </div>
        <div className="border border-border rounded-xl bg-card p-5 shadow-sm text-center">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">{t("rosterCoverage")}</span>
          <p className="text-xl font-bold text-primary mt-1">{attendanceRate}%</p>
        </div>
      </div>

      {/* Chart Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Distribution Chart */}
        <div className="border border-border rounded-xl bg-card p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-base text-foreground">{t("availabilityBreakup")}</h3>
            <span className="text-xs text-muted-foreground">Today's statuses</span>
          </div>
          <div className="h-64">
            {guardStatusData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No data available today.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={guardStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {guardStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      borderColor: "hsl(var(--border))", 
                      color: "hsl(var(--card-foreground))",
                      fontSize: "12px",
                      borderRadius: "8px"
                    }} 
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Weekly Shifts Chart */}
        <div className="border border-border rounded-xl bg-card p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-base text-foreground">{t("weeklyShiftDistribution")}</h3>
            <span className="text-xs text-muted-foreground">Guards per shift</span>
          </div>
          <div className="h-64">
            {weeklyShiftData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Roster history is empty. Generate rosters to see weekly charts.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyShiftData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      borderColor: "hsl(var(--border))", 
                      color: "hsl(var(--card-foreground))",
                      fontSize: "12px",
                      borderRadius: "8px"
                    }} 
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="Morning" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Evening" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Night" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Location Occupancy */}
        <div className="border border-border rounded-xl bg-card p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-base text-foreground">{t("locationOccupancy")}</h3>
            <span className="text-xs text-muted-foreground">Assigned vs. Required</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationOccupancyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    borderColor: "hsl(var(--border))", 
                    color: "hsl(var(--card-foreground))",
                    fontSize: "12px",
                    borderRadius: "8px"
                  }} 
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="Required" fill="#64748b" radius={[4, 4, 0, 0]} opacity={0.4} />
                <Bar dataKey="Assigned" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Guard Availability Trend */}
        <div className="border border-border rounded-xl bg-card p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-base text-foreground">{t("coverageHistory")}</h3>
            <span className="text-xs text-muted-foreground">Assignments vs. Vacancies</span>
          </div>
          <div className="h-64">
            {availabilityTrendData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No historical logs.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={availabilityTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      borderColor: "hsl(var(--border))", 
                      color: "hsl(var(--card-foreground))",
                      fontSize: "12px",
                      borderRadius: "8px"
                    }} 
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="Filled" stroke="#10b981" strokeWidth={2} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Vacancies" stroke="#f43f5e" strokeWidth={2} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
