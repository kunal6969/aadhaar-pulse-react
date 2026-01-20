import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../api';

interface LocationContextType {
  selectedState: string | null;
  selectedDistrict: string | null;
  setSelectedState: (state: string | null) => void;
  setSelectedDistrict: (district: string | null) => void;
  states: string[];
  districts: string[];
  isLoadingStates: boolean;
  isLoadingDistricts: boolean;
  locationLabel: string;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(true);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

  // Fetch states on mount
  useEffect(() => {
    async function fetchStates() {
      try {
        const response = await api.get('/api/enrollment/states');
        const stateList: string[] = response.data?.states || [];
        
        // State name normalization map
        const stateNormalization: Record<string, string> = {
          'andhra pradesh': 'Andhra Pradesh',
          'andaman & nicobar islands': 'Andaman and Nicobar Islands',
          'dadra & nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
          'dadra and nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
          'dadra and nagar haveli and daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
          'daman & diu': 'Dadra and Nagar Haveli and Daman and Diu',
          'daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
          'jammu & kashmir': 'Jammu and Kashmir',
          'odisha': 'Odisha',
          'orissa': 'Odisha',
          'pondicherry': 'Puducherry',
          'west bengal': 'West Bengal',
          'west  bengal': 'West Bengal',
          'west bangal': 'West Bengal',
          'westbengal': 'West Bengal',
        };
        
        // Normalize and deduplicate states
        const normalizedStates = stateList
          .filter((s) => s && !/^\d+$/.test(s)) // Remove numeric entries
          .map((s) => {
            const normalized = s.trim().toLowerCase().replace(/\s+/g, ' ');
            return stateNormalization[normalized] || 
                   // Title case if not in map
                   s.trim().split(' ').map(word => 
                     word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                   ).join(' ');
          });
        
        // Use Set to deduplicate and sort
        const uniqueStates = [...new Set(normalizedStates)].sort();
        setStates(uniqueStates);
      } catch (error) {
        console.error('Failed to fetch states:', error);
      } finally {
        setIsLoadingStates(false);
      }
    }
    fetchStates();
  }, []);

  // Fetch districts when state changes
  useEffect(() => {
    async function fetchDistricts() {
      if (!selectedState) {
        setDistricts([]);
        return;
      }
      setIsLoadingDistricts(true);
      try {
        const response = await api.get('/api/enrollment/districts', {
          params: { state: selectedState },
        });
        const districtList = response.data?.districts || [];
        setDistricts(districtList.sort());
      } catch (error) {
        console.error('Failed to fetch districts:', error);
        setDistricts([]);
      } finally {
        setIsLoadingDistricts(false);
      }
    }
    fetchDistricts();
    setSelectedDistrict(null); // Reset district when state changes
  }, [selectedState]);

  // Generate location label
  const locationLabel = selectedDistrict
    ? `${selectedDistrict}, ${selectedState}`
    : selectedState
    ? selectedState
    : 'All India';

  return (
    <LocationContext.Provider
      value={{
        selectedState,
        selectedDistrict,
        setSelectedState,
        setSelectedDistrict,
        states,
        districts,
        isLoadingStates,
        isLoadingDistricts,
        locationLabel,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
}
