import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  TrendingUp,
  Loader2,
  Play,
  Users,
  UserCog,
  Fingerprint,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { fetchComprehensiveForecast, fetchHeatmapData, type DataTypeForecast } from '../api';

interface ForecastProps {
  simulationDate: Date;
}

// Colors for different data types
const COLORS = {
  enrollment: { primary: '#06b6d4', secondary: '#0891b2' },
  demographic: { primary: '#a855f7', secondary: '#9333ea' },
  biometric: { primary: '#10b981', secondary: '#059669' },
};

// Format large numbers
function formatNumber(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

// Single Forecast Chart Component
function ForecastChart({
  dataType,
  data,
  forecastFrom,
  icon: Icon,
  color,
}: {
  dataType: string;
  data: DataTypeForecast;
  forecastFrom: string;
  icon: React.ElementType;
  color: { primary: string; secondary: string };
}) {
  // Combine historical and forecast data for the chart - showing both actual and predicted side by side
  const chartData = [
    // Historical data with both actual and fitted values
    ...data.historical.map((h) => ({
      date: format(parseISO(h.date), 'MMM d'),
      fullDate: h.date,
      actual: h.actual,
      predicted: h.fitted || null, // Model's fitted value for historical period
      lower: null as number | null,
      upper: null as number | null,
    })),
    // Future forecast with only predicted values
    ...data.forecast.map((f) => ({
      date: format(parseISO(f.date), 'MMM d'),
      fullDate: f.date,
      actual: null as number | null,
      predicted: f.predicted,
      lower: f.lower_bound,
      upper: f.upper_bound,
    })),
  ];

  const totalPredicted = data.forecast.reduce((sum, f) => sum + f.predicted, 0);
  const avgDaily = data.forecast.length > 0 ? totalPredicted / data.forecast.length : 0;
  const peakDay = data.forecast.length > 0 ? Math.max(...data.forecast.map((f) => f.predicted)) : 0;
  const mape = (data as DataTypeForecast & { mape?: number }).mape || 0;
  const accuracy = Math.max(0, 100 - mape);

  if (data.error) {
    return (
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${color.primary}20` }}>
            <Icon style={{ color: color.primary }} size={20} />
          </div>
          <h3 className="text-lg font-semibold text-white capitalize">{dataType} Forecast</h3>
        </div>
        <div className="flex items-center justify-center h-48 text-slate-400">
          <AlertCircle size={20} className="mr-2" />
          <span>No data available for this district</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${color.primary}20` }}>
            <Icon style={{ color: color.primary }} size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white capitalize">{dataType} Forecast</h3>
            <p className="text-xs text-slate-400">Based on {data.training_days} days of historical data</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded" style={{ backgroundColor: color.primary }} />
            <span className="text-slate-400">Actual Data</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded" style={{ backgroundColor: color.secondary, backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 3px, ' + color.secondary + ' 3px, ' + color.secondary + ' 6px)' }} />
            <span className="text-slate-400">Model Prediction</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id={`gradient-${dataType}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={10} interval="preserveStartEnd" />
          <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => formatNumber(v)} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value, name) => [
              formatNumber(value as number),
              name === 'actual' ? 'Actual' : name === 'predicted' ? 'Predicted' : String(name),
            ]}
          />
          <ReferenceLine
            x={format(parseISO(forecastFrom), 'MMM d')}
            stroke="#64748b"
            strokeDasharray="5 5"
            label={{ value: 'Forecast Start', position: 'top', fontSize: 10, fill: '#64748b' }}
          />
          {/* Confidence band */}
          <Area
            type="monotone"
            dataKey="upper"
            stroke="transparent"
            fill={`url(#gradient-${dataType})`}
            connectNulls={false}
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="transparent"
            fill="#0f172a"
            connectNulls={false}
          />
          {/* Actual line - solid cyan/purple/green */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke={color.primary}
            strokeWidth={2.5}
            dot={false}
            connectNulls={false}
            name="Actual"
          />
          {/* Predicted/Fitted line - dashed darker shade */}
          <Line
            type="monotone"
            dataKey="predicted"
            stroke={color.secondary}
            strokeWidth={2.5}
            strokeDasharray="8 4"
            dot={false}
            connectNulls={false}
            name="Predicted"
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mt-4">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold" style={{ color: accuracy >= 80 ? '#10b981' : accuracy >= 60 ? '#f59e0b' : '#ef4444' }}>
            {accuracy.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-400">Model Accuracy</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold" style={{ color: color.primary }}>
            {formatNumber(totalPredicted)}
          </p>
          <p className="text-xs text-slate-400">Total Predicted</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold" style={{ color: color.primary }}>
            {formatNumber(avgDaily)}
          </p>
          <p className="text-xs text-slate-400">Daily Average</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold" style={{ color: color.primary }}>
            {formatNumber(peakDay)}
          </p>
          <p className="text-xs text-slate-400">Peak Day</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold" style={{ color: color.primary }}>
            {formatNumber(data.historical_mean)}
          </p>
          <p className="text-xs text-slate-400">Historical Avg</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Forecast({ simulationDate }: ForecastProps) {
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [horizonDays, setHorizonDays] = useState(14);

  // Fetch districts for dropdown
  const { data: heatmapData } = useQuery({
    queryKey: ['heatmap-districts', format(simulationDate, 'yyyy-MM-dd')],
    queryFn: () => fetchHeatmapData(simulationDate, 'enrollment'),
  });

  const districts = [...new Set(Array.isArray(heatmapData) ? heatmapData.map((d) => d.name) : [])].sort();

  // Comprehensive forecast mutation
  const forecastMutation = useMutation({
    mutationFn: () => fetchComprehensiveForecast(selectedDistrict, simulationDate, horizonDays),
  });

  const handleForecast = () => {
    if (selectedDistrict) {
      forecastMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">ML Forecast</h1>
        <p className="text-slate-400 mt-1">
          Predict future Aadhaar transactions with historical accuracy comparison
        </p>
      </div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <Info className="text-blue-400 mt-0.5 flex-shrink-0" size={18} />
          <div className="text-sm">
            <p className="text-blue-300 font-medium">Side-by-Side Comparison: Actual vs Predicted</p>
            <p className="text-blue-200/70 mt-1">
              Both lines run <strong>side by side</strong> across the entire chart for easy comparison.
              The <strong>solid line</strong> shows actual recorded data, while the <strong>dashed line</strong> shows 
              the model's predictions. In the historical period, you can see how well the model fits the actual data.
              The <strong>Model Accuracy</strong> percentage shows how close predictions are to actual values (higher is better).
            </p>
          </div>
        </div>
      </motion.div>

      {/* Forecast Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6"
      >
        <h2 className="text-xl font-semibold text-white mb-4">Generate Comprehensive Forecast</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* District Select */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">Select a district</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>

          {/* Forecast From */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Forecast From</label>
            <div className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-300">
              {format(simulationDate, 'MMM d, yyyy')}
            </div>
          </div>

          {/* Horizon Days */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Horizon (days)</label>
            <select
              value={horizonDays}
              onChange={(e) => setHorizonDays(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
            </select>
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              onClick={handleForecast}
              disabled={!selectedDistrict || forecastMutation.isPending}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {forecastMutation.isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Play size={20} />
              )}
              Generate All
            </button>
          </div>
        </div>
      </motion.div>

      {/* Forecast Results */}
      {forecastMutation.data && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-400" size={20} />
            <span className="text-lg font-semibold text-white">
              Forecasts for {forecastMutation.data.district}
            </span>
            <span className="text-slate-400 text-sm">
              ({format(parseISO(forecastMutation.data.forecast_from), 'MMM d')} → +{forecastMutation.data.horizon_days} days)
            </span>
          </div>

          {/* Three Forecast Charts */}
          <div className="grid grid-cols-1 gap-6">
            {/* Enrollment Forecast */}
            <ForecastChart
              dataType="enrollment"
              data={forecastMutation.data.data_types.enrollment}
              forecastFrom={forecastMutation.data.forecast_from}
              icon={Users}
              color={COLORS.enrollment}
            />

            {/* Demographic Forecast */}
            <ForecastChart
              dataType="demographic"
              data={forecastMutation.data.data_types.demographic}
              forecastFrom={forecastMutation.data.forecast_from}
              icon={UserCog}
              color={COLORS.demographic}
            />

            {/* Biometric Forecast */}
            <ForecastChart
              dataType="biometric"
              data={forecastMutation.data.data_types.biometric}
              forecastFrom={forecastMutation.data.forecast_from}
              icon={Fingerprint}
              color={COLORS.biometric}
            />
          </div>
        </div>
      )}

      {/* Error State */}
      {forecastMutation.isError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center"
        >
          <p className="text-red-400">
            Failed to generate forecast. Please try a different district or check if data is available.
          </p>
        </motion.div>
      )}

      {/* Empty State */}
      {!forecastMutation.data && !forecastMutation.isPending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-12 text-center"
        >
          <TrendingUp className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">No Forecast Generated</h3>
          <p className="text-slate-400 mb-4">
            Select a district and click "Generate All" to create forecasts for all three data types
          </p>
          <div className="flex justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-cyan-400" />
              <span>Enrollments</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCog size={16} className="text-purple-400" />
              <span>Demographics</span>
            </div>
            <div className="flex items-center gap-2">
              <Fingerprint size={16} className="text-emerald-400" />
              <span>Biometrics</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
