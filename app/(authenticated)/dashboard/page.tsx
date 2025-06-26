"use client";

import { useSession } from "next-auth/react";
import { CarbonPointsCard } from "../../_components/CarbonPointsCard";
import { TransactionHistory } from "../../_components/TransactionHistory";
import { MyRides } from "../../_components/MyRides";
import { useAuth } from "../../_contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { userData, isLoading, error, refreshUserData } = useAuth();

  // Extract user display name from session
  const userEmail = session?.user?.email || "Guest";
  const displayName = userEmail.split("@")[0];

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-4 pb-20 space-y-6">
        <Skeleton className="h-8 w-60 bg-white/10 rounded-md" />
        <Skeleton className="h-24 w-full bg-white/10 rounded-lg" />
        <Skeleton className="h-48 w-full bg-white/10 rounded-lg" />
        <Skeleton className="h-64 w-full bg-white/10 rounded-lg" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  // Show no data state
  if (!userData) {
    return <div className="p-4 text-white">No user data available</div>;
  }

  // Show dashboard with data
  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-semibold text-white mb-6">Welcome, {displayName}!</h1>
      <div className="space-y-6">
        <div className="w-full">
          <CarbonPointsCard carbonPoints={userData.carbonPoints} />
        </div>
        <div className="w-full space-y-6">
          <TransactionHistory transactions={userData.transactions} />
          <MyRides 
            createdRides={userData.createdRides} 
            bookedRides={userData.bookedRides} 
            onDataUpdate={refreshUserData}
          />
        </div>
      </div>
    </div>
  );
} 