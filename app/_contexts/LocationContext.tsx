"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { getLocations } from "../_actions/getLocations";
import { toast } from "sonner";

interface LocationContextData {
  locations: string[];
  locationDistances: LocationDistance[];
  isLoading: boolean;
  error: string | null;
  refreshLocations: () => Promise<void>;
  lastFetched: number | null;
}

interface LocationDistance {
  name: string;
  distanceFromOrg: number;
}

// Cache expiration time in milliseconds (1 hour)
const CACHE_EXPIRATION = 60 * 60 * 1000;

// Create the context
const LocationContext = createContext<LocationContextData | undefined>(undefined);

// Provider component
export function LocationProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<string[]>([]);
  const [locationDistances, setLocationDistances] = useState<LocationDistance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Function to fetch locations
  const fetchLocations = useCallback(async (force = false) => {
    // If we've already fetched data and the cache hasn't expired, don't fetch again
    if (
      !force && 
      locations.length > 0 && 
      locationDistances.length > 0 && 
      lastFetched && 
      Date.now() - lastFetched < CACHE_EXPIRATION
    ) {
      return;
    }

    try {
      // For initial loading or forced refresh, set isLoading to true
      if (locations.length === 0 || force) {
        setIsLoading(true);
      }
      
      // Fetch location names
      const locationNames = await getLocations();
      setLocations(locationNames);
      
      // Fetch location distances
      const response = await fetch('/api/locations');
      const distanceData = await response.json();
      setLocationDistances(distanceData);
      
      setError(null);
      setInitialized(true);
      setLastFetched(Date.now());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load locations.";
      setError(errorMessage);
      
      // Only show toast on initial load or forced refresh
      if (locations.length === 0 || force) {
        toast.error("Error loading locations", { description: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  }, [locations.length, locationDistances.length, lastFetched]);

  // Fetch locations data on initial load
  useEffect(() => {
    if (!initialized) {
      fetchLocations();
    }
  }, [initialized, fetchLocations]);

  // Handle background revalidation - if cache is stale, refresh in background
  useEffect(() => {
    if (lastFetched && Date.now() - lastFetched > CACHE_EXPIRATION) {
      fetchLocations();
    }
  }, [lastFetched, fetchLocations]);

  // Context value
  const value: LocationContextData = {
    locations,
    locationDistances,
    isLoading,
    error,
    refreshLocations: () => fetchLocations(true),
    lastFetched
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

// Hook to use the locations context
export function useLocations() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocations must be used within a LocationProvider");
  }
  return context;
} 