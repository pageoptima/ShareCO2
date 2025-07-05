"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Car, HomeIcon } from "lucide-react";
import { useAuth } from "../../_contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import VehicleManager from "./components/VehicleManager";
import ProfileManager from "./components/ProfileManager";

export default function ProfilePage() {

  const router = useRouter();
  const { userData, isLoading } = useAuth();
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="p-4 pb-20 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-60 bg-white/10 rounded-md mb-6" />
        <Skeleton className="h-[400px] w-full bg-white/10 rounded-lg" />
      </div>
    );
  }
  
  return (
    <div className="p-4 pb-20 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:bg-white/10 -ml-2 hover:cursor-pointer"
          onClick={() => router.push("/dashboard")}
        >
          <HomeIcon className="h-5 w-5 mr-1"/>
          Home
        </Button>
        <h1 className="text-2xl font-semibold text-white">My Profile</h1>
        <div className="w-20"></div> {/* Empty div for centering */}
      </div>
      
      <div className="flex items-center justify-center mb-6">
        <Avatar className="h-24 w-24 border-4 border-emerald-600">
          <AvatarImage 
            src={`https://avatar.vercel.sh/${userData?.email}`} 
            alt={userData?.email || ""} 
          />
          <AvatarFallback className="bg-emerald-800 text-white text-2xl">
            {userData?.email ? userData.email.substring(0, 2).toUpperCase() : "U"}
          </AvatarFallback>
        </Avatar>
      </div>
      
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#1A3C34]">
          <TabsTrigger value="personal" className="data-[state=active]:bg-emerald-600">
            <UserIcon className="h-4 w-4 mr-2" />
            Personal Info
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="data-[state=active]:bg-emerald-600">
            <Car className="h-4 w-4 mr-2" />
            My Vehicles
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="personal">
          {/* Profile Manager */}
          <ProfileManager/>
        </TabsContent>
        
        <TabsContent value="vehicles">
          {/* Vehicle Manager */}
          <VehicleManager />
        </TabsContent>
      </Tabs>
    </div>
  );
} 