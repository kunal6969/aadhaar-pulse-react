import axios from 'axios';
import { format } from 'date-fns';

// Backend API URL - use environment variable or fallback to deployed backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://aadhaar-pulse-backend.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to format date for API
const formatDate = (date: Date): string => format(date, 'yyyy-MM-dd');

// Location filter params
export interface LocationFilter {
  state?: string | null;
  district?: string | null;
}

// ==================== TYPES ====================

// Comprehensive KPI Data from /api/analytics/kpis
export interface KPIData {
  simulation_date: string;
  // Enrollments
  total_enrollments_30d: number;
  total_enrollments_7d: number;
  total_enrollments_today: number;
  enrollment_growth_rate: number;
  // Demographics
  total_demo_updates_30d: number;
  total_demo_updates_7d: number;
  total_demo_updates_today: number;
  demo_growth_rate: number;
  // Biometrics
  total_bio_updates_30d: number;
  total_bio_updates_7d: number;
  total_bio_updates_today: number;
  bio_growth_rate: number;
  // Activity
  active_districts: number;
  active_states: number;
  pending_mbu_count: number;
  mbu_completion_percentage: number;
  // Top states
  top_5_states: Array<{
    state: string;
    enrollment_count: number;
    demographic_count: number;
    biometric_count: number;
    total_activity: number;
  }>;
}

// Enrollment Summary from /api/enrollment/summary
export interface EnrollmentSummary {
  total_enrollments_30d: number;
  total_enrollments_7d: number;
  total_enrollments_today: number;
  active_districts: number;
  active_states: number;
  top_states: Array<{
    state: string;
    count: number;
    percentage: number;
  }>;
  simulation_date: string;
  age_0_5_total: number;
  age_5_17_total: number;
  age_18_plus_total: number;
}

// Demographic Summary from /api/demographic/summary  
export interface DemographicSummary {
  total_updates_30d: number;
  total_updates_7d: number;
  total_updates_today: number;
  active_districts: number;
  active_states: number;
  top_states: Array<{
    state: string;
    count: number;
    percentage: number;
  }>;
  simulation_date: string;
  age_5_17_total: number;
  age_17_plus_total: number;
}

// Biometric Summary from /api/biometric/summary
export interface BiometricSummary {
  total_updates_30d: number;
  total_updates_7d: number;
  total_updates_today: number;
  active_districts: number;
  active_states: number;
  top_states: Array<{
    state: string;
    count: number;
    percentage: number;
  }>;
  simulation_date: string;
  age_5_17_total: number;
  age_17_plus_total: number;
  pending_mbu_estimate: number;
  mbu_completion_rate: number;
}

// Trend data point
export interface TrendDataPoint {
  date: string;
  total: number;
  age_0_5?: number;
  age_5_17?: number;
  age_18_plus?: number;
  age_17_plus?: number;
}

// Anomaly record
export interface Anomaly {
  id: string;
  pincode: string | null;
  district: string;
  state: string;
  date: string;
  data_type: string;
  observed_count: number;
  baseline_mean: number;
  deviation_ratio: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  anomaly_score: number;
  message: string;
}

// Heatmap data point
export interface HeatmapDataPoint {
  state: string;
  name: string;
  lat: number;
  lng: number;
  value: number;
  intensity: number;
}

// Forecast result
export interface ForecastResult {
  district: string;
  forecast_from: string;
  horizon_days: number;
  forecast: Array<{
    date: string;
    predicted: number;
    lower_bound: number;
    upper_bound: number;
  }>;
  historical?: Array<{
    date: string;
    actual: number;
  }>;
  risk_assessment?: {
    risk_level: string;
    risk_score: number;
    message: string;
  };
}

// Comprehensive forecast for all three data types
export interface ComprehensiveForecastResult {
  district: string;
  forecast_from: string;
  horizon_days: number;
  data_types: {
    enrollment: DataTypeForecast;
    demographic: DataTypeForecast;
    biometric: DataTypeForecast;
  };
}

export interface DataTypeForecast {
  historical: Array<{ date: string; actual: number; fitted?: number }>;
  forecast: Array<{
    date: string;
    predicted: number;
    lower_bound: number;
    upper_bound: number;
  }>;
  training_days: number;
  historical_mean: number;
  mape?: number;
  error?: string;
}

// ==================== API FUNCTIONS ====================

// Health check
export async function fetchHealth() {
  const response = await api.get('/api/health');
  return response.data;
}

// Comprehensive KPIs
export async function fetchKPIs(simulationDate: Date): Promise<KPIData> {
  const response = await api.get('/api/analytics/kpis', {
    params: { simulation_date: formatDate(simulationDate) },
  });
  return response.data;
}

// Enrollment Summary (supports state/district filter)
export async function fetchEnrollmentSummary(
  simulationDate: Date,
  filter?: LocationFilter
): Promise<EnrollmentSummary> {
  const response = await api.get('/api/enrollment/summary', {
    params: {
      simulation_date: formatDate(simulationDate),
      ...(filter?.state && { state: filter.state }),
      ...(filter?.district && { district: filter.district }),
    },
  });
  return response.data;
}

// Demographic Summary (supports state/district filter)
export async function fetchDemographicSummary(
  simulationDate: Date,
  filter?: LocationFilter
): Promise<DemographicSummary> {
  const response = await api.get('/api/demographic/summary', {
    params: {
      simulation_date: formatDate(simulationDate),
      ...(filter?.state && { state: filter.state }),
      ...(filter?.district && { district: filter.district }),
    },
  });
  return response.data;
}

// Biometric Summary (supports state/district filter)
export async function fetchBiometricSummary(
  simulationDate: Date,
  filter?: LocationFilter
): Promise<BiometricSummary> {
  const response = await api.get('/api/biometric/summary', {
    params: {
      simulation_date: formatDate(simulationDate),
      ...(filter?.state && { state: filter.state }),
      ...(filter?.district && { district: filter.district }),
    },
  });
  return response.data;
}

// Enrollment Trends (supports state/district filter)
export async function fetchEnrollmentTrends(
  simulationDate: Date,
  filter?: LocationFilter
): Promise<TrendDataPoint[]> {
  const response = await api.get('/api/enrollment/trends', {
    params: {
      simulation_date: formatDate(simulationDate),
      ...(filter?.state && { state: filter.state }),
      ...(filter?.district && { district: filter.district }),
    },
  });
  return response.data?.data || response.data || [];
}

// Demographic Trends (supports state/district filter)
export async function fetchDemographicTrends(
  simulationDate: Date,
  filter?: LocationFilter
): Promise<TrendDataPoint[]> {
  const response = await api.get('/api/demographic/trends', {
    params: {
      simulation_date: formatDate(simulationDate),
      ...(filter?.state && { state: filter.state }),
      ...(filter?.district && { district: filter.district }),
    },
  });
  return response.data?.data || response.data || [];
}

// Biometric Trends (supports state/district filter)
export async function fetchBiometricTrends(
  simulationDate: Date,
  filter?: LocationFilter
): Promise<TrendDataPoint[]> {
  const response = await api.get('/api/biometric/trends', {
    params: {
      simulation_date: formatDate(simulationDate),
      ...(filter?.state && { state: filter.state }),
      ...(filter?.district && { district: filter.district }),
    },
  });
  return response.data?.data || response.data || [];
}

// Anomalies (supports state filter)
export async function fetchAnomalies(
  simulationDate: Date,
  filter?: LocationFilter
): Promise<Anomaly[]> {
  const response = await api.get('/api/anomaly/detect', {
    params: {
      simulation_date: formatDate(simulationDate),
      ...(filter?.state && { state: filter.state }),
    },
  });
  return response.data?.anomalies || response.data || [];
}

// Heatmap Data
export async function fetchHeatmapData(
  simulationDate: Date,
  type: 'enrollment' | 'demographic' | 'biometric' = 'enrollment'
): Promise<HeatmapDataPoint[]> {
  const response = await api.get(`/api/geospatial/heatmap/${type}`, {
    params: { simulation_date: formatDate(simulationDate) },
  });
  return response.data?.locations || response.data || [];
}

// Forecast
export async function fetchForecast(
  district: string,
  forecastFrom: Date,
  horizonDays: number = 14
): Promise<ForecastResult> {
  const response = await api.post('/api/forecast/mbu', {
    district,
    forecast_from: formatDate(forecastFrom),
    horizon_days: horizonDays,
  });
  return response.data;
}

// Comprehensive Forecast for all three data types
export async function fetchComprehensiveForecast(
  district: string,
  forecastFrom: Date,
  horizonDays: number = 14
): Promise<ComprehensiveForecastResult> {
  const response = await api.post('/api/forecast/comprehensive', {
    district,
    forecast_from: formatDate(forecastFrom),
    horizon_days: horizonDays,
  });
  return response.data;
}

// ==================== ML ANALYTICS TYPES ====================

// ML Model Status
export interface MLModelStatus {
  summary: {
    total: number;
    trained: number;
    ready: boolean;
  };
  models: Record<string, {
    trained: boolean;
    file_size_kb: number;
    trained_at: string;
    training_time_sec: number;
  }>;
}

// Capacity Planning - Erlang-C Enhanced Model
export interface CapacityMethodology {
  model: string;
  service_time_minutes: number;
  productive_hours_per_day: number;
  target_service_level: string;
  formula: string;
  stress_index: string;
}

export interface CapacityPlanningData {
  level?: string;
  state?: string;
  period?: string;
  methodology?: CapacityMethodology;
  
  // National level summary (new Erlang-C fields)
  summary?: {
    avg_daily_demand?: number;
    p95_daily_demand?: number;
    peak_daily_demand?: number;
    recommended_operators?: number;
    peak_surge_operators?: number;
    utilization?: number;
    avg_wait_minutes?: number;
    service_level?: number;
    weekend_operators?: number;
    service_capacity_per_operator?: number;
    district_count?: number;
    capacity_stress_index?: number;
    coefficient_of_variation?: number;
    // Legacy fields
    total_demand?: number;
    peak_demand?: number;
    operators_needed_peak?: number;
    capacity_stress_score?: number;
    weekend_gap?: number;
  };
  
  // Raw data from model
  data?: {
    avg_daily_demand?: number;
    p95_daily_demand?: number;
    peak_daily_demand?: number;
    recommended_fte_operators?: number;
    operators_for_p95?: number;
    peak_surge_operators?: number;
    utilization_at_p95?: number;
    avg_wait_minutes?: number;
    service_level?: number;
    weekend_operators?: number;
    weekend_operator_ratio?: number;
    service_capacity_per_operator_per_day?: number;
    capacity_stress_index?: number;
    // Legacy
    total_demand?: number;
    peak_demand?: number;
    operators_needed_avg?: number;
    operators_needed_peak?: number;
    capacity_stress_score?: number;
    weekend_gap?: number;
  };
  
  // States comparison
  states?: Record<string, {
    recommended_operators?: number;
    avg_daily_demand?: number;
    p95_daily_demand?: number;
    utilization?: number;
    district_count?: number;
    capacity_stress_index?: number;
    avg_wait_minutes?: number;
    // Legacy
    operators_needed_peak?: number;
    capacity_stress_score?: number;
    weekend_gap?: number;
    peak_demand?: number;
  }>;
  
  // Districts list
  districts?: Array<{
    state: string;
    district: string;
    avg_daily_demand?: number;
    p95_daily_demand?: number;
    peak_daily_demand?: number;
    recommended_operators?: number;
    peak_surge_operators?: number;
    utilization?: number;
    avg_wait_minutes?: number;
    service_level?: number;
    service_capacity_per_operator?: number;
    capacity_stress_index?: number;
    weekend_operators?: number;
    weekend_gap?: number;
    coefficient_of_variation?: number;
    total_transactions?: number;
    days_of_data?: number;
    // Legacy
    operators_needed_peak?: number;
    capacity_stress_score?: number;
    total_demand?: number;
    peak_demand?: number;
  }>;
  
  // Rankings
  top_50_needy?: Array<{
    state: string;
    district: string;
    recommended_operators?: number;
    avg_daily_demand?: number;
    p95_daily_demand?: number;
    capacity_stress_index?: number;
    utilization?: number;
    avg_wait_minutes?: number;
    // Legacy
    operators_needed_peak?: number;
    capacity_stress?: number;
    capacity_stress_score?: number;
  }>;
  
  top_50_stress?: Array<{
    state: string;
    district: string;
    capacity_stress_index?: number;
    recommended_operators?: number;
    coefficient_of_variation?: number;
  }>;
  
  // Legacy fields for backward compatibility
  national?: {
    total_demand?: number;
    peak_demand?: number;
    operators_needed_avg?: number;
    operators_needed_peak?: number;
    capacity_stress_index?: number;
    weekend_gap?: number;
  };
  
  by_state?: Record<string, {
    operators_needed_peak?: number;
    capacity_stress?: number;
    capacity_stress_score?: number;
    weekend_gap?: number;
    peak_demand?: number;
    total_demand?: number;
  }>;
  
  rankings?: {
    top_50_stress?: Array<{
      state: string;
      district: string;
      capacity_stress_index?: number;
      recommended_operators?: number;
      utilization?: number;
      capacity_stress?: number;
      capacity_stress_score?: number;
      operators_needed_peak?: number;
    }>;
    top_50_needy?: Array<{
      state: string;
      district: string;
      recommended_operators?: number;
      utilization?: number;
      capacity_stress_index?: number;
      capacity_stress?: number;
      capacity_stress_score?: number;
      operators_needed_peak?: number;
    }>;
  };
}

// Underserved District
export interface UnderservedDistrict {
  state: string;
  district: string;
  underserved_score: number;
  enrollments: number;
  child_enrollments: number;
  demographic_updates: number;
  biometric_updates: number;
  child_ratio: number;
  update_activity_ratio: number;
}

export interface UnderservedData {
  national?: {
    avg_underserved_score: number;
    median_underserved_score: number;
    total_districts: number;
  };
  rankings?: {
    top_50_underserved: UnderservedDistrict[];
  };
  by_state?: Record<string, {
    avg_underserved_score: number;
    district_count: number;
    most_underserved: UnderservedDistrict[];
  }>;
}

// Fraud Detection
export interface FraudRiskDistrict {
  state: string;
  district: string;
  fraud_risk_score: number;
  digit_entropy: number;
  round_number_ratio: number;
  spike_factor: number;
  reasons: string[];
}

export interface FraudDetectionData {
  national?: {
    avg_fraud_risk: number;
    high_risk_count: number;
    total_districts: number;
  };
  rankings?: {
    top_50_high_risk: FraudRiskDistrict[];
  };
  by_state?: Record<string, {
    avg_fraud_risk: number;
    high_risk_districts: FraudRiskDistrict[];
  }>;
}

// Clustering
export interface ClusteringData {
  national?: {
    n_clusters: number;
    cluster_sizes: number[];
  };
  segment_profiles?: Record<string, {
    name: string;
    description: string;
    avg_enrollment: number;
    avg_updates: number;
    district_count: number;
  }>;
  by_state?: Record<string, {
    dominant_cluster: number;
    cluster_distribution: Record<number, number>;
  }>;
}

// Hotspot Detection
export interface HotspotData {
  national?: {
    hotspot_count: number;
    avg_intensity: number;
  };
  rankings?: {
    top_50_hotspots: Array<{
      state: string;
      district: string;
      intensity: number;
      ewma_value: number;
      is_hotspot: boolean;
    }>;
    infrastructure_priority: Array<{
      state: string;
      district: string;
      priority_score: number;
    }>;
  };
}

// MBU Projection
export interface MBUProjectionData {
  national?: {
    total_5_year_mbu: number;
    avg_annual_mbu: number;
    peak_year: number;
    peak_year_demand: number;
  };
  rankings?: {
    top_50_mbu_demand: Array<{
      state: string;
      district: string;
      total_5_year_mbu: number;
      yearly_projection: number[];
    }>;
  };
  by_state?: Record<string, {
    total_5_year_mbu: number;
    scanner_recommendation: number;
  }>;
}

// Top 50 Needy Districts
export interface Top50NeedyData {
  parameter: string;
  top_50: Array<{
    key: string;
    state: string;
    district: string;
    capacity_stress: number;
    underserved_score: number;
    fraud_risk: number;
    hotspot_intensity: number;
    mbu_demand: number;
    composite_neediness: number;
  }>;
}

// State Comparison
export interface StateComparisonData {
  metric: string;
  total_states: number;
  ranking: Array<{
    state: string;
    value: number;
    data: Record<string, unknown>;
  }>;
}

// District Comparison
export interface DistrictComparisonData {
  state: string;
  metric: string;
  total_districts: number;
  top_n: Array<{
    district: string;
    value: number;
    [key: string]: unknown;
  }>;
  bottom_n: Array<{
    district: string;
    value: number;
    [key: string]: unknown;
  }>;
}

// Monthly Comparison
export interface MonthlyComparisonData {
  metric: string;
  state: string;
  monthly_comparison: Record<string, {
    national_summary?: Record<string, unknown>;
    state?: string;
    data?: Record<string, unknown>;
    top_5_districts?: Array<Record<string, unknown>>;
  }>;
}

// ==================== ML API FUNCTIONS ====================

// ML Model Status
export async function fetchMLStatus(): Promise<MLModelStatus> {
  const response = await api.get('/api/ml-v2/status');
  return response.data;
}

// Capacity Planning
export async function fetchCapacityPlanning(
  state?: string,
  district?: string,
  period?: string,
  level?: string
): Promise<CapacityPlanningData> {
  const response = await api.get('/api/ml-v2/capacity', {
    params: { 
      ...(state && { state }), 
      ...(district && { district }),
      ...(period && { period }),
      ...(level && { level }),
    },
  });
  return response.data;
}

// Underserved Districts
export async function fetchUnderserved(
  state?: string,
  period?: string,
  limit?: number
): Promise<UnderservedData> {
  const response = await api.get('/api/ml-v2/underserved', {
    params: { 
      ...(state && { state }), 
      ...(period && { period }),
      ...(limit && { limit }),
    },
  });
  return response.data;
}

// Fraud Detection
export async function fetchFraudRisk(
  state?: string,
  period?: string,
  limit?: number
): Promise<FraudDetectionData> {
  const response = await api.get('/api/ml-v2/fraud', {
    params: { 
      ...(state && { state }), 
      ...(period && { period }),
      ...(limit && { limit }),
    },
  });
  return response.data;
}

// Clustering
export async function fetchClustering(
  state?: string
): Promise<ClusteringData> {
  const response = await api.get('/api/ml-v2/clustering', {
    params: { ...(state && { state }) },
  });
  return response.data;
}

// Hotspots
export async function fetchHotspots(
  state?: string,
  period?: string
): Promise<HotspotData> {
  const response = await api.get('/api/ml-v2/hotspots', {
    params: { ...(state && { state }), ...(period && { period }) },
  });
  return response.data;
}

// MBU Projection
export async function fetchMBUProjection(
  state?: string,
  period?: string
): Promise<MBUProjectionData> {
  const response = await api.get('/api/ml-v2/mbu-projection', {
    params: { ...(state && { state }), ...(period && { period }) },
  });
  return response.data;
}

// Top 50 Needy Districts (National)
export async function fetchTop50Needy(): Promise<Top50NeedyData> {
  const response = await api.get('/api/ml-v2/rankings/top-50-needy');
  return response.data;
}

// State Comparison
export async function fetchStateComparison(
  metric: string = 'underserved_score',
  period?: string
): Promise<StateComparisonData> {
  const response = await api.get('/api/ml-v2/compare/states', {
    params: { metric, ...(period && { period }) },
  });
  return response.data;
}

// District Comparison within State
export async function fetchDistrictComparison(
  state: string,
  metric: string = 'underserved_score',
  topN?: number
): Promise<DistrictComparisonData> {
  const response = await api.get('/api/ml-v2/compare/districts', {
    params: { state, metric, ...(topN && { top_n: topN }) },
  });
  return response.data;
}

// Monthly Comparison
export async function fetchMonthlyComparison(
  metric: string = 'underserved_score',
  state?: string
): Promise<MonthlyComparisonData> {
  const response = await api.get('/api/ml-v2/monthly-comparison', {
    params: { metric, ...(state && { state }) },
  });
  return response.data;
}

export default api;
