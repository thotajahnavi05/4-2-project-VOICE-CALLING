import { useState, useEffect } from 'react';
import {
  Phone, PhoneCall, PhoneOff, TrendingUp,
  Activity, Clock, Zap, ChevronRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { getCalls } from '../api/client';
import { getUser } from '../utils/auth';
import { COLLEGE_LOGO_URL, COLLEGE_NAME } from '../utils/brand';

const COLORS = ['#06b6d4', '#10b981', '#ef4444', '#f43f5e'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ calls: 0, completed: 0, failed: 0, inProgress: 0 });
  const [recentCalls, setRecentCalls] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await getCalls().catch(() => ({ data: [] }));
      const calls = res.data || [];
      setRecentCalls(calls.slice(0, 5));

      const completed = calls.filter(c => c.status === 'completed').length;
      const failed = calls.filter(c => c.status === 'failed').length;
      const inProgress = calls.filter(c => c.status === 'in-progress').length;
      setStats({ calls: calls.length, completed, failed, inProgress });

      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-IN', { weekday: 'short' });
        const dayStr = d.toISOString().split('T')[0];
        const dayCalls = calls.filter(c => c.createdAt?.startsWith(dayStr));
        days.push({
          name: dateStr,
          calls: dayCalls.length,
          completed: dayCalls.filter(c => c.status === 'completed').length,
        });
      }
      setChartData(days);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: 'Completed', value: stats.completed },
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Failed', value: stats.failed },
  ].filter(d => d.value > 0);

  const successRate = stats.calls > 0
    ? Math.round((stats.completed / stats.calls) * 100)
    : 0;

  const user = getUser();
  const firstName = (user?.name || user?.username || '').split(' ')[0];

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.04)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] pointer-events-none" />

      {/* Decorative glow — cyan + coral */}
      <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs text-primary-light mb-2 font-medium tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
            Live Dashboard
          </div>
          <h1 className="text-3xl font-bold text-white">
            {firstName ? (
              <>
                Welcome back,{' '}
                <span className="bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent">
                  {firstName}
                </span>
              </>
            ) : (
              'Dashboard'
            )}
          </h1>
          <p className="text-text-muted mt-1 text-sm">India Voice Calling Overview</p>
        </div>

        <div className="flex items-center gap-3 bg-surface-card border border-border rounded-2xl px-4 py-2.5 backdrop-blur-xl">
          <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center shadow-inner">
            <img src={COLLEGE_LOGO_URL} alt={COLLEGE_NAME} className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{COLLEGE_NAME}</p>
            <p className="text-[11px] text-text-muted">Imparting Value Based Education</p>
          </div>
        </div>
      </div>

      {/* Top Stats */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Phone} label="Total Calls" value={stats.calls} color="primary" />
        <StatCard icon={PhoneCall} label="Completed" value={stats.completed} color="success" />
        <StatCard icon={PhoneOff} label="Failed" value={stats.failed} color="danger" />
        <StatCard
          icon={TrendingUp}
          label="Success Rate"
          value={`${successRate}%`}
          color="accent"
        />
      </div>

      {/* Charts */}
      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area chart */}
        <div className="lg:col-span-2 bg-surface-card border border-border rounded-2xl p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(6,182,212,0.1)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity size={18} className="text-primary-light" />
                Call Activity
              </h3>
              <p className="text-xs text-text-muted mt-0.5">Last 7 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-text-muted">Calls</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-success" />
                <span className="text-text-muted">Completed</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2942" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(10, 14, 26, 0.95)',
                  border: '1px solid #1e2942',
                  borderRadius: 12,
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 10px 40px rgba(6, 182, 212, 0.15)',
                }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Area
                type="monotone"
                dataKey="calls"
                stroke="#22d3ee"
                fill="url(#colorCalls)"
                strokeWidth={2.5}
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#10b981"
                fill="url(#colorCompleted)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-surface-card border border-border rounded-2xl p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(244,63,94,0.1)]">
          <div className="mb-2">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Zap size={18} className="text-accent" />
              Call Distribution
            </h3>
            <p className="text-xs text-text-muted mt-0.5">Status breakdown</p>
          </div>

          {pieData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-text-muted text-sm">No data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10, 14, 26, 0.95)',
                    border: '1px solid #1e2942',
                    borderRadius: 12,
                    boxShadow: '0 10px 40px rgba(6, 182, 212, 0.15)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}

          <div className="space-y-2 mt-3">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: COLORS[i] }}
                  />
                  <span className="text-text-muted">{d.name}</span>
                </div>
                <span className="text-white font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Calls */}
      <div className="relative bg-surface-card border border-border rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock size={18} className="text-primary-light" />
              Recent Calls
            </h3>
            <p className="text-xs text-text-muted mt-0.5">Latest activity</p>
          </div>
          <button
            onClick={() => navigate('/calls')}
            className="flex items-center gap-1 text-sm text-primary-light hover:text-primary transition-colors font-medium"
          >
            View all
            <ChevronRight size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : recentCalls.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
              <Phone size={22} className="text-primary-light" />
            </div>
            <p className="text-text-muted">No calls yet. Start your first call!</p>
            <button
              onClick={() => navigate('/calls')}
              className="mt-4 px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-primary/25"
            >
              Make your first call
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/30">
                  <th className="text-left py-3.5 px-6 text-text-muted font-medium">Phone</th>
                  <th className="text-left py-3.5 px-6 text-text-muted font-medium">Assistant</th>
                  <th className="text-left py-3.5 px-6 text-text-muted font-medium">Status</th>
                  <th className="text-left py-3.5 px-6 text-text-muted font-medium">Duration</th>
                  <th className="text-left py-3.5 px-6 text-text-muted font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentCalls.map(call => (
                  <tr
                    key={call._id}
                    className="border-b border-border/30 hover:bg-surface/30 transition-colors cursor-pointer"
                    onClick={() => navigate('/calls')}
                  >
                    <td className="py-4 px-6 text-white font-mono">{call.customerPhone}</td>
                    <td className="py-4 px-6 text-text-muted">{call.assistantId?.name || '—'}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 ${
                        call.status === 'completed' ? 'bg-success/20 text-success' :
                        call.status === 'in-progress' ? 'bg-primary/20 text-primary-light' :
                        call.status === 'failed' ? 'bg-danger/20 text-danger' :
                        'bg-accent/20 text-accent'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          call.status === 'completed' ? 'bg-success' :
                          call.status === 'in-progress' ? 'bg-primary-light animate-pulse' :
                          call.status === 'failed' ? 'bg-danger' : 'bg-accent'
                        }`} />
                        {call.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-text-muted">{call.duration ? `${call.duration}s` : '—'}</td>
                    <td className="py-4 px-6 text-text-muted">
                      {new Date(call.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
