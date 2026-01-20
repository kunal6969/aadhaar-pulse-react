import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { fetchAnomalies, type Anomaly } from '../api';
import { useState } from 'react';

interface AnomaliesProps {
  simulationDate: Date;
}

const severityConfig = {
  CRITICAL: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
  },
  HIGH: {
    icon: AlertTriangle,
    color: 'text-orange-400',
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/30',
  },
  MEDIUM: {
    icon: AlertCircle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/30',
  },
  LOW: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/30',
  },
};

export default function Anomalies({ simulationDate }: AnomaliesProps) {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [dataTypeFilter, setDataTypeFilter] = useState<string>('all');

  const dateStr = format(simulationDate, 'yyyy-MM-dd');

  const { data: anomalies, isLoading } = useQuery<Anomaly[]>({
    queryKey: ['anomalies', dateStr],
    queryFn: () => fetchAnomalies(simulationDate),
  });

  // Get unique data types
  const dataTypes = [...new Set(anomalies?.map((a) => a.data_type) || [])];

  // Filter anomalies
  const filteredAnomalies = anomalies?.filter((a) => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (dataTypeFilter !== 'all' && a.data_type !== dataTypeFilter) return false;
    return true;
  }) || [];

  // Stats
  const criticalCount = anomalies?.filter((a) => a.severity === 'CRITICAL').length || 0;
  const highCount = anomalies?.filter((a) => a.severity === 'HIGH').length || 0;
  const mediumCount = anomalies?.filter((a) => a.severity === 'MEDIUM').length || 0;
  const lowCount = anomalies?.filter((a) => a.severity === 'LOW').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Anomalies</h1>
        <p className="text-slate-400 mt-1">
          Detected anomalies and unusual patterns as of {format(simulationDate, 'MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-slate-700">
              <AlertTriangle className="text-slate-300" size={24} />
            </div>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Total Detected</h3>
          <p className="text-3xl font-bold text-white">{anomalies?.length || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-[#0f172a] border border-red-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-red-500/20">
              <AlertTriangle className="text-red-500" size={24} />
            </div>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Critical</h3>
          <p className="text-3xl font-bold text-red-500">{criticalCount}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0f172a] border border-orange-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-orange-500/20">
              <AlertTriangle className="text-orange-400" size={24} />
            </div>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">High</h3>
          <p className="text-3xl font-bold text-orange-400">{highCount}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-[#0f172a] border border-amber-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-amber-500/20">
              <AlertCircle className="text-amber-400" size={24} />
            </div>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Medium</h3>
          <p className="text-3xl font-bold text-amber-400">{mediumCount}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0f172a] border border-blue-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Info className="text-blue-400" size={24} />
            </div>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Low</h3>
          <p className="text-3xl font-bold text-blue-400">{lowCount}</p>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-4"
      >
        <div className="flex items-center gap-2 text-slate-400">
          <Filter size={20} />
          <span>Filters:</span>
        </div>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select
          value={dataTypeFilter}
          onChange={(e) => setDataTypeFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Data Types</option>
          {dataTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
        <span className="text-slate-500 text-sm ml-auto">
          Showing {filteredAnomalies.length} of {anomalies?.length || 0}
        </span>
      </motion.div>

      {/* Anomaly List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
      >
        <h2 className="text-xl font-semibold text-white mb-4">Detected Anomalies</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 skeleton rounded-xl animate-pulse bg-slate-800" />
            ))}
          </div>
        ) : filteredAnomalies.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-400">No anomalies match the current filters</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredAnomalies.map((anomaly, idx) => {
              const config = severityConfig[anomaly.severity] || severityConfig.MEDIUM;
              const Icon = config.icon;

              return (
                <motion.div
                  key={anomaly.id || idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`p-4 rounded-xl border ${config.border} ${config.bg}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                      <Icon className={config.color} size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-white font-medium">
                          {anomaly.district}, {anomaly.state}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
                          {anomaly.severity}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm mb-2">
                        {anomaly.message}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <TrendingUp size={12} />
                          Observed: {anomaly.observed_count.toLocaleString()}
                        </span>
                        <span>
                          Baseline: {anomaly.baseline_mean.toLocaleString()}
                        </span>
                        <span>
                          Deviation: {anomaly.deviation_ratio}x
                        </span>
                        <span className="capitalize">
                          {anomaly.data_type}
                        </span>
                        <span>
                          {anomaly.date}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
