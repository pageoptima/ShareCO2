"use client";

import { useSession } from "next-auth/react";
import { BottomNav } from "../_components/BottomNav";
import { redirect } from "next/navigation";
import { AuthProvider, useAuth } from "../_contexts/AuthContext";
import { LocationProvider } from "../_contexts/LocationContext";
import { RideRequestProvider } from "../_contexts/RideRequestContext";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMenu } from "../_components/UserMenu";
import { DisclaimerModal } from "../_components/DisclaimerModal";

// Add a loading component for a better UX
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-emerald-900 bg-radial from-emerald-700 to-black to-90% p-4 flex flex-col space-y-4">
      <Skeleton className="h-8 w-60 bg-white/10 rounded-md" />
      <Skeleton className="h-32 w-full bg-white/10 rounded-lg" />
      <Skeleton className="h-32 w-full bg-white/10 rounded-lg" />
      <Skeleton className="h-32 w-full bg-white/10 rounded-lg" />
    </div>
  );
}

// Component to handle auth check and protected content
function AuthenticatedContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { showDisclaimer, setShowDisclaimer, refreshUserData } = useAuth();
  
  // Show loading state while checking authentication
  if (status === "loading") {
    return <LoadingScreen />;
  }
  
  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    redirect("/");
  }

  // Handle disclaimer acceptance
  const handleDisclaimerAccept = async () => {
    setShowDisclaimer(false);
    // Refresh user data to update disclaimerAccepted status
    await refreshUserData();
  };

  return (
    <div className="min-h-screen bg-emerald-900 bg-radial from-emerald-700 to-black to-90%">
      <header className="fixed top-0 right-0 z-50 p-4">
        <UserMenu />
      </header>
      {children}
      {session && <BottomNav />}
      
      {/* Disclaimer Modal */}
      <DisclaimerModal 
        isOpen={showDisclaimer} 
        onAccept={handleDisclaimerAccept} 
      />
    </div>
  );
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <LocationProvider>
        <RideRequestProvider>
          <Suspense fallback={<LoadingScreen />}>
            <AuthenticatedContent>{children}</AuthenticatedContent>
          </Suspense>
        </RideRequestProvider>
      </LocationProvider>
    </AuthProvider>
  );
} 