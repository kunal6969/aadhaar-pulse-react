import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  MapPin,
  Users,
  AlertTriangle,
  Target,
  Truck,
  CheckCircle2,
  Clock,
  Heart,
  Map,
  Info,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  fetchMLStatus,
  fetchUnderserved,
  fetchTop50Needy,
  fetchClustering,
  fetchStateComparison,
  fetchDistrictComparison,
  type MLModelStatus,
  type UnderservedData,
  type Top50NeedyData,
  type ClusteringData,
  type StateComparisonData,
  type DistrictComparisonData,
} from '../../api';
import { useLocationContext } from '../../context/LocationContext';
import IndiaLeafletMap from '../../components/IndiaLeafletMap';

// Format large numbers
function formatNumber(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

// Get underserved color
function getUnderservedColor(score: number): string {
  if (score > 80) return 'text-red-500';
  if (score > 60) return 'text-orange-400';
  if (score > 40) return 'text-amber-400';
  return 'text-emerald-400';
}

// Get period string from date
function getPeriodFromDate(date: Date): string {
  const month = date.getMonth();
  const periods = ['', '', '', '', '', '', '', '', 'september', 'october', 'november', 'december'];
  return periods[month] || '';
}

// Cluster colors
const CLUSTER_COLORS = ['#06b6d4', '#a855f7', '#10b981', '#f97316', '#ec4899'];

// Cluster names and descriptions
const CLUSTER_PROFILES = [
  { name: 'Migration Hubs', description: 'High enrollment, low updates - areas with transient population' },
  { name: 'Stable Zones', description: 'Balanced activity - mature Aadhaar coverage with steady updates' },
  { name: 'High Biometric Churn', description: 'High biometric updates - areas with aging biometric data' },
  { name: 'Enrollment Surge', description: 'New enrollment surge - rapidly growing registration areas' },
  { name: 'Suspicious Update Zones', description: 'Unusual update patterns requiring monitoring' },
];

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
    pink: 'bg-pink-500/20 text-pink-400',
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

// Cluster Segment Card
function ClusterCard({
  name,
  description,
  count,
  color,
}: {
  name: string;
  description: string;
  count: number;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-800/50 rounded-xl p-4 border border-slate-700"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <h4 className="text-white font-medium text-sm">{name}</h4>
      </div>
      <p className="text-slate-400 text-xs mb-2">{description}</p>
      <p className="text-xs text-slate-500">{count} districts</p>
    </motion.div>
  );
}

// Props interface
interface EquityProps {
  simulationDate: Date;
}

export default function Equity({ simulationDate }: EquityProps) {
  const { selectedState, setSelectedState, locationLabel } = useLocationContext();
  const [showClusters, setShowClusters] = useState(false);
  
  // Get period from simulation date
  const period = getPeriodFromDate(simulationDate);
  const dateStr = format(simulationDate, 'MMMM d, yyyy');

  // Fetch ML model status
  const { data: modelStatus } = useQuery<MLModelStatus>({
    queryKey: ['ml-status'],
    queryFn: fetchMLStatus,
  });

  // Fetch underserved data - state or national level
  const { data: underservedData, isLoading: loadingUnderserved } = useQuery<UnderservedData>({
    queryKey: ['underserved', selectedState, period],
    queryFn: () => fetchUnderserved(selectedState || undefined, period || undefined),
  });

  // Fetch top 50 needy districts (national)
  const { data: top50Data, isLoading: loadingTop50 } = useQuery<Top50NeedyData>({
    queryKey: ['top50-needy'],
    queryFn: fetchTop50Needy,
  });

  // Fetch clustering data
  const { data: clusteringData } = useQuery<ClusteringData>({
    queryKey: ['clustering', selectedState],
    queryFn: () => fetchClustering(selectedState || undefined),
  });

  // Fetch state comparison for national view
  const { data: stateComparisonData } = useQuery<StateComparisonData>({
    queryKey: ['state-comparison', 'underserved_score', period],
    queryFn: () => fetchStateComparison('underserved_score', period || undefined),
    enabled: !selectedState,
  });

  // Fetch district comparison for state view
  const { data: districtComparisonData } = useQuery<DistrictComparisonData>({
    queryKey: ['district-comparison', selectedState, 'underserved_score'],
    queryFn: () => fetchDistrictComparison(selectedState!, 'underserved_score', 20),
    enabled: !!selectedState,
  });

  // Prepare data based on selection
  const displayData = useMemo(() => {
    if (selectedState) {
      // State selected - show top 10 districts
      const districts = districtComparisonData?.top_n?.slice(0, 10) || 
        underservedData?.rankings?.top_50_underserved?.filter(d => d.state === selectedState)?.slice(0, 10) || [];
      return {
        topItems: districts.map(d => ({
          name: d.district,
          state: selectedState,
          score: 'value' in d ? (d as { value: number }).value : (d as { underserved_score: number }).underserved_score || 0,
        })),
        title: `Top 10 Underserved Districts in ${selectedState}`,
      };
    } else {
      // National view - show top 10 states
      const states = stateComparisonData?.ranking?.slice(0, 10) || [];
      return {
        topItems: states.map(s => ({
          name: s.state,
          state: s.state,
          score: s.value || 0,
        })),
        title: 'Top 10 Underserved States in India',
      };
    }
  }, [selectedState, stateComparisonData, districtComparisonData, underservedData]);

  // Get top underserved districts for chart
  const topUnderservedDistricts = useMemo(() => {
    if (selectedState) {
      return underservedData?.rankings?.top_50_underserved?.filter(d => d.state === selectedState)?.slice(0, 10) || [];
    }
    return underservedData?.rankings?.top_50_underserved?.slice(0, 20) || [];
  }, [selectedState, underservedData]);

  // Top 50 needy for table
  const top50Needy = useMemo(() => {
    if (selectedState) {
      return top50Data?.top_50?.filter(d => d.state === selectedState)?.slice(0, 10) || [];
    }
    return top50Data?.top_50?.slice(0, 20) || [];
  }, [selectedState, top50Data]);

  // Prepare heat map data
  const heatMapData = useMemo(() => {
    if (selectedState) {
      // District level for selected state - use underserved data
      const districts = underservedData?.rankings?.top_50_underserved?.filter(d => d.state === selectedState) || [];
      return districts.map(d => ({
        state: d.district,
        value: d.underserved_score || 0,
        cluster: clusteringData?.by_state?.[selectedState]?.dominant_cluster,
      }));
    } else {
      // State level
      return stateComparisonData?.ranking?.map(s => ({
        state: s.state,
        value: s.value || 0,
        cluster: clusteringData?.by_state?.[s.state]?.dominant_cluster,
      })) || [];
    }
  }, [selectedState, stateComparisonData, clusteringData, underservedData]);

  // Bar chart data
  const chartData = displayData.topItems.slice(0, 10).map((d) => ({
    name: d.name.length > 12 ? d.name.substring(0, 12) + '...' : d.name,
    score: d.score,
    fullName: d.name,
    state: d.state,
  }));

  // Handle state click from map
  const handleStateClick = (state: string | null) => {
    setSelectedState(state);
  };

  // Calculate mobile units recommended from API data
  const mobileUnitsCount = useMemo(() => {
    // Use backend MBU recommendation count if available
    const apiCount = underservedData?.mbu_recommendations?.total_recommended ||
                     underservedData?.national?.mbu_recommended_total ||
                     0;
    if (apiCount > 0) return apiCount;
    
    // Fallback: calculate from critical districts
    const criticalCount = topUnderservedDistricts.filter(d => d.underserved_score > 70).length;
    return Math.min(criticalCount + 5, 25);
  }, [topUnderservedDistricts, underservedData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Heart className="text-pink-400" />
            Equity & Access
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1.5 text-slate-400 text-sm">
              <Calendar size={14} />
              {dateStr}
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5 text-cyan-400 text-sm font-medium">
              <MapPin size={14} />
              {locationLabel}
            </span>
          </div>
        </div>
        <ModelStatusBadge status={modelStatus} />
      </div>

      {/* Explainer Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <Target className="text-pink-400 mt-0.5" size={20} />
          <div>
            <h3 className="text-pink-400 font-medium">What this page does</h3>
            <p className="text-slate-400 text-sm mt-1">
              Identifies {selectedState ? `districts in ${selectedState}` : 'states and districts across India'} with poor Aadhaar access using enrollment gaps, child registration rates, and update activity.
              Recommends where to deploy mobile enrollment units for maximum impact.
            </p>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={selectedState ? "Districts Analyzed" : "States Analyzed"}
          value={selectedState ? (districtComparisonData?.total_districts || 0) : (stateComparisonData?.total_states || underservedData?.national?.total_districts || 0)}
          subValue={selectedState ? `In ${selectedState}` : "Across India"}
          icon={MapPin}
          color="pink"
        />
        <StatCard
          title="Avg Underserved Score"
          value={`${(underservedData?.national?.avg_underserved_score || 0).toFixed(1)}/100`}
          subValue="Higher = more underserved"
          icon={AlertTriangle}
          color="orange"
        />
        <StatCard
          title="Critical Areas"
          value={topUnderservedDistricts.filter(d => d.underserved_score > 80).length}
          subValue="Score > 80"
          icon={Target}
          color="red"
        />
        <StatCard
          title="Mobile Units Recommended"
          value={mobileUnitsCount}
          subValue="Priority deployments"
          icon={Truck}
          color="purple"
        />
      </div>

      {/* Mobile Units Explanation Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <Info className="text-purple-400 mt-0.5 flex-shrink-0" size={18} />
          <div>
            <h3 className="text-purple-400 font-medium text-sm">What are Mobile Enrollment Units (MBUs)?</h3>
            <p className="text-slate-400 text-sm mt-1">
              <strong>Mobile Biometric Units (MBUs)</strong> are portable Aadhaar enrollment stations that can be deployed to 
              remote or underserved areas where permanent enrollment centers are unavailable or insufficient. 
              The recommended count is based on the number of districts with high underserved scores (&gt;70), 
              factoring in population density, geographic accessibility, and current enrollment gaps. 
              Each MBU can typically process 50-100 enrollments per day and is equipped with biometric scanners, 
              cameras, and connectivity equipment.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content: Heat Map + Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Heat Map */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Map className="text-pink-400" size={24} />
              <h2 className="text-xl font-semibold text-white">
                {selectedState ? `${selectedState} Districts` : 'India Heat Map'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowClusters(false)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  !showClusters ? 'bg-pink-500/20 text-pink-400 border border-pink-500/50' : 'bg-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                Heat Map
              </button>
              <button
                onClick={() => setShowClusters(true)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  showClusters ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                Clusters
              </button>
            </div>
          </div>

          <IndiaLeafletMap
            stateData={heatMapData}
            selectedState={selectedState}
            onStateClick={handleStateClick}
            showClusters={showClusters}
          />
        </motion.div>

        {/* Right: Top Underserved Ranking */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-orange-400" size={24} />
            <h2 className="text-xl font-semibold text-white">{displayData.title}</h2>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {loadingUnderserved ? (
              [...Array(10)].map((_, i) => (
                <div key={i} className="h-12 skeleton rounded-lg animate-pulse bg-slate-800" />
              ))
            ) : (
              displayData.topItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                    !selectedState ? 'hover:bg-slate-700' : 'bg-slate-800/50'
                  }`}
                  onClick={() => !selectedState && setSelectedState(item.name)}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      index < 3 ? 'bg-red-500/30 text-red-400' : 
                      index < 6 ? 'bg-orange-500/30 text-orange-400' : 
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-white text-sm font-medium">{item.name}</p>
                      {selectedState && <p className="text-slate-500 text-xs">{item.state}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono text-sm font-medium ${getUnderservedColor(item.score)}`}>
                      {item.score.toFixed(1)}
                    </p>
                    <p className="text-slate-500 text-xs">score</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Underserved Score Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <Map className="text-pink-400" size={24} />
          <h2 className="text-xl font-semibold text-white">
            Underserved Score Distribution - {selectedState || 'Top 10'}
          </h2>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#64748b" domain={[0, 100]} />
              <YAxis type="category" dataKey="name" stroke="#64748b" width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
                formatter={(value) => [value !== undefined ? `${Number(value).toFixed(1)}/100` : '—', 'Score']}
                labelFormatter={(_, payload) => payload[0]?.payload?.fullName || ''}
              />
              <Bar dataKey="score" fill="#ec4899" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Top Neediest Districts Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <Truck className="text-purple-400" size={24} />
          <div>
            <h2 className="text-xl font-semibold text-white">
              Mobile Unit Deployment Optimizer - {selectedState || 'All India'}
            </h2>
            <p className="text-slate-400 text-sm">Recommended placements for maximum impact</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">District</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">State</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">Need Score</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">Expected Uplift</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">Duration (days)</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium text-sm">Priority</th>
              </tr>
            </thead>
            <tbody>
              {loadingTop50 ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="py-3 px-4">
                      <div className="h-8 skeleton rounded animate-pulse bg-slate-800" />
                    </td>
                  </tr>
                ))
              ) : (
                top50Needy.slice(0, 10).map((district, index) => (
                  <tr key={district.key} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{district.district}</td>
                    <td className="py-3 px-4 text-slate-400">{district.state}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`${getUnderservedColor(district.underserved_score)} font-mono`}>
                        {district.underserved_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400">
                      +{Math.round(district.composite_neediness / 1000)}%
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">
                      {Math.min(30, Math.round(district.underserved_score / 3))}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        index < 3 ? 'bg-red-500/20 text-red-400' :
                        index < 7 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {index < 3 ? 'Urgent' : index < 7 ? 'High' : 'Medium'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* District Clustering */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <Users className="text-cyan-400" size={24} />
          <div>
            <h2 className="text-xl font-semibold text-white">
              {selectedState ? `${selectedState} District Clustering` : 'State Clustering Analysis'}
            </h2>
            <p className="text-slate-400 text-sm">K-Means segmentation reveals 5 behavioral patterns</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CLUSTER_PROFILES.map((profile, index) => (
            <ClusterCard
              key={profile.name}
              name={profile.name}
              description={profile.description}
              count={clusteringData?.national?.cluster_sizes?.[index] || 0}
              color={CLUSTER_COLORS[index]}
            />
          ))}
        </div>

      </motion.div>
    </div>
  );
}
