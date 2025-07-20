"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CarbonPointsCard } from "./components/CarbonPointsCard";
import CreatedRideHistory from "./components/CreatedRideHistory";
import RideBookedHistory from "./components/RideBookedHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserProfileStatus } from "./actions";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("created");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile-status"],
    queryFn: getUserProfileStatus,
  });

  // Redirect to /profile if profile is not completed
  useEffect(() => {
    if (!isLoading && !isError && data && !data.isProfileCompleted) {
      router.push("/profile");
    }
  }, [data, isLoading, isError, router]);

  // Extract user display name
  const userEmail = session?.user?.email || "Guest";
  const displayName = userEmail.split("@")[0];

  // Set tab from query param
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "booked" || tab === "created") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-semibold text-white mb-6">
        Welcome, {displayName}!
      </h1>

      <div className="space-y-6">
        <CarbonPointsCard />

        <Card className="bg-gradient-to-br from-[#1A3C34] to-[#2C5046] text-white border-none shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold tracking-tight">
              My Rides
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-[calc(100%-2rem)] grid-cols-2 bg-black/20 rounded-md p-1 mx-4 mb-4">
                <TabsTrigger
                  value="created"
                  className="data-[state=active]:bg-[#2E7D32] data-[state=active]:text-white text-gray-300 cursor-pointer"
                >
                  Created
                </TabsTrigger>
                <TabsTrigger
                  value="booked"
                  className="data-[state=active]:bg-[#2E7D32] data-[state=active]:text-white text-gray-300 cursor-pointer"
                >
                  Booked
                </TabsTrigger>
              </TabsList>
              <TabsContent value="created">
                <CreatedRideHistory />
              </TabsContent>
              <TabsContent value="booked">
                <RideBookedHistory />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
