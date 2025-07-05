import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
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
import { useAuth } from "@/app/_contexts/AuthContext";
import { updateUserProfile } from "./actions";

// Schema for personal information
const userProfileSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
    gender: z.enum(["Male", "Female", "Other", ""], { required_error: "Gender is required" }).optional(),
    age: z.number().min(18, { message: "You must be at least 18 years old" }).max(100).optional(),
});

type UserProfileValues = z.infer<typeof userProfileSchema>;

export default function ProfileManager() {

    const { userData, refreshUserData } = useAuth();

    const defaultValues: UserProfileValues = {
        name  : userData?.name || "",
        gender: (userData?.gender as UserProfileValues['gender']) || "",
        age   : userData?.age || undefined,
    };

    const form = useForm<UserProfileValues>({
        resolver: zodResolver(userProfileSchema),
        defaultValues,
    });

    // Update mutation
    const mutation = useMutation(
        {
            mutationFn: ( data: Partial<UserProfileValues> ) => updateUserProfile(data),         
            onSuccess: async () => {
                toast.success( 'Profile updated successfully' );
                await refreshUserData();
                form.reset(form.getValues());
            },
            onError: (error: any) => {
                toast.error(error.message);
            },
        }
    );

    const watchedValues = form.watch();

    const hasChanges = useMemo(() => {
        if (!userData) return false;
        const current = form.getValues();
        return Object.keys(defaultValues).some(
            (key) => (current as any)[key] !== (defaultValues as any)[key]
        );
    }, [watchedValues, defaultValues, userData]);

    useEffect(() => {
        form.reset(defaultValues);
    }, [userData]);

    return (
        <Card className="bg-[#1A3C34] text-white border-none">
            <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form id="profile-form" onSubmit={form.handleSubmit((data) => {
                        const changedData: Partial<UserProfileValues> = {};
                        (Object.keys(defaultValues) as Array<keyof UserProfileValues>).forEach((key) => {
                            if (data[key] !== defaultValues[key]) {
                                (changedData as any)[key] = data[key];
                            }
                        });
                        if (Object.keys(changedData).length > 0) {
                            mutation.mutate(changedData);
                        } else {
                            toast.info("No changes to save");
                        }
                    })} className="space-y-4">
                        {/* Name */}
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Enter your full name" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* Gender */}
                        <FormField control={form.control} name="gender" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Gender</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select your gender" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* Age */}
                        <FormField control={form.control} name="age" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Age</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="Enter your age"
                                        min={18}
                                        max={100}
                                        value={field.value || ""}
                                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormDescription>You must be at least 18 years old</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </form>
                </Form>
            </CardContent>
            <CardFooter>
                <Button
                    form="profile-form"
                    type="submit"
                    className="w-full"
                    disabled={mutation.isPending || !hasChanges}
                >
                    {mutation.isPending ? (
                        <span className="flex items-center">
                            <Save className="mr-2 h-4 w-4 animate-spin" /> Saving...
                        </span>
                    ) : (
                        <span className="flex items-center">
                            <Save className="mr-2 h-4 w-4" /> {hasChanges ? "Save Changes" : "No Changes"}
                        </span>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
