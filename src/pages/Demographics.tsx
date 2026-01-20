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
  LineChart,
  Line,
} from 'recharts';
import { format } from 'date-fns';
import { UserCog, TrendingUp, Activity, ArrowUp } from 'lucide-react';
import { fetchDemographicTrends, fetchKPIs, type TrendDataPoint, type KPIData } from '../api';

interface DemographicsProps {
  simulationDate: Date;
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color = 'purple',
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  color?: string;
}) {
  const colorClasses = {
    purple: 'bg-purple-500/20 text-purple-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon size={24} />
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

export default function Demographics({ simulationDate }: DemographicsProps) {
  const dateStr = format(simulationDate, 'yyyy-MM-dd');

  const { data: kpis } = useQuery<KPIData>({
    queryKey: ['kpis', dateStr],
    queryFn: () => fetchKPIs(simulationDate),
  });

  const { data: trends, isLoading } = useQuery<TrendDataPoint[]>({
    queryKey: ['demographic-trends', dateStr],
    queryFn: () => fetchDemographicTrends(simulationDate),
  });

  const chartData = Array.isArray(trends) ? trends.map((t) => ({
    date: format(new Date(t.date), 'MMM d'),
    updates: t.total,
  })) : [];

  const totalUpdates = kpis?.total_demo_updates_30d || 0;
  const avgDaily = trends?.length ? Math.round(totalUpdates / trends.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Demographics</h1>
        <p className="text-slate-400 mt-1">
          Demographic update analytics and patterns
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Updates"
          value={totalUpdates.toLocaleString()}
          change="+15.3%"
          icon={UserCog}
          color="purple"
        />
        <StatCard
          title="Daily Average"
          value={avgDaily.toLocaleString()}
          change="+9.7%"
          icon={TrendingUp}
          color="cyan"
        />
        <StatCard
          title="Active Districts"
          value={(kpis?.active_districts || 0).toLocaleString()}
          change="+2.1%"
          icon={Activity}
          color="emerald"
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
          <h2 className="text-xl font-semibold text-white mb-4">Update Trends</h2>
          {isLoading ? (
            <div className="h-64 skeleton rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="demoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
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
                  dataKey="updates"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fill="url(#demoGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Weekly Pattern</h2>
          {isLoading ? (
            <div className="h-64 skeleton rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData.slice(-21)}>
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
                <Line
                  type="monotone"
                  dataKey="updates"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={{ fill: '#a855f7', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </div>
  );
}
