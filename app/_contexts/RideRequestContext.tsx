"use client";

import { toast } from "sonner";
import { useSession } from "next-auth/react";
import formatTime, { formatDate } from "@/lib/formatTime";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
  useRef
} from "react";

import {
  getRideRequests,
  getUserRideRequests,
  getAggregatedRideRequests,
  AggregatedRideRequest
} from "../_actions/getRideRequests";

import { createRideRequest } from "../_actions/createRideRequest";

export interface RideRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  from: string;
  to: string;
  time: string;
  date: string;
  createdAt: string;
  status: 'Pending' | 'Matched' | 'Canceled';
}

interface RideRequestContextType {
  rideRequests: RideRequest[];
  userRideRequest: RideRequest | null;
  userRideRequests: RideRequest[];
  aggregatedRideRequests: AggregatedRideRequest[];
  isLoading: boolean;
  error: string | null;
  refreshRideRequests: () => Promise<void>;
  createNewRideRequest: (
    startingPoint: string,
    destination: string,
    startingTime: string
  ) => Promise<{ success: boolean; message: string }>;
}

const RideRequestContext = createContext<RideRequestContextType | undefined>(undefined);

export function RideRequestProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [aggregatedRideRequests, setAggregatedRideRequests] = useState<AggregatedRideRequest[]>([]);
  const [userRideRequest, setUserRideRequest] = useState<RideRequest | null>(null);
  const [userRideRequests, setUserRideRequests] = useState<RideRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Create a stable fetchRideRequests function that won't change on re-renders
  const fetchRideRequests = useCallback(async () => {
    if (status !== "authenticated" || !isMountedRef.current) return;

    try {
      setIsLoading(true);

      // Fetch other users' ride requests - regular and aggregated
      const [requests, aggregated] = await Promise.all([
        getRideRequests(),
        getAggregatedRideRequests()
      ]);

      if (!isMountedRef.current) return;

      // Transform the requests to match our context's RideRequest interface
      const formattedRequests: RideRequest[] = requests.map(request => ({
        id: request.id,
        userId: request.userId,
        userName: request.userId, // We don't have name in the original request
        userEmail: request.user.email,
        from: request.startingPoint,
        to: request.destination,
        time: formatTime(request.startingTime),
        date: formatDate(request.startingTime),
        createdAt: new Date(request.createdAt).toISOString(),
        status: request.status as "Pending" | "Matched" | "Canceled"
      }));

      setRideRequests(formattedRequests);
      setAggregatedRideRequests(aggregated);

      // Fetch user's own ride requests
      const userRequests = await getUserRideRequests();

      if (!isMountedRef.current) return;

      if (userRequests && userRequests.length > 0) {
        const formattedUserRequests: RideRequest[] = userRequests.map(request => ({
          id: request.id,
          userId: request.userId,
          userName: request.userId,
          userEmail: request.user.email,
          from: request.startingPoint,
          to: request.destination,
          time: formatTime(request.startingTime),
          date: formatDate(request.startingTime),
          createdAt: new Date(request.createdAt).toISOString(),
          status: request.status as "Pending" | "Matched" | "Canceled"
        }));

        setUserRideRequests(formattedUserRequests);
        // Keep the first request for backward compatibility
        setUserRideRequest(formattedUserRequests[0]);
      } else {
        setUserRideRequests([]);
        setUserRideRequest(null);
      }

      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : "Failed to load ride requests.";
      setError(errorMessage);
      console.error("Error loading ride requests:", err);
      toast.error("Error loading ride requests", { description: errorMessage });
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [status]);

  // Create a stable refreshRideRequests function that won't change on re-renders
  const refreshRideRequests = useCallback(async () => {
    await fetchRideRequests();
  }, [fetchRideRequests]);

  const createNewRideRequest = useCallback(async (
    startingPoint: string,
    destination: string,
    startingTime: string
  ) => {
    try {
      // Call the server action to create the ride request
      const result = await createRideRequest(startingPoint, destination, startingTime);

      // Refresh the ride requests immediately to show the new request
      await fetchRideRequests();

      // Show appropriate toast based on result
      if (result.success) {
        toast.success("Success", { description: result.message });
        return { success: true, message: result.message };
      } else {
        toast.error("Error", { description: result.message });
        return { success: false, message: result.message };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create ride request.";
      console.error("Error creating ride request:", err);
      toast.error("Error", { description: errorMessage });
      return { success: false, message: errorMessage };
    }
  }, [fetchRideRequests]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load ride requests on initial mount and when authentication status changes
  useEffect(() => {
    if (status === "authenticated") {
      fetchRideRequests();
    }
  }, [status, fetchRideRequests]);

  // Set up polling to refresh ride requests every 30 seconds
  useEffect(() => {
    if (status !== "authenticated") return;

    const intervalId = setInterval(() => {
      fetchRideRequests();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [status, fetchRideRequests]);

  const value = {
    rideRequests,
    userRideRequest,
    userRideRequests,
    aggregatedRideRequests,
    isLoading,
    error,
    refreshRideRequests,
    createNewRideRequest
  };

  return <RideRequestContext.Provider value={value}>{children}</RideRequestContext.Provider>;
}

export function useRideRequests() {
  const context = useContext(RideRequestContext);

  if (context === undefined) {
    throw new Error("useRideRequests must be used within a RideRequestProvider");
  }

  return context;
} 