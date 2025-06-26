"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getUserData } from "../_actions/getUserData";
import { toast } from "sonner";

// Define types for user data
interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
}

interface Ride {
  id: string;
  from: string;
  to: string;
  date: string;
  status: string;
  time: string;
}

interface BookedRide extends Ride {
  startingTime: string;
}

interface Vehicle {
  id: string;
  type: string;
  vehicleNumber: string;
  model?: string;
}

interface UserData {
  carbonPoints: number;
  transactions: Transaction[];
  createdRides: Ride[];
  bookedRides: BookedRide[];
  vehicles: Vehicle[];
  isAdmin: boolean;
  disclaimerAccepted: boolean;
  name?: string;
  email?: string;
  gender?: string;
  age?: number;
}

// Define the context state
interface AuthContextData {
  userData: UserData | null;
  isLoading: boolean;
  error: string | null;
  showDisclaimer: boolean;
  refreshUserData: () => Promise<void>;
  setShowDisclaimer: (show: boolean) => void;
}

// Create the context
const AuthContext = createContext<AuthContextData | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(false);

  // Function to fetch user data
  const fetchUserData = useCallback(async () => {
    if (status !== "authenticated") return;
    
    try {
      setIsLoading(true);
      const data = await getUserData();
      setUserData(data);
      setError(null);
      
      // Check if user needs to see disclaimer
      if (data && !data.disclaimerAccepted) {
        setShowDisclaimer(true);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      setError("Failed to load user data");
      
      // Show a generic error instead of the actual database error
      toast.error("Unable to load profile", { 
        description: "We're having trouble loading your profile data. Please try again later."
      });
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  // Fetch user data when session changes
  useEffect(() => {
    fetchUserData();
  }, [status, session?.user?.id, fetchUserData]);

  // Context value
  const value: AuthContextData = {
    userData,
    isLoading,
    error,
    showDisclaimer,
    refreshUserData: fetchUserData,
    setShowDisclaimer
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 