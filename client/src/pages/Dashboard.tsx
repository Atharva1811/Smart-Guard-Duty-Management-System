// client/src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext.tsx';
import { api } from '../config/api.ts';
import { 
  Users, 
  CheckCircle, 
  UserMinus, 
  AlertTriangle,
  Moon,
  Sun,
  Sunrise
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { t, translateText } = useTranslation();
  const [stats, setStats] = useState({
    totalGuards: 0,
    availableToday: 0,
    onLeave: 0,
    vacantSpots: 0,
    morningCount: 0,
    eveningCount: 0,
    nightCount: 0,
    coverage: 0,
  });

  const [pieData, setPieData] = useState<any[]>([]);
  const [barData, setBarData] = useState<any[]>([]);
  const [lineData, setLineData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        
        const [guardsRes, locationsRes, rosterRes, historyRes] = await Promise.all([
          api.get('/api/guards'),
          api.get('/api/locations'),
          api.get(`/api/roster/assignments?date=${todayStr}`),
          api.get('/api/roster/history?limit=100'),
        ]);

        const guards = guardsRes.data.data;
        const locations = locationsRes.data.data;
        const roster = rosterRes.data.data;
        const history = historyRes.data.data.results || [];

        let morning = 0, evening = 0, night = 0;
        roster.forEach((a: any) => {
          if (a.guard_id) {
            if (a.shift === 'Morning') morning++;
            else if (a.shift === 'Evening') evening++;
            else if (a.shift === 'Night') night++;
          }
        });

        const totalRequired = locations.reduce((acc: number, loc: any) => {
          return acc + (loc.shift || 'Morning,Evening,Night').split(',').length;
        }, 0);

        const totalAssigned = morning + evening + night;
        const coverageRate = totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 0;

        const available = guards.filter((g: any) => g.status === 'AVAILABLE').length;
        const onLeave = guards.filter((g: any) => g.status === 'LEAVE').length;
        const absent = guards.filter((g: any) => g.status === 'ABSENT').length;
        const medical = guards.filter((g: any) => g.status === 'MEDICAL').length;
        const training = guards.filter((g: any) => g.status === 'TRAINING').length;

        setStats({
          totalGuards: guards.length,
          availableToday: available,
          onLeave,
          vacantSpots: totalRequired - totalAssigned,
          morningCount: morning,
          eveningCount: evening,
          nightCount: night,
          coverage: coverageRate,
        });

        // Set Pie Data
        const pieList = [
          { name: 'Available', value: available, color: '#10b981' },
          { name: 'On Leave', value: onLeave, color: '#3b82f6' },
          { name: 'Absent', value: absent, color: '#ef4444' },
          { name: 'Medical', value: medical, color: '#fbbf24' },
          { name: 'Training', value: training, color: '#818cf8' },
        ].filter(d => d.value > 0);
        setPieData(pieList);

        // Set Bar Data
        const barList = locations.map((loc: any) => {
          const assignedCount = roster.filter((a: any) => a.location_id === loc.id && a.guard_id).length;
          return {
            name: translateText(loc.locationName),
            assigned: assignedCount,
          };
        });
        setBarData(barList);

        // Set Line Data (Coverage trend from past history unique dates)
        const uniqueDates = [...new Set(history.map((h: any) => h.assignment_date))] as string[];
        const sortedDates = uniqueDates.sort().slice(-7);
        const lineList = sortedDates.map(date => {
          const list = history.filter((h: any) => h.assignment_date === date);
          const assigned = list.filter((h: any) => h.guard_id).length;
          const total = list.length;
          return {
            date: date.substring(5), // MM-DD
            rate: total > 0 ? Math.round((assigned / total) * 100) : 100,
          };
        });

        if (lineList.length === 0) {
          lineList.push({ date: 'Today', rate: coverageRate });
        }
        setLineData(lineList);

      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [translateText]);

  if (loading) {
    return <div className="text-center py-10">Loading statistics dashboard...</div>;
  }

  const statCards = [
    { title: t('totalGuards'), val: stats.totalGuards, icon: Users, color: 'text-primary bg-primary/10' },
    { title: t('availableToday'), val: stats.availableToday, icon: CheckCircle, color: 'text-emerald-500 bg-emerald-500/10' },
    { title: t('guardsOnLeave'), val: stats.onLeave, icon: UserMinus, color: 'text-blue-500 bg-blue-500/10' },
    { title: t('vacantSpots'), val: stats.vacantSpots, icon: AlertTriangle, color: 'text-red-500 bg-red-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('overview')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('overviewSub')}</p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{card.title}</p>
                <p className="text-3xl font-extrabold">{card.val}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Details Shifts overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl"><Sunrise className="h-5 w-5" /></div>
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">{t('morningShift')}</p>
            <p className="text-2xl font-bold">{stats.morningCount} assigned</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl"><Sun className="h-5 w-5" /></div>
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">{t('eveningShift')}</p>
            <p className="text-2xl font-bold">{stats.eveningCount} assigned</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl"><Moon className="h-5 w-5" /></div>
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">{t('nightShift')}</p>
            <p className="text-2xl font-bold">{stats.nightCount} assigned</p>
          </div>
        </div>
      </div>

      {/* Visual representation Charts Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Availability Breakup (Donut) */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col h-[320px]">
          <h3 className="font-bold text-sm text-foreground mb-4">{t('availabilityBreakup')}</h3>
          <div className="flex-1 min-h-0">
            {pieData.length === 0 ? (
              <p className="text-center text-xs py-10 text-muted-foreground">No attendance records today.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Guards`]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Checkpoint Occupancy (Bar) */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col h-[320px] lg:col-span-2">
          <h3 className="font-bold text-sm text-foreground mb-4">{t('locationOccupancy')}</h3>
          <div className="flex-1 min-h-0">
            {barData.length === 0 ? (
              <p className="text-center text-xs py-10 text-muted-foreground">No checkpoints configured.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" fontSize={10} stroke="#888888" tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} stroke="#888888" tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="assigned" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Coverage History (Line) */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col h-[320px] md:col-span-2 lg:col-span-3">
          <h3 className="font-bold text-sm text-foreground mb-4">{t('coverageHistory')}</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <XAxis dataKey="date" fontSize={10} stroke="#888888" tickLine={false} axisLine={false} />
                <YAxis fontSize={10} stroke="#888888" tickLine={false} axisLine={false} unit="%" />
                <Tooltip formatter={(value) => [`${value}% coverage`]} />
                <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
