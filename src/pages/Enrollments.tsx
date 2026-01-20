import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { format } from 'date-fns';
import { Users, TrendingUp, Calendar, ArrowUp } from 'lucide-react';
import { fetchEnrollmentTrends, fetchKPIs, type TrendDataPoint, type KPIData } from '../api';

interface EnrollmentsProps {
  simulationDate: Date;
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-cyan-500/20">
          <Icon className="text-cyan-400" size={24} />
        </div>
        <div className="flex items-center gap-1 text-emerald-400 text-sm">
          <ArrowUp size={16} />
          <span>{change}</span>
        </div>
      </div>
      <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </motion.div>
  );
}

export default function Enrollments({ simulationDate }: EnrollmentsProps) {
  const dateStr = format(simulationDate, 'yyyy-MM-dd');

  const { data: kpis } = useQuery<KPIData>({
    queryKey: ['kpis', dateStr],
    queryFn: () => fetchKPIs(simulationDate),
  });

  const { data: trends, isLoading: trendsLoading } = useQuery<TrendDataPoint[]>({
    queryKey: ['enrollment-trends', dateStr],
    queryFn: () => fetchEnrollmentTrends(simulationDate),
  });

  const chartData = Array.isArray(trends) ? trends.map((t) => ({
    date: format(new Date(t.date), 'MMM d'),
    enrollments: t.total,
  })) : [];

  // Calculate stats
  const totalEnrollments = kpis?.total_enrollments_30d || 0;
  const avgDaily = trends?.length ? Math.round(totalEnrollments / trends.length) : 0;
  const maxDay = Array.isArray(trends) ? trends.reduce((max, t) => (t.total > max.total ? t : max), { total: 0, date: '' }) : { total: 0, date: '' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Enrollments</h1>
        <p className="text-slate-400 mt-1">
          Aadhaar enrollment analytics and trends
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Enrollments"
          value={totalEnrollments.toLocaleString()}
          change="+12.5%"
          icon={Users}
        />
        <StatCard
          title="Daily Average"
          value={avgDaily.toLocaleString()}
          change="+8.2%"
          icon={TrendingUp}
        />
        <StatCard
          title="Peak Day"
          value={maxDay?.date ? format(new Date(maxDay.date), 'MMM d') : '-'}
          change={`${maxDay?.total?.toLocaleString() || 0}`}
          icon={Calendar}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Enrollment Trend</h2>
          {trendsLoading ? (
            <div className="h-64 skeleton rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="enrollGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="enrollments"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#enrollGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Daily Distribution</h2>
          {trendsLoading ? (
            <div className="h-64 skeleton rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                />
                <Bar
                  dataKey="enrollments"
                  fill="#06b6d4"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </div>
  );
}
