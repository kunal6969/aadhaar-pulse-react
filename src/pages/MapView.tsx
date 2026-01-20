import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Map, MapPin, Info } from 'lucide-react';
import { fetchHeatmapData, type HeatmapDataPoint } from '../api';

interface MapViewProps {
  simulationDate: Date;
}

export default function MapView({ simulationDate }: MapViewProps) {
  const dateStr = format(simulationDate, 'yyyy-MM-dd');

  const { data: heatmapData, isLoading } = useQuery<HeatmapDataPoint[]>({
    queryKey: ['heatmap', dateStr],
    queryFn: () => fetchHeatmapData(simulationDate, 'enrollment'),
  });

  // Group by state
  const stateData = Array.isArray(heatmapData) ? heatmapData.reduce((acc, item) => {
    if (!acc[item.state]) {
      acc[item.state] = { count: 0, districts: 0 };
    }
    acc[item.state].count += item.value;
    acc[item.state].districts += 1;
    return acc;
  }, {} as Record<string, { count: number; districts: number }>) : {};

  const sortedStates = Object.entries(stateData)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20);

  const maxCount = Math.max(...sortedStates.map(([, data]) => data.count));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Map View</h1>
        <p className="text-slate-400 mt-1">
          Geographic distribution of Aadhaar activities
        </p>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3"
      >
        <Info className="text-blue-400 mt-0.5" size={20} />
        <div>
          <h3 className="text-blue-400 font-medium">Geographic Overview</h3>
          <p className="text-slate-400 text-sm mt-1">
            This view shows enrollment distribution by state. For an interactive map,
            consider integrating with a mapping library like Leaflet or Mapbox.
          </p>
        </div>
      </motion.div>

      {/* State Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Map className="text-cyan-400" size={24} />
            <h2 className="text-xl font-semibold text-white">State Distribution</h2>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-8 skeleton rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedStates.map(([state, data], idx) => (
                <motion.div
                  key={state}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{state}</span>
                    <span className="text-slate-400">{data.count.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(data.count / maxCount) * 100}%` }}
                      transition={{ delay: idx * 0.05 + 0.2, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Top Districts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="text-emerald-400" size={24} />
            <h2 className="text-xl font-semibold text-white">Top Districts</h2>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-12 skeleton rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {heatmapData
                ?.sort((a, b) => b.value - a.value)
                .slice(0, 15)
                .map((item, idx) => (
                  <motion.div
                    key={`${item.state}-${item.name}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl"
                  >
                    <div>
                      <p className="text-white font-medium">{item.name}</p>
                      <p className="text-slate-400 text-sm">{item.state}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-cyan-400 font-semibold">
                        {item.value.toLocaleString()}
                      </p>
                      <p className="text-slate-500 text-xs">enrollments</p>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-cyan-400">
            {Object.keys(stateData).length}
          </p>
          <p className="text-slate-400 text-sm">Active States</p>
        </div>
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-emerald-400">
            {heatmapData?.length || 0}
          </p>
          <p className="text-slate-400 text-sm">Active Districts</p>
        </div>
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-400">
            {Array.isArray(heatmapData) ? heatmapData.reduce((sum, d) => sum + d.value, 0).toLocaleString() : 0}
          </p>
          <p className="text-slate-400 text-sm">Total Enrollments</p>
        </div>
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-400">
            {Array.isArray(heatmapData) && heatmapData.length > 0 ? Math.round(heatmapData.reduce((sum, d) => sum + d.value, 0) / heatmapData.length).toLocaleString() : 0}
          </p>
          <p className="text-slate-400 text-sm">Avg per District</p>
        </div>
      </motion.div>
    </div>
  );
}
