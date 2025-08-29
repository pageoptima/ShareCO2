"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Car, HomeIcon, Camera } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import VehicleManager from "./components/VehicleManager";
import ProfileManager from "./components/ProfileManager";
import { getUserProfile, updateUserProfileImage } from "./components/ProfileManager/actions";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner"; // Use sonner for toast notifications

// Validate file size (1MB = 1,048,576 bytes)
function validateFileSize(file: File, maxSizeInBytes: number = 1 * 1024 * 1024): boolean {
  if (file.size > maxSizeInBytes) {
    toast.error("Image size exceeds 1MB limit");
    return false;
  }
  return true;
}

// Validate file extension based on MIME type
function validateFileType(file: File, allowedTypes: string[] = ["image/jpeg", "image/jpg", "image/png", "image/gif"]): boolean {
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    toast.error("Only JPG, JPEG, PNG, and GIF files are allowed");
    return false;
  }
  return true;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch user profile using useQuery
  const {
    data: userData,
    isLoading: isUserDataFetching,
    isError: isUserDataError,
  } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
    enabled: !!session?.user?.id, // Only fetch if user is logged in
  });

  // Mutation for updating profile image
  const mutation = useMutation({
    mutationFn: updateUserProfileImage,
    onMutate: () => {
      setIsUploading(true);
    },
    onSuccess: (data) => {
      setIsUploading(false);
      if (data.success) {
        // Invalidate userProfile query to refetch updated profile
        queryClient.invalidateQueries({ queryKey: ["userProfile"] });
        toast.success("Profile image updated successfully");
      } else {
        toast.error(data.error || "Failed to update profile image");
      }
    },
    onError: (error) => {
      setIsUploading(false);
      toast.error(error.message || "Failed to update profile image");
    },
  });

  // Handle file selection with validation
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Perform validations
      if (!validateFileSize(file)) {
        event.target.value = ""; // Reset file input
        return;
      }
      if (!validateFileType(file)) {
        event.target.value = ""; // Reset file input
        return;
      }

      // Proceed with upload
      const formData = new FormData();
      formData.append("profileImage", file);
      mutation.mutate(formData);
    }
    // Reset file input
    if (event.target) event.target.value = "";
  };

  // Trigger file input click
  const handleEditClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-4 pb-20 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-[#1a3c34] -ml-2 cursor-pointer"
          onClick={() => router.push("/dashboard")}
        >
          <HomeIcon className="h-5 w-5 mr-1" />
          Home
        </Button>
        <h1 className="text-2xl font-semibold text-white cursor-pointer">
          My Profile
        </h1>
        <div className="w-20"></div> {/* Empty div for centering */}
      </div>

      <div className="flex items-center justify-center mb-6 relative">
        {isUserDataFetching ? (
          <div className="h-24 w-24 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
          </div>
        ) : isUserDataError ? (
          <div className="h-24 w-24 flex items-center justify-center text-red-500 text-sm">
            Error loading profile
          </div>
        ) : (
          <>
            <Avatar className="h-24 w-24 border-4 border-emerald-600">
              <AvatarImage
                src={userData?.image || "/default-avatar.png"}
                alt={session?.user?.name || session?.user?.email || ""}
              />
              <AvatarFallback className="bg-emerald-800 text-white text-2xl">
                {session?.user?.name?.[0] || session?.user?.email?.[0] || ""}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-0 right-0 bg-emerald-600 text-white hover:bg-emerald-700 border-none rounded-full h-8 w-8"
              onClick={handleEditClick}
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#1A3C34]">
          <TabsTrigger
            value="personal"
            className="data-[state=active]:bg-emerald-600 cursor-pointer"
          >
            <UserIcon className="h-4 w-4 mr-2" />
            Personal Info
          </TabsTrigger>
          <TabsTrigger
            value="vehicles"
            className="data-[state=active]:bg-emerald-600 cursor-pointer"
          >
            <Car className="h-4 w-4 mr-2" />
            My Vehicles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <ProfileManager />
        </TabsContent>

        <TabsContent value="vehicles">
          <VehicleManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}