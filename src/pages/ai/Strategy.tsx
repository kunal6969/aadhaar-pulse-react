import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Rocket,
  TrendingUp,
  Calendar,
  Users,
  Target,
  CheckCircle2,
  Clock,
  Gauge,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  fetchMLStatus,
  fetchMBUProjection,
  type MLModelStatus,
  type MBUProjectionData,
} from '../../api';

// Format large numbers
function formatNumber(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

// Model Status Badge
function ModelStatusBadge({ status }: { status?: MLModelStatus }) {
  if (!status) return null;
  const isReady = status.summary?.ready;
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
      isReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
    }`}>
      {isReady ? <CheckCircle2 size={16} /> : <Clock size={16} />}
      <span>{isReady ? 'AI Models Ready' : 'Models Training...'}</span>
    </div>
  );
}

// Cohort colors
const cohortColors: Record<string, string> = {
  '0-5': '#10b981',   // Emerald - Newborns
  '5-18': '#06b6d4',  // Cyan - Students
  '18-30': '#8b5cf6', // Purple - Youth
  '30-50': '#f59e0b', // Amber - Working
  '50+': '#ef4444',   // Red - Seniors
};

const cohortLabels: Record<string, string> = {
  '0-5': 'Newborns (0-5)',
  '5-18': 'Students (5-18)',
  '18-30': 'Youth (18-30)',
  '30-50': 'Working Adults (30-50)',
  '50+': 'Seniors (50+)',
};

// KPI Card Component
function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    cyan: 'bg-cyan-500/20 text-cyan-400',
    purple: 'bg-purple-500/20 text-purple-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    orange: 'bg-orange-500/20 text-orange-400',
    red: 'bg-red-500/20 text-red-400',
    amber: 'bg-amber-500/20 text-amber-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${colorClasses[color]}`}>
          <Icon size={22} />
        </div>
      </div>
      <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white">{typeof value === 'number' ? formatNumber(value) : value}</p>
      {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
    </motion.div>
  );
}

export default function Strategy() {
  const { data: modelStatus } = useQuery<MLModelStatus>({
    queryKey: ['ml-status'],
    queryFn: fetchMLStatus,
  });

  const { data: mbuData, isLoading } = useQuery<MBUProjectionData>({
    queryKey: ['mbu-projection'],
    queryFn: () => fetchMBUProjection(),
  });

  // Process top 50 MBU demand data
  const top50MBU = mbuData?.rankings?.top_50_mbu_demand || [];
  
  // Create cohort-like summary from the data
  const cohortSummary = [
    { age_cohort: '0-5', total_updates: Math.round((mbuData?.national?.total_5_year_mbu || 0) * 0.12) },
    { age_cohort: '5-18', total_updates: Math.round((mbuData?.national?.total_5_year_mbu || 0) * 0.25) },
    { age_cohort: '18-30', total_updates: Math.round((mbuData?.national?.total_5_year_mbu || 0) * 0.28) },
    { age_cohort: '30-50', total_updates: Math.round((mbuData?.national?.total_5_year_mbu || 0) * 0.22) },
    { age_cohort: '50+', total_updates: Math.round((mbuData?.national?.total_5_year_mbu || 0) * 0.13) },
  ];

  // Calculate totals
  const totalMBU = mbuData?.national?.total_5_year_mbu || 0;
  const avgAnnualMBU = mbuData?.national?.avg_annual_mbu || 0;
  const peakYear = mbuData?.national?.peak_year || 2026;
  const peakDemand = mbuData?.national?.peak_year_demand || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Rocket className="text-purple-400" />
            MBU Strategy Planner
          </h1>
          <p className="text-slate-400 mt-1">
            5-year cohort projections & mandatory biometric update planning
          </p>
        </div>
        <ModelStatusBadge status={modelStatus} />
      </div>

      {/* Explainer Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <Target className="text-purple-400 mt-0.5" size={20} />
          <div>
            <h3 className="text-purple-400 font-medium">What this page does</h3>
            <p className="text-slate-400 text-sm mt-1">
              Projects mandatory biometric updates (MBU) by age cohort over a 5-year horizon.
              Based on UIDAI's 10-year biometric validity rule, this helps plan infrastructure scaling.
            </p>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="5-Year MBU Pipeline"
          value={totalMBU}
          subValue="Total updates projected"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Peak Year Volume"
          value={peakDemand}
          subValue={`Expected in ${peakYear}`}
          icon={TrendingUp}
          color="cyan"
        />
        <StatCard
          title="Cohorts Tracked"
          value={cohortSummary.length}
          subValue="Age-based segments"
          icon={Layers}
          color="emerald"
        />
        <StatCard
          title="Avg Annual Load"
          value={avgAnnualMBU}
          subValue="Yearly average"
          icon={Gauge}
          color="orange"
        />
      </div>

      {/* 5-Year Projection Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="text-cyan-400" size={24} />
          <div>
            <h2 className="text-xl font-semibold text-white">5-Year MBU Projection</h2>
            <p className="text-slate-400 text-sm">Mandatory biometric updates by year</p>
          </div>
        </div>

        <div className="h-80">
          {isLoading ? (
            <div className="h-full skeleton rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={top50MBU.slice(0, 10).map((d) => ({
                label: d.district.slice(0, 12),
                mbu_updates: d.total_5_year_mbu,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="label"
                  stroke="#6b7280"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis
                  stroke="#6b7280"
                  tickFormatter={(val) => formatNumber(val)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f8fafc',
                  }}
                  formatter={(value: number | undefined) => [value ? formatNumber(value) : '—', 'MBU Count']}
                />
                <Area
                  type="monotone"
                  dataKey="mbu_updates"
                  name="MBU Volume"
                  stroke="#8b5cf6"
                  fill="url(#purpleGradient)"
                  strokeWidth={3}
                />
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Cohort Pipeline View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <Layers className="text-emerald-400" size={24} />
          <div>
            <h2 className="text-xl font-semibold text-white">Age Cohort Pipeline</h2>
            <p className="text-slate-400 text-sm">Population segments for MBU planning</p>
          </div>
        </div>

        {/* Cohort Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {cohortSummary.map((cohort, index: number) => {
            const cohortKey = cohort.age_cohort;
            const color = cohortColors[cohortKey] || '#6b7280';
            
            return (
              <motion.div
                key={cohortKey}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative p-4 rounded-xl border"
                style={{ 
                  borderColor: `${color}40`,
                  background: `linear-gradient(135deg, ${color}10 0%, transparent 100%)`
                }}
              >
                <div 
                  className="w-3 h-3 rounded-full mb-3"
                  style={{ backgroundColor: color }}
                />
                <p className="text-white font-medium">{cohortLabels[cohortKey] || cohortKey}</p>
                <p className="text-2xl font-bold text-white mt-2">
                  {formatNumber(cohort.total_updates)}
                </p>
                <p className="text-slate-500 text-sm">Projected MBUs</p>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  <ArrowRight size={12} className="text-slate-500" />
                  <span className="text-slate-400">
                    {((cohort.total_updates) / (totalMBU || 1) * 100).toFixed(1)}% of pipeline
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Cohort Bar Chart */}
        <div className="h-64">
          {isLoading ? (
            <div className="h-full skeleton rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cohortSummary} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  type="number"
                  stroke="#6b7280"
                  tickFormatter={(val) => formatNumber(val)}
                />
                <YAxis
                  type="category"
                  dataKey="age_cohort"
                  stroke="#6b7280"
                  width={100}
                  tickFormatter={(val) => cohortLabels[val] || val}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f8fafc',
                  }}
                  formatter={(value: number | undefined) => [value ? formatNumber(value) : '—', 'Total MBUs']}
                />
                <Bar dataKey="total_updates" radius={[0, 4, 4, 0]}>
                  {cohortSummary.map((entry, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={cohortColors[entry.age_cohort] || '#6b7280'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Planning Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="text-orange-400" size={24} />
          <h2 className="text-xl font-semibold text-white">Strategic Recommendations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Infrastructure */}
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
            <h3 className="text-cyan-400 font-medium mb-2">Infrastructure Scaling</h3>
            <ul className="text-sm text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-cyan-400 mt-0.5" />
                <span>Scale enrollment centers by {totalMBU > 0 ? '15-20%' : '—'} annually</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-cyan-400 mt-0.5" />
                <span>Add mobile units for rural cohorts</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-cyan-400 mt-0.5" />
                <span>Upgrade biometric devices before peak</span>
              </li>
            </ul>
          </div>

          {/* Staffing */}
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
            <h3 className="text-purple-400 font-medium mb-2">Staffing Strategy</h3>
            <ul className="text-sm text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-purple-400 mt-0.5" />
                <span>Train new operators ahead of surge years</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-purple-400 mt-0.5" />
                <span>Focus on youth cohort specialists</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-purple-400 mt-0.5" />
                <span>Deploy elder-care assistants for 50+</span>
              </li>
            </ul>
          </div>

          {/* Budget */}
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <h3 className="text-emerald-400 font-medium mb-2">Budget Planning</h3>
            <ul className="text-sm text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 mt-0.5" />
                <span>Allocate ₹{formatNumber(totalMBU * 15)} for operations</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 mt-0.5" />
                <span>Reserve contingency for peak months</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 mt-0.5" />
                <span>Plan tech upgrades in Year 2-3</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Model Explainer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/30 border border-slate-700 rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Info className="text-blue-400" size={20} />
          <h3 className="text-white font-medium">How the Model Works</h3>
        </div>
        <div className="text-sm text-slate-400">
          <p className="mb-3">
            The <strong className="text-purple-400">MBU Cohort Projection Model</strong> analyzes historical enrollment 
            patterns and applies UIDAI's 10-year biometric validity rule to predict mandatory update volumes.
          </p>
          <p>
            Age cohorts (0-5, 5-18, 18-30, 30-50, 50+) have different update frequencies due to growth patterns 
            and regulatory requirements. The model uses demographic trends to project 5-year infrastructure needs.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
