import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Shield,
  Target,
  Activity,
  CheckCircle2,
  Clock,
  Zap,
  Eye,
  Info,
} from 'lucide-react';
import { useState } from 'react';
import {
  fetchMLStatus,
  fetchFraudRisk,
  fetchHotspots,
  type MLModelStatus,
  type FraudDetectionData,
  type HotspotData,
} from '../../api';

// Format large numbers
function formatNumber(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

// Get risk color
function getRiskColor(score: number): string {
  if (score > 50) return 'text-red-500';
  if (score > 30) return 'text-orange-400';
  if (score > 15) return 'text-amber-400';
  return 'text-emerald-400';
}

function getRiskBg(score: number): string {
  if (score > 50) return 'bg-red-500/20';
  if (score > 30) return 'bg-orange-500/20';
  if (score > 15) return 'bg-amber-500/20';
  return 'bg-emerald-500/20';
}

function getRiskLevel(score: number): string {
  if (score > 50) return 'Critical';
  if (score > 30) return 'High';
  if (score > 15) return 'Medium';
  return 'Low';
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

export default function Risk() {
  const [selectedState] = useState<string | undefined>();
  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>();

  const { data: modelStatus } = useQuery<MLModelStatus>({
    queryKey: ['ml-status'],
    queryFn: fetchMLStatus,
  });

  const { data: fraudData, isLoading: loadingFraud } = useQuery<FraudDetectionData>({
    queryKey: ['fraud-risk', selectedState, selectedPeriod],
    queryFn: () => fetchFraudRisk(selectedState, selectedPeriod),
  });

  const { data: hotspotData, isLoading: loadingHotspots } = useQuery<HotspotData>({
    queryKey: ['hotspots', selectedState, selectedPeriod],
    queryFn: () => fetchHotspots(selectedState, selectedPeriod),
  });

  // Get high risk districts
  const highRiskDistricts = fraudData?.rankings?.top_50_high_risk?.slice(0, 15) || [];
  const hotspots = hotspotData?.rankings?.top_50_hotspots?.slice(0, 15) || [];
  const infrastructurePriority = hotspotData?.rankings?.infrastructure_priority?.slice(0, 10) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="text-red-400" />
            Risk Monitor
          </h1>
          <p className="text-slate-400 mt-1">
            Fraud signals + surge alerts for operations risk management
          </p>
        </div>
        <ModelStatusBadge status={modelStatus} />
      </div>

      {/* Explainer Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <Target className="text-red-400 mt-0.5" size={20} />
          <div>
            <h3 className="text-red-400 font-medium">What this page does</h3>
            <p className="text-slate-400 text-sm mt-1">
              Detects potential fraud using digit distribution analysis and identifies demand surges using EWMA (Exponential Weighted Moving Average).
              Prioritize audits and resource allocation based on risk scores.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={selectedPeriod || ''}
          onChange={(e) => setSelectedPeriod(e.target.value || undefined)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:border-red-500 focus:outline-none"
        >
          <option value="">All Periods</option>
          <option value="september">September</option>
          <option value="october">October</option>
          <option value="november">November</option>
          <option value="december">December</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Fraud Alerts"
          value={fraudData?.national?.high_risk_count || 0}
          subValue="Districts with score > 30"
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Avg Fraud Risk"
          value={`${(fraudData?.national?.avg_fraud_risk || 0).toFixed(1)}/100`}
          subValue="National average"
          icon={Shield}
          color="orange"
        />
        <StatCard
          title="Hotspot Count"
          value={hotspotData?.national?.hotspot_count || 0}
          subValue="Active demand surges"
          icon={Zap}
          color="amber"
        />
        <StatCard
          title="Districts Requiring Audit"
          value={highRiskDistricts.filter(d => d.fraud_risk_score > 50).length}
          subValue="Critical risk level"
          icon={Eye}
          color="purple"
        />
      </div>

      {/* Two Panel View: Fraud + Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Fraud Risk Table */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-red-400" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-white">Fraud Risk Analysis</h2>
              <p className="text-slate-400 text-sm">Districts with suspicious patterns</p>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {loadingFraud ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="h-16 skeleton rounded-lg" />
              ))
            ) : (
              highRiskDistricts.map((district) => (
                <div
                  key={`${district.state}-${district.district}`}
                  className="p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-white font-medium">{district.district}</p>
                      <p className="text-slate-500 text-xs">{district.state}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBg(district.fraud_risk_score)} ${getRiskColor(district.fraud_risk_score)}`}>
                      {district.fraud_risk_score.toFixed(1)} - {getRiskLevel(district.fraud_risk_score)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {district.reasons?.map((reason, i) => (
                      <span key={i} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                        {reason}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30 transition-colors">
                      Schedule Audit
                    </button>
                    <button className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded hover:bg-slate-600 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Right: Hotspot Surge Alerts */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="text-amber-400" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-white">Hotspot Surge Alerts</h2>
              <p className="text-slate-400 text-sm">EWMA-detected demand spikes</p>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {loadingHotspots ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="h-14 skeleton rounded-lg" />
              ))
            ) : (
              hotspots.map((hotspot) => (
                <div
                  key={`${hotspot.state}-${hotspot.district}`}
                  className={`p-3 rounded-lg transition-colors ${
                    hotspot.is_hotspot 
                      ? 'bg-amber-500/10 border border-amber-500/30' 
                      : 'bg-slate-800/50 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{hotspot.district}</p>
                        {hotspot.is_hotspot && (
                          <span className="text-xs bg-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs">{hotspot.state}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-400 font-mono text-sm">
                        {hotspot.intensity?.toFixed(2) || hotspot.ewma_value?.toFixed(0)}
                      </p>
                      <p className="text-slate-500 text-xs">Intensity</p>
                    </div>
                  </div>
                  {hotspot.is_hotspot && (
                    <div className="mt-2 flex gap-2">
                      <button className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded hover:bg-amber-500/30 transition-colors">
                        Deploy Operators
                      </button>
                      <button className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded hover:bg-slate-600 transition-colors">
                        Device Check
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Infrastructure Priority */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <Activity className="text-purple-400" size={24} />
          <div>
            <h2 className="text-xl font-semibold text-white">Infrastructure Priority</h2>
            <p className="text-slate-400 text-sm">Districts requiring immediate resource allocation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {infrastructurePriority.map((item, index) => (
            <div
              key={`${item.state}-${item.district}`}
              className={`p-4 rounded-xl text-center ${
                index === 0 ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30' :
                index < 3 ? 'bg-orange-500/10 border border-orange-500/20' :
                'bg-slate-800/50 border border-slate-700'
              }`}
            >
              <p className={`text-sm font-medium ${index < 3 ? 'text-orange-400' : 'text-white'}`}>
                {item.district}
              </p>
              <p className="text-xs text-slate-500 mt-1">{item.state}</p>
              <p className="text-lg font-bold text-white mt-2">
                {item.priority_score?.toFixed(0) || '—'}
              </p>
              <p className="text-xs text-slate-500">Priority Score</p>
            </div>
          ))}
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
          <h3 className="text-white font-medium">How the Models Work</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="text-red-400 font-medium mb-2">🔍 Fraud Detection</h4>
            <p className="text-slate-400">
              Uses <strong>Benford's Law</strong> and <strong>digit distribution entropy</strong> to detect unnatural 
              patterns in enrollment numbers. High round-number ratios and low digit entropy flag potential manipulation.
            </p>
          </div>
          <div>
            <h4 className="text-amber-400 font-medium mb-2">⚡ Hotspot Detection</h4>
            <p className="text-slate-400">
              Uses <strong>EWMA (Exponential Weighted Moving Average)</strong> to detect sudden demand surges.
              Districts with activity significantly above their moving average trigger alerts.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
