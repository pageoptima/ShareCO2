import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { getUserProfile, updateUserProfile } from "./actions";
import { useEffect, useState } from "react";

// Schema for personal information
const userProfileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  gender: z.enum(["Male", "Female", "Other", ""], {
    required_error: "Gender is required",
  }),
  age: z
    .number()
    .min(18, { message: "You must be at least 18 years old" })
    .max(100),
  phone: z
    .string()
    .regex(/^\+?1?\s?\(?[2-9][0-9]{2}\)?[-. ]?[2-9][0-9]{2}[-. ]?[0-9]{4}$/, {
      message: "Invalid phone number format",
    }),
});

type UserProfileValues = z.infer<typeof userProfileSchema>;

export default function ProfileManager() {
  const [formInitialized, setFormInitialized] = useState(false);

  // Hook for fetching the user profile
  const {
    data: userData,
    isLoading: isUserDataFetching,
    isError: isUserDataError,
    error: userDataError,
    refetch: refetchUserData,
  } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
  });

  if (isUserDataError) {
    console.error(userDataError);
  }

  // Update mutation
  const mutation = useMutation({
    mutationFn: (data: Partial<UserProfileValues>) => updateUserProfile(data),
    onSuccess: async (result) => {
      if (result.success) {
        localStorage.setItem("isProfileCompleted", "true");
        toast.success("Profile updated successfully");
        await refetchUserData();
        form.reset(form.getValues());
      } else {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      console.error(error.message);
    },
  });

  const form = useForm<UserProfileValues>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      name: "",
      gender: "",
      age: undefined,
      phone: "", // Add phone to default values
    },
  });

  // Populate form once data is available
  useEffect(() => {
    if (userData && !formInitialized) {
      form.reset({
        name: userData?.name ?? "",
        gender: (userData?.gender as UserProfileValues["gender"]) ?? "",
        age: userData?.age ?? undefined,
        phone: userData?.phone ?? "",
      });
      setFormInitialized(true); // Mark form as initialized
    }
  }, [userData, form, formInitialized]);

  const hasChanges = () => {
    if (!userData) return false;
    return true;
  };

  const handleSubmit = async (data: UserProfileValues) => {
    if (mutation.isPending) return;
    await mutation.mutateAsync(data);
  };

  if (isUserDataFetching || !formInitialized) {
    return (
      <Card className="bg-[#1A3C34] text-white border-none">
        <CardHeader>
          <div className="h-6 w-40 bg-gray-600/50 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-600/50 rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-600/50 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-600/50 rounded animate-pulse" />
          </div>
          {/* Gender Field */}
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-600/50 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-600/50 rounded animate-pulse" />
          </div>
          {/* Age Field */}
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-600/50 rounded animate-pulse" />
            <div className="h-10 w-20 bg-gray-600/50 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-600/50 rounded animate-pulse" />
          </div>
          {/* Phone Field */}
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-600/50 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-600/50 rounded animate-pulse" />
          </div>
        </CardContent>
        <CardFooter>
          <div className="h-10 w-full bg-gray-600/50 rounded animate-pulse" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1A3C34] text-white border-none">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your personal details</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            id="profile-form2"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter your full name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Gender */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Age */}
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter your age"
                      min={18}
                      max={100}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    You must be at least 18 years old
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter your phone number"
                      type="tel"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <Button
          form="profile-form2"
          type="submit"
          className="w-full cursor-pointer"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <span className="flex items-center">
              <Save className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </span>
          ) : (
            <span className="flex items-center cursor-pointer">
              <Save className="mr-2 h-4 w-4" />{" "}
              {hasChanges() ? "Save Changes" : "No Changes"}
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
