"use client";

import { useSession } from "next-auth/react";
import { CarbonPointsCard } from "./components/CarbonPointsCard";
import { TransactionHistory } from "./components/TransactionHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreatedRideHistory from "./components/CreatedRideHistory";
import RideBookedHistory from "./components/RideBookedHistory";

export default function DashboardPage() {

  const { data: session } = useSession();

  // Extract user display name from session
  const userEmail = session?.user?.email || "Guest";
  const displayName = userEmail.split("@")[0];

  // Show dashboard with data
  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-semibold text-white mb-6">Welcome, {displayName}!</h1>
      <div className="space-y-6">
        <div className="w-full">
          <CarbonPointsCard />
        </div>
        <div className="w-full space-y-6">
          <TransactionHistory />
          <Card className="bg-gradient-to-br from-[#1A3C34] to-[#2C5046] text-white border-none shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold tracking-tight">My Rides</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
              <Tabs defaultValue="created" className="w-full">
                <TabsList className="grid w-[calc(100%-2rem)] grid-cols-2 bg-black/20 rounded-md p-1 mx-4 mb-4">
                  <TabsTrigger
                    value="created"
                    className="data-[state=active]:bg-[#2E7D32] data-[state=active]:text-white text-gray-300"
                  >
                    Created
                  </TabsTrigger>
                  <TabsTrigger
                    value="booked"
                    className="data-[state=active]:bg-[#2E7D32] data-[state=active]:text-white text-gray-300"
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

            {/* {currentRide && (
              <RideChatModal
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                ride={currentRide}
              />
            )} */}
          </Card>
        </div>
      </div>
    </div>
  );
} 