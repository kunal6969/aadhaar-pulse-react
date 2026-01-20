import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import type { FeatureCollection, Feature, Geometry } from 'geojson';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Mapping from GeoJSON state names to our data state names
const STATE_NAME_MAP: Record<string, string> = {
  'Orissa': 'Odisha',
  'Uttaranchal': 'Uttarakhand',
  'Andaman and Nicobar': 'Andaman and Nicobar Islands',
  'Dadra and Nagar Haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'Daman and Diu': 'Dadra and Nagar Haveli and Daman and Diu',
};

// Reverse mapping for lookup
const REVERSE_STATE_NAME_MAP: Record<string, string[]> = {
  'Odisha': ['Orissa', 'Odisha'],
  'Uttarakhand': ['Uttaranchal', 'Uttarakhand'],
  'Andaman and Nicobar Islands': ['Andaman and Nicobar', 'Andaman and Nicobar Islands'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Dadra and Nagar Haveli', 'Daman and Diu', 'Dadra and Nagar Haveli and Daman and Diu'],
};

// Get heat color based on score
function getHeatColor(score: number): string {
  if (score > 80) return '#dc2626'; // red-600
  if (score > 60) return '#ea580c'; // orange-600
  if (score > 40) return '#d97706'; // amber-600
  if (score > 20) return '#65a30d'; // lime-600
  return '#0891b2'; // cyan-600
}

// Get cluster color
function getClusterColor(clusterId: number): string {
  const colors = ['#06b6d4', '#a855f7', '#10b981', '#f97316', '#ec4899'];
  return colors[clusterId % colors.length];
}

interface StateData {
  state: string;
  value: number;
  cluster?: number;
}

interface IndiaLeafletMapProps {
  stateData: StateData[];
  selectedState: string | null;
  onStateClick: (state: string) => void;
  metric?: string;
  showClusters?: boolean;
}

// Component to handle map events and updates
function MapController({ selectedState }: { selectedState: string | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedState) {
      // Zoom to approximate state center
      const stateCenters: Record<string, [number, number]> = {
        'Andhra Pradesh': [15.9129, 79.74],
        'Arunachal Pradesh': [28.218, 94.7278],
        'Assam': [26.2006, 92.9376],
        'Bihar': [25.0961, 85.3131],
        'Chhattisgarh': [21.2787, 81.8661],
        'Goa': [15.2993, 74.124],
        'Gujarat': [22.2587, 71.1924],
        'Haryana': [29.0588, 76.0856],
        'Himachal Pradesh': [31.1048, 77.1734],
        'Jharkhand': [23.6102, 85.2799],
        'Karnataka': [15.3173, 75.7139],
        'Kerala': [10.8505, 76.2711],
        'Madhya Pradesh': [22.9734, 78.6569],
        'Maharashtra': [19.7515, 75.7139],
        'Manipur': [24.6637, 93.9063],
        'Meghalaya': [25.467, 91.3662],
        'Mizoram': [23.1645, 92.9376],
        'Nagaland': [26.1584, 94.5624],
        'Odisha': [20.9517, 85.0985],
        'Punjab': [31.1471, 75.3412],
        'Rajasthan': [27.0238, 74.2179],
        'Sikkim': [27.533, 88.5122],
        'Tamil Nadu': [11.1271, 78.6569],
        'Telangana': [18.1124, 79.0193],
        'Tripura': [23.9408, 91.9882],
        'Uttar Pradesh': [26.8467, 80.9462],
        'Uttarakhand': [30.0668, 79.0193],
        'West Bengal': [22.9868, 87.855],
        'Delhi': [28.7041, 77.1025],
        'Jammu and Kashmir': [33.7782, 76.5762],
        'Ladakh': [34.1526, 77.5771],
        'Puducherry': [11.9416, 79.8083],
        'Chandigarh': [30.7333, 76.7794],
        'Andaman and Nicobar Islands': [11.7401, 92.6586],
        'Lakshadweep': [10.5667, 72.6417],
        'Dadra and Nagar Haveli and Daman and Diu': [20.4283, 72.8397],
      };
      
      const center = stateCenters[selectedState];
      if (center) {
        map.setView(center, 7, { animate: true });
      }
    } else {
      // Reset to India view
      map.setView([22.5, 82], 4.5, { animate: true });
    }
  }, [selectedState, map]);
  
  return null;
}

export default function IndiaLeafletMap({
  stateData,
  selectedState,
  onStateClick,
  showClusters = false,
}: IndiaLeafletMapProps) {
  const geoJsonRef = useRef<L.GeoJSON | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Load GeoJSON file
  useEffect(() => {
    fetch('/india-states.geojson')
      .then(res => res.json())
      .then((data: FeatureCollection) => {
        setGeoJsonData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load India GeoJSON:', err);
        setLoading(false);
      });
  }, []);
  
  // Helper function to normalize state name from GeoJSON to our data format
  const normalizeStateName = (geoJsonName: string): string => {
    return STATE_NAME_MAP[geoJsonName] || geoJsonName;
  };
  
  // Create a map of state data for quick lookup (handles name variations)
  const stateDataMap = useMemo(() => {
    const map = new Map<string, StateData>();
    stateData.forEach(s => {
      map.set(s.state, s);
      // Also add alternate names
      const alternates = REVERSE_STATE_NAME_MAP[s.state];
      if (alternates) {
        alternates.forEach(alt => map.set(alt, s));
      }
    });
    return map;
  }, [stateData]);

  // Style function for GeoJSON features
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getFeatureStyle = (feature: Feature<Geometry, any> | undefined) => {
    // Get state name from GeoJSON (uses NAME_1 property)
    const geoJsonStateName = feature?.properties?.NAME_1 || feature?.properties?.name;
    if (!geoJsonStateName) {
      return {
        fillColor: '#1e293b',
        weight: 1,
        opacity: 1,
        color: '#334155',
        fillOpacity: 0.7,
      };
    }
    
    // Normalize the state name for data lookup
    const normalizedName = normalizeStateName(geoJsonStateName);
    const data = stateDataMap.get(geoJsonStateName) || stateDataMap.get(normalizedName);
    
    // Check selection and hover states (compare with both original and normalized names)
    const isSelected = selectedState === geoJsonStateName || selectedState === normalizedName;
    const isHovered = hoveredState === geoJsonStateName || hoveredState === normalizedName;
    
    let fillColor = '#1e293b'; // default slate
    if (data) {
      if (showClusters && data.cluster !== undefined) {
        fillColor = getClusterColor(data.cluster);
      } else {
        fillColor = getHeatColor(data.value);
      }
    }
    
    return {
      fillColor,
      weight: isSelected ? 3 : isHovered ? 2 : 1,
      opacity: 1,
      color: isSelected ? '#06b6d4' : isHovered ? '#94a3b8' : '#475569',
      fillOpacity: isSelected ? 0.9 : isHovered ? 0.85 : 0.75,
    };
  };

  // Event handlers for each feature
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onEachFeature = (feature: Feature<Geometry, any>, layer: L.Layer) => {
    const geoJsonStateName = feature.properties?.NAME_1 || feature.properties?.name;
    if (!geoJsonStateName) return;
    
    const normalizedName = normalizeStateName(geoJsonStateName);
    const data = stateDataMap.get(geoJsonStateName) || stateDataMap.get(normalizedName);
    const displayName = normalizedName; // Use normalized name for display
    
    // Bind tooltip
    const tooltipContent = `
      <div style="background: #0f172a; padding: 8px 12px; border-radius: 8px; border: 1px solid #334155;">
        <div style="color: #f1f5f9; font-weight: 600; margin-bottom: 4px;">${displayName}</div>
        <div style="color: #94a3b8; font-size: 12px;">
          Score: <span style="color: ${data ? getHeatColor(data.value) : '#64748b'}; font-weight: 600;">${data?.value?.toFixed(1) || 'N/A'}</span>
        </div>
        ${data?.cluster !== undefined ? `<div style="color: #94a3b8; font-size: 12px;">Cluster: ${data.cluster + 1}</div>` : ''}
      </div>
    `;
    
    (layer as L.Path).bindTooltip(tooltipContent, {
      permanent: false,
      direction: 'top',
      className: 'custom-tooltip',
      opacity: 1,
    });
    
    // Add event listeners - use normalized name for consistency
    layer.on({
      mouseover: () => {
        setHoveredState(normalizedName);
      },
      mouseout: () => {
        setHoveredState(null);
      },
      click: () => {
        onStateClick(normalizedName);
      },
    });
  };

  // Re-render GeoJSON when data changes
  useEffect(() => {
    if (geoJsonRef.current) {
      geoJsonRef.current.setStyle(getFeatureStyle as L.StyleFunction);
    }
  }, [stateData, selectedState, hoveredState, showClusters, geoJsonData]);

  // Show loading state
  if (loading) {
    return (
      <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  // Show error if GeoJSON failed to load
  if (!geoJsonData) {
    return (
      <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm">Failed to load map data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-slate-700">
      <MapContainer
        center={[22.5, 82]}
        zoom={4.5}
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        attributionControl={false}
      >
        {/* Topographic tile layer */}
        <TileLayer
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenTopoMap'
          opacity={0.3}
        />
        
        {/* Alternative: Satellite view with lower opacity */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; Esri'
          opacity={0.15}
        />
        
        {/* GeoJSON layer for states */}
        <GeoJSON
          key={JSON.stringify(stateData.map(s => s.value))} // Force re-render when data changes
          ref={geoJsonRef}
          data={geoJsonData}
          style={getFeatureStyle as L.StyleFunction}
          onEachFeature={onEachFeature}
        />
        
        <MapController selectedState={selectedState} />
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 border border-slate-700 z-[1000]">
        <div className="text-xs text-slate-400 mb-2 font-medium">
          {showClusters ? 'Cluster Legend' : 'Underserved Score'}
        </div>
        {showClusters ? (
          <div className="space-y-1">
            {['Migration Hubs', 'Stable Zones', 'High Biometric', 'Enrollment Surge', 'Suspicious'].map((name, i) => (
              <div key={name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getClusterColor(i) }} />
                <span className="text-xs text-slate-300">{name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {[
              { label: '> 80 (Critical)', color: '#dc2626' },
              { label: '60-80 (High)', color: '#ea580c' },
              { label: '40-60 (Medium)', color: '#d97706' },
              { label: '20-40 (Low)', color: '#65a30d' },
              { label: '< 20 (Minimal)', color: '#0891b2' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                <span className="text-xs text-slate-300">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Selected State Badge */}
      {selectedState && (
        <div className="absolute top-4 left-4 bg-cyan-500/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-cyan-500/50 z-[1000]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-sm text-cyan-300 font-medium">{selectedState}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); onStateClick(''); }}
              className="text-cyan-400 hover:text-cyan-300 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      {!selectedState && (
        <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-700 z-[1000]">
          <p className="text-xs text-slate-400">Click a state to zoom in</p>
        </div>
      )}
    </div>
  );
}
