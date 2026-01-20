import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  ReferenceLine,
} from 'recharts';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Target,
  Activity,
  CheckCircle2,
  Clock,
  Cpu,
  MapPin,
  Building2,
  Globe,
  ArrowRight,
  Zap,
  BarChart3,
  TrendingDown,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import {
  fetchMLStatus,
  fetchCapacityPlanning,
  type MLModelStatus,
  type CapacityPlanningData,
} from '../../api';
import { useLocationContext } from '../../context/LocationContext';

// ==================== UTILITIES ====================

function formatNumber(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

function getStressColor(csi: number): string {
  if (csi > 15) return 'text-red-500';
  if (csi > 10) return 'text-orange-400';
  if (csi > 5) return 'text-amber-400';
  return 'text-emerald-400';
}

function getStressLevel(csi: number): string {
  if (csi > 15) return 'Critical';
  if (csi > 10) return 'High';
  if (csi > 5) return 'Medium';
  return 'Low';
}

function getStressBg(csi: number): string {
  if (csi > 15) return 'bg-red-500/20';
  if (csi > 10) return 'bg-orange-500/20';
  if (csi > 5) return 'bg-amber-500/20';
  return 'bg-emerald-500/20';
}

// Get current and next month names based on simulation date
function getMonthNames(simulationDate: Date) {
  const currentMonth = simulationDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const nextMonth = new Date(simulationDate.getFullYear(), simulationDate.getMonth() + 1, 1)
    .toLocaleString('default', { month: 'long', year: 'numeric' });
  return { currentMonth, nextMonth };
}

// Generate daily data for a month based on simulation date
function generateMonthlyDemandData(
  avgDemand: number, 
  _p95Demand: number, 
  recommendedOperators: number, 
  serviceCapacity: number,
  simulationDate: Date
) {
  const daysInMonth = new Date(simulationDate.getFullYear(), simulationDate.getMonth() + 1, 0).getDate();
  const selectedDay = simulationDate.getDate();
  
  const data = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(simulationDate.getFullYear(), simulationDate.getMonth(), day);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Base demand with variation
    let baseDemand = avgDemand;
    
    // Weekend reduction (35% of weekday)
    if (isWeekend) {
      baseDemand *= 0.35;
    }
    
    // Add some daily variation (±15%)
    const variation = 1 + (Math.sin(day * 0.5) * 0.15);
    const demand = Math.round(baseDemand * variation);
    
    // Capacity is what we can handle with recommended operators
    const capacity = Math.round(recommendedOperators * serviceCapacity);
    
    data.push({
      day: day,
      date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      dayName: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      demand,
      capacity,
      isWeekend,
      isPast: day <= selectedDay,
      isFuture: day > selectedDay,
    });
  }
  
  return data;
}

// ==================== COMPONENTS ====================

function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const colorClasses: Record<string, string> = {
    cyan: 'bg-cyan-500/20 text-cyan-400',
    purple: 'bg-purple-500/20 text-purple-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    orange: 'bg-orange-500/20 text-orange-400',
    red: 'bg-red-500/20 text-red-400',
    blue: 'bg-blue-500/20 text-blue-400',
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
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${
            trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'
          }`}>
            {trend === 'up' ? <TrendingUp size={16} /> : trend === 'down' ? <TrendingDown size={16} /> : null}
          </div>
        )}
      </div>
      <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white">{typeof value === 'number' ? formatNumber(value) : value}</p>
      {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
    </motion.div>
  );
}

function ModelStatusBadge({ status }: { status?: MLModelStatus }) {
  if (!status) return null;
  const isReady = status.summary?.ready;
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
      isReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
    }`}>
      {isReady ? <CheckCircle2 size={16} /> : <Clock size={16} />}
      <span>{isReady ? 'AI Models Ready' : 'Models Training...'}</span>
      <span className="text-xs opacity-70">({status.summary?.trained}/{status.summary?.total})</span>
    </div>
  );
}

function LocationBreadcrumb({ 
  state, 
  district, 
  locationLabel 
}: { 
  state: string | null; 
  district: string | null;
  locationLabel: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Globe size={16} className="text-cyan-400" />
      <span className="text-slate-400">Viewing:</span>
      <span className="text-white font-medium">{locationLabel}</span>
      {state && !district && (
        <span className="text-cyan-400 text-xs bg-cyan-500/20 px-2 py-0.5 rounded">State Level</span>
      )}
      {district && (
        <span className="text-purple-400 text-xs bg-purple-500/20 px-2 py-0.5 rounded">District Level</span>
      )}
      {!state && !district && (
        <span className="text-emerald-400 text-xs bg-emerald-500/20 px-2 py-0.5 rounded">National Level</span>
      )}
    </div>
  );
}

// Leaderboard Row Component
function LeaderboardRow({ 
  rank, 
  name, 
  subName,
  operators, 
  utilization,
  stressIndex,
}: { 
  rank: number;
  name: string;
  subName?: string;
  operators: number;
  utilization: number;
  stressIndex: number;
}) {
  const rankColors: Record<number, string> = {
    1: 'bg-yellow-500 text-yellow-900',
    2: 'bg-slate-300 text-slate-800',
    3: 'bg-amber-600 text-amber-100',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.03 }}
      className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
    >
      {/* Rank */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        rankColors[rank] || 'bg-slate-700 text-slate-300'
      }`}>
        {rank}
      </div>
      
      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{name}</p>
        {subName && <p className="text-slate-500 text-xs truncate">{subName}</p>}
      </div>
      
      {/* Operators Needed */}
      <div className="text-right">
        <p className="text-cyan-400 font-mono font-bold">{operators.toLocaleString()}</p>
        <p className="text-slate-500 text-xs">operators</p>
      </div>
      
      {/* Utilization */}
      <div className="text-right w-16">
        <p className={`font-mono text-sm ${
          utilization > 0.85 ? 'text-red-400' : utilization > 0.7 ? 'text-amber-400' : 'text-emerald-400'
        }`}>
          {(utilization * 100).toFixed(0)}%
        </p>
        <p className="text-slate-500 text-xs">util.</p>
      </div>
      
      {/* Stress Badge */}
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStressBg(stressIndex)} ${getStressColor(stressIndex)}`}>
        {getStressLevel(stressIndex)}
      </div>
    </motion.div>
  );
}

// ==================== MAIN COMPONENT ====================

interface OperationsProps {
  simulationDate: Date;
}

export default function Operations({ simulationDate }: OperationsProps) {
  const [selectedPeriod] = useState<string | undefined>();
  const { selectedState, selectedDistrict, locationLabel } = useLocationContext();
  const { currentMonth, nextMonth } = getMonthNames(simulationDate);

  const { data: modelStatus } = useQuery<MLModelStatus>({
    queryKey: ['ml-status'],
    queryFn: fetchMLStatus,
  });

  const level = selectedDistrict ? 'district' : selectedState ? 'state' : 'national';

  const { data: capacityData, isLoading } = useQuery<CapacityPlanningData>({
    queryKey: ['capacity-planning', selectedState, selectedDistrict, selectedPeriod, level],
    queryFn: () => fetchCapacityPlanning(
      selectedState || undefined, 
      selectedDistrict || undefined,
      selectedPeriod, 
      level
    ),
  });

  // Fetch all states for national view
  const { data: statesData } = useQuery<CapacityPlanningData>({
    queryKey: ['capacity-states'],
    queryFn: () => fetchCapacityPlanning(undefined, undefined, undefined, 'all_states'),
    enabled: !selectedState && !selectedDistrict,
  });

  // Extract KPIs
  const kpis = useMemo(() => {
    if (selectedDistrict && capacityData?.districts) {
      const districtInfo = capacityData.districts.find(d => d.district === selectedDistrict);
      return {
        avgDemand: districtInfo?.avg_daily_demand || 0,
        p95Demand: districtInfo?.p95_daily_demand || districtInfo?.peak_daily_demand || 0,
        peakDemand: districtInfo?.peak_daily_demand || 0,
        recommendedOperators: districtInfo?.recommended_operators || districtInfo?.operators_needed_peak || 0,
        peakSurgeOperators: districtInfo?.peak_surge_operators || 0,
        utilization: districtInfo?.utilization || 0,
        avgWaitMinutes: districtInfo?.avg_wait_minutes || 0,
        serviceLevel: districtInfo?.service_level || 0.8,
        weekendOperators: districtInfo?.weekend_operators || 0,
        serviceCapacity: districtInfo?.service_capacity_per_operator || 32.5,
        stressIndex: districtInfo?.capacity_stress_index || districtInfo?.capacity_stress_score || 0,
        weekendGap: districtInfo?.weekend_gap || 0,
        cv: districtInfo?.coefficient_of_variation || 0,
        totalTransactions: districtInfo?.total_transactions || 0,
        daysOfData: districtInfo?.days_of_data || 30,
      };
    }
    if (selectedState) {
      const stateData = capacityData?.summary;
      return {
        avgDemand: stateData?.avg_daily_demand || 0,
        p95Demand: stateData?.p95_daily_demand || stateData?.peak_daily_demand || 0,
        peakDemand: stateData?.peak_daily_demand || 0,
        recommendedOperators: stateData?.recommended_operators || stateData?.operators_needed_peak || 0,
        peakSurgeOperators: stateData?.peak_surge_operators || 0,
        utilization: stateData?.utilization || 0,
        avgWaitMinutes: stateData?.avg_wait_minutes || 0,
        serviceLevel: stateData?.service_level || 0.8,
        weekendOperators: stateData?.weekend_operators || 0,
        serviceCapacity: stateData?.service_capacity_per_operator || 32.5,
        stressIndex: stateData?.capacity_stress_index || stateData?.capacity_stress_score || 0,
        weekendGap: stateData?.weekend_gap || 0,
        cv: stateData?.coefficient_of_variation || 0,
        totalTransactions: 0,
        daysOfData: 30,
      };
    }
    // National level
    const summary = capacityData?.summary;
    const data = capacityData?.data;
    return {
      avgDemand: summary?.avg_daily_demand || data?.avg_daily_demand || 0,
      p95Demand: summary?.p95_daily_demand || data?.p95_daily_demand || 0,
      peakDemand: summary?.peak_daily_demand || data?.peak_daily_demand || 0,
      recommendedOperators: summary?.recommended_operators || data?.recommended_fte_operators || data?.operators_for_p95 || 0,
      peakSurgeOperators: summary?.peak_surge_operators || data?.peak_surge_operators || 0,
      utilization: summary?.utilization || data?.utilization_at_p95 || 0,
      avgWaitMinutes: summary?.avg_wait_minutes || data?.avg_wait_minutes || 0,
      serviceLevel: summary?.service_level || data?.service_level || 0.8,
      weekendOperators: summary?.weekend_operators || data?.weekend_operators || 0,
      serviceCapacity: summary?.service_capacity_per_operator || data?.service_capacity_per_operator_per_day || 32.5,
      stressIndex: summary?.capacity_stress_index || data?.capacity_stress_index || 0,
      weekendGap: 0,
      cv: 0,
      totalTransactions: 0,
      daysOfData: 30,
    };
  }, [selectedDistrict, selectedState, capacityData]);

  const methodology = capacityData?.methodology;

  // Generate monthly demand chart data
  const monthlyData = useMemo(() => {
    return generateMonthlyDemandData(kpis.avgDemand, kpis.p95Demand, kpis.recommendedOperators, kpis.serviceCapacity, simulationDate);
  }, [kpis.avgDemand, kpis.p95Demand, kpis.recommendedOperators, kpis.serviceCapacity, simulationDate]);

  // Get top 10 states for national view
  const topStates = useMemo(() => {
    const statesObj = statesData?.states || capacityData?.by_state || {};
    return Object.entries(statesObj)
      .map(([state, data]) => ({
        state,
        recommended_operators: data.recommended_operators || data.operators_needed_peak || 0,
        avg_daily_demand: data.avg_daily_demand || 0,
        utilization: data.utilization || 0,
        capacity_stress_index: data.capacity_stress_index || 0,
        ...data,
      }))
      .sort((a, b) => b.recommended_operators - a.recommended_operators)
      .slice(0, 10);
  }, [statesData, capacityData]);

  // Normalized district type for leaderboards
  interface NormalizedDistrict {
    state: string;
    district: string;
    recommended_operators: number;
    utilization: number;
    capacity_stress_index: number;
  }

  // Get top 20 districts nationally or top 10 for state
  const topDistricts = useMemo((): NormalizedDistrict[] => {
    if (selectedState) {
      return (capacityData?.districts || []).slice(0, 10).map(d => ({
        state: d.state,
        district: d.district,
        recommended_operators: d.recommended_operators || d.operators_needed_peak || 0,
        utilization: d.utilization || 0,
        capacity_stress_index: d.capacity_stress_index || d.capacity_stress_score || 0,
      }));
    }
    const rawData = capacityData?.top_50_needy?.slice(0, 20) || 
                    capacityData?.districts?.slice(0, 20) ||
                    capacityData?.rankings?.top_50_needy?.slice(0, 20) || [];
    return rawData.map(d => ({
      state: d.state,
      district: d.district,
      recommended_operators: d.recommended_operators || d.operators_needed_peak || 0,
      utilization: d.utilization || 0,
      capacity_stress_index: d.capacity_stress_index || d.capacity_stress_score || 0,
    }));
  }, [selectedState, capacityData]);

  return (
    <div className="space-y-6">
      {/* Metrics Explanation */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/60 rounded-xl p-4">
          <h4 className="text-cyan-400 font-semibold mb-1 text-sm flex items-center gap-1"><CheckCircle2 size={16}/> SLA</h4>
          <p className="text-slate-300 text-xs">% served within 5 min. Target: 80%.</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4">
          <h4 className="text-amber-400 font-semibold mb-1 text-sm flex items-center gap-1"><AlertTriangle size={16}/> Capacity Stress Index</h4>
          <p className="text-slate-300 text-xs">How unpredictable demand is. Higher = more queues.</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4">
          <h4 className="text-purple-400 font-semibold mb-1 text-sm flex items-center gap-1"><Users size={16}/> Recommended Operators</h4>
          <p className="text-slate-300 text-xs">Minimum staff needed for 80% SLA.</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-purple-500/20">
              <Users className="text-purple-400" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-white">AI Operations Planner</h1>
          </div>
          <p className="text-slate-400">
            Operator staffing predictions for <span className="text-cyan-400 font-medium">{nextMonth}</span> based on {currentMonth} patterns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ModelStatusBadge status={modelStatus} />
        </div>
      </div>

      {/* Location Breadcrumb */}
      <LocationBreadcrumb 
        state={selectedState} 
        district={selectedDistrict} 
        locationLabel={locationLabel} 
      />

      {/* Methodology Card */}
      {methodology && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <h3 className="text-white font-medium mb-2 flex items-center gap-2">
            <Cpu size={18} className="text-purple-400" />
            Mathematical Model: {methodology.model || 'Erlang-C Queueing Theory'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Service Time</p>
              <p className="text-white font-medium">{methodology.service_time_minutes || 12} min/transaction</p>
            </div>
            <div>
              <p className="text-slate-400">Productive Hours</p>
              <p className="text-white font-medium">{methodology.productive_hours_per_day || 6.5} hrs/day</p>
            </div>
            <div>
              <p className="text-slate-400">Target SLA</p>
              <p className="text-white font-medium">{methodology.target_service_level || '80% within 5 min'}</p>
            </div>
            <div>
              <p className="text-slate-400">Stress Formula</p>
              <p className="text-cyan-400 font-mono text-xs">{methodology.stress_index || 'Peak/P95 × (1+CV) × log(Vol)'}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={`P95 Daily Demand`}
          value={kpis.p95Demand}
          subValue={`Avg: ${formatNumber(kpis.avgDemand)}/day`}
          icon={Activity}
          color="cyan"
          trend="up"
        />
        <StatCard
          title={`Operators for ${nextMonth}`}
          value={kpis.recommendedOperators}
          subValue={`+${kpis.peakSurgeOperators || 0} surge capacity`}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Projected Utilization"
          value={`${((kpis.utilization || 0) * 100).toFixed(1)}%`}
          subValue={kpis.utilization > 0.85 ? 'High load - add staff' : 'Healthy range'}
          icon={AlertTriangle}
          color={kpis.utilization > 0.85 ? 'orange' : 'emerald'}
        />
        <StatCard
          title="Avg Wait Time"
          value={`${(kpis.avgWaitMinutes || 0).toFixed(1)} min`}
          subValue={`SLA: ${((kpis.serviceLevel || 0.8) * 100).toFixed(0)}% within 5 min`}
          icon={Clock}
          color="blue"
        />
      </div>

      {/* Monthly Demand & Capacity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <BarChart3 className="text-cyan-400" size={24} />
              {currentMonth} Demand vs Capacity
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Daily transaction demand with capacity planning threshold (full month)
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="text-slate-400">Demand</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-orange-500" />
              <span className="text-slate-400">Capacity</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-purple-500" />
              <span className="text-slate-400">P95</span>
            </div>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={11}
                tickFormatter={(value, index) => index % 3 === 0 ? value : ''}
              />
              <YAxis stroke="#64748b" tickFormatter={(v) => formatNumber(v)} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f8fafc' }}
                formatter={(value, name) => [
                  formatNumber(Number(value) || 0),
                  name === 'demand' ? 'Demand' : 'Capacity'
                ]}
              />
              <Area
                type="monotone"
                dataKey="demand"
                fill="#06b6d4"
                fillOpacity={0.3}
                stroke="#06b6d4"
                strokeWidth={2}
                name="demand"
              />
              <Line
                type="monotone"
                dataKey="capacity"
                stroke="#f97316"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="capacity"
                dot={false}
              />
              <ReferenceLine 
                y={kpis.p95Demand} 
                stroke="#a855f7" 
                strokeDasharray="3 3" 
                label={{ value: 'P95', fill: '#a855f7', fontSize: 11, position: 'right' }} 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
          <p className="text-slate-300 text-sm">
            <span className="text-cyan-400 font-medium">Forecast:</span> Based on {currentMonth} patterns, 
            we predict <span className="text-white font-medium">{formatNumber(kpis.recommendedOperators)}</span> operators 
            needed for <span className="text-cyan-400">{nextMonth}</span> to maintain {((kpis.serviceLevel || 0.8) * 100).toFixed(0)}% SLA.
          </p>
        </div>
      </motion.div>

      {/* ==================== NATIONAL VIEW ==================== */}
      {!selectedState && !selectedDistrict && (
        <>
          {/* Top 10 States Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <MapPin className="text-orange-400" size={24} />
                  Top 10 States Requiring Staff
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Predicted staffing requirements for <span className="text-cyan-400 font-medium">{nextMonth}</span>
                </p>
              </div>
              <div className="bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1">
                <Zap size={14} />
                Next Month Forecast
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 bg-slate-800/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {topStates.map((state, index) => (
                  <LeaderboardRow
                    key={state.state}
                    rank={index + 1}
                    name={state.state}
                    operators={state.recommended_operators}
                    utilization={state.utilization}
                    stressIndex={state.capacity_stress_index}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* Top 20 Districts Nationally */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Building2 className="text-purple-400" size={24} />
                  Top 20 Districts Requiring Staff (National)
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Districts across India with highest staffing needs for <span className="text-cyan-400 font-medium">{nextMonth}</span>
                </p>
              </div>
              <div className="bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1">
                <Target size={14} />
                Priority Allocation
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-14 bg-slate-800/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column: Ranks 1-10 */}
                <div className="space-y-2">
                  {topDistricts.slice(0, 10).map((district, index) => (
                    <LeaderboardRow
                      key={`${district.state}-${district.district}`}
                      rank={index + 1}
                      name={district.district}
                      subName={district.state}
                      operators={district.recommended_operators}
                      utilization={district.utilization}
                      stressIndex={district.capacity_stress_index}
                    />
                  ))}
                </div>
                {/* Right Column: Ranks 11-20 */}
                <div className="space-y-2">
                  {topDistricts.slice(10, 20).map((district, index) => (
                    <LeaderboardRow
                      key={`${district.state}-${district.district}`}
                      rank={index + 11}
                      name={district.district}
                      subName={district.state}
                      operators={district.recommended_operators}
                      utilization={district.utilization}
                      stressIndex={district.capacity_stress_index}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* ==================== STATE VIEW ==================== */}
      {selectedState && !selectedDistrict && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Building2 className="text-purple-400" size={24} />
                Top 10 Districts in {selectedState}
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Staffing requirements for <span className="text-cyan-400 font-medium">{nextMonth}</span> — Click sidebar to drill down
              </p>
            </div>
            <div className="bg-cyan-500/20 text-cyan-400 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1">
              <ArrowRight size={14} />
              Select District for Details
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-800/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {topDistricts.map((district, index) => (
                <LeaderboardRow
                  key={district.district}
                  rank={index + 1}
                  name={district.district}
                  operators={district.recommended_operators}
                  utilization={district.utilization}
                  stressIndex={district.capacity_stress_index}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ==================== DISTRICT VIEW ==================== */}
      {selectedDistrict && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="text-purple-400" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-white">{selectedDistrict} — Detailed Analysis</h2>
              <p className="text-slate-400 text-sm">{selectedState} • Prediction for {nextMonth}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Historical Performance */}
            <div className="space-y-4">
              <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                <BarChart3 size={14} />
                Historical Analysis ({currentMonth})
              </h3>
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <p className="text-slate-400 text-sm">Average Daily Demand</p>
                <p className="text-2xl font-bold text-cyan-400">{formatNumber(kpis.avgDemand)}</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <p className="text-slate-400 text-sm">P95 Peak Demand</p>
                <p className="text-2xl font-bold text-purple-400">{formatNumber(kpis.p95Demand)}</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <p className="text-slate-400 text-sm">Demand Variability (CV)</p>
                <p className="text-2xl font-bold text-amber-400">{(kpis.cv * 100).toFixed(1)}%</p>
                <p className="text-slate-500 text-xs mt-1">Higher = more variable demand</p>
              </div>
              {kpis.totalTransactions > 0 && (
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <p className="text-slate-400 text-sm">Total Transactions</p>
                  <p className="text-2xl font-bold text-emerald-400">{formatNumber(kpis.totalTransactions)}</p>
                  <p className="text-slate-500 text-xs mt-1">over {kpis.daysOfData} days</p>
                </div>
              )}
            </div>

            {/* Predictions for Next Month */}
            <div className="space-y-4">
              <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                <Zap size={14} />
                Predictions for {nextMonth}
              </h3>
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <p className="text-slate-400 text-sm">Recommended FTE Operators</p>
                <p className="text-3xl font-bold text-purple-400">{kpis.recommendedOperators.toLocaleString()}</p>
                <p className="text-slate-500 text-xs mt-1">+{kpis.peakSurgeOperators} for surge capacity</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <p className="text-slate-400 text-sm">Weekend Operators (70%)</p>
                <p className="text-2xl font-bold text-blue-400">{kpis.weekendOperators || Math.round(kpis.recommendedOperators * 0.7)}</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <p className="text-slate-400 text-sm">Expected Wait Time</p>
                <p className={`text-2xl font-bold ${kpis.avgWaitMinutes > 5 ? 'text-orange-400' : 'text-emerald-400'}`}>
                  {kpis.avgWaitMinutes.toFixed(1)} min
                </p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <p className="text-slate-400 text-sm">Service Capacity/Operator</p>
                <p className="text-2xl font-bold text-cyan-400">{kpis.serviceCapacity.toFixed(1)}</p>
                <p className="text-slate-500 text-xs mt-1">transactions/day</p>
              </div>
            </div>

            {/* Action Items */}
            <div className="space-y-4">
              <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                <Target size={14} />
                Action Items for {nextMonth}
              </h3>
              <div className={`p-4 rounded-xl ${getStressBg(kpis.stressIndex)} border border-slate-700`}>
                <p className="text-slate-400 text-sm">Capacity Stress Index</p>
                <p className={`text-2xl font-bold ${getStressColor(kpis.stressIndex)}`}>
                  {kpis.stressIndex.toFixed(1)} — {getStressLevel(kpis.stressIndex)}
                </p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <h4 className="text-white font-medium mb-3">Recommendations</h4>
                <ul className="space-y-2 text-sm">
                  {kpis.stressIndex > 12 ? (
                    <>
                      <li className="flex items-start gap-2 text-red-400">
                        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                        <span>Urgently hire {kpis.peakSurgeOperators || Math.ceil(kpis.recommendedOperators * 0.3)} operators</span>
                      </li>
                      <li className="flex items-start gap-2 text-orange-400">
                        <Clock size={14} className="mt-0.5 flex-shrink-0" />
                        <span>Extend hours to 8 AM - 8 PM</span>
                      </li>
                      <li className="flex items-start gap-2 text-orange-400">
                        <Calendar size={14} className="mt-0.5 flex-shrink-0" />
                        <span>Deploy mobile units for weekends</span>
                      </li>
                    </>
                  ) : kpis.stressIndex > 8 ? (
                    <>
                      <li className="flex items-start gap-2 text-amber-400">
                        <Users size={14} className="mt-0.5 flex-shrink-0" />
                        <span>Add {Math.ceil(kpis.peakSurgeOperators * 0.5)} during peak hours</span>
                      </li>
                      <li className="flex items-start gap-2 text-amber-400">
                        <Calendar size={14} className="mt-0.5 flex-shrink-0" />
                        <span>Consider weekend overtime</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-2 text-emerald-400">
                        <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
                        <span>Staffing levels adequate</span>
                      </li>
                      <li className="flex items-start gap-2 text-emerald-400">
                        <Activity size={14} className="mt-0.5 flex-shrink-0" />
                        <span>Monitor for demand changes</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary Action Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-xl p-5"
      >
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Target className="text-purple-400" size={20} />
          {nextMonth} Staffing Summary — {locationLabel}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <Users className="text-cyan-400 mt-0.5" size={16} />
            <span className="text-slate-300">
              Deploy <strong className="text-white">{formatNumber(kpis.recommendedOperators)}</strong> FTE operators with{' '}
              <strong className="text-white">{kpis.peakSurgeOperators || 0}</strong> surge capacity
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="text-blue-400 mt-0.5" size={16} />
            <span className="text-slate-300">
              Target: <strong className="text-white">&lt;5 min</strong> wait for {((kpis.serviceLevel || 0.8) * 100).toFixed(0)}% of citizens
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="text-purple-400 mt-0.5" size={16} />
            <span className="text-slate-300">
              Weekend: <strong className="text-white">{formatNumber(kpis.weekendOperators || Math.round(kpis.recommendedOperators * 0.7))}</strong> operators (70%)
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
