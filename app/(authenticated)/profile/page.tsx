"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Save, 
  User as UserIcon, 
  Car, 
  HomeIcon
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../_contexts/AuthContext";
import { updateUserProfile } from "../../_actions/updateUserProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import VehicleManagement from "./VehicleManagement";

// Schema for personal information
const userProfileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
  gender: z.enum(["Male", "Female", "Other", ""]).optional(),
  age: z.number().min(18, { message: "You must be at least 18 years old" }).max(100).optional(),
});

type UserProfileValues = {
  name?: string;
  gender?: "Male" | "Female" | "Other" | "";
  age?: number;
};

export default function ProfilePage() {
  const router = useRouter();
  const { userData, refreshUserData, isLoading } = useAuth();
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [initialValues, setInitialValues] = useState<UserProfileValues>({
    name: "",
    gender: "",
    age: undefined,
  });
  
  // Form for personal information
  const userForm = useForm<UserProfileValues>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      name: "",
      gender: "",
      age: undefined,
    },
  });
  
  // Watch form values for change detection
  const watchedValues = userForm.watch();
  
  // Check if form has changes compared to initial values
  const hasChanges = useMemo(() => {
    if (!userData || !initialValues) return false;
    
    const currentName = watchedValues.name || "";
    const currentGender = watchedValues.gender || "";
    const currentAge = watchedValues.age;
    
    const initialName = initialValues.name || "";
    const initialGender = initialValues.gender || "";
    const initialAge = initialValues.age;
    
    return (
      currentName !== initialName ||
      currentGender !== initialGender ||
      currentAge !== initialAge
    );
  }, [watchedValues, initialValues, userData]);
  
  // Load user data into the form when userData changes
  useEffect(() => {
    if (userData) {
      const formValues: UserProfileValues = {
        name: userData.name || "",
        gender: (userData.gender as "Male" | "Female" | "Other" | "") || "",
        age: userData.age || undefined,
      };
      
      // Set initial values for comparison
      setInitialValues(formValues);
      
      // Reset form with user data
      userForm.reset(formValues);
    }
  }, [userData, userForm]);
  
  // Save personal information
  const onSubmitProfile = async (data: UserProfileValues) => {
    if (!hasChanges) {
      toast.info("No changes to save");
      return;
    }
    
    setIsSubmittingProfile(true);
    try {
      // Only send fields that have actually changed
      const changedData: Partial<UserProfileValues> = {};
      
      if ((data.name || "") !== (initialValues.name || "")) {
        changedData.name = data.name;
      }
      if ((data.gender || "") !== (initialValues.gender || "")) {
        changedData.gender = data.gender;
      }
      if (data.age !== initialValues.age) {
        changedData.age = data.age;
      }
      
      await updateUserProfile(changedData);
      
      // Refresh user data and update initial values
      await refreshUserData();
      toast.success("Profile updated successfully");
      
      // Update initial values to current values after successful save
      setInitialValues({
        name: data.name || "",
        gender: data.gender || "",
        age: data.age,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSubmittingProfile(false);
    }
  };
  
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
          <Card className="bg-[#1A3C34] text-white border-none">
            <CardHeader>
              <CardTitle className="text-white">Personal Information</CardTitle>
              <CardDescription className="text-gray-400">
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...userForm}>
                <form id="profile-form" onSubmit={userForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                  <FormField
                    control={userForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Full Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            value={field.value || ""}
                            className="bg-black/30 border-gray-700 text-white" 
                            placeholder="Enter your full name" 
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={userForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Gender</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-black/30 text-white border-gray-700">
                              <SelectValue placeholder="Select your gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#1A3C34] text-white border-gray-700">
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={userForm.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Age</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            type="number"
                            className="bg-black/30 border-gray-700 text-white" 
                            placeholder="Enter your age" 
                            min={18}
                            max={100}
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? undefined : Number(value));
                            }}
                          />
                        </FormControl>
                        <FormDescription className="text-gray-400">
                          You must be at least 18 years old
                        </FormDescription>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter>
              <Button 
                form="profile-form" 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmittingProfile || !hasChanges}
              >
                {isSubmittingProfile ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="mr-2 h-4 w-4" />
                    {hasChanges ? "Save Changes" : "No Changes"}
                  </span>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="vehicles">
          <VehicleManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
} 