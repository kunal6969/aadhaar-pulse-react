import { Routes, Route, NavLink, useLocation as useRouterLocation } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Fingerprint,
  Map,
  TrendingUp,
  AlertTriangle,
  Menu,
  X,
  Calendar,
  MapPin,
  ChevronDown,
  Globe,
  Building2,
  Brain,
  Gauge,
  ShieldAlert,
  Rocket,
} from 'lucide-react';
import { format } from 'date-fns';

// Pages
import Dashboard from './pages/Dashboard';
import Enrollments from './pages/Enrollments';
import Demographics from './pages/Demographics';
import Biometrics from './pages/Biometrics';
import MapView from './pages/MapView';
import Forecast from './pages/Forecast';
import Anomalies from './pages/Anomalies';

// AI Insights Pages
import Operations from './pages/ai/Operations';
import Equity from './pages/ai/Equity';
import Risk from './pages/ai/Risk';
import Strategy from './pages/ai/Strategy';

// Context
import { LocationProvider, useLocationContext } from './context/LocationContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/enrollments', label: 'Enrollments', icon: Users },
  { path: '/demographics', label: 'Demographics', icon: UserCog },
  { path: '/biometrics', label: 'Biometrics', icon: Fingerprint },
  { path: '/map', label: 'Map View', icon: Map },
  { path: '/forecast', label: 'Forecast', icon: TrendingUp },
  { path: '/anomalies', label: 'Anomalies', icon: AlertTriangle },
];

const aiNavItems = [
  { path: '/ai/operations', label: 'Operations Planner', icon: Gauge },
  { path: '/ai/equity', label: 'Equity & Access', icon: Brain },
  { path: '/ai/risk', label: 'Risk Monitor', icon: ShieldAlert },
  { path: '/ai/strategy', label: 'MBU Strategy', icon: Rocket },
];

// Location Selector Component
function LocationSelector() {
  const {
    selectedState,
    selectedDistrict,
    setSelectedState,
    setSelectedDistrict,
    states,
    districts,
    isLoadingStates,
    isLoadingDistricts,
    locationLabel,
  } = useLocationContext();

  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);

  return (
    <div className="p-4 border-t border-slate-800">
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
        <MapPin size={16} className="text-cyan-400" />
        <span>Location Filter</span>
      </div>

      {/* Current Selection Display */}
      <div className="mb-3 px-3 py-2 bg-slate-800/50 rounded-lg">
        <p className="text-xs text-slate-500">Viewing data for:</p>
        <p className="text-sm font-medium text-cyan-400 flex items-center gap-1.5">
          <Globe size={14} />
          {locationLabel}
        </p>
      </div>

      {/* State Selector */}
      <div className="relative mb-2">
        <button
          onClick={() => {
            setShowStateDropdown(!showStateDropdown);
            setShowDistrictDropdown(false);
          }}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-left text-sm flex items-center justify-between hover:border-cyan-500/50 transition-colors"
        >
          <span className={selectedState ? 'text-white' : 'text-slate-400'}>
            {selectedState || 'All States'}
          </span>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform ${showStateDropdown ? 'rotate-180' : ''}`}
          />
        </button>
        {showStateDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            <button
              onClick={() => {
                setSelectedState(null);
                setShowStateDropdown(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-cyan-400 hover:bg-slate-700 flex items-center gap-2"
            >
              <Globe size={14} />
              All India
            </button>
            {isLoadingStates ? (
              <div className="px-3 py-2 text-slate-400 text-sm">Loading...</div>
            ) : (
              states.map((state) => (
                <button
                  key={state}
                  onClick={() => {
                    setSelectedState(state);
                    setShowStateDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-700 ${
                    selectedState === state ? 'text-cyan-400 bg-slate-700' : 'text-white'
                  }`}
                >
                  {state}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* District Selector - Only show when state is selected */}
      {selectedState && (
        <div className="relative">
          <button
            onClick={() => {
              setShowDistrictDropdown(!showDistrictDropdown);
              setShowStateDropdown(false);
            }}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-left text-sm flex items-center justify-between hover:border-cyan-500/50 transition-colors"
          >
            <span className={selectedDistrict ? 'text-white' : 'text-slate-400'}>
              {selectedDistrict || 'All Districts'}
            </span>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform ${showDistrictDropdown ? 'rotate-180' : ''}`}
            />
          </button>
          {showDistrictDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  setSelectedDistrict(null);
                  setShowDistrictDropdown(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-cyan-400 hover:bg-slate-700 flex items-center gap-2"
              >
                <Building2 size={14} />
                All Districts
              </button>
              {isLoadingDistricts ? (
                <div className="px-3 py-2 text-slate-400 text-sm">Loading...</div>
              ) : (
                districts.map((district) => (
                  <button
                    key={district}
                    onClick={() => {
                      setSelectedDistrict(district);
                      setShowDistrictDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-700 ${
                      selectedDistrict === district ? 'text-cyan-400 bg-slate-700' : 'text-white'
                    }`}
                  >
                    {district}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Reset Button */}
      {(selectedState || selectedDistrict) && (
        <button
          onClick={() => {
            setSelectedState(null);
            setSelectedDistrict(null);
          }}
          className="w-full mt-2 px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
        >
          Reset to All India
        </button>
      )}
    </div>
  );
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Use Dec 15, 2025 as default since data ends around that date
  const [simulationDate, setSimulationDate] = useState(new Date('2025-12-15'));
  const routerLocation = useRouterLocation();

  return (
    <div className="flex min-h-screen bg-[#030712]">
      {/* Sidebar */}
      <motion.aside
        initial={{ width: sidebarOpen ? 280 : 80 }}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="fixed left-0 top-0 h-full bg-[#0f172a] border-r border-slate-800 z-50 flex flex-col"
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">आ</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Aadhaar Pulse</h1>
                <p className="text-xs text-slate-400">Analytics Dashboard</p>
              </div>
            </motion.div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-medium"
                >
                  {item.label}
                </motion.span>
              )}
            </NavLink>
          ))}

          {/* AI Insights Divider */}
          {sidebarOpen && (
            <div className="pt-4 pb-2">
              <div className="flex items-center gap-2 px-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                <span className="text-xs text-purple-400 font-medium uppercase tracking-wider">AI Insights</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
              </div>
            </div>
          )}
          {!sidebarOpen && (
            <div className="pt-4 pb-2 flex justify-center">
              <div className="w-8 h-px bg-purple-500/50" />
            </div>
          )}

          {/* AI Navigation Items */}
          {aiNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-medium"
                >
                  {item.label}
                </motion.span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Location Selector - Only when sidebar is open */}
        {sidebarOpen && <LocationSelector />}

        {/* Date Picker */}
        {sidebarOpen && (
          <div className="p-4 border-t border-slate-800">
            <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <Calendar size={16} />
              Simulation Date
            </label>
            <input
              type="date"
              value={format(simulationDate, 'yyyy-MM-dd')}
              onChange={(e) => setSimulationDate(new Date(e.target.value))}
              min="2025-09-01"
              max="2025-12-31"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
        )}
      </motion.aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-[280px]' : 'ml-20'
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={routerLocation.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            <Routes>
              <Route path="/" element={<Dashboard simulationDate={simulationDate} />} />
              <Route path="/enrollments" element={<Enrollments simulationDate={simulationDate} />} />
              <Route path="/demographics" element={<Demographics simulationDate={simulationDate} />} />
              <Route path="/biometrics" element={<Biometrics simulationDate={simulationDate} />} />
              <Route path="/map" element={<MapView simulationDate={simulationDate} />} />
              <Route path="/forecast" element={<Forecast simulationDate={simulationDate} />} />
              <Route path="/anomalies" element={<Anomalies simulationDate={simulationDate} />} />
              {/* AI Insights Routes */}
              <Route path="/ai/operations" element={<Operations simulationDate={simulationDate} />} />
              <Route path="/ai/equity" element={<Equity simulationDate={simulationDate} />} />
              <Route path="/ai/risk" element={<Risk />} />
              <Route path="/ai/strategy" element={<Strategy />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function App() {
  return (
    <LocationProvider>
      <AppContent />
    </LocationProvider>
  );
}

export default App;
