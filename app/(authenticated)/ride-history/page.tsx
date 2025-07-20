"use client"

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HomeIcon } from "lucide-react";
import Link from "next/link"; 
import CreatedRideHistory from "./components/CreatedRideHistory";
import RideBookedHistory from "./components/RideBookedHistory";
export default function RideHistory() {
  return (
    <div className="p-4 pb-20 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link href="/dashboard" passHref>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 -ml-2 hover:cursor-pointer flex items-center"
          >
            <HomeIcon className="h-5 w-5 mr-1" />
            Home
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold text-white">Ride History</h1>
        <div className="w-20"></div>
      </div>

      <Tabs defaultValue="created" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#1A3C34]">
          <TabsTrigger
            value="created"
            className="data-[state=active]:bg-emerald-600 cursor-pointer"
          >
            Created Rides
          </TabsTrigger>
          <TabsTrigger
            value="booked"
            className="data-[state=active]:bg-emerald-600 cursor-pointer"
          >
            Booked Rides
          </TabsTrigger>
        </TabsList>

        <TabsContent value="created" className="mt-4">
          <CreatedRideHistory />
        </TabsContent>

        <TabsContent value="booked" className="mt-4">
          <RideBookedHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
