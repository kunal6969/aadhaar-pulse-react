import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import {
  Users,
  UserCog,
  Fingerprint,
  MapPin,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Target,
  BarChart3,
  PieChartIcon,
} from 'lucide-react';
import {
  fetchKPIs,
  fetchEnrollmentSummary,
  fetchDemographicSummary,
  fetchBiometricSummary,
  fetchEnrollmentTrends,
  fetchDemographicTrends,
  fetchBiometricTrends,
  type KPIData,
  type EnrollmentSummary,
  type DemographicSummary,
  type BiometricSummary,
  type TrendDataPoint,
  type LocationFilter,
} from '../api';
import { useLocationContext } from '../context/LocationContext';

interface DashboardProps {
  simulationDate: Date;
}

// Colors for charts
const COLORS = {
  cyan: '#06b6d4',
  purple: '#a855f7',
  emerald: '#10b981',
  orange: '#f97316',
  pink: '#ec4899',
  blue: '#3b82f6',
};

// Format large numbers
function formatNumber(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

// KPI Card Component
function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
  trendValue,
  gradient,
  delay,
}: {
  title: string;
  value: number | string;
  subValue?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  gradient: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-gradient-to-br ${gradient} p-[1px] rounded-2xl`}
    >
      <div className="bg-[#0f172a] rounded-2xl p-5 h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-slate-800/50">
            <Icon className="text-cyan-400" size={20} />
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-sm ${
                trend === 'up'
                  ? 'text-emerald-400'
                  : trend === 'down'
                  ? 'text-red-400'
                  : 'text-slate-400'
              }`}
            >
              {trend === 'up' ? (
                <TrendingUp size={16} />
              ) : trend === 'down' ? (
                <TrendingDown size={16} />
              ) : null}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <h3 className="text-slate-400 text-xs font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold text-white">
          {typeof value === 'number' ? formatNumber(value) : value}
        </p>
        {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
      </div>
    </motion.div>
  );
}

// Section Header
function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-slate-800">
        <Icon className="text-cyan-400" size={20} />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

// Loading Skeleton
function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={`skeleton rounded-2xl animate-pulse bg-slate-800 ${className}`} />;
}

export default function Dashboard({ simulationDate }: DashboardProps) {
  const dateStr = format(simulationDate, 'yyyy-MM-dd');
  const { selectedState, selectedDistrict, locationLabel } = useLocationContext();

  const filter: LocationFilter = {
    state: selectedState,
    district: selectedDistrict,
  };

  // Fetch comprehensive KPIs (All India only)
  const { data: kpis, isLoading: kpisLoading } = useQuery<KPIData>({
    queryKey: ['kpis', dateStr],
    queryFn: () => fetchKPIs(simulationDate),
  });

  // Fetch Enrollment Summary (with location filter)
  const { data: enrollmentSummary, isLoading: enrollmentLoading } = useQuery<EnrollmentSummary>({
    queryKey: ['enrollment-summary', dateStr, selectedState, selectedDistrict],
    queryFn: () => fetchEnrollmentSummary(simulationDate, filter),
  });

  // Fetch Demographic Summary (with location filter)
  const { data: demographicSummary, isLoading: demographicLoading } = useQuery<DemographicSummary>({
    queryKey: ['demographic-summary', dateStr, selectedState, selectedDistrict],
    queryFn: () => fetchDemographicSummary(simulationDate, filter),
  });

  // Fetch Biometric Summary (with location filter)
  const { data: biometricSummary, isLoading: biometricLoading } = useQuery<BiometricSummary>({
    queryKey: ['biometric-summary', dateStr, selectedState, selectedDistrict],
    queryFn: () => fetchBiometricSummary(simulationDate, filter),
  });

  // Fetch Trends (with location filter)
  const { data: enrollmentTrends, isLoading: enrollmentTrendsLoading } = useQuery<TrendDataPoint[]>({
    queryKey: ['enrollment-trends', dateStr, selectedState, selectedDistrict],
    queryFn: () => fetchEnrollmentTrends(simulationDate, filter),
  });

  const { data: demographicTrends } = useQuery<TrendDataPoint[]>({
    queryKey: ['demographic-trends', dateStr, selectedState, selectedDistrict],
    queryFn: () => fetchDemographicTrends(simulationDate, filter),
  });

  const { data: biometricTrends } = useQuery<TrendDataPoint[]>({
    queryKey: ['biometric-trends', dateStr, selectedState, selectedDistrict],
    queryFn: () => fetchBiometricTrends(simulationDate, filter),
  });

  // Prepare chart data
  const enrollmentChartData = Array.isArray(enrollmentTrends)
    ? enrollmentTrends.slice(-30).map((t) => ({
        date: format(new Date(t.date), 'MMM d'),
        total: t.total,
        age_0_5: t.age_0_5 || 0,
        age_5_17: t.age_5_17 || 0,
        age_18_plus: t.age_18_plus || 0,
      }))
    : [];

  // Combined trends chart data
  const combinedTrendsData = Array.isArray(enrollmentTrends)
    ? enrollmentTrends.slice(-14).map((e, idx) => {
        const demoPoint = Array.isArray(demographicTrends) ? demographicTrends[idx] : null;
        const bioPoint = Array.isArray(biometricTrends) ? biometricTrends[idx] : null;
        return {
          date: format(new Date(e.date), 'MMM d'),
          enrollments: e.total,
          demographics: demoPoint?.total || 0,
          biometrics: bioPoint?.total || 0,
        };
      })
    : [];

  // Age distribution pie chart data for enrollments
  const enrollmentAgeData = enrollmentSummary
    ? [
        { name: 'Age 0-5', value: enrollmentSummary.age_0_5_total, color: COLORS.cyan },
        { name: 'Age 5-17', value: enrollmentSummary.age_5_17_total, color: COLORS.purple },
        { name: 'Age 18+', value: enrollmentSummary.age_18_plus_total, color: COLORS.emerald },
      ]
    : [];

  // Age distribution for demographic updates
  const demographicAgeData = demographicSummary
    ? [
        { name: 'Age 5-17', value: demographicSummary.age_5_17_total || 0, color: COLORS.purple },
        { name: 'Age 17+', value: demographicSummary.age_17_plus_total || 0, color: COLORS.orange },
      ]
    : [];

  // Age distribution for biometric updates
  const biometricAgeData = biometricSummary
    ? [
        { name: 'Age 5-17', value: biometricSummary.age_5_17_total || 0, color: COLORS.emerald },
        { name: 'Age 17+', value: biometricSummary.age_17_plus_total || 0, color: COLORS.pink },
      ]
    : [];

  // Top states data for bar chart
  const topStatesData = kpis?.top_5_states || [];

  const isLoading = kpisLoading || enrollmentLoading || demographicLoading || biometricLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Aadhaar Pulse Dashboard
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1.5 text-slate-400 text-sm">
              <Calendar size={14} />
              {format(simulationDate, 'MMMM d, yyyy')}
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5 text-cyan-400 text-sm font-medium">
              <MapPin size={14} />
              {locationLabel}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
          <Activity size={16} />
          <span>Live Data</span>
        </div>
      </div>

      {/* Today's Activity Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-slate-800 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="text-cyan-400" size={20} />
          <h2 className="text-lg font-semibold text-white">Today's Activity ({format(simulationDate, 'MMM d, yyyy')})</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-slate-900/50 rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="text-cyan-400" size={18} />
              <span className="text-slate-400 text-sm">New Enrollments</span>
            </div>
            <p className="text-3xl font-bold text-cyan-400">
              {isLoading ? '...' : formatNumber(enrollmentSummary?.total_enrollments_today || 0)}
            </p>
          </div>
          <div className="text-center p-4 bg-slate-900/50 rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-2">
              <UserCog className="text-purple-400" size={18} />
              <span className="text-slate-400 text-sm">Demographic Updates</span>
            </div>
            <p className="text-3xl font-bold text-purple-400">
              {isLoading ? '...' : formatNumber(demographicSummary?.total_updates_today || 0)}
            </p>
          </div>
          <div className="text-center p-4 bg-slate-900/50 rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Fingerprint className="text-emerald-400" size={18} />
              <span className="text-slate-400 text-sm">Biometric Updates</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400">
              {isLoading ? '...' : formatNumber(biometricSummary?.total_updates_today || 0)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <LoadingSkeleton key={i} className="h-32" />
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Enrollments (30d)"
              value={enrollmentSummary?.total_enrollments_30d || 0}
              subValue={`7d: ${formatNumber(enrollmentSummary?.total_enrollments_7d || 0)}`}
              icon={Users}
              trend={kpis && kpis.enrollment_growth_rate > 0 ? 'up' : kpis && kpis.enrollment_growth_rate < 0 ? 'down' : 'neutral'}
              trendValue={kpis ? `${kpis.enrollment_growth_rate.toFixed(1)}%` : ''}
              gradient="from-cyan-500/20 to-blue-500/20"
              delay={0}
            />
            <StatCard
              title="Demographics (30d)"
              value={demographicSummary?.total_updates_30d || 0}
              subValue={`7d: ${formatNumber(demographicSummary?.total_updates_7d || 0)}`}
              icon={UserCog}
              trend={kpis && kpis.demo_growth_rate > 0 ? 'up' : kpis && kpis.demo_growth_rate < 0 ? 'down' : 'neutral'}
              trendValue={kpis ? `${kpis.demo_growth_rate.toFixed(1)}%` : ''}
              gradient="from-purple-500/20 to-pink-500/20"
              delay={0.05}
            />
            <StatCard
              title="Biometrics (30d)"
              value={biometricSummary?.total_updates_30d || 0}
              subValue={`7d: ${formatNumber(biometricSummary?.total_updates_7d || 0)}`}
              icon={Fingerprint}
              gradient="from-emerald-500/20 to-teal-500/20"
              trend={kpis && kpis.bio_growth_rate > 0 ? 'up' : kpis && kpis.bio_growth_rate < 0 ? 'down' : 'neutral'}
              trendValue={kpis ? `${kpis.bio_growth_rate.toFixed(1)}%` : ''}
              delay={0.1}
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrollment Trends Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
        >
          <SectionHeader
            icon={BarChart3}
            title="Enrollment Trends"
            subtitle="Daily enrollments over last 30 days"
          />
          {enrollmentTrendsLoading ? (
            <LoadingSkeleton className="h-64" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={enrollmentChartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatNumber(v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value) => [(value as number)?.toLocaleString() || '0', 'Enrollments']}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke={COLORS.cyan}
                  strokeWidth={2}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Enrollment Age Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
        >
          <SectionHeader
            icon={PieChartIcon}
            title="Enrollment Age Distribution"
            subtitle="By age group (30d)"
          />
          {enrollmentLoading ? (
            <LoadingSkeleton className="h-64" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={enrollmentAgeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {enrollmentAgeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [formatNumber((value as number) || 0), 'Enrollments']}
                />
                <Legend
                  formatter={(value) => <span className="text-slate-400 text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Age Distribution Charts for Demographics & Biometrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demographic Age Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
        >
          <SectionHeader
            icon={UserCog}
            title="Demographic Updates by Age"
            subtitle="Age breakdown (30d)"
          />
          {demographicLoading ? (
            <LoadingSkeleton className="h-64" />
          ) : (
            <div className="flex items-center">
              <ResponsiveContainer width="60%" height={240}>
                <PieChart>
                  <Pie
                    data={demographicAgeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {demographicAgeData.map((entry, index) => (
                      <Cell key={`cell-demo-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [formatNumber((value as number) || 0), 'Updates']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-40% space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.purple }} />
                  <div>
                    <p className="text-xs text-slate-400">Age 5-17</p>
                    <p className="text-sm font-medium text-white">{formatNumber(demographicSummary?.age_5_17_total || 0)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.orange }} />
                  <div>
                    <p className="text-xs text-slate-400">Age 17+</p>
                    <p className="text-sm font-medium text-white">{formatNumber(demographicSummary?.age_17_plus_total || 0)}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-700">
                  <p className="text-xs text-slate-500">Total Updates</p>
                  <p className="text-lg font-bold text-purple-400">{formatNumber(demographicSummary?.total_updates_30d || 0)}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Biometric Age Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
        >
          <SectionHeader
            icon={Fingerprint}
            title="Biometric Updates by Age"
            subtitle="Age breakdown (30d)"
          />
          {biometricLoading ? (
            <LoadingSkeleton className="h-64" />
          ) : (
            <div className="flex items-center">
              <ResponsiveContainer width="60%" height={240}>
                <PieChart>
                  <Pie
                    data={biometricAgeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {biometricAgeData.map((entry, index) => (
                      <Cell key={`cell-bio-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [formatNumber((value as number) || 0), 'Updates']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-40% space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.emerald }} />
                  <div>
                    <p className="text-xs text-slate-400">Age 5-17</p>
                    <p className="text-sm font-medium text-white">{formatNumber(biometricSummary?.age_5_17_total || 0)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.pink }} />
                  <div>
                    <p className="text-xs text-slate-400">Age 17+</p>
                    <p className="text-sm font-medium text-white">{formatNumber(biometricSummary?.age_17_plus_total || 0)}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-700">
                  <p className="text-xs text-slate-500">Total Updates</p>
                  <p className="text-lg font-bold text-emerald-400">{formatNumber(biometricSummary?.total_updates_30d || 0)}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 States Bar Chart */}
        {!selectedState && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
          >
            <SectionHeader
              icon={BarChart3}
              title="Top 5 States by Activity"
              subtitle="Combined enrollment + demographic + biometric"
            />
            {kpisLoading ? (
              <LoadingSkeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topStatesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatNumber(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="state"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                    formatter={(value, name) => [
                      formatNumber((value as number) || 0),
                      name === 'enrollment_count'
                        ? 'Enrollments'
                        : name === 'demographic_count'
                        ? 'Demographics'
                        : 'Biometrics',
                    ]}
                  />
                  <Bar dataKey="enrollment_count" stackId="a" fill={COLORS.cyan} />
                  <Bar dataKey="demographic_count" stackId="a" fill={COLORS.purple} />
                  <Bar dataKey="biometric_count" stackId="a" fill={COLORS.emerald} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        )}

      </div>

      {/* Comparative Activity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
      >
        <SectionHeader
          icon={Activity}
          title="Activity Comparison"
          subtitle="Enrollments vs Demographics vs Biometrics (last 14 days)"
        />
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={combinedTrendsData}>
            <defs>
              <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDemo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorBio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatNumber(v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
              formatter={(value, name) => [
                formatNumber((value as number) || 0),
                String(name).charAt(0).toUpperCase() + String(name).slice(1),
              ]}
            />
            <Legend
              formatter={(value) => (
                <span className="text-slate-400 text-xs capitalize">{value}</span>
              )}
            />
            <Area
              type="monotone"
              dataKey="enrollments"
              stroke={COLORS.cyan}
              strokeWidth={2}
              fill="url(#colorEnroll)"
            />
            <Area
              type="monotone"
              dataKey="demographics"
              stroke={COLORS.purple}
              strokeWidth={2}
              fill="url(#colorDemo)"
            />
            <Area
              type="monotone"
              dataKey="biometrics"
              stroke={COLORS.emerald}
              strokeWidth={2}
              fill="url(#colorBio)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
