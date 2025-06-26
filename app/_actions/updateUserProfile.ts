"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Validate the inputs
const userProfileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
  gender: z.enum(["Male", "Female", "Other", ""]).optional(),
  age: z.number().int().min(18, { message: "You must be at least 18 years old" }).max(100).optional(),
});

export async function updateUserProfile(data: {
  name?: string;
  gender?: "Male" | "Female" | "Other" | "";
  age?: number;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be logged in to update your profile");
  }

  try {
    // Validate inputs
    userProfileSchema.parse(data);

    // Update the user profile
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        gender: data.gender,
        age: data.age,
      },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile. Please try again.");
  }
} 